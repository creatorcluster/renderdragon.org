import { AUTH_HEADERS, canonicalString, sha256Hex } from "./signing";

export interface AuthEnv {
  AUTH_STORE: DurableObjectNamespace;
  REPLAY_PROTECTION?: string;
}

export type AuthOutcome =
  | { ok: true; clientId: string; scopes: string[]; rateLimitPerMin: number }
  | { ok: false; status: number; reason: string };

const MAX_SKEW_SECONDS = 300;

// "writes": store single-use nonces for state-changing methods only (uploads),
//   which keeps Durable Object writes proportional to writes, not reads.
// "all":    store a nonce for every request (strongest, more DO writes).
// "off":    timestamp window only.
const replayMode = (env: AuthEnv): "writes" | "all" | "off" => {
  const mode = (env.REPLAY_PROTECTION ?? "writes").toLowerCase();
  return mode === "all" || mode === "off" ? mode : "writes";
};

export async function authenticateRequest(
  request: Request,
  url: URL,
  env: AuthEnv,
  body: ArrayBuffer | undefined,
): Promise<AuthOutcome> {
  const clientId = request.headers.get(AUTH_HEADERS.client) ?? "";
  const timestamp = request.headers.get(AUTH_HEADERS.timestamp) ?? "";
  const nonce = request.headers.get(AUTH_HEADERS.nonce) ?? "";
  const signature = request.headers.get(AUTH_HEADERS.signature) ?? "";

  if (!clientId || !timestamp || !nonce || !signature) {
    return { ok: false, status: 401, reason: "missing_auth_headers" };
  }

  const bodyHash = await sha256Hex(body ?? new Uint8Array());
  const canonical = canonicalString({
    method: request.method,
    path: `${url.pathname}${url.search}`,
    clientId,
    timestamp,
    nonce,
    bodyHash,
  });

  const mode = replayMode(env);
  const method = request.method.toUpperCase();
  const isRead = method === "GET" || method === "HEAD";
  const storeNonce = mode === "all" || (mode === "writes" && !isRead);

  const stub = env.AUTH_STORE.get(env.AUTH_STORE.idFromName("global"));
  const response = await stub.fetch("https://auth.internal/verify", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      clientId,
      timestamp,
      nonce,
      signature,
      canonical,
      storeNonce,
      maxSkewSeconds: MAX_SKEW_SECONDS,
    }),
  });

  const data = (await response.json()) as {
    ok: boolean;
    reason?: string;
    scopes?: string[];
    rateLimitPerMin?: number;
  };
  if (!data.ok) {
    const status = response.status === 403 || response.status === 429 ? response.status : 401;
    return { ok: false, status, reason: data.reason ?? "unauthorized" };
  }
  return {
    ok: true,
    clientId,
    scopes: Array.isArray(data.scopes) ? data.scopes : [],
    rateLimitPerMin: data.rateLimitPerMin ?? 0,
  };
}
