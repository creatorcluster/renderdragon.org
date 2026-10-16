import {
  AUTH_HEADERS,
  canonicalString,
  hmacHex,
  randomHex,
  sha256Hex,
  timingSafeEqual,
} from "./signing";

export interface Env {
  ROUTER_ORIGIN: string;
  GATEWAY_CLIENT_ID: string;
  GATEWAY_SECRET: string;
  TURNSTILE_SECRET?: string;
  TURNSTILE_HOSTNAMES?: string;
  REQUIRE_TURNSTILE?: string;
  SUPABASE_URL?: string;
  SUPABASE_ANON_KEY?: string;
  SESSION_TTL_SECONDS?: string;
  COOKIE_SECURE?: string;
  ALLOWED_ORIGINS?: string;
}

const COOKIE_NAME = "rdgw";
const DEFAULT_ALLOWED_ORIGINS = ["https://renderdragon.org", "https://www.renderdragon.org"];
const DEFAULT_TURNSTILE_HOSTNAMES = ["renderdragon.org", "www.renderdragon.org", "localhost"];

const STRIP_FROM_REQUEST = new Set([
  "host",
  "connection",
  "content-length",
  "accept-encoding",
  "cookie",
  "origin",
  "referer",
  "cf-connecting-ip",
  "cf-ipcountry",
  "cf-ray",
  "cf-visitor",
  "x-forwarded-for",
  "x-forwarded-proto",
  "x-real-ip",
  "x-auth-client",
  "x-auth-timestamp",
  "x-auth-nonce",
  "x-auth-signature",
]);

const STRIP_FROM_RESPONSE = new Set(["content-encoding", "content-length", "transfer-encoding"]);

interface SessionPayload {
  iat: number;
  exp: number;
  sid: string;
  sub: string;
}

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

const isLocalOrigin = (origin: string): boolean => {
  try {
    const { hostname } = new URL(origin);
    return (
      hostname === "localhost" ||
      hostname === "127.0.0.1" ||
      hostname === "[::1]" ||
      hostname.endsWith(".local") ||
      /^10\./.test(hostname) ||
      /^192\.168\./.test(hostname) ||
      /^172\.(1[6-9]|2\d|3[01])\./.test(hostname)
    );
  } catch {
    return false;
  }
};

const originAllowed = (origin: string, env: Env): boolean =>
  origin === "null" || listEnv(env.ALLOWED_ORIGINS, DEFAULT_ALLOWED_ORIGINS).includes(origin) || isLocalOrigin(origin);

// ---- base64url ----

const b64urlEncode = (text: string): string => {
  const bytes = new TextEncoder().encode(text);
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
};

const b64urlDecode = (text: string): string => {
  const padded = text.replace(/-/g, "+").replace(/_/g, "/");
  const binary = atob(padded + "===".slice((padded.length + 3) % 4));
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);
  return new TextDecoder().decode(bytes);
};

// ---- session token ----

async function mintSession(secret: string, payload: SessionPayload): Promise<string> {
  const encoded = b64urlEncode(JSON.stringify(payload));
  const signature = await hmacHex(secret, `v1.${encoded}`);
  return `v1.${encoded}.${signature}`;
}

async function verifySession(secret: string, token: string): Promise<SessionPayload | null> {
  const parts = token.split(".");
  if (parts.length !== 3 || parts[0] !== "v1") return null;
  const expected = await hmacHex(secret, `v1.${parts[1]}`);
  if (!timingSafeEqual(expected, parts[2])) return null;
  let payload: SessionPayload;
  try {
    payload = JSON.parse(b64urlDecode(parts[1])) as SessionPayload;
  } catch {
    return null;
  }
  if (!Number.isFinite(payload.exp) || payload.exp * 1000 < Date.now()) return null;
  return payload;
}

// ---- cookie ----

const getCookie = (request: Request, name: string): string | null => {
  const header = request.headers.get("Cookie") ?? "";
  for (const part of header.split(";")) {
    const trimmed = part.trim();
    const index = trimmed.indexOf("=");
    if (index === -1) continue;
    if (trimmed.slice(0, index) === name) return trimmed.slice(index + 1);
  }
  return null;
};

const sessionCookie = (value: string, maxAge: number, secure: boolean): string =>
  `${COOKIE_NAME}=${value}; Path=/; HttpOnly;${secure ? " Secure;" : ""} SameSite=${secure ? "None" : "Lax"}; Max-Age=${maxAge}`;

// CORS: in production the gateway is cross-origin (renderdragon.org → gateway.codersoft.xyz),
// so credentialed requests need an explicit allow-origin + allow-credentials.
const buildCors = (request: Request, env: Env): Record<string, string> => {
  const origin = request.headers.get("Origin") ?? "";
  const headers: Record<string, string> = {
    Vary: "Origin",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    "Access-Control-Max-Age": "86400",
  };
  if (origin && originAllowed(origin, env)) {
    headers["Access-Control-Allow-Origin"] = origin;
    headers["Access-Control-Allow-Credentials"] = "true";
  }
  return headers;
};

const withCors = (response: Response, cors: Record<string, string>): Response => {
  const headers = new Headers(response.headers);
  const setCookies =
    (response.headers as { getSetCookie?: () => string[] }).getSetCookie?.() ?? [];
  headers.delete("Set-Cookie");
  for (const [key, value] of Object.entries(cors)) headers.set(key, value);
  const merged = new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
  for (const cookie of setCookies) merged.headers.append("Set-Cookie", cookie);
  return merged;
};

// ---- responses ----

const jsonResponse = (body: unknown, status: number, session?: { token: string; maxAge: number; secure: boolean }): Response => {
  const response = new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json", "cache-control": "no-store" },
  });
  if (session) response.headers.append("Set-Cookie", sessionCookie(session.token, session.maxAge, session.secure));
  return response;
};

// ---- verification ----

async function verifySupabase(env: Env, token: string): Promise<boolean> {
  if (!env.SUPABASE_URL || !env.SUPABASE_ANON_KEY) return false;
  try {
    const response = await fetch(`${stripTrailingSlash(env.SUPABASE_URL)}/auth/v1/user`, {
      headers: { apikey: env.SUPABASE_ANON_KEY, Authorization: `Bearer ${token}` },
    });
    return response.ok;
  } catch {
    return false;
  }
}

async function verifyTurnstile(env: Env, token: string, ip: string | null): Promise<boolean> {
  if (!env.TURNSTILE_SECRET) return false;
  const form = new FormData();
  form.append("secret", env.TURNSTILE_SECRET);
  form.append("response", token);
  if (ip) form.append("remoteip", ip);
  try {
    const response = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
      method: "POST",
      body: form,
    });
    const data = (await response.json()) as { success?: boolean; hostname?: string };
    if (!data.success) return false;
    const allowed = listEnv(env.TURNSTILE_HOSTNAMES, DEFAULT_TURNSTILE_HOSTNAMES);
    // Require a hostname and enforce the allow-list (an absent hostname must not pass).
    return Boolean(data.hostname) && allowed.includes(data.hostname as string);
  } catch {
    return false;
  }
}

const requireTurnstile = (env: Env): boolean => (env.REQUIRE_TURNSTILE ?? "true") !== "false";

// ---- handlers ----

async function establishSession(request: Request, env: Env): Promise<Response> {
  const origin = request.headers.get("Origin");
  if (origin && !originAllowed(origin, env)) return jsonResponse({ error: "origin_not_allowed" }, 403);

  let payload: { turnstileToken?: string; supabaseToken?: string } = {};
  try {
    payload = (await request.json()) as typeof payload;
  } catch {
    payload = {};
  }

  let subject: string | null = null;

  if (payload.supabaseToken && (await verifySupabase(env, payload.supabaseToken))) {
    subject = "user";
  }

  if (!subject) {
    if (requireTurnstile(env)) {
      const ip = request.headers.get("CF-Connecting-IP");
      if (payload.turnstileToken && (await verifyTurnstile(env, payload.turnstileToken, ip))) {
        subject = "anon";
      }
    } else {
      subject = "anon";
    }
  }

  if (!subject) return jsonResponse({ error: "verification_failed" }, 401);

  const maxAge = parseIntEnv(env.SESSION_TTL_SECONDS, 1800);
  const now = Math.floor(Date.now() / 1000);
  const session: SessionPayload = { iat: now, exp: now + maxAge, sid: randomHex(8), sub: subject };
  const token = await mintSession(env.GATEWAY_SECRET, session);
  const secure = (env.COOKIE_SECURE ?? "true") !== "false";

  return jsonResponse({ ok: true, expiresAt: session.exp }, 200, { token, maxAge, secure });
}

async function sessionStatus(request: Request, env: Env): Promise<Response> {
  const token = getCookie(request, COOKIE_NAME);
  const session = token ? await verifySession(env.GATEWAY_SECRET, token) : null;
  if (!session) return jsonResponse({ ok: false }, 401);
  return jsonResponse({ ok: true, expiresAt: session.exp }, 200);
}

async function proxy(request: Request, env: Env, url: URL, relativePath: string): Promise<Response> {
  const origin = request.headers.get("Origin");
  if (origin && !originAllowed(origin, env)) return jsonResponse({ error: "origin_not_allowed" }, 403);

  const token = getCookie(request, COOKIE_NAME);
  const session = token ? await verifySession(env.GATEWAY_SECRET, token) : null;
  if (!session) return jsonResponse({ error: "session_required" }, 401);

  const isBodyless = request.method === "GET" || request.method === "HEAD";
  const body = isBodyless ? undefined : await request.arrayBuffer();
  const upstreamPath = `${relativePath}${url.search}`;

  const timestamp = String(Math.floor(Date.now() / 1000));
  const nonce = randomHex(16);
  const bodyHash = await sha256Hex(body ?? new Uint8Array());
  const canonical = canonicalString({
    method: request.method,
    path: upstreamPath,
    clientId: env.GATEWAY_CLIENT_ID,
    timestamp,
    nonce,
    bodyHash,
  });
  const signature = await hmacHex(env.GATEWAY_SECRET, canonical);

  const headers = new Headers();
  request.headers.forEach((value, key) => {
    if (!STRIP_FROM_REQUEST.has(key.toLowerCase())) headers.set(key, value);
  });
  headers.set(AUTH_HEADERS.client, env.GATEWAY_CLIENT_ID);
  headers.set(AUTH_HEADERS.timestamp, timestamp);
  headers.set(AUTH_HEADERS.nonce, nonce);
  headers.set(AUTH_HEADERS.signature, signature);

  const upstream = await fetch(`${stripTrailingSlash(env.ROUTER_ORIGIN)}${upstreamPath}`, {
    method: request.method,
    headers,
    body,
    redirect: "manual",
  });

  const responseHeaders = new Headers(upstream.headers);
  for (const key of STRIP_FROM_RESPONSE) responseHeaders.delete(key);
  return new Response(upstream.body, {
    status: upstream.status,
    statusText: upstream.statusText,
    headers: responseHeaders,
  });
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    const cors = buildCors(request, env);
    const relativePath = url.pathname || "/";

    if (request.method === "OPTIONS") {
      if (request.headers.get("Origin") && !cors["Access-Control-Allow-Origin"]) {
        return new Response(null, { status: 403 });
      }
      return new Response(null, { status: 204, headers: cors });
    }

    let response: Response;

    // Public: lets a visitor with a valid cached catalog skip the challenge entirely.
    if (relativePath === "/__version") {
      if (request.method !== "GET") {
        response = jsonResponse({ error: "method_not_allowed" }, 405);
      } else {
        const upstream = await fetch(`${stripTrailingSlash(env.ROUTER_ORIGIN)}/__version`, {
          headers: { accept: "application/json" },
        });
        const responseHeaders = new Headers(upstream.headers);
        for (const key of STRIP_FROM_RESPONSE) responseHeaders.delete(key);
        responseHeaders.set("cache-control", "no-store");
        response = new Response(upstream.body, { status: upstream.status, headers: responseHeaders });
      }
    } else if (relativePath === "/__session") {
      if (request.method === "POST") response = await establishSession(request, env);
      else if (request.method === "GET") response = await sessionStatus(request, env);
      else response = jsonResponse({ error: "method_not_allowed" }, 405);
    } else {
      response = await proxy(request, env, url, relativePath);
    }

    return withCors(response, cors);
  },
};
