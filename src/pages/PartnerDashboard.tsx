import { useCallback, useEffect, useRef, useState } from "react";
import { Helmet } from "react-helmet-async";
import { Link } from "react-router-dom";
import { IconLoader2, IconArrowRight, IconKey } from "@tabler/icons-react";
import { TwitterVerifiedIcon } from "@/components/partners/TwitterVerifiedIcon";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import AuthDialog from "@/components/auth/AuthDialog";
import { useAuth } from "@/hooks/useAuth";
import { PartnerAppForm } from "@/components/partners/PartnerAppForm";
import { PartnerUsers } from "@/components/partners/PartnerUsers";
import { PartnerKeys } from "@/components/partners/PartnerKeys";
import { PartnerStatsPanel } from "@/components/partners/PartnerStatsPanel";
import { PartnerOnboarding } from "@/components/partners/PartnerOnboarding";
import { ClientId } from "@/components/partners/ClientId";
import {
  getPartnerContext,
  listPartnerConsents,
  listPartnerKeys,
  listPartnerUsage,
  summarizeUsage,
  type PartnerApiKey,
  type PartnerConsent,
  type PartnerContext,
  type PartnerStats,
} from "@/lib/partners/client";
import { resolvePartnerPermissions } from "@/lib/partners/permissions";

const EMPTY_STATS: PartnerStats = {
  totalUsers: 0,
  activeUsers: 0,
  revokedUsers: 0,
  activeKeys: 0,
  calls: 0,
  errors: 0,
  errorRate: 0,
  p95LatencyMs: 0,
  daily: [],
  userDaily: [],
  endpoints: [],
  statuses: [],
  recentEvents: [],
};

export default function PartnerDashboard() {
  const { user, loading: authLoading } = useAuth();
  const [loading, setLoading] = useState(true);
  const [context, setContext] = useState<PartnerContext | null>(null);
  const [consents, setConsents] = useState<PartnerConsent[]>([]);
  const [keys, setKeys] = useState<PartnerApiKey[]>([]);
  const [stats, setStats] = useState<PartnerStats>(EMPTY_STATS);
  const [authOpen, setAuthOpen] = useState(false);
  const hasLoadedRef = useRef(false);

  const load = useCallback(async () => {
    // Only show the full-page loader on the first fetch. Refreshes (e.g. after a
    // token refresh on tab focus) must not unmount the onboarding wizard.
    if (!hasLoadedRef.current) setLoading(true);
    try {
      const ctx = await getPartnerContext();
      setContext(ctx);
      if (ctx?.app) {
        const [consentRows, keyRows, usage] = await Promise.all([
          listPartnerConsents(ctx.app.id),
          listPartnerKeys(ctx.org.id),
          listPartnerUsage(ctx.org.id),
        ]);
        setConsents(consentRows);
        setKeys(keyRows);
        setStats(summarizeUsage(consentRows, keyRows, usage));
      }
    } finally {
      hasLoadedRef.current = true;
      setLoading(false);
    }
  }, []);

  const userId = user?.id;

  useEffect(() => {
    if (authLoading) return;
    if (userId) {
      // Depend on the id, not the whole user object: Supabase replaces the user
      // object on TOKEN_REFRESHED (tab focus), which would otherwise re-run this.
      void load();
    } else {
      setLoading(false);
    }
  }, [authLoading, userId, load]);

  // First-time setup takes over the whole screen — no dashboard chrome.
  if (!authLoading && !loading && user && context?.app && !context.app.onboarded_at) {
    return (
      <>
        <Helmet>
          <title>Partner setup | RenderDragon</title>
          <meta name="robots" content="noindex, nofollow" />
        </Helmet>
        <PartnerOnboarding app={context.app} org={context.org} onComplete={load} />
      </>
    );
  }

  return (
    <div className="min-h-screen flex flex-col cow-grid-bg bg-background text-foreground">
      <Helmet>
        <title>Partner dashboard | RenderDragon</title>
        <meta name="robots" content="noindex, nofollow" />
      </Helmet>

      <main className="flex-grow pt-28 pb-16">
        <div className="container mx-auto px-4">
          {authLoading || loading ? (
            <div className="flex items-center gap-3 py-24 text-muted-foreground">
              <IconLoader2 className="size-5 animate-spin" />
              <span>Loading your dashboard…</span>
            </div>
          ) : !user ? (
            <EmptyState
              title="Sign in to your partner dashboard"
              body="The dashboard is for approved partners only."
              action={
                <>
                  <Button onClick={() => setAuthOpen(true)}>Sign in</Button>
                  <AuthDialog open={authOpen} onOpenChange={setAuthOpen} />
                </>
              }
            />
          ) : !context ? (
            <EmptyState
              title="You're not a partner yet"
              body="The partner program is invite-only. Reach out through our contact page and we'll take it from there."
              action={
                <Button asChild>
                  <Link to="/contact">
                    Contact us
                    <IconArrowRight data-icon="inline-end" />
                  </Link>
                </Button>
              }
            />
          ) : (
            <>
              <header className="flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  {context.app?.logo_url ? (
                    <img
                      src={context.app.logo_url}
                      alt=""
                      className="size-12 rounded-[var(--radius)] object-cover"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <div className="flex size-12 items-center justify-center rounded-[var(--radius)] bg-muted font-heading text-xl font-bold text-primary">
                      {(context.app?.name || context.org.name).charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div>
                    <div className="flex items-center gap-2">
                      <h1 className="font-heading text-2xl font-bold">
                        {context.app?.name || context.org.name}
                      </h1>
                      {context.org.verified && (
                        <Badge variant="secondary" className="gap-1">
                          <TwitterVerifiedIcon className="size-3.5 text-[#1D9BF0]" /> Verified
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">{context.org.name}</p>
                  </div>
                </div>
                <div className="flex gap-6 text-sm">
                  <Metric label="Users" value={String(stats.totalUsers)} />
                  <Metric label="Keys" value={String(keys.filter((key) => key.status === "active").length)} />
                  <Metric label="Calls (30d)" value={stats.calls.toLocaleString()} />
                </div>
              </header>

              <Separator className="my-8" />

              {!context.app ? (
                <EmptyState
                  title="No app yet"
                  body="Your organization is approved but the OAuth app hasn't been created. We'll set it up shortly."
                  action={null}
                />
              ) : (
                <Tabs defaultValue="overview">
                  <TabsList>
                    <TabsTrigger value="overview">Overview</TabsTrigger>
                    <TabsTrigger value="app">App</TabsTrigger>
                    <TabsTrigger value="users">Users</TabsTrigger>
                    <TabsTrigger value="keys">Keys</TabsTrigger>
                    <TabsTrigger value="stats">Stats</TabsTrigger>
                  </TabsList>

                  <TabsContent value="overview" forceMount className="mt-8 data-[state=inactive]:hidden">
                    <div className="grid gap-8 lg:grid-cols-[1.2fr_0.8fr]">
                      <PartnerStatsPanel stats={stats} />
                      <div className="flex flex-col gap-6">
                        <div className="rounded-[var(--radius)] border border-border bg-card p-6">
                          <h3 className="font-heading text-base font-semibold">Your app</h3>
                          <p className="mt-2 text-sm text-muted-foreground">
                            {context.app.description || "No description yet."}
                          </p>
                          {!context.app.supabase_client_id && (
                            <p className="mt-3 text-xs text-muted-foreground">
                              Your OAuth client hasn't been registered yet. Add at least one redirect URI in the
                              App tab and we'll issue the client id.
                            </p>
                          )}
                          <dl className="mt-4 flex flex-col gap-3 text-sm">
                            <Row label="Client id" value={<ClientId clientId={context.app.supabase_client_id} />} />
                            <Row label="Redirect URIs" value={String(context.app.redirect_uris.length)} />
                            <Row
                              label="Permissions"
                              value={resolvePartnerPermissions(context.app.permissions)
                                .map((permission) => permission.label)
                                .join(", ") || "Profile"}
                            />
                          </dl>
                        </div>
                        <div className="rounded-[var(--radius)] border border-border bg-card p-6">
                          <h3 className="flex items-center gap-2 font-heading text-base font-semibold">
                            <IconKey className="size-4 text-primary" /> API
                          </h3>
                          <p className="mt-2 text-sm text-muted-foreground">
                            Sign your requests with this key.
                          </p>
                          <code className="mt-4 block truncate rounded-[var(--radius)] border border-border bg-muted px-3 py-2 font-mono text-xs">
                            GET https://api.codersoft.xyz/__version
                          </code>
                        </div>
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="app" forceMount className="mt-8 data-[state=inactive]:hidden">
                    <PartnerAppForm app={context.app} onSaved={load} />
                  </TabsContent>

                  <TabsContent value="users" forceMount className="mt-8 data-[state=inactive]:hidden">
                    <PartnerUsers consents={consents} onChanged={load} />
                  </TabsContent>

                  <TabsContent value="keys" forceMount className="mt-8 data-[state=inactive]:hidden">
                    <PartnerKeys keys={keys} onChanged={load} />
                  </TabsContent>

                  <TabsContent value="stats" forceMount className="mt-8 data-[state=inactive]:hidden">
                    <PartnerStatsPanel stats={stats} />
                  </TabsContent>
                </Tabs>
              )}
            </>
          )}
        </div>
      </main>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="font-heading text-xl font-bold tabular-nums">{value}</div>
      <div className="text-xs text-muted-foreground">{label}</div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <dt className="shrink-0 text-muted-foreground">{label}</dt>
      <dd className="min-w-0 text-right">{value}</dd>
    </div>
  );
}

function EmptyState({
  title,
  body,
  action,
}: {
  title: string;
  body: string;
  action: React.ReactNode;
}) {
  return (
    <div className="mx-auto flex max-w-lg flex-col items-center rounded-[var(--radius)] border border-border bg-card px-8 py-16 text-center">
      <h2 className="font-heading text-xl font-semibold">{title}</h2>
      <p className="mt-3 text-sm text-muted-foreground">{body}</p>
      {action && <div className="mt-6 flex gap-3">{action}</div>}
    </div>
  );
}
