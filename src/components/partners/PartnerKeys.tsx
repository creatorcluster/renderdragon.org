import { useState } from "react";
import { IconCopy, IconLoader2, IconPlus, IconKey } from "@tabler/icons-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";
import { createPartnerKey, revokePartnerKey, type IssuedPartnerKey } from "@/lib/partners/provisioning";
import type { PartnerApiKey } from "@/lib/partners/client";

const formatDate = (value: string | null) =>
  value ? new Date(value).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" }) : "—";

export function PartnerKeys({
  keys,
  onChanged,
}: {
  keys: PartnerApiKey[];
  onChanged: () => void;
}) {
  const [createOpen, setCreateOpen] = useState(false);
  const [label, setLabel] = useState("");
  const [creating, setCreating] = useState(false);
  const [issued, setIssued] = useState<IssuedPartnerKey | null>(null);
  const [pendingRevoke, setPendingRevoke] = useState<PartnerApiKey | null>(null);
  const [revoking, setRevoking] = useState(false);

  const create = async () => {
    setCreating(true);
    try {
      const result = await createPartnerKey(label || "Default key");
      setIssued(result);
      setCreateOpen(false);
      setLabel("");
      onChanged();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not create a key");
    } finally {
      setCreating(false);
    }
  };

  const revoke = async () => {
    if (!pendingRevoke) return;
    setRevoking(true);
    try {
      await revokePartnerKey(pendingRevoke.key_id);
      toast.success("Key revoked");
      setPendingRevoke(null);
      onChanged();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not revoke the key");
    } finally {
      setRevoking(false);
    }
  };

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h3 className="font-heading text-base font-semibold">API keys</h3>
          <p className="text-sm text-muted-foreground">
            Scope <code className="font-mono text-xs">assets:read</code>.
          </p>
        </div>
        <Button onClick={() => setCreateOpen(true)}>
          <IconPlus className="size-4" data-icon="inline-start" aria-hidden />
          New key
        </Button>
      </div>

      {keys.length === 0 ? (
        <div className="rounded-[var(--radius)] border border-border bg-card p-8 text-center">
          <IconKey className="mx-auto size-8 text-muted-foreground" stroke={1.5} aria-hidden />
          <p className="mt-3 font-medium">No keys yet</p>
          <p className="mt-2 text-sm text-muted-foreground">
            Create a key to read the asset catalog from your server.
          </p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-[var(--radius)] border border-border">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead>Key</TableHead>
                <TableHead>Scopes</TableHead>
                <TableHead>Limit</TableHead>
                <TableHead>Last used</TableHead>
                <TableHead className="text-right">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {keys.map((key) => (
                <TableRow key={key.id}>
                  <TableCell>
                    <div className="font-mono text-sm">{key.key_id}</div>
                    {key.label && <div className="text-xs text-muted-foreground">{key.label}</div>}
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {key.scopes.map((scope) => (
                        <Badge key={scope} variant="secondary" className="font-mono text-[10px] font-normal">
                          {scope}
                        </Badge>
                      ))}
                    </div>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {key.rate_limit_per_min}/min
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {formatDate(key.last_used_at)}
                  </TableCell>
                  <TableCell className="text-right">
                    {key.status === "active" ? (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-destructive hover:text-destructive"
                        onClick={() => setPendingRevoke(key)}
                      >
                        Revoke
                      </Button>
                    ) : (
                      <Badge variant="outline" className="text-[10px] text-muted-foreground">
                        Revoked
                      </Badge>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Create */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create a key</DialogTitle>
            <DialogDescription>
              Name it so you can tell keys apart later. The secret is shown once.
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-2 py-2">
            <Label htmlFor="key-label">Label</Label>
            <Input
              id="key-label"
              value={label}
              onChange={(event) => setLabel(event.target.value)}
              placeholder="Production"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)} disabled={creating}>
              Cancel
            </Button>
            <Button onClick={create} disabled={creating}>
              {creating && <IconLoader2 className="size-4 animate-spin" aria-hidden />}
              Create key
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Secret, shown once */}
      <Dialog open={issued !== null} onOpenChange={(open) => !open && setIssued(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Your new key</DialogTitle>
            <DialogDescription>
              Copy the secret now — it won't be shown again. Store it as a server-side secret.
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-3 py-2">
            <div className="flex flex-col gap-1">
              <Label>Client id</Label>
              <code className="rounded-[var(--radius)] border border-border bg-muted px-3 py-2 font-mono text-sm">
                {issued?.key_id}
              </code>
            </div>
            <Separator />
            <div className="flex flex-col gap-1">
              <Label>Secret</Label>
              <div className="flex items-center gap-2">
                <code className="flex-1 truncate rounded-[var(--radius)] border border-border bg-muted px-3 py-2 font-mono text-sm">
                  {issued?.secret}
                </code>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => {
                    if (issued?.secret) {
                      void navigator.clipboard.writeText(issued.secret);
                      toast.success("Secret copied");
                    }
                  }}
                  aria-label="Copy secret"
                >
                  <IconCopy className="size-4" />
                </Button>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button onClick={() => setIssued(null)}>Done</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Revoke */}
      <AlertDialog open={pendingRevoke !== null} onOpenChange={(open) => !open && setPendingRevoke(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Revoke this key?</AlertDialogTitle>
            <AlertDialogDescription>
              Requests signed with <span className="font-mono">{pendingRevoke?.key_id}</span> will start
              failing immediately.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={revoking}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              disabled={revoking}
              onClick={(event) => {
                event.preventDefault();
                void revoke();
              }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Revoke key
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
