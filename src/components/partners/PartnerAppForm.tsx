import { useState } from "react";
import { IconLoader2 } from "@tabler/icons-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { PARTNER_PERMISSIONS, type PartnerPermissionId } from "@/lib/partners/permissions";
import { updatePartnerApp, type PartnerApp } from "@/lib/partners/client";
import { RedirectUriField } from "@/components/partners/RedirectUriField";
import { ClientId } from "@/components/partners/ClientId";
import { ImageUpload } from "@/components/profile/ImageUpload";

export function PartnerAppForm({ app, onSaved }: { app: PartnerApp; onSaved: () => void }) {
  const [name, setName] = useState(app.name);
  const [description, setDescription] = useState(app.description ?? "");
  const [logoUrl, setLogoUrl] = useState(app.logo_url ?? "");
  const [redirectUris, setRedirectUris] = useState<string[]>(app.redirect_uris ?? []);
  const [permissions, setPermissions] = useState<PartnerPermissionId[]>(app.permissions);
  const [saving, setSaving] = useState(false);

  const toggle = (id: PartnerPermissionId, checked: boolean) => {
    setPermissions((current) =>
      checked ? [...new Set([...current, id])] : current.filter((permission) => permission !== id),
    );
  };

  const save = async () => {
    setSaving(true);
    try {
      await updatePartnerApp(app.id, {
        name: name.trim() || app.name,
        description: description.trim() || null,
        logo_url: logoUrl.trim() || null,
        redirect_uris: redirectUris,
        permissions,
      });
      toast.success("App updated");
      onSaved();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not save");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex max-w-2xl flex-col gap-6">
      <div className="flex flex-col gap-2">
        <Label htmlFor="app-name">App name</Label>
        <Input id="app-name" value={name} onChange={(event) => setName(event.target.value)} />
        <p className="text-xs text-muted-foreground">Shown to users on the consent screen.</p>
      </div>

      <div className="flex flex-col gap-2">
        <Label>App icon</Label>
        <div className="chamfer flex items-center gap-4 border border-border p-4">
          {logoUrl ? (
            <img
              src={logoUrl}
              alt=""
              className="size-14 shrink-0 chamfer border border-border object-cover"
              referrerPolicy="no-referrer"
            />
          ) : (
            <div className="flex size-14 shrink-0 items-center justify-center chamfer border border-border bg-card font-heading text-xl font-bold text-primary">
              {(name.trim() || "A").charAt(0).toUpperCase()}
            </div>
          )}
          <div className="flex min-w-0 flex-col gap-1.5">
            <ImageUpload
              bucket="showcase"
              folder="partner-logos"
              label={logoUrl ? "Replace icon" : "Upload icon"}
              currentImage={logoUrl}
              onUpload={(url) => setLogoUrl(url)}
            />
            <p className="text-xs text-muted-foreground">
              Shown on the consent screen. PNG, JPG or GIF up to 5 MB.
            </p>
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="app-desc">Description</Label>
        <Textarea
          id="app-desc"
          value={description}
          onChange={(event) => setDescription(event.target.value)}
          rows={3}
          placeholder="One line about what your app does."
        />
      </div>

      <RedirectUriField
        inputId="app-redirects"
        value={redirectUris}
        onChange={setRedirectUris}
        hint="Coordinate changes with us. They're mirrored to your OAuth client."
      />

      <Separator />

      <div className="flex flex-col gap-3">
        <div>
          <Label>Permissions</Label>
          <p className="mt-1 text-xs text-muted-foreground">
            What your app asks users for. Each one is listed on the consent screen.
          </p>
        </div>
        <div className="flex flex-col gap-2">
          {PARTNER_PERMISSIONS.map((permission) => {
            const disabled = permission.required;
            return (
              <label
                key={permission.id}
                className="flex items-start gap-3 rounded-[var(--radius)] border border-border p-3"
              >
                <Checkbox
                  checked={disabled || permissions.includes(permission.id)}
                  disabled={disabled}
                  onCheckedChange={(checked) => toggle(permission.id, checked === true)}
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
                  <span className="block text-xs text-muted-foreground">{permission.summary}</span>
                </span>
              </label>
            );
          })}
        </div>
      </div>

      <Separator />

      <dl className="grid gap-4 sm:grid-cols-2">
        <div className="min-w-0">
          <dt className="text-xs text-muted-foreground">Client id</dt>
          <dd className="mt-1 min-w-0">
            <ClientId clientId={app.supabase_client_id} />
          </dd>
          {!app.supabase_client_id && (
            <p className="mt-1 text-xs text-muted-foreground">
              We register your OAuth client once your redirect URIs are set, then your client id appears here.
            </p>
          )}
        </div>
        <div>
          <dt className="text-xs text-muted-foreground">Client type</dt>
          <dd className="mt-1 text-sm capitalize">{app.type}</dd>
        </div>
      </dl>

      <Button onClick={save} disabled={saving} className="self-start">
        {saving && <IconLoader2 className="size-4 animate-spin" aria-hidden />}
        Save changes
      </Button>
    </div>
  );
}
