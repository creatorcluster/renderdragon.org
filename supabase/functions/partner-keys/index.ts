// Partner API key provisioning.
//
// Issues read-only asset API keys for a partner org and registers the secret in
// the codersoft-api-router Durable Object. Runs with the service role, so it can
// write partner_api_keys; the browser never sees the router admin key.
//
// Required Edge Function secrets:
//   ROUTER_ADMIN_KEY  - the router's ADMIN_KEY (set via the Supabase dashboard)
// Optional:
//   ROUTER_ORIGIN     - defaults to https://api.codersoft.xyz

import { createClient } from "npm:@supabase/supabase-js@2";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, content-type, apikey",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS_HEADERS, "content-type": "application/json" },
  });

const hex = (bytes: number): string => {
  const buffer = new Uint8Array(bytes);
  crypto.getRandomValues(buffer);
  return [...buffer].map((byte) => byte.toString(16).padStart(2, "0")).join("");
};

const DEFAULT_SCOPES = ["assets:read"];
const DEFAULT_RATE_LIMIT = 120;

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") return new Response("ok", { headers: CORS_HEADERS });
  if (request.method !== "POST") return json({ error: "method_not_allowed" }, 405);

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  const adminKey = Deno.env.get("ROUTER_ADMIN_KEY");
  const routerOrigin = (Deno.env.get("ROUTER_ORIGIN") ?? "https://api.codersoft.xyz").replace(/\/+$/, "");

  if (!supabaseUrl || !serviceKey) return json({ error: "server_misconfigured" }, 500);

  const token = (request.headers.get("Authorization") ?? "").replace(/^Bearer\s+/i, "");
  const admin = createClient(supabaseUrl, serviceKey, { auth: { persistSession: false } });

  const { data: userData, error: userError } = await admin.auth.getUser(token);
  if (userError || !userData.user) return json({ error: "unauthorized" }, 401);

  const { data: membership } = await admin
    .from("partner_members")
    .select("org_id, role")
    .eq("user_id", userData.user.id)
    .maybeSingle();
  if (!membership) return json({ error: "not_a_partner" }, 403);
  // Key management is owner-only (see docs/partner-program/data-model.md / api-security.md).
  if (membership.role !== "owner") return json({ error: "forbidden_owner_only" }, 403);

  const orgId = membership.org_id as string;
  const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;

  const registerInRouter = (keyId: string, secret: string) =>
    fetch(`${routerOrigin}/__admin/clients/${keyId}`, {
      method: "PUT",
      headers: { "content-type": "application/json", "x-admin-key": adminKey ?? "" },
      body: JSON.stringify({
        secret,
        description: `partner:${orgId}`,
        enabled: true,
        scopes: DEFAULT_SCOPES,
        rateLimitPerMin: DEFAULT_RATE_LIMIT,
      }),
    });

  const removeFromRouter = (keyId: string) =>
    fetch(`${routerOrigin}/__admin/clients/${keyId}`, {
      method: "DELETE",
      headers: { "x-admin-key": adminKey ?? "" },
    });

  if (body.action === "create") {
    const keyId = `rdk_${hex(12)}`;
    const secret = hex(32);
    const label = typeof body.label === "string" && body.label.trim() ? body.label.trim().slice(0, 80) : null;

    // Register with the router only when it's configured. If it isn't yet, still issue
    // the key so onboarding works; it activates once the API infrastructure is deployed.
    let routerRegistered = false;
    if (adminKey) {
      const registration = await registerInRouter(keyId, secret);
      if (!registration.ok) {
        return json({ error: "router_registration_failed", status: registration.status }, 502);
      }
      routerRegistered = true;
    }

    const { error: insertError } = await admin.from("partner_api_keys").insert({
      org_id: orgId,
      key_id: keyId,
      label,
      scopes: DEFAULT_SCOPES,
      rate_limit_per_min: DEFAULT_RATE_LIMIT,
      status: "active",
    });

    if (insertError) {
      if (routerRegistered) await removeFromRouter(keyId);
      return json({ error: insertError.message }, 500);
    }

    return json({
      key_id: keyId,
      secret,
      label,
      scopes: DEFAULT_SCOPES,
      rate_limit_per_min: DEFAULT_RATE_LIMIT,
      router_registered: routerRegistered,
    });
  }

  if (body.action === "revoke") {
    const keyId = String(body.key_id ?? "");
    const { data: row } = await admin
      .from("partner_api_keys")
      .select("id, org_id")
      .eq("key_id", keyId)
      .maybeSingle();
    if (!row || row.org_id !== orgId) return json({ error: "not_found" }, 404);

    if (adminKey) await removeFromRouter(keyId);
    await admin
      .from("partner_api_keys")
      .update({ status: "revoked", revoked_at: new Date().toISOString() })
      .eq("id", row.id);

    return json({ ok: true });
  }

  return json({ error: "unknown_action" }, 400);
});
