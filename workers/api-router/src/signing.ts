const encoder = new TextEncoder();

const toHex = (bytes: Uint8Array): string => {
  let out = "";
  for (const byte of bytes) out += byte.toString(16).padStart(2, "0");
  return out;
};

export async function hmacHex(secret: string, message: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const signature = await crypto.subtle.sign("HMAC", key, encoder.encode(message));
  return toHex(new Uint8Array(signature));
}

export async function sha256Hex(data: ArrayBuffer | Uint8Array | string): Promise<string> {
  const bytes =
    typeof data === "string"
      ? encoder.encode(data)
      : data instanceof Uint8Array
        ? data
        : new Uint8Array(data);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return toHex(new Uint8Array(digest));
}

// Constant-time comparison. Length is not treated as secret, only the contents.
export function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i += 1) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

export function randomHex(bytes = 16): string {
  const buffer = new Uint8Array(bytes);
  crypto.getRandomValues(buffer);
  return toHex(buffer);
}

export interface CanonicalParts {
  method: string;
  path: string;
  clientId: string;
  timestamp: string;
  nonce: string;
  bodyHash: string;
}

// Canonical request string. Both the router and every signing client (gateway,
// third-party servers, the router itself when calling e3) build it identically.
export function canonicalString(parts: CanonicalParts): string {
  return [
    "v1",
    parts.method.toUpperCase(),
    parts.path,
    parts.clientId,
    parts.timestamp,
    parts.nonce,
    parts.bodyHash,
  ].join("\n");
}

export const AUTH_HEADERS = {
  client: "x-auth-client",
  timestamp: "x-auth-timestamp",
  nonce: "x-auth-nonce",
  signature: "x-auth-signature",
} as const;

export const E3_HEADERS = {
  timestamp: "x-e3-timestamp",
  nonce: "x-e3-nonce",
  signature: "x-e3-signature",
} as const;
