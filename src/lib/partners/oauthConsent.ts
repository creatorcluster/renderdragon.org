import { supabase } from "@/integrations/supabase/client";

// Adapter over Supabase Auth's OAuth 2.1 *server* consent endpoints. The consent
// screen is ours; Supabase owns the protocol. When the installed supabase-js
// exposes the OAuth server client methods we use them, otherwise we fall back to
// the documented GoTrue REST routes (both are behind the same feature).

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string;
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string;

interface OAuthMethods {
  getAuthorizationDetails: (authorizationId: string) => Promise<{ data: unknown; error: { message: string } | null }>;
  approveAuthorization: (authorizationId: string) => Promise<{ data: unknown; error: { message: string } | null }>;
  denyAuthorization: (authorizationId: string) => Promise<{ data: unknown; error: { message: string } | null }>;
}

const clientOAuth = (): OAuthMethods | null => {
  const auth = supabase.auth as unknown as { oauth?: OAuthMethods };
  return auth.oauth ?? null;
};

export interface ConsentAuthorization {
  authorizationId: string;
  clientId: string | null;
  clientName: string;
  clientLogoUrl: string | null;
  redirectUri: string | null;
  scopes: string[];
  /** Present when the user has already consented: Supabase auto-approves and hands
   * back a redirect (with the code) instead of a pending consent request. */
  redirectUrl: string | null;
}

const asRecord = (value: unknown): Record<string, unknown> =>
  typeof value === "object" && value !== null ? (value as Record<string, unknown>) : {};

const pickString = (record: Record<string, unknown>, ...keys: string[]): string | null => {
  for (const key of keys) {
    const value = record[key];
    if (typeof value === "string" && value.length > 0) return value;
  }
  return null;
};

function normalize(authorizationId: string, data: unknown): ConsentAuthorization {
  const root = asRecord(data);
  const client = asRecord(root.client ?? root.oauth_client);
  const scope = pickString(root, "scope", "scopes");
  return {
    authorizationId,
    clientId: pickString(client, "client_id", "clientId", "id") ?? pickString(root, "client_id"),
    clientName: pickString(client, "name", "client_name") ?? "A partner application",
    clientLogoUrl: pickString(client, "logo_uri", "logo_url", "logo"),
    redirectUri: pickString(client, "redirect_uri", "redirectUri") ?? pickString(root, "redirect_uri"),
    redirectUrl: pickString(root, "redirect_url", "redirectUrl"),
    scopes: scope ? scope.split(/\s+/).filter(Boolean) : [],
  };
}

async function authedFetch(path: string, init: RequestInit = {}): Promise<Response> {
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  return fetch(`${SUPABASE_URL}/auth/v1${path}`, {
    ...init,
    headers: {
      apikey: SUPABASE_KEY,
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(init.headers ?? {}),
    },
  });
}

export async function loadAuthorization(authorizationId: string): Promise<ConsentAuthorization> {
  const oauth = clientOAuth();
  if (oauth) {
    const { data, error } = await oauth.getAuthorizationDetails(authorizationId);
    if (error) throw new Error(error.message);
    return normalize(authorizationId, data);
  }

  const response = await authedFetch(`/oauth/authorizations/${encodeURIComponent(authorizationId)}`);
  if (!response.ok) {
    throw new Error(
      response.status === 404
        ? "OAuth consent is not enabled on this project yet."
        : `Could not load this authorization request (${response.status}).`,
    );
  }
  return normalize(authorizationId, await response.json());
}

/** Approve or deny. Returns the URL to send the user back to the partner. */
export async function decideAuthorization(
  authorizationId: string,
  approve: boolean,
): Promise<string | null> {
  const oauth = clientOAuth();
  if (oauth) {
    const { data, error } = approve
      ? await oauth.approveAuthorization(authorizationId)
      : await oauth.denyAuthorization(authorizationId);
    if (error) throw new Error(error.message);
    const record = asRecord(data);
    return pickString(record, "redirect_url", "redirectUrl", "url");
  }

  const response = await authedFetch(
    `/oauth/authorizations/${encodeURIComponent(authorizationId)}/consent`,
    {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ action: approve ? "approve" : "deny" }),
    },
  );
  if (!response.ok) throw new Error(`Could not record your decision (${response.status}).`);
  const record = asRecord(await response.json());
  return pickString(record, "redirect_url", "redirectUrl", "url");
}
