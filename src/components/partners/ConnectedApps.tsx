import { useCallback, useEffect, useState } from "react";
import { IconLoader2, IconPlugConnected } from "@tabler/icons-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { resolvePartnerPermissions } from "@/lib/partners/permissions";
import { getMyConnectedApps, revokeMyConsent, type ConnectedApp } from "@/lib/partners/client";

/**
 * "Connected apps" for the signed-in user: the partner apps they've signed into,
 * and one-click revoke. Rendered inside Account settings.
 */
export function ConnectedApps() {
  const [apps, setApps] = useState<ConnectedApp[] | null>(null);
  const [pending, setPending] = useState<ConnectedApp | null>(null);
  const [working, setWorking] = useState(false);

  const load = useCallback(async () => {
    setApps(await getMyConnectedApps());
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const revoke = async () => {
    if (!pending) return;
    setWorking(true);
    try {
      await revokeMyConsent(pending.consent_id);
      toast.success(`Disconnected ${pending.app_name}`);
      setPending(null);
      await load();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not disconnect");
    } finally {
      setWorking(false);
    }
  };

  const active = apps?.filter((app) => !app.revoked_at) ?? [];

  return (
    <div className="space-y-4">
      <h3 className="text-lg text-primary">Connected apps</h3>
      <p className="text-sm text-muted-foreground">
        Apps you've signed into with RenderDragon. Revoke any time — they lose access on their next request.
      </p>

      {apps === null ? (
        <div className="flex items-center gap-2 py-4 text-sm text-muted-foreground">
          <IconLoader2 className="size-4 animate-spin" /> Loading…
        </div>
      ) : active.length === 0 ? (
        <div className="chamfer border border-border bg-card/40 px-4 py-6 text-center">
          <IconPlugConnected className="mx-auto size-6 text-muted-foreground" stroke={1.6} />
          <p className="mt-2 text-sm text-muted-foreground">You haven't connected any apps yet.</p>
        </div>
      ) : (
        <ul className="divide-y divide-border chamfer border border-border">
          {active.map((app) => (
            <li key={app.consent_id} className="flex items-center gap-4 px-4 py-3">
              {app.app_logo ? (
                <img
                  src={app.app_logo}
                  alt=""
                  className="size-10 shrink-0 chamfer border border-border object-cover"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div className="flex size-10 shrink-0 items-center justify-center chamfer bg-muted font-heading font-bold text-primary">
                  {app.app_name.charAt(0).toUpperCase()}
                </div>
              )}
              <div className="min-w-0 flex-1">
                <div className="truncate text-sm font-medium">{app.app_name}</div>
                <div className="mt-1 flex flex-wrap gap-1">
                  {resolvePartnerPermissions(app.granted_permissions).map((permission) => (
                    <Badge key={permission.id} variant="secondary" className="text-[10px] font-normal">
                      {permission.label}
                    </Badge>
                  ))}
                </div>
                <div className="mt-1 text-xs text-muted-foreground">
                  Connected {new Date(app.granted_at).toLocaleDateString()}
                </div>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="shrink-0 text-destructive hover:text-destructive"
                onClick={() => setPending(app)}
              >
                Revoke
              </Button>
            </li>
          ))}
        </ul>
      )}

      <AlertDialog open={pending !== null} onOpenChange={(open) => !open && setPending(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Disconnect {pending?.app_name}?</AlertDialogTitle>
            <AlertDialogDescription>
              This app will lose access to your RenderDragon account. You can connect it again later.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={working}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              disabled={working}
              onClick={(event) => {
                event.preventDefault();
                void revoke();
              }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Revoke access
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Separator />
    </div>
  );
}
