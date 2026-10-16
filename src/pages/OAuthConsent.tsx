import { useEffect, useRef, useState } from "react";
import { Helmet } from "react-helmet-async";
import { useSearchParams } from "react-router-dom";
import { IconLoader2, IconLock } from "@tabler/icons-react";
import { TwitterVerifiedIcon } from "@/components/partners/TwitterVerifiedIcon";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import AuthDialog from "@/components/auth/AuthDialog";
import { useAuth } from "@/hooks/useAuth";
import { useProfile } from "@/hooks/useProfile";
import { ConsentFieldList } from "@/components/partners/ConsentFieldList";
import { toast } from "sonner";
import {
  loadAuthorization,
  decideAuthorization,
  type ConsentAuthorization,
} from "@/lib/partners/oauthConsent";
import {
  getPublicPartnerApp,
  recordConsent,
  type PublicPartnerApp,
} from "@/lib/partners/client";
import type { PartnerPermissionId } from "@/lib/partners/permissions";

type Screen = "loading" | "ready" | "error" | "done";

export default function OAuthConsent() {
  const [params] = useSearchParams();
  const authorizationId = params.get("authorization_id");
  const { user, loading: authLoading } = useAuth();
  const { profile } = useProfile();

  const [screen, setScreen] = useState<Screen>("loading");
  const [authorization, setAuthorization] = useState<ConsentAuthorization | null>(null);
  const [publicApp, setPublicApp] = useState<PublicPartnerApp | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [deciding, setDeciding] = useState(false);
  const [authOpen, setAuthOpen] = useState(false);

  // Guards against React StrictMode double-invoking the effect: an authorization
  // request can only be read once, so a second call would 400.
  const startedRef = useRef(false);

  useEffect(() => {
    if (authLoading || !user || !authorizationId || startedRef.current) return;
    startedRef.current = true;
    setScreen("loading");
    (async () => {
      try {
        const details = await loadAuthorization(authorizationId);
        // Already consented: Supabase hands back a redirect (with the code) instead
        // of a pending consent request — just send the user back to the app.
        if (details.redirectUrl) {
          window.location.assign(details.redirectUrl);
          return;
        }
        // Only registered, active partner apps may be authorized (unknown/disabled →
        // error, never fall through to approval). See docs/partner-program/oauth-consent.md.
        const app = details.clientId ? await getPublicPartnerApp(details.clientId) : null;
        if (!app) {
          setError("This app isn't a registered RenderDragon partner, so access can't be granted.");
          setScreen("error");
          return;
        }
        setAuthorization(details);
        setPublicApp(app);
        setScreen("ready");
      } catch (err) {
        setError(err instanceof Error ? err.message : "Something went wrong.");
        setScreen("error");
      }
    })();
  }, [authLoading, user, authorizationId]);

  // The app's requested permissions come from the registry (the source of truth).
  const requested: PartnerPermissionId[] = publicApp?.permissions ?? [];

  const redirectHost = (() => {
    try {
      return authorization?.redirectUri ? new URL(authorization.redirectUri).host : null;
    } catch {
      return null;
    }
  })();

  const decide = async (approve: boolean) => {
    if (!authorizationId || !authorization) return;
    setDeciding(true);
    try {
      if (approve && publicApp && user) {
        try {
          await recordConsent({
            app_id: publicApp.id,
            user_id: user.id,
            granted_permissions: requested,
            snapshot: {
              display_name: profile?.display_name ?? user.user_metadata?.full_name ?? null,
              username: profile?.username ?? null,
              avatar_url: profile?.avatar_url ?? user.user_metadata?.avatar_url ?? null,
              email: requested.includes("email") ? user.email ?? null : null,
            },
          });
        } catch (recordError) {
          // Never block the user's decision on our bookkeeping.
          console.warn("Could not record consent:", recordError);
        }
      }
      const redirect = await decideAuthorization(authorizationId, approve);
      if (redirect) {
        window.location.assign(redirect);
        return;
      }
      setScreen("done");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not complete the request.");
    } finally {
      setDeciding(false);
    }
  };

  const appName = publicApp?.name ?? authorization?.clientName ?? "A partner application";
  const appLogo = publicApp?.logo_url ?? authorization?.clientLogoUrl;

  return (
    <div className="min-h-screen flex flex-col cow-grid-bg bg-background text-foreground">
      <Helmet>
        <title>Authorize an app | RenderDragon</title>
        <meta name="robots" content="noindex, nofollow" />
      </Helmet>

      <main className="flex-grow flex items-center justify-center px-4 py-28">
        <div className="w-full max-w-md">
          {!authorizationId ? (
            <ErrorCard message="This authorization link is missing its request id." />
          ) : screen === "error" ? (
            <ErrorCard message={error ?? "Something went wrong."} />
          ) : !authLoading && !user ? (
            <>
              <Panel title="Sign in to continue">
                <p className="text-sm text-muted-foreground">
                  You need a RenderDragon account to review this request.
                </p>
                <Button className="mt-5 w-full" onClick={() => setAuthOpen(true)}>
                  Sign in
                </Button>
              </Panel>
              <AuthDialog open={authOpen} onOpenChange={setAuthOpen} />
            </>
          ) : screen === "done" ? (
            <Panel title="Done">
              <p className="text-sm text-muted-foreground">
                You can close this window and return to {appName}.
              </p>
            </Panel>
          ) : screen === "loading" || !authorization ? (
            <Panel title="Checking request">
              <div className="flex items-center gap-3 text-muted-foreground">
                <IconLoader2 className="size-5 animate-spin" />
                <span className="text-sm">Loading the details…</span>
              </div>
            </Panel>
          ) : (
            <div className="rounded-[var(--radius)] border border-border bg-card p-6 shadow-2xl sm:p-7">
              <div className="flex items-center gap-3">
                {appLogo ? (
                  <img
                    src={appLogo}
                    alt=""
                    className="size-11 rounded-[var(--radius)] object-cover"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="flex size-11 items-center justify-center rounded-[var(--radius)] bg-muted font-heading text-lg font-bold text-primary">
                    {appName.charAt(0).toUpperCase()}
                  </div>
                )}
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="truncate font-heading text-base font-semibold">{appName}</span>
                    <Badge variant="secondary" className="gap-1 text-[10px]">
                      <TwitterVerifiedIcon className="size-3.5 text-[#1D9BF0]" /> Verified partner
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {publicApp?.description || "wants to use your RenderDragon account"}
                  </p>
                </div>
              </div>

              <Separator className="my-5" />

              <p className="mb-3 text-sm font-medium">This app will be able to see:</p>
              <ConsentFieldList requested={requested} />

              <Separator className="my-5" />

              {redirectHost && (
                <p className="mb-4 text-xs text-muted-foreground">
                  You'll return to <span className="font-mono text-foreground">{redirectHost}</span> after approving.
                </p>
              )}

              <div className="flex gap-3">
                <Button className="flex-1" onClick={() => decide(true)} disabled={deciding}>
                  {deciding && <IconLoader2 className="size-4 animate-spin" aria-hidden />}
                  Approve
                </Button>
                <Button variant="outline" className="flex-1" onClick={() => decide(false)} disabled={deciding}>
                  Deny
                </Button>
              </div>

              <p className="mt-4 flex items-center justify-center gap-1.5 text-center text-xs text-muted-foreground">
                <IconLock className="size-3.5" aria-hidden />
                Signed in as {user?.email}. You can revoke access any time.
              </p>
              <p className="mt-2 text-center text-xs text-muted-foreground">
                By approving you agree to our{" "}
                <a href="/tos" className="text-primary hover:underline">Terms</a> and{" "}
                <a href="/privacy" className="text-primary hover:underline">Privacy Policy</a>.
              </p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-[var(--radius)] border border-border bg-card p-6 shadow-xl">
      <h1 className="font-heading text-lg font-semibold">{title}</h1>
      <div className="mt-3">{children}</div>
    </div>
  );
}

function ErrorCard({ message }: { message: string }) {
  return (
    <Panel title="Can't continue">
      <p className="text-sm text-muted-foreground">{message}</p>
      <Button variant="outline" className="mt-5 w-full" onClick={() => window.location.assign("/")}>
        Go to RenderDragon
      </Button>
    </Panel>
  );
}
