import { supabase } from "@/integrations/supabase/client";
import { clearCachePrefixes, touchCaches } from "@/lib/cache";
import { getTurnstileToken } from "@/lib/turnstile";

// In local dev the gateway isn't reached directly: the Vite dev server proxies
// /api/assets-gw/* straight to the public upstreams (see vite.config.ts) and we skip the
// session/version handshake. Production goes through the signed gateway, which lives on
// its own domain (renderdragon.org is in a different Cloudflare account), so calls are
// cross-origin with credentials.
const DEV_MODE = import.meta.env.DEV;

export const ASSETS_API_BASE_URL = DEV_MODE
  ? "/api/assets-gw"
  : "https://gateway.codersoft.xyz";

export function assetsApiUrl(path: string): string {
  const normalized = path.startsWith("/") ? path : `/${path}`;
  return `${ASSETS_API_BASE_URL}${normalized}`;
}

// Public, no session required: the catalog version. A visitor whose cached copy
// matches this never triggers a Turnstile challenge.
export async function fetchAssetsVersion(): Promise<string | null> {
  if (DEV_MODE) return null; // upstreams have no version endpoint; skip the sync
  try {
    const response = await fetch(`${ASSETS_API_BASE_URL}/__version`, { credentials: "omit" });
    if (!response.ok) return null;
    const data = (await response.json()) as { version?: unknown };
    return typeof data.version === "string" ? data.version : null;
  } catch {
    return null;
  }
}

let sessionPromise: Promise<void> | null = null;

async function hasSession(): Promise<boolean> {
  try {
    const response = await fetch(`${ASSETS_API_BASE_URL}/__session`, { credentials: "include" });
    return response.ok;
  } catch {
    return false;
  }
}

async function acquireSession(): Promise<void> {
  const { data } = await supabase.auth.getSession();
  const supabaseToken = data.session?.access_token;

  // Logged-in visitors are accepted via their Supabase token; anonymous visitors
  // solve one Turnstile challenge that the gateway verifies server-side.
  const turnstileToken = supabaseToken ? undefined : await getTurnstileToken();

  const response = await fetch(`${ASSETS_API_BASE_URL}/__session`, {
    method: "POST",
    credentials: "include",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ supabaseToken, turnstileToken }),
  });

  if (!response.ok) {
    throw new Error(`Unable to establish an assets session (${response.status})`);
  }
}

export async function ensureAssetsSession(): Promise<void> {
  if (!sessionPromise) {
    sessionPromise = (async () => {
      if (await hasSession()) return;
      await acquireSession();
    })().catch((error) => {
      sessionPromise = null;
      throw error;
    });
  }
  return sessionPromise;
}

export async function fetchFromAssetsApi(path: string, init?: RequestInit): Promise<Response> {
  if (DEV_MODE) {
    const response = await fetch(assetsApiUrl(path), init);
    if (!response.ok) {
      throw new Error(`Assets API error ${response.status} ${response.statusText} for ${path}`);
    }
    return response;
  }

  await ensureAssetsSession();

  const send = () => fetch(assetsApiUrl(path), { ...init, credentials: "include" });
  let response = await send();

  if (response.status === 401) {
    // Session expired or was rejected; re-establish once and retry.
    sessionPromise = null;
    await ensureAssetsSession();
    response = await send();
  }

  if (!response.ok) {
    throw new Error(`Assets API error ${response.status} ${response.statusText} for ${path}`);
  }
  return response;
}

// Parse a JSON response from the assets API. Callers that only need typed data should
// use this instead of hand-rolling `res.json()` and their own parse errors.
export async function fetchAssetsJson<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetchFromAssetsApi(path, init);
  try {
    return (await response.json()) as T;
  } catch {
    throw new Error(`Invalid JSON from assets API for ${path}`);
  }
}

const VERSION_KEY = "rd-assets-version";

// Caches whose lifetime is governed by the catalog version instead of their own TTL.
const CATALOG_CACHE_PREFIXES = [
  "api:all-resources",
  "api:categories",
  "api:category:",
  "api:showcases",
];

let syncPromise: Promise<void> | null = null;

async function runSync(): Promise<void> {
  const version = await fetchAssetsVersion();
  if (!version) return; // endpoint unavailable -> leave existing caches alone

  let stored: string | null = null;
  try {
    stored = localStorage.getItem(VERSION_KEY);
  } catch {
    stored = null;
  }

  if (stored === version) {
    // Catalog is current: keep the caches alive so no auth (and no challenge) is needed.
    touchCaches(CATALOG_CACHE_PREFIXES);
    return;
  }

  // Catalog changed (or first visit): drop the stale data and remember the new version.
  clearCachePrefixes(CATALOG_CACHE_PREFIXES);
  try {
    localStorage.setItem(VERSION_KEY, version);
  } catch {
    // ignore
  }
}

// Best-effort, runs once per page load, and is awaited before any catalog fetch so the
// version decision is made before we ever touch the authenticated path.
//
// This stays explicit at each cache-first call site (api.ts, showcases.ts) on purpose:
// it is NOT run inside fetchFromAssetsApi, because the cached catalogue has to be
// invalidated for a new version *before* it is read, and fetchFromAssetsApi only runs
// once the code has already decided to go to the network.
export function ensureAssetsVersionSynced(): Promise<void> {
  if (!syncPromise) {
    syncPromise = runSync().catch((error) => {
      console.warn("Assets version sync failed:", error);
    });
  }
  return syncPromise;
}

export function resetAssetsVersionSync(): void {
  syncPromise = null;
}
