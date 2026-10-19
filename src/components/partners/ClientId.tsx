import { useState } from "react";
import { IconCheck, IconCopy } from "@tabler/icons-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

/**
 * Renders a partner's OAuth client id, with a copy affordance. Until RenderDragon
 * registers the OAuth client, the id is null, so we say so explicitly instead of
 * showing a bare em dash that looks like a rendering bug.
 */
export function ClientId({
  clientId,
  className,
}: {
  clientId: string | null | undefined;
  className?: string;
}) {
  const [copied, setCopied] = useState(false);

  if (!clientId) {
    return (
      <span className={cn("inline-flex items-center gap-2 text-sm text-muted-foreground", className)}>
        <span className="size-1.5 shrink-0 rounded-full bg-amber-500" aria-hidden />
        Pending registration
      </span>
    );
  }

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(clientId);
      setCopied(true);
      toast.success("Client id copied");
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Could not copy the client id");
    }
  };

  return (
    <span className={cn("inline-flex min-w-0 max-w-full items-center gap-2", className)}>
      <code className="min-w-0 truncate font-mono text-xs" title={clientId}>
        {clientId}
      </code>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="size-7 shrink-0"
        onClick={() => void copy()}
        aria-label="Copy client id"
      >
        {copied ? <IconCheck className="size-3.5 text-emerald-500" /> : <IconCopy className="size-3.5" />}
      </Button>
    </span>
  );
}
