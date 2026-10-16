// Single source of truth for what a partner app may request and exactly which
// user fields each permission exposes. The OAuth consent screen, the partner
// dashboard, and the read-only API all read from this registry — add a license
// here and it appears everywhere.

export type PartnerPermissionId =
  | "profile"
  | "email"
  | "favourites:read";

export interface PartnerPermissionField {
  label: string;
  detail?: string;
}

export interface PartnerPermission {
  id: PartnerPermissionId;
  label: string;
  summary: string;
  fields: PartnerPermissionField[];
  /** Required for sign-in; always shown on the consent screen. */
  required?: boolean;
  /** Supabase OAuth scope sent upstream when this permission is requested. */
  standardScope?: string;
}

export const PARTNER_PERMISSIONS: readonly PartnerPermission[] = [
  {
    id: "profile",
    label: "Profile",
    summary: "Your public RenderDragon profile",
    required: true,
    standardScope: "profile",
    fields: [
      { label: "Avatar or icon" },
      { label: "Display name" },
      { label: "Username" },
    ],
  },
  {
    id: "email",
    label: "Email address",
    summary: "Reach you about your account",
    standardScope: "email",
    fields: [
      { label: "Email address" },
      { label: "Whether it is verified", detail: "A true/false flag, not the address" },
    ],
  },
  {
    id: "favourites:read",
    label: "Favourites",
    summary: "The assets you have favourited on RenderDragon",
    fields: [
      { label: "Your favourited assets", detail: "Names and links only" },
    ],
  },
] as const;

const BY_ID = new Map<string, PartnerPermission>(
  PARTNER_PERMISSIONS.map((permission) => [permission.id, permission]),
);

export function isPartnerPermission(id: string): id is PartnerPermissionId {
  return BY_ID.has(id);
}

export function getPartnerPermission(id: string): PartnerPermission | undefined {
  return BY_ID.get(id);
}

/** Resolve a list of ids to full permissions, ignoring unknown ids, order preserved. */
export function resolvePartnerPermissions(ids: readonly string[]): PartnerPermission[] {
  return ids
    .map((id) => BY_ID.get(id))
    .filter((permission): permission is PartnerPermission => permission !== undefined);
}

/** The permissions to display on a consent screen for a requested set. `profile`
 * is always included because it is required for sign-in. */
export function consentPermissions(requested: readonly string[]): PartnerPermission[] {
  const resolved = resolvePartnerPermissions(requested);
  const hasProfile = resolved.some((permission) => permission.id === "profile");
  return hasProfile ? resolved : [getPartnerPermission("profile")!, ...resolved];
}

/** Upstream OAuth scopes for a requested set (`openid` is added by the flow). */
export function standardScopesFor(requested: readonly string[]): string[] {
  const scopes = new Set<string>(["openid"]);
  for (const permission of resolvePartnerPermissions(requested)) {
    if (permission.standardScope) scopes.add(permission.standardScope);
  }
  return [...scopes];
}
