/**
 * Dependency-free resource rules shared by the pure catalogue algebra and the
 * data layer, so neither has to import the other (or the Supabase client).
 */

/** Subcategories hidden from the minecraft-icons catalogue. */
export const MCICONS_BLACKLISTED_SUBCATEGORIES = ["backgrounds"];

/**
 * Download counts are keyed by the numeric resource id. Resources from the
 * "main" set are identified as `main-<id>`; everything else keeps its own id.
 */
export const downloadCountKey = (id: string | number): string => {
  if (typeof id === "number") return String(id);
  return id.startsWith("main-") ? id.replace("main-", "") : id;
};
