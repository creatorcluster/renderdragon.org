import { supabase } from "@/integrations/supabase/client";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { PartnerPermissionId } from "@/lib/partners/permissions";

// Tables created by the partner_program migration are not in the generated
// Database type yet, so we use a broadly-typed client (same pattern as showcases.ts).
const sb = supabase as unknown as SupabaseClient;

export interface PartnerOrg {
  id: string;
  name: string;
  verified: boolean;
  verified_domain: string | null;
  status: "invited" | "active" | "suspended";
  contact_email: string | null;
  created_at: string;
}

export interface PartnerApp {
  id: string;
  org_id: string;
  supabase_client_id: string | null;
  name: string;
  description: string | null;
  logo_url: string | null;
  redirect_uris: string[];
  type: "public" | "confidential";
  token_auth_method: string | null;
  permissions: PartnerPermissionId[];
  status: "active" | "suspended";
  onboarded_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface PartnerConsent {
  id: string;
  app_id: string;
  user_id: string;
  granted_permissions: PartnerPermissionId[];
  display_name: string | null;
  username: string | null;
  avatar_url: string | null;
  email: string | null;
  granted_at: string;
  revoked_at: string | null;
  last_seen_at: string;
}

export interface PartnerApiKey {
  id: string;
  org_id: string;
  key_id: string;
  label: string | null;
  scopes: string[];
  rate_limit_per_min: number;
  status: "active" | "revoked";
  last_used_at: string | null;
  created_at: string;
  revoked_at: string | null;
}

export interface PartnerUsageEvent {
  ts: string;
  type: string;
  endpoint: string | null;
  status: number | null;
  latency_ms: number | null;
}

export interface PartnerContext {
  org: PartnerOrg;
  app: PartnerApp | null;
  role: "owner" | "member";
}

/** The signed-in user's partner org + app, or null if they are not a partner. */
export async function getPartnerContext(): Promise<PartnerContext | null> {
  const { data } = await sb.auth.getUser();
  const user = data?.user;
  if (!user) return null;

  const { data: memberships } = await sb
    .from("partner_members")
    .select("org_id, role")
    .eq("user_id", user.id)
    .limit(1);
  const membership = memberships?.[0] as { org_id: string; role: "owner" | "member" } | undefined;
  if (!membership) return null;

  const { data: org } = await sb
    .from("partner_orgs")
    .select("*")
    .eq("id", membership.org_id)
    .maybeSingle();
  if (!org) return null;

  const { data: app } = await sb
    .from("partner_apps")
    .select("*")
    .eq("org_id", membership.org_id)
    .maybeSingle();

  return {
    org: org as PartnerOrg,
    app: (app as PartnerApp) ?? null,
    role: membership.role,
  };
}

export async function updatePartnerApp(
  appId: string,
  patch: Partial<Pick<PartnerApp, "name" | "description" | "logo_url" | "redirect_uris" | "permissions">>,
): Promise<PartnerApp> {
  const { data, error } = await sb
    .from("partner_apps")
    .update({ ...patch, updated_at: new Date().toISOString() })
    .eq("id", appId)
    .select("*")
    .single();
  if (error) throw new Error(error.message);
  return data as PartnerApp;
}

export async function completePartnerOnboarding(appId: string): Promise<void> {
  const now = new Date().toISOString();
  const { error } = await sb
    .from("partner_apps")
    .update({ onboarded_at: now, updated_at: now })
    .eq("id", appId);
  if (error) throw new Error(error.message);
}

export async function listPartnerConsents(appId: string): Promise<PartnerConsent[]> {  const { data, error } = await sb
    .from("partner_consents")
    .select("*")
    .eq("app_id", appId)
    .order("granted_at", { ascending: false });
  if (error) throw new Error(error.message);
  return (data as PartnerConsent[]) ?? [];
}

export async function revokePartnerConsent(consentId: string): Promise<void> {
  const { error } = await sb
    .from("partner_consents")
    .update({ revoked_at: new Date().toISOString() })
    .eq("id", consentId);
  if (error) throw new Error(error.message);
}

export interface ConnectedApp {
  consent_id: string;
  app_id: string;
  app_name: string;
  app_logo: string | null;
  granted_permissions: PartnerPermissionId[];
  granted_at: string;
  revoked_at: string | null;
}

/** Partner apps the signed-in user has connected (their own consents only). */
export async function getMyConnectedApps(): Promise<ConnectedApp[]> {
  const { data, error } = await sb.rpc("get_my_connected_apps");
  if (error) return [];
  return (data as ConnectedApp[]) ?? [];
}

/** The signed-in user revoking their own access to an app. */
export async function revokeMyConsent(consentId: string): Promise<void> {
  await revokePartnerConsent(consentId);
}

export async function listPartnerKeys(orgId: string): Promise<PartnerApiKey[]> {
  const { data, error } = await sb
    .from("partner_api_keys")
    .select("*")
    .eq("org_id", orgId)
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return (data as PartnerApiKey[]) ?? [];
}

export async function listPartnerUsage(orgId: string, days = 30): Promise<PartnerUsageEvent[]> {
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
  const { data, error } = await sb
    .from("partner_usage_events")
    .select("ts, type, endpoint, status, latency_ms")
    .eq("org_id", orgId)
    .gte("ts", since)
    .order("ts", { ascending: false })
    .limit(5000);
  if (error) return [];
  return (data as PartnerUsageEvent[]) ?? [];
}

export interface PartnerDailyStats {
  date: string;
  calls: number;
  errors: number;
  p95LatencyMs: number;
}

export interface PartnerEndpointStats {
  endpoint: string;
  calls: number;
  errors: number;
  errorRate: number;
  p95LatencyMs: number;
}

export interface PartnerStatusStats {
  status: number | null;
  calls: number;
}

export interface PartnerUserDayStats {
  date: string;
  signIns: number;
  revocations: number;
}

export interface PartnerStats {
  totalUsers: number;
  activeUsers: number;
  revokedUsers: number;
  activeKeys: number;
  calls: number;
  errors: number;
  errorRate: number;
  p95LatencyMs: number;
  daily: PartnerDailyStats[];
  userDaily: PartnerUserDayStats[];
  endpoints: PartnerEndpointStats[];
  statuses: PartnerStatusStats[];
  recentEvents: PartnerUsageEvent[];
}

/** 95th percentile (nearest-rank) for a list of numeric samples. */
function percentile95(values: number[]): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  return sorted[Math.min(sorted.length - 1, Math.floor(sorted.length * 0.95))];
}

const isErrorStatus = (status: number | null) => status !== null && status >= 400;

export function summarizeUsage(
  consents: PartnerConsent[],
  keys: PartnerApiKey[],
  events: PartnerUsageEvent[],
  days = 30,
): PartnerStats {
  const now = Date.now();
  const activeWindow = days * 24 * 60 * 60 * 1000;

  const totalUsers = consents.length;
  const revokedUsers = consents.filter((consent) => consent.revoked_at).length;
  const activeUsers = consents.filter(
    (consent) => !consent.revoked_at && now - new Date(consent.last_seen_at).getTime() <= activeWindow,
  ).length;
  const activeKeys = keys.filter((key) => key.status === "active").length;

  const calls = events.length;
  const errors = events.filter((event) => isErrorStatus(event.status)).length;
  const errorRate = calls > 0 ? errors / calls : 0;
  const p95LatencyMs = percentile95(
    events
      .map((event) => event.latency_ms)
      .filter((value): value is number => typeof value === "number"),
  );

  const buckets = new Map<string, { calls: number; errors: number; latencies: number[] }>();
  const userBuckets = new Map<string, { signIns: number; revocations: number }>();
  for (let i = days - 1; i >= 0; i -= 1) {
    const date = new Date(now - i * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
    buckets.set(date, { calls: 0, errors: 0, latencies: [] });
    userBuckets.set(date, { signIns: 0, revocations: 0 });
  }

  for (const consent of consents) {
    const granted = userBuckets.get(consent.granted_at.slice(0, 10));
    if (granted) granted.signIns += 1;
    if (consent.revoked_at) {
      const revoked = userBuckets.get(consent.revoked_at.slice(0, 10));
      if (revoked) revoked.revocations += 1;
    }
  }

  const endpointMap = new Map<string, { calls: number; errors: number; latencies: number[] }>();
  const statusMap = new Map<number | null, number>();

  for (const event of events) {
    const bucket = buckets.get(event.ts.slice(0, 10));
    if (bucket) {
      bucket.calls += 1;
      if (isErrorStatus(event.status)) bucket.errors += 1;
      if (typeof event.latency_ms === "number") bucket.latencies.push(event.latency_ms);
    }

    const endpoint = event.endpoint?.trim() || "Unattributed";
    const endpointEntry = endpointMap.get(endpoint) ?? { calls: 0, errors: 0, latencies: [] };
    endpointEntry.calls += 1;
    if (isErrorStatus(event.status)) endpointEntry.errors += 1;
    if (typeof event.latency_ms === "number") endpointEntry.latencies.push(event.latency_ms);
    endpointMap.set(endpoint, endpointEntry);

    statusMap.set(event.status, (statusMap.get(event.status) ?? 0) + 1);
  }

  const daily: PartnerDailyStats[] = [...buckets.entries()].map(([date, bucket]) => ({
    date,
    calls: bucket.calls,
    errors: bucket.errors,
    p95LatencyMs: percentile95(bucket.latencies),
  }));

  const userDaily: PartnerUserDayStats[] = [...userBuckets.entries()].map(([date, bucket]) => ({
    date,
    signIns: bucket.signIns,
    revocations: bucket.revocations,
  }));

  const endpoints: PartnerEndpointStats[] = [...endpointMap.entries()]
    .map(([endpoint, entry]) => ({
      endpoint,
      calls: entry.calls,
      errors: entry.errors,
      errorRate: entry.calls > 0 ? entry.errors / entry.calls : 0,
      p95LatencyMs: percentile95(entry.latencies),
    }))
    .sort((a, b) => b.calls - a.calls)
    .slice(0, 10);

  const statuses: PartnerStatusStats[] = [...statusMap.entries()]
    .map(([status, count]) => ({ status, calls: count }))
    .sort((a, b) => b.calls - a.calls);

  const recentEvents = [...events]
    .sort((a, b) => new Date(b.ts).getTime() - new Date(a.ts).getTime())
    .slice(0, 15);

  return {
    totalUsers,
    activeUsers,
    revokedUsers,
    activeKeys,
    calls,
    errors,
    errorRate,
    p95LatencyMs,
    daily,
    userDaily,
    endpoints,
    statuses,
    recentEvents,
  };
}

export interface PublicPartnerApp {
  id: string;
  name: string;
  description: string | null;
  logo_url: string | null;
  permissions: PartnerPermissionId[];
}

/** Public, non-partner lookup used by the consent screen (keyed by OAuth client id). */
export async function getPublicPartnerApp(clientId: string): Promise<PublicPartnerApp | null> {
  const { data, error } = await sb.rpc("partner_app_public", { p_client_id: clientId });
  if (error) return null;
  const row = (Array.isArray(data) ? data[0] : data) as
    | { id: string; name: string; description: string | null; logo_url: string | null; permissions: string[] }
    | undefined;
  if (!row) return null;
  return {
    id: row.id,
    name: row.name,
    description: row.description ?? null,
    logo_url: row.logo_url,
    permissions: (row.permissions ?? []) as PartnerPermissionId[],
  };
}

export interface ConsentSnapshot {
  display_name?: string | null;
  username?: string | null;
  avatar_url?: string | null;
  email?: string | null;
}

/** Record (or refresh) the signed-in user's grant for an app. */
export async function recordConsent(input: {
  app_id: string;
  user_id: string;
  granted_permissions: string[];
  snapshot: ConsentSnapshot;
}): Promise<void> {
  const now = new Date().toISOString();
  const { error } = await sb.from("partner_consents").upsert(
    {
      app_id: input.app_id,
      user_id: input.user_id,
      granted_permissions: input.granted_permissions,
      display_name: input.snapshot.display_name ?? null,
      username: input.snapshot.username ?? null,
      avatar_url: input.snapshot.avatar_url ?? null,
      email: input.snapshot.email ?? null,
      granted_at: now,
      revoked_at: null,
      last_seen_at: now,
    },
    { onConflict: "app_id,user_id" },
  );
  if (error) throw new Error(error.message);
}

