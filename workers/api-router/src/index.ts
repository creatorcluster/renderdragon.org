import { authenticateRequest } from "./auth";
import {
  E3_HEADERS,
  canonicalString,
  hmacHex,
  randomHex,
  sha256Hex,
  timingSafeEqual,
} from "./signing";

export { AuthStore } from "./auth-store";

export interface Env {
  E3_ORIGIN: string;
  E3_RESOURCES_ORIGIN?: string;
  ASSETS_FALLBACK_ORIGIN: string;
  RESOURCES_FALLBACK_ORIGIN: string;
  // Ordered origin pools per group (comma-separated). First entry is the primary, the
  // rest are backups tried in order. Unset falls back to E3_* + *_FALLBACK_ORIGIN.
  ASSETS_ORIGINS?: string;
  RESOURCES_ORIGINS?: string;
  // Shared secret for router -> e3 request signing (set on both sides). Required in production.
  E3_SHARED_SECRET?: string;
  // Master key for the /__admin/* client-management API.
  ADMIN_KEY?: string;
  // "writes" (default) | "all" | "off" — see auth.ts.
  REPLAY_PROTECTION?: string;
  // Paths hashed to form the public asset-catalog version, and how long to cache it.
  VERSION_SOURCES?: string;
  VERSION_CACHE_TTL_SECONDS?: string;
  PRIMARY_TIMEOUT_MS?: string;
  FAILOVER_COOLDOWN_MS?: string;
  ALLOWED_ORIGINS?: string;
  AUTH_STORE: DurableObjectNamespace;
}

const DEFAULT_E3_ORIGIN = "https://e3.codersoft.xyz";
const DEFAULT_ASSETS_FALLBACK = "https://assets-api-worker.powernplant101-c6b.workers.dev";
const DEFAULT_RESOURCES_FALLBACK = "https://hamburger-api.powernplant101-c6b.workers.dev";
const DEFAULT_ALLOWED_ORIGINS = [
  "https://renderdragon.org",
  "https://www.renderdragon.org",
  "https://api.codersoft.xyz",
  "https://assets.codersoft.xyz",
];
const DEFAULT_PRIMARY_TIMEOUT_MS = 2500;
const DEFAULT_FAILOVER_COOLDOWN_MS = 30000;
const E3_ROUTER_CLIENT_ID = "api-router";

type Group = "assets" | "resources";

const RESOURCE_PREFIXES = ["/categories", "/category", "/all", "/fonts", "/mcicons", "/music_moods"];

// JSON API paths (as opposed to file paths). A 404 here means the origin does not
// implement the route at all, so the next origin should be tried instead of
// returning the 404 to the client — that is how /music_moods silently disappeared.
const JSON_API_PATHS = ["/all", "/categories", "/mcicons", "/fonts", "/music_moods"];

const isJsonApiPath = (pathname: string): boolean =>
  JSON_API_PATHS.includes(pathname) || pathname.startsWith("/category/");

// Per-origin passive health: an origin that fails is skipped for a cooldown, then retried.
const originDownUntil = new Map<string, number>();

const isOriginDown = (origin: string): boolean => (originDownUntil.get(origin) ?? 0) > Date.now();
const markOriginDown = (origin: string, cooldownMs: number): void => {
  originDownUntil.set(origin, Date.now() + cooldownMs);
};
const markOriginUp = (origin: string): void => {
  originDownUntil.delete(origin);
};

// Origins for a group in configured order (primary first).
const configuredOrigins = (env: Env, group: Group): string[] => {
  const configured = group === "resources" ? listEnv(env.RESOURCES_ORIGINS, []) : listEnv(env.ASSETS_ORIGINS, []);
  const list = configured.length
    ? configured
    : group === "resources"
      ? [
          env.E3_RESOURCES_ORIGIN || env.E3_ORIGIN || DEFAULT_E3_ORIGIN,
          env.RESOURCES_FALLBACK_ORIGIN || DEFAULT_RESOURCES_FALLBACK,
        ]
      : [env.E3_ORIGIN || DEFAULT_E3_ORIGIN, env.ASSETS_FALLBACK_ORIGIN || DEFAULT_ASSETS_FALLBACK];
  return [...new Set(list.map(stripTrailingSlash).filter(Boolean))];
};

// Healthy origins first, down ones last so they still get a chance to recover.
const orderedOrigins = (env: Env, group: Group): string[] => {
  const origins = configuredOrigins(env, group);
  return [
    ...origins.filter((origin) => !isOriginDown(origin)),
    ...origins.filter((origin) => isOriginDown(origin)),
  ];
};

const stripTrailingSlash = (value: string): string => value.replace(/\/+$/, "");

const parseIntEnv = (value: string | undefined, fallback: number): number => {
  const parsed = Number.parseInt(value ?? "", 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
};

const listEnv = (value: string | undefined, fallback: string[]): string[] =>
  (value ?? fallback.join(","))
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);

const classify = (pathname: string): Group =>
  RESOURCE_PREFIXES.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`))
    ? "resources"
    : "assets";

// Read-only endpoints a partner-scoped key (`assets:read`) may request.
const PARTNER_READ_PREFIXES = ["/all", "/categories", "/category", "/mcicons", "/fonts", "/music_moods"];

const isPartnerReadPath = (pathname: string): boolean =>
  PARTNER_READ_PREFIXES.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));

const buildCorsHeaders = (request: Request, env: Env): Record<string, string> => {
  const allowed = (env.ALLOWED_ORIGINS ?? DEFAULT_ALLOWED_ORIGINS.join(","))
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);

  const origin = request.headers.get("Origin") ?? "";
  const headers: Record<string, string> = {
    Vary: "Origin",
    "Access-Control-Allow-Methods": "GET,POST,PUT,PATCH,DELETE,OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Requested-With",
    "Access-Control-Max-Age": "86400",
  };

  if (origin && allowed.includes(origin)) {
    headers["Access-Control-Allow-Origin"] = origin;
    headers["Access-Control-Allow-Credentials"] = "true";
  } else {
    headers["Access-Control-Allow-Origin"] = allowed[0] ?? DEFAULT_ALLOWED_ORIGINS[0];
  }

  return headers;
};

const HOP_BY_HOP = new Set([
  "host",
  "connection",
  "content-length",
  "accept-encoding",
  "cf-connecting-ip",
  "cf-ipcountry",
  "cf-ray",
  "cf-visitor",
  "x-forwarded-for",
  "x-forwarded-proto",
  "x-real-ip",
]);

const STRIP_FROM_RESPONSE = new Set(["content-encoding", "content-length", "transfer-encoding"]);

const forwardHeaders = (source: Headers): Headers => {
  const headers = new Headers();
  source.forEach((value, key) => {
    if (!HOP_BY_HOP.has(key.toLowerCase())) headers.set(key, value);
  });
  return headers;
};

const isOriginDownStatus = (status: number): boolean =>
  status === 502 || status === 503 || status === 504 || (status >= 520 && status <= 527) || status === 530;

const json = (body: unknown, status: number, extraHeaders: Record<string, string> = {}): Response =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...extraHeaders, "content-type": "application/json" },
  });

const applyCors = (upstream: Response, cors: Record<string, string>, via: string): Response => {
  const headers = new Headers(upstream.headers);
  for (const key of STRIP_FROM_RESPONSE) headers.delete(key);
  for (const [key, value] of Object.entries(cors)) headers.set(key, value);
  headers.set("x-api-router-upstream", via);
  return new Response(upstream.body, {
    status: upstream.status,
    statusText: upstream.statusText,
    headers,
  });
};

async function signToE3(
  secret: string,
  method: string,
  path: string,
  body: ArrayBuffer | undefined,
): Promise<Headers> {
  const timestamp = String(Math.floor(Date.now() / 1000));
  const nonce = randomHex(16);
  const bodyHash = await sha256Hex(body ?? new Uint8Array());
  const canonical = canonicalString({
    method,
    path,
    clientId: E3_ROUTER_CLIENT_ID,
    timestamp,
    nonce,
    bodyHash,
  });
  const signature = await hmacHex(secret, canonical);
  const headers = new Headers();
  headers.set(E3_HEADERS.timestamp, timestamp);
  headers.set(E3_HEADERS.nonce, nonce);
  headers.set(E3_HEADERS.signature, signature);
  return headers;
}

async function handleAdmin(
  request: Request,
  env: Env,
  cors: Record<string, string>,
  url: URL,
): Promise<Response> {
  if (!env.ADMIN_KEY) return json({ error: "admin_disabled" }, 501, cors);
  const supplied = request.headers.get("x-admin-key") ?? "";
  if (!timingSafeEqual(supplied, env.ADMIN_KEY)) return json({ error: "unauthorized" }, 401, cors);

  const stub = env.AUTH_STORE.get(env.AUTH_STORE.idFromName("global"));
  const doPath = url.pathname.replace(/^\/__admin/, "") + url.search;
  const body =
    request.method === "GET" || request.method === "HEAD" ? undefined : await request.arrayBuffer();
  const doResponse = await stub.fetch(`https://auth.internal${doPath}`, {
    method: request.method,
    headers: { "content-type": request.headers.get("content-type") ?? "application/json" },
    body,
  });
  return new Response(await doResponse.text(), {
    status: doResponse.status,
    headers: { ...cors, "content-type": "application/json" },
  });
}

async function fetchUpstream(env: Env, path: string): Promise<{ ok: boolean; status: number; text: string }> {
  const origins = orderedOrigins(env, classify(path));
  const timeoutMs = parseIntEnv(env.PRIMARY_TIMEOUT_MS, DEFAULT_PRIMARY_TIMEOUT_MS);
  const cooldownMs = parseIntEnv(env.FAILOVER_COOLDOWN_MS, DEFAULT_FAILOVER_COOLDOWN_MS);

  let last = { ok: false, status: 502, text: "" };
  for (let i = 0; i < origins.length; i += 1) {
    const origin = origins[i];
    const isLast = i === origins.length - 1;
    const controller = new AbortController();
    const timer = isLast ? null : setTimeout(() => controller.abort(), timeoutMs);
    try {
      const headers = new Headers({ accept: "application/json" });
      if (env.E3_SHARED_SECRET) {
        const signature = await signToE3(env.E3_SHARED_SECRET, "GET", path, undefined);
        signature.forEach((value, key) => headers.set(key, value));
      }
      const upstream = await fetch(`${origin}${path}`, {
        headers,
        redirect: "manual",
        signal: controller.signal,
      });
      if (isOriginDownStatus(upstream.status)) {
        markOriginDown(origin, cooldownMs);
        last = { ok: false, status: upstream.status, text: "" };
        continue;
      }
      if (upstream.status === 404 && !isLast && isJsonApiPath(path)) {
        // Healthy origin that does not implement this JSON route (e.g. an older
        // e3 build): ask the next origin rather than handing the 404 to the client.
        last = { ok: false, status: 404, text: "" };
        continue;
      }
      markOriginUp(origin);
      return { ok: upstream.ok, status: upstream.status, text: await upstream.text() };
    } catch {
      markOriginDown(origin, cooldownMs);
      last = { ok: false, status: 502, text: "" };
    } finally {
      if (timer !== null) clearTimeout(timer);
    }
  }
  return last;
}

// Public, unauthenticated so visitors with a valid cache pay no Turnstile challenge:
// the client compares this version and only refreshes its cached catalog when it changes.
async function handleVersion(env: Env, cors: Record<string, string>): Promise<Response> {
  const stub = env.AUTH_STORE.get(env.AUTH_STORE.idFromName("global"));
  const ttlMs = parseIntEnv(env.VERSION_CACHE_TTL_SECONDS, 300) * 1000;

  const cachedResponse = await stub.fetch("https://auth.internal/version");
  const cached = (await cachedResponse.json()) as {
    version?: string;
    generatedAt?: number;
    cachedAt?: number;
  };

  if (cached.version && Date.now() - (cached.cachedAt ?? 0) < ttlMs) {
    return json({ version: cached.version, generatedAt: cached.generatedAt }, 200, {
      ...cors,
      "cache-control": "no-store",
    });
  }

  const sources = listEnv(env.VERSION_SOURCES, ["/all", "/api/assets"]);
  const parts: string[] = [];
  for (const source of sources) {
    const result = await fetchUpstream(env, source);
    if (!result.ok) return json({ error: "version_unavailable" }, 503, cors);
    parts.push(`${source}:${result.status}:${await sha256Hex(result.text)}`);
  }

  const version = await sha256Hex(parts.join("\n"));
  const generatedAt = Date.now();
  await stub.fetch("https://auth.internal/version", {
    method: "PUT",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ version, generatedAt }),
  });

  return json({ version, generatedAt }, 200, { ...cors, "cache-control": "no-store" });
}

// Drop the cached catalog version so the next /__version recomputes it (called after
// a successful write, so uploads are reflected without waiting for the TTL).
async function invalidateVersion(env: Env): Promise<void> {
  try {
    const stub = env.AUTH_STORE.get(env.AUTH_STORE.idFromName("global"));
    await stub.fetch("https://auth.internal/version", { method: "DELETE" });
  } catch {
    // best effort
  }
}

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);
    const cors = buildCorsHeaders(request, env);

    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: cors });
    }

    if (url.pathname === "/__router/health") {
      const health = (group: Group) =>
        configuredOrigins(env, group).map((origin) => ({ origin, up: !isOriginDown(origin) }));
      return json(
        { ok: true, authStore: Boolean(env.AUTH_STORE), origins: { assets: health("assets"), resources: health("resources") } },
        200,
        cors,
      );
    }

    if (url.pathname === "/__version") {
      return handleVersion(env, cors);
    }

    if (url.pathname.startsWith("/__admin/")) {
      return handleAdmin(request, env, cors, url);
    }

    const isBodyless = request.method === "GET" || request.method === "HEAD";
    const body = isBodyless ? undefined : await request.arrayBuffer();

    const auth = await authenticateRequest(request, url, env, body);
    if (!auth.ok) {
      return json({ error: "unauthorized", reason: auth.reason }, auth.status, cors);
    }

    // Partner keys carry scopes (e.g. `assets:read`) and are read-only: reject
    // writes and any path outside the asset read set. Unscoped clients (the
    // gateway, internal callers) are unrestricted.
    if (auth.scopes.length > 0 && !auth.scopes.includes("*")) {
      const method = request.method.toUpperCase();
      if (auth.scopes.includes("assets:read")) {
        if (method !== "GET" && method !== "HEAD") {
          return json({ error: "forbidden", reason: "read_only_scope" }, 403, cors);
        }
        if (!isPartnerReadPath(url.pathname)) {
          return json({ error: "forbidden", reason: "path_not_allowed" }, 403, cors);
        }
      }
    }

    const group = classify(url.pathname);
    const origins = orderedOrigins(env, group);
    const primary = configuredOrigins(env, group)[0];
    const timeoutMs = parseIntEnv(env.PRIMARY_TIMEOUT_MS, DEFAULT_PRIMARY_TIMEOUT_MS);
    const cooldownMs = parseIntEnv(env.FAILOVER_COOLDOWN_MS, DEFAULT_FAILOVER_COOLDOWN_MS);
    const target = `${url.pathname}${url.search}`;
    const baseHeaders = forwardHeaders(request.headers);

    const e3Signature = env.E3_SHARED_SECRET
      ? await signToE3(env.E3_SHARED_SECRET, request.method, target, body)
      : null;

    for (let i = 0; i < origins.length; i += 1) {
      const origin = origins[i];
      const isLast = i === origins.length - 1;
      // Time-box only until the first byte (the failover probe). Clearing the timer once
      // headers arrive lets a large body stream to completion on the chosen origin.
      const controller = new AbortController();
      const timer = isLast ? null : setTimeout(() => controller.abort(), timeoutMs);
      try {
        const headers = new Headers(baseHeaders);
        e3Signature?.forEach((value, key) => headers.set(key, value));
        const upstream = await fetch(`${origin}${target}`, {
          method: request.method,
          headers,
          body,
          redirect: "manual",
          signal: controller.signal,
        });

        if (isOriginDownStatus(upstream.status)) {
          console.warn(`${origin} returned ${upstream.status}; trying next origin`);
          markOriginDown(origin, cooldownMs);
          continue;
        }

        if (upstream.status === 404 && !isLast && isJsonApiPath(url.pathname)) {
          console.warn(`${origin} does not implement ${url.pathname} (404); trying next origin`);
          markOriginUp(origin);
          continue;
        }

        markOriginUp(origin);
        if (!isBodyless && upstream.status < 400) ctx.waitUntil(invalidateVersion(env));
        return applyCors(upstream, cors, origin === primary ? "e3" : "fallback");
      } catch (error) {
        console.warn(`${origin} unreachable (${String(error)}); trying next origin`);
        markOriginDown(origin, cooldownMs);
      } finally {
        if (timer !== null) clearTimeout(timer);
      }
    }

    return json({ error: "upstream_unavailable" }, 502, cors);
  },
};
