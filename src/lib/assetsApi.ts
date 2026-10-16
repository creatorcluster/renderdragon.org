import { supabase } from "@/integrations/supabase/client";
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
