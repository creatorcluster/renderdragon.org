import { Resource } from "@/types/resources";
import {
  downloadCountKey,
  MCICONS_BLACKLISTED_SUBCATEGORIES,
} from "@/lib/resourceKeys";

export type CatalogueCategory = Resource["category"] | null | "favorites";

export interface CatalogueCriteria {
  /** Active category filter. `null` is "all", `"favorites"` disables category filtering. */
  category: CatalogueCategory;
  /** Active subcategory filter, or `null`/`"all"` for none. */
  subcategory?: string | null;
  searchQuery?: string;
  sortOrder?: string;
  /** Subcategories derived from the loaded set, as shown in the filter UI. */
  availableSubcategories?: string[];
  /** Download counts keyed by `downloadCountKey(id)`. */
  downloadCounts?: Record<string, number>;
  /** Subcategories hidden from the minecraft-icons catalogue. */
  blacklist?: readonly string[];
}

const getNumericId = (id: Resource["id"]) => {
  if (typeof id === "number") return id;
  const parsed = Number(id.toString().replace(/^[^0-9]+/, ""));
  return Number.isFinite(parsed) ? parsed : 0;
};

/**
 * Pure filter + sort pipeline behind the resources catalogue. Applies, in order:
 * category, minecraft-icons blacklist, subcategory, search, then sort.
 */
export const filterAndSort = (
  resources: Resource[],
  criteria: CatalogueCriteria
): Resource[] => {
  const {
    category,
    subcategory = null,
    searchQuery = "",
    sortOrder = "newest",
    availableSubcategories = [],
    downloadCounts = {},
    blacklist = MCICONS_BLACKLISTED_SUBCATEGORIES,
  } = criteria;

  let result = [...resources];

  const getCount = (id: Resource["id"]) =>
    downloadCounts[downloadCountKey(id)] || 0;

  if (category && category !== "favorites") {
    result = result.filter((r) => r.category === category);
  } else if (category === null) {
    result = result.filter(
      (r) => r.category !== "minecraft-icons" && r.category !== "mcsounds"
    );
  }

  if (category === "minecraft-icons") {
    result = result.filter(
      (r) => !r.subcategory || !blacklist.includes(r.subcategory)
    );
  }

  if (subcategory && subcategory !== "all") {
    if (category === "mcsounds" || category === "minecraft-icons") {
      result = result.filter(
        (r) =>
          r.subcategory === subcategory ||
          r.subcategory?.startsWith(subcategory + "/")
      );
    } else if (availableSubcategories.includes(subcategory)) {
      result = result.filter((r) => r.subcategory === subcategory);
    }
  }

  if (searchQuery) {
    const query = searchQuery.toLowerCase();
    result = result.filter((r) =>
      [r.title, r.credit, r.subcategory, r.filetype].some(
        (field) => field && field.toLowerCase().includes(query)
      )
    );
  }

  switch (sortOrder) {
    case "popular":
      result.sort((a, b) => getCount(b.id) - getCount(a.id));
      break;
    case "a-z":
      result.sort((a, b) => a.title.localeCompare(b.title));
      break;
    case "z-a":
      result.sort((a, b) => b.title.localeCompare(a.title));
      break;
    case "newest":
    default:
      result.sort((a, b) => getNumericId(b.id) - getNumericId(a.id));
      break;
  }

  return result;
};

/** Subcategories present in the loaded set for a category, sorted alphabetically. */
export const deriveSubcategories = (
  resources: Resource[],
  category: CatalogueCategory | undefined,
  blacklist: readonly string[] = MCICONS_BLACKLISTED_SUBCATEGORIES
): string[] => {
  if (!category || category === "favorites") return [];
  const subs = resources
    .filter((r) => {
      if (r.category !== category || !r.subcategory) return false;
      if (category === "minecraft-icons" && blacklist.includes(r.subcategory)) {
        return false;
      }
      return true;
    })
    .map((r) => r.subcategory as string);
  return Array.from(new Set(subs)).sort();
};

/** Whether the loaded set contains anything for a category (ignoring the blacklist). */
export const hasResourcesForCategory = (
  resources: Resource[],
  category: CatalogueCategory | undefined,
  blacklist: readonly string[] = MCICONS_BLACKLISTED_SUBCATEGORIES
): boolean => {
  if (!category || category === "favorites") return true;
  return resources.some((resource) => {
    if (resource.category !== category) return false;
    if (
      category === "minecraft-icons" &&
      resource.subcategory &&
      blacklist.includes(resource.subcategory)
    ) {
      return false;
    }
    return true;
  });
};
