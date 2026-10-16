import {
  IconUser,
  IconMail,
  IconHeart,
  IconCheck,
  type Icon,
} from "@tabler/icons-react";
import { cn } from "@/lib/utils";
import {
  consentPermissions,
  type PartnerPermissionId,
} from "@/lib/partners/permissions";

const ICONS: Record<PartnerPermissionId, Icon> = {
  profile: IconUser,
  email: IconMail,
  "favourites:read": IconHeart,
};

interface ConsentFieldListProps {
  requested: readonly PartnerPermissionId[];
  className?: string;
}

/**
 * The exact list of data a partner app will receive. Shared by the live consent
 * screen and the preview on the partners page, so the two can never drift.
 */
export function ConsentFieldList({ requested, className }: ConsentFieldListProps) {
  const permissions = consentPermissions(requested);

  return (
    <ul className={cn("flex flex-col divide-y divide-border", className)}>
      {permissions.map((permission) => {
        const PermIcon = ICONS[permission.id] ?? IconCheck;
        return (
          <li key={permission.id} className="flex gap-3 py-4 first:pt-0 last:pb-0">
            <PermIcon className="mt-0.5 size-5 shrink-0 text-primary" stroke={1.6} aria-hidden />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-foreground">{permission.summary}</p>
              <ul className="mt-2 flex flex-wrap gap-x-4 gap-y-1">
                {permission.fields.map((field) => (
                  <li
                    key={field.label}
                    className="flex items-center gap-1.5 text-sm text-muted-foreground"
                  >
                    <IconCheck className="size-3.5 text-primary/70" stroke={2} aria-hidden />
                    <span>{field.label}</span>
                    {field.detail && (
                      <span className="text-xs text-muted-foreground/70">({field.detail})</span>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
