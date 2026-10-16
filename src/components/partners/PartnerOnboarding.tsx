import {
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type InputHTMLAttributes,
  type TextareaHTMLAttributes,
} from "react";
import {
  IconLoader2,
  IconArrowRight,
  IconArrowLeft,
  IconCopy,
  IconKey,
  IconCheck,
  IconLogout,
} from "@tabler/icons-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import Logo from "@/components/Logo";
import { ConsentFieldList } from "@/components/partners/ConsentFieldList";
import { RedirectUriField } from "@/components/partners/RedirectUriField";
import { ImageUpload } from "@/components/profile/ImageUpload";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import {
  PARTNER_PERMISSIONS,
  resolvePartnerPermissions,
  type PartnerPermissionId,
} from "@/lib/partners/permissions";
import {
  updatePartnerApp,
  completePartnerOnboarding,
  type PartnerApp,
  type PartnerOrg,
} from "@/lib/partners/client";
import { createPartnerKey, type IssuedPartnerKey } from "@/lib/partners/provisioning";
import { useAuth } from "@/hooks/useAuth";
import { useProfile } from "@/hooks/useProfile";

interface Step {
  id: string;
  label: string;
  title: string;
  blurb: string;
}

const STEPS: Step[] = [
  {
    id: "welcome",
    label: "Welcome",
    title: "Let's get started",
    blurb: "A few quick steps and your app is ready to offer Sign in with RenderDragon.",
  },
  {
    id: "app",
    label: "Your app",
    title: "Tell us about your app",
    blurb: "This is what people see when they authorize you.",
  },
  {
    id: "access",
    label: "User access",
    title: "What can users share?",
    blurb: "Each item below appears on the consent screen, exactly as shown.",
  },
  {
    id: "redirects",
    label: "Redirects",
    title: "Where do we send people back?",
    blurb: "Add the callback URLs your app listens on. We'll only ever use these.",
  },
  {
    id: "finish",
    label: "Finish",
    title: "You're all set",
    blurb: "Review everything, grab an API key, and head to your dashboard.",
  },
];

export function PartnerOnboarding({
  app,
  org,
  onComplete,
}: {
  app: PartnerApp;
  org: PartnerOrg;
  onComplete: () => void;
}) {
  const { user, signOut } = useAuth();
  const { profile } = useProfile();

  const [active, setActive] = useState(0);
  const [name, setName] = useState(app.name);
  const [description, setDescription] = useState(app.description ?? "");
  const [logoUrl, setLogoUrl] = useState(app.logo_url ?? "");
  const [redirectUris, setRedirectUris] = useState<string[]>(app.redirect_uris ?? []);
  const [permissions, setPermissions] = useState<PartnerPermissionId[]>(
    app.permissions.length ? app.permissions : ["profile"],
  );

  const [saving, setSaving] = useState(false);
  const [issuing, setIssuing] = useState(false);
  const [issued, setIssued] = useState<IssuedPartnerKey | null>(null);

  const titleRef = useRef<HTMLSpanElement>(null);
  const checkRef = useRef<HTMLSpanElement>(null);

  const isLast = active === STEPS.length - 1;
  const firstName =
    (profile?.display_name || user?.user_metadata?.full_name || user?.email || "there")
      .split(/[@\s]/)[0] || "there";

  const togglePermission = (id: PartnerPermissionId, checked: boolean) => {
    setPermissions((current) =>
      checked ? [...new Set([...current, id])] : current.filter((permission) => permission !== id),
    );
  };

  // transitions.dev — text-states-swap on the step title.
  useEffect(() => {
    const el = titleRef.current;
    if (!el) return;
    const next = STEPS[active].title;
    if (el.textContent === next) return;
    const duration =
      parseFloat(getComputedStyle(document.documentElement).getPropertyValue("--text-swap-dur")) || 200;
    el.classList.add("is-exit");
    const timer = window.setTimeout(() => {
      el.textContent = next;
      el.classList.remove("is-exit");
      el.classList.add("is-enter-start");
      void el.offsetHeight;
      el.classList.remove("is-enter-start");
    }, duration);
    return () => window.clearTimeout(timer);
  }, [active]);

  // transitions.dev — success-check replay on the finale.
  useEffect(() => {
    if (!isLast) return;
    const check = checkRef.current;
    if (!check) return;
    const path = check.querySelector<SVGPathElement>("svg path");
    if (path) {
      const length = Math.ceil(path.getTotalLength());
      path.style.strokeDasharray = String(length);
      path.style.strokeDashoffset = String(length);
    }
    check.setAttribute("data-state", "out");
    void check.offsetWidth;
    check.setAttribute("data-state", "in");
  }, [isLast]);

  const next = () => {
    if (STEPS[active].id === "app" && !name.trim()) {
      toast.error("Give your app a name to continue.");
      return;
    }
    setActive((index) => Math.min(index + 1, STEPS.length - 1));
  };

  const back = () => setActive((index) => Math.max(index - 1, 0));

  const skip = async () => {
    setSaving(true);
    try {
      await completePartnerOnboarding(app.id);
      onComplete();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not skip setup.");
      setSaving(false);
    }
  };

  const finish = async () => {
    setSaving(true);
    try {
      await updatePartnerApp(app.id, {
        name: name.trim() || app.name,
        description: description.trim() || null,
        logo_url: logoUrl.trim() || null,
        redirect_uris: redirectUris,
        permissions,
      });
      await completePartnerOnboarding(app.id);
      onComplete();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not finish setup.");
      setSaving(false);
    }
  };

  const issueKey = async () => {
    setIssuing(true);
    try {
      setIssued(await createPartnerKey("Onboarding"));
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not create a key.");
    } finally {
      setIssuing(false);
    }
  };

  const appInitial = (name.trim() || "A").charAt(0).toUpperCase();
  const redirectCount = redirectUris.length;

  return (
    // Full-screen overlay: no navbar, no footer.
    <div className="fixed inset-0 z-[100] flex bg-background text-foreground">
      {/* Rail */}
      <aside className="hidden w-[360px] shrink-0 flex-col overflow-y-auto border-r border-sidebar-border bg-sidebar px-8 py-10 text-sidebar-foreground lg:flex">
        <div className="flex items-center gap-2">
          <Logo size="sm" />
          <span className="font-minecraftia text-lg">
            Render<span className="text-primary">Dragon</span>
          </span>
        </div>

        <div className="mt-10">
          <p className="font-heading text-lg font-semibold leading-snug">
            Set up {org.name} in a few clicks
          </p>
          <p className="mt-1 text-sm text-sidebar-foreground/60">
            For RenderDragon sign-in and the asset API.
          </p>
        </div>

        <ol className="mt-12 flex flex-col">
          {STEPS.map((step, index) => {
            const done = index < active;
            const current = index === active;
            return (
              <li key={step.id} className="flex gap-3">
                <div className="flex flex-col items-center">
                  <span
                    className={cn(
                      "flex size-8 shrink-0 items-center justify-center rounded-full border font-mono text-xs transition-colors",
                      done && "border-primary bg-primary text-primary-foreground",
                      current && "border-primary bg-primary/10 text-primary",
                      !done && !current && "border-sidebar-border text-sidebar-foreground/50",
                    )}
                  >
                    {done ? <IconCheck className="size-4" stroke={2.5} /> : index + 1}
                  </span>
                  {index < STEPS.length - 1 && (
                    <span className={cn("my-1 w-px flex-1", done ? "bg-primary/50" : "bg-sidebar-border")} />
                  )}
                </div>
                <span
                  className={cn(
                    "pb-7 pt-1.5 text-sm transition-colors",
                    current ? "font-medium text-sidebar-foreground" : "text-sidebar-foreground/55",
                  )}
                >
                  {step.label}
                </span>
              </li>
            );
          })}
        </ol>

        <div className="mt-auto flex flex-col gap-3 pt-10 text-sm">
          <span className="truncate text-sidebar-foreground/60">{user?.email}</span>
          <button
            type="button"
            onClick={() => void signOut()}
            className="inline-flex items-center gap-2 text-sidebar-foreground/70 transition-colors hover:text-sidebar-foreground"
          >
            <IconLogout className="size-4" stroke={1.7} /> Sign out
          </button>
          <button
            type="button"
            onClick={skip}
            disabled={saving}
            className="inline-flex items-center gap-2 text-sidebar-foreground/50 transition-colors hover:text-sidebar-foreground/80"
          >
            Skip setup for now
          </button>
        </div>
      </aside>

      {/* Main */}
      <div className="flex min-w-0 flex-1 flex-col">
        {/* Mobile header */}
        <div className="flex items-center justify-between border-b border-border px-5 py-4 lg:hidden">
          <div className="flex items-center gap-2">
            <Logo size="sm" />
            <span className="font-minecraftia text-base">
              Render<span className="text-primary">Dragon</span>
            </span>
          </div>
          <span className="font-mono text-xs text-muted-foreground">
            Step {active + 1} of {STEPS.length}
          </span>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-10 sm:px-10 lg:px-16 lg:py-16">
          <div className="mx-auto flex w-full max-w-xl flex-col">
            <h1 className="text-center font-heading text-3xl font-bold tracking-tight sm:text-4xl">
              <span ref={titleRef} className="t-text-swap">
                {STEPS[0].title}
              </span>
            </h1>
            <p className="mx-auto mt-3 max-w-md text-center text-muted-foreground">
              {STEPS[active].blurb}
            </p>

            <div className="t-steps mt-12 min-h-[360px]">
              {STEPS.map((step, index) => (
                <section
                  key={step.id}
                  className="t-step overflow-y-auto pr-1"
                  data-active={index === active}
                  style={
                    {
                      "--t-step-from":
                        index < active
                          ? "calc(var(--page-slide-distance) * -1)"
                          : index > active
                            ? "var(--page-slide-distance)"
                            : "0px",
                    } as CSSProperties
                  }
                >
                  {step.id === "welcome" && (
                    <div className="flex flex-col items-center text-center">
                      <p className="font-heading text-lg font-semibold">
                        Hi {firstName}, welcome aboard
                      </p>
                      <p className="mt-1 text-sm text-muted-foreground">
                        We'll set {org.name} up for RenderDragon sign-in and the asset API.
                      </p>
                      <ol className="mt-8 flex w-full flex-col divide-y divide-border border-y border-border text-left">
                        {[
                          "Name and describe your app",
                          "Choose what users share",
                          "Add your redirect URLs",
                          "Get an API key",
                        ].map((item, itemIndex) => (
                          <li key={item} className="flex items-center gap-3 py-3">
                            <span className="font-mono text-xs text-primary">
                              {String(itemIndex + 1).padStart(2, "0")}
                            </span>
                            <span className="text-sm">{item}</span>
                          </li>
                        ))}
                      </ol>
                    </div>
                  )}

                  {step.id === "app" && (
                    <div className="flex flex-col gap-5">
                      <LabeledInput
                        id="ob-name"
                        label="App name"
                        hint="Shown to users on the consent screen."
                        value={name}
                        onChange={(event) => setName(event.target.value)}
                        placeholder="Acme Tools"
                      />
                      <div className="flex flex-col gap-3">
                        <LabeledInput
                          id="ob-logo"
                          label="Logo URL"
                          hint="Paste an image link, or upload one below."
                          value={logoUrl}
                          onChange={(event) => setLogoUrl(event.target.value)}
                          placeholder="https://…/logo.png"
                        />
                        <div className="flex items-center gap-3">
                          <ImageUpload
                            bucket="showcase"
                            folder="partner-logos"
                            label="Upload logo"
                            currentImage={logoUrl}
                            onUpload={(url) => setLogoUrl(url)}
                          />
                          {logoUrl ? (
                            <img
                              src={logoUrl}
                              alt=""
                              className="size-10 shrink-0 chamfer border border-border object-cover"
                              referrerPolicy="no-referrer"
                            />
                          ) : (
                            <div className="flex size-10 shrink-0 items-center justify-center chamfer border border-border bg-card font-heading text-base font-bold text-primary">
                              {appInitial}
                            </div>
                          )}
                        </div>
                      </div>
                      <LabeledTextarea
                        id="ob-desc"
                        label="Description"
                        hint="One line about what your app does."
                        value={description}
                        onChange={(event) => setDescription(event.target.value)}
                        placeholder="A studio tool for Minecraft creators."
                        rows={2}
                      />
                    </div>
                  )}

                  {step.id === "access" && (
                    <div className="flex flex-col gap-8">
                      <div className="divide-y divide-border border-y border-border">
                        {PARTNER_PERMISSIONS.map((permission) => {
                          const disabled = permission.required;
                          return (
                            <label
                              key={permission.id}
                              className="flex cursor-pointer items-start gap-3 py-4"
                            >
                              <Checkbox
                                checked={disabled || permissions.includes(permission.id)}
                                disabled={disabled}
                                onCheckedChange={(checked) => togglePermission(permission.id, checked === true)}
                                className="mt-0.5"
                              />
                              <span className="min-w-0">
                                <span className="flex items-center gap-2 text-sm font-medium">
                                  {permission.label}
                                  {disabled && (
                                    <Badge variant="outline" className="text-[10px] font-normal">
                                      Required
                                    </Badge>
                                  )}
                                </span>
                                <span className="block text-sm text-muted-foreground">
                                  {permission.summary}
                                </span>
                              </span>
                            </label>
                          );
                        })}
                      </div>

                      <div className="mx-auto w-full max-w-sm chamfer border border-border bg-card p-5">
                        <p className="text-xs font-medium text-muted-foreground">Users will see</p>
                        <div className="mt-3 flex items-center gap-3">
                          {logoUrl ? (
                            <img
                              src={logoUrl}
                              alt=""
                              className="size-10 chamfer object-cover"
                              referrerPolicy="no-referrer"
                            />
                          ) : (
                            <div className="flex size-10 items-center justify-center chamfer bg-muted font-heading font-bold text-primary">
                              {appInitial}
                            </div>
                          )}
                          <div className="min-w-0">
                            <div className="truncate text-sm font-medium">{name.trim() || "Your app"}</div>
                            <div className="text-xs text-muted-foreground">wants to use your account</div>
                          </div>
                        </div>
                        <div className="mt-4 border-t border-border pt-4">
                          <ConsentFieldList requested={permissions} />
                        </div>
                      </div>
                    </div>
                  )}

                  {step.id === "redirects" && (
                    <RedirectUriField
                      inputId="ob-redirect"
                      value={redirectUris}
                      onChange={setRedirectUris}
                      hint="These are the only URLs we'll send users back to after they approve."
                    />
                  )}

                  {step.id === "finish" && (
                    <div className="flex flex-col items-center">
                      <span className="t-success-check" data-state="out" ref={checkRef} aria-hidden="true">
                        <svg viewBox="0 0 48 48" fill="none" className="size-16 text-primary">
                          <path
                            d="M13 25.5 L21 33 L35 16"
                            stroke="currentColor"
                            strokeWidth="3.5"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                      </span>
                      <p className="mt-4 font-heading text-xl font-semibold">
                        {name.trim() || app.name} is ready
                      </p>

                      <dl className="mt-8 flex w-full flex-col divide-y divide-border border-y border-border text-left text-sm">
                        <div className="flex justify-between gap-4 py-3">
                          <dt className="text-muted-foreground">Client id</dt>
                          <dd className="truncate font-mono text-xs">
                            {app.supabase_client_id ?? "Issued after review"}
                          </dd>
                        </div>
                        <div className="flex justify-between gap-4 py-3">
                          <dt className="text-muted-foreground">Permissions</dt>
                          <dd className="text-right">
                            {resolvePartnerPermissions(permissions)
                              .map((permission) => permission.label)
                              .join(", ")}
                          </dd>
                        </div>
                        <div className="flex justify-between gap-4 py-3">
                          <dt className="text-muted-foreground">Redirect URIs</dt>
                          <dd>{redirectCount}</dd>
                        </div>
                      </dl>

                      <div className="mt-8 w-full text-left">
                        <div className="flex items-center gap-2">
                          <IconKey className="size-4 text-primary" stroke={1.7} />
                          <p className="text-sm font-medium">Your first API key</p>
                        </div>
                        {issued ? (
                          <div className="mt-3 flex flex-col gap-2 chamfer border border-border bg-card p-4">
                            <div className="flex items-center gap-2">
                              <code className="min-w-0 flex-1 truncate font-mono text-xs">
                                {issued.secret}
                              </code>
                              <Button
                                variant="outline"
                                size="icon"
                                onClick={() => {
                                  void navigator.clipboard.writeText(issued.secret);
                                  toast.success("Secret copied");
                                }}
                                aria-label="Copy secret"
                              >
                                <IconCopy className="size-4" />
                              </Button>
                            </div>
                            <p className="text-xs text-muted-foreground">
                              Client id <span className="font-mono">{issued.key_id}</span>. Shown once.
                            </p>
                          </div>
                        ) : (
                          <Button variant="outline" className="mt-3" onClick={issueKey} disabled={issuing}>
                            {issuing && <IconLoader2 className="size-4 animate-spin" aria-hidden />}
                            Create key
                          </Button>
                        )}
                      </div>
                    </div>
                  )}
                </section>
              ))}
            </div>
          </div>
        </div>

        {/* Bottom CTA */}
        <div className="border-t border-border px-6 py-5 sm:px-10 lg:px-16">
          <div className="mx-auto flex w-full max-w-xl items-center justify-center gap-3">
            {active > 0 && (
              <Button variant="ghost" onClick={back} disabled={saving}>
                <IconArrowLeft className="size-4" data-icon="inline-start" aria-hidden />
                Back
              </Button>
            )}
            {isLast ? (
              <Button onClick={finish} disabled={saving} size="lg" className="min-w-[220px]">
                {saving && <IconLoader2 className="size-4 animate-spin" aria-hidden />}
                Enter dashboard
              </Button>
            ) : (
              <Button onClick={next} disabled={saving} size="lg" className="min-w-[220px]">
                {active === 0 ? "Get started" : "Continue"}
                <IconArrowRight className="size-4" data-icon="inline-end" aria-hidden />
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/** Input with the label rendered inside the field, matching the onboarding field style. */
function LabeledInput({
  label,
  hint,
  ...props
}: InputHTMLAttributes<HTMLInputElement> & { label: string; hint?: string }) {
  return (
    <div className="flex flex-col gap-2">
      <label
        htmlFor={props.id}
        className="chamfer border border-input bg-card/40 transition-colors focus-within:border-primary"
      >
        <span className="block px-4 pt-3 text-xs text-muted-foreground">{label}</span>
        <input
          {...props}
          className="w-full bg-transparent px-4 pb-3 pt-1 text-base text-foreground outline-none placeholder:text-muted-foreground/60"
        />
      </label>
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}

/** Textarea equivalent of LabeledInput. */
function LabeledTextarea({
  label,
  hint,
  mono,
  ...props
}: TextareaHTMLAttributes<HTMLTextAreaElement> & { label: string; hint?: string; mono?: boolean }) {
  return (
    <div className="flex flex-col gap-2">
      <label
        htmlFor={props.id}
        className="chamfer border border-input bg-card/40 transition-colors focus-within:border-primary"
      >
        <span className="block px-4 pt-3 text-xs text-muted-foreground">{label}</span>
        <textarea
          {...props}
          className={cn(
            "w-full resize-none bg-transparent px-4 pb-3 pt-1 text-base text-foreground outline-none placeholder:text-muted-foreground/60",
            mono && "font-mono text-sm",
          )}
        />
      </label>
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}
