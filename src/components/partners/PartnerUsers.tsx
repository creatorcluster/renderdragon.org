import { useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
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
import { resolvePartnerPermissions } from "@/lib/partners/permissions";
import { revokePartnerConsent, type PartnerConsent } from "@/lib/partners/client";
import { toast } from "sonner";

const formatDate = (value: string) =>
  new Date(value).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });

const initials = (name: string | null, fallback: string) =>
  (name || fallback).slice(0, 2).toUpperCase();

export function PartnerUsers({
  consents,
  onChanged,
}: {
  consents: PartnerConsent[];
  onChanged: () => void;
}) {
  const [pending, setPending] = useState<PartnerConsent | null>(null);
  const [working, setWorking] = useState(false);

  const revoke = async () => {
    if (!pending) return;
    setWorking(true);
    try {
      await revokePartnerConsent(pending.id);
      toast.success("Access revoked");
      setPending(null);
      onChanged();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not revoke access");
    } finally {
      setWorking(false);
    }
  };

  if (consents.length === 0) {
    return (
      <div className="rounded-[var(--radius)] border border-border bg-card p-8 text-center">
        <p className="font-medium">No one has signed in yet</p>
        <p className="mt-2 text-sm text-muted-foreground">
          Users who sign in through your app appear here with what they agreed to share.
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="overflow-hidden rounded-[var(--radius)] border border-border">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead>User</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Shared</TableHead>
              <TableHead>Granted</TableHead>
              <TableHead>Last seen</TableHead>
              <TableHead className="text-right">Access</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {consents.map((consent) => {
              const permissions = resolvePartnerPermissions(consent.granted_permissions);
              const revoked = Boolean(consent.revoked_at);
              const name = consent.display_name || consent.username || "RenderDragon user";
              return (
                <TableRow key={consent.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar className="size-9">
                        {consent.avatar_url && (
                          <AvatarImage src={consent.avatar_url} alt="" referrerPolicy="no-referrer" />
                        )}
                        <AvatarFallback className="bg-primary/15 text-xs text-primary">
                          {initials(consent.display_name, consent.username || "RD")}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0">
                        <div className="truncate text-sm font-medium">{name}</div>
                        {consent.username && (
                          <div className="truncate text-xs text-muted-foreground">@{consent.username}</div>
                        )}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {consent.email || "—"}
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {permissions.map((permission) => (
                        <Badge key={permission.id} variant="secondary" className="text-[10px] font-normal">
                          {permission.label}
                        </Badge>
                      ))}
                    </div>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {formatDate(consent.granted_at)}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {formatDate(consent.last_seen_at)}
                  </TableCell>
                  <TableCell className="text-right">
                    {revoked ? (
                      <Badge variant="outline" className="text-[10px] text-muted-foreground">
                        Revoked
                      </Badge>
                    ) : (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-destructive hover:text-destructive"
                        onClick={() => setPending(consent)}
                      >
                        Revoke
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      <AlertDialog open={pending !== null} onOpenChange={(open) => !open && setPending(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Revoke access?</AlertDialogTitle>
            <AlertDialogDescription>
              {pending?.display_name || pending?.username || "This user"} will be signed out of your
              app on their next request and will need to approve access again.
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
    </>
  );
}
