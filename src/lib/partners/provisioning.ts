import { supabase } from "@/integrations/supabase/client";

// Partner API keys are issued through the `partner-keys` Edge Function because
// the secret must also be registered in the router's Durable Object, which needs
// the router admin key. The browser never sees that key.

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string;
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string;

async function callPartnerKeys<T>(body: Record<string, unknown>): Promise<T> {
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;

  const response = await fetch(`${SUPABASE_URL}/functions/v1/partner-keys`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      apikey: SUPABASE_KEY,
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(body),
  });

  const payload = (await response.json().catch(() => ({}))) as Record<string, unknown>;
  if (!response.ok) {
    throw new Error(
      typeof payload.error === "string"
        ? payload.error
        : response.status === 404
          ? "Key provisioning isn't set up yet."
          : `Request failed (${response.status})`,
    );
  }
  return payload as T;
}

export interface IssuedPartnerKey {
  key_id: string;
  secret: string;
  label: string | null;
  scopes: string[];
  rate_limit_per_min: number;
}

export const createPartnerKey = (label: string) =>
  callPartnerKeys<IssuedPartnerKey>({ action: "create", label });

export const revokePartnerKey = (keyId: string) =>
  callPartnerKeys<{ ok: boolean }>({ action: "revoke", key_id: keyId });
