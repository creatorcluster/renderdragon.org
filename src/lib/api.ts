import { readCache, readStaleCache, writeCache } from "@/lib/cache";
import { ensureAssetsVersionSynced, fetchAssetsJson } from "@/lib/assetsApi";
import { Resource } from "@/types/resources";


const ALL_RESOURCES_CACHE_KEY = "api:all-resources";
const CATEGORIES_CACHE_KEY = "api:categories";
const CATEGORY_CACHE_PREFIX = "api:category:";

/**
 * Thrown when the catalog could not be loaded at all (session/network failure and
 * no usable cache). Callers must surface this instead of rendering an empty list,
 * which is indistinguishable from "there are no resources".
 */
export class ResourceApiError extends Error {
  constructor(message = "Unable to load resources") {
    super(message);
    this.name = "ResourceApiError";
  }
}

export interface ApiResource {
  id: number;
  title: string;
  credit: string;
  filename: string;
  ext: string;
  url: string;
  size: number;
  subcategory?: string;
}

export interface ApiCategories {
  categories: string[];
  total: number;
}

export interface ApiAllResources {
  categories: Record<string, ApiResource[]>;
}


const fetchJson = async <T>(path: string): Promise<T | null> => {
  try {
    return await fetchAssetsJson<T>(path, {
      cache: "default",
      headers: {
        Accept: "application/json",
      },
    });
  } catch (error) {
    console.error(`Fetch error for ${path}:`, error);
    return null;
  }
};

const normalizeCategory = (category: string): Resource["category"] | null => {
  if (category === "mcicons") return "minecraft-icons";
  if (category === "mcsounds") return "mcsounds";
  if (category === "resources") return null; // Skip: these are not images and shouldn't appear in the Images tab
  return category as Resource["category"];
};

const toApiCategory = (category: string): string => {
  if (category === "minecraft-icons") return "mcicons";
  if (category === "mcsounds") return "mcsounds";
  if (category === "images") return "images";
  return category;
};

const inferSubcategory = (url: string, category: string): string | undefined => {
  if (category !== "presets") return undefined;
  const lower = url.toLowerCase();
  if (lower.includes("/adobe/")) return "adobe";
  if (lower.includes("/davinci/")) return "davinci";
  if (lower.includes("/previews/")) return "previews";
  return undefined;
};

const normalizeApiResource = (item: ApiResource, category: string): Resource | null => {
  const normalizedCategory = normalizeCategory(category);
  if (!normalizedCategory) return null; // Skip excluded categories
  let subcategory: string | undefined = item.subcategory || undefined;

  if (!subcategory && category === "presets") {
    subcategory = inferSubcategory(item.url, category);
  }

  return {
    id: item.id,
    title: item.title,
    category: normalizedCategory,
    subcategory,
    credit: item.credit || undefined,
    filetype: item.ext,
    download_url: item.url,
    preview_url: undefined,
    image_url: undefined,
    software: undefined,
    description: undefined,
    filename: item.filename,
  };
};

const flattenCategories = (categories: Record<string, ApiResource[]>): Resource[] =>
  Object.entries(categories).flatMap(([category, items]) =>
    items.map(item => normalizeApiResource(item, category)).filter((r): r is Resource => r !== null)
  );

const readCachedCatalog = (): ApiAllResources | null => {
  const fresh = readCache<ApiAllResources>(ALL_RESOURCES_CACHE_KEY);
  if (fresh?.categories && Object.keys(fresh.categories).length > 0) return fresh;
  const stale = readStaleCache<ApiAllResources>(ALL_RESOURCES_CACHE_KEY);
  if (stale?.categories && Object.keys(stale.categories).length > 0) return stale;
  return null;
};

const resourceFromCatalog = (catalog: ApiAllResources, apiCategory: string): Resource[] => {
  const items = catalog.categories?.[apiCategory];
  if (!items || items.length === 0) return [];
  return items
    .map(item => normalizeApiResource(item, apiCategory))
    .filter((r): r is Resource => r !== null);
};

const CATEGORY_NAMES = [
  "music",
  "sfx",
  "images",
  "animations",
  "fonts",
  "presets",
  "mcsounds",
  "minecraft-icons",
];

/**
 * Rebuilds the catalog from the per-category caches. Last resort when `/all` is
 * unreachable but individual categories were cached earlier.
 */
const readResourcesFromCategoryCaches = (): Resource[] => {
  const collected: Resource[] = [];

  for (const category of CATEGORY_NAMES) {
    const cacheKey = `${CATEGORY_CACHE_PREFIX}${category}`;
    const cached = readCache<ApiResource[]>(cacheKey) ?? readStaleCache<ApiResource[]>(cacheKey);
    if (!cached || cached.length === 0) continue;
    const apiCategory = toApiCategory(category);
    collected.push(
      ...cached.map(item => normalizeApiResource(item, apiCategory)).filter((r): r is Resource => r !== null)
    );
  }

  return collected;
};

export const fetchCategories = async (): Promise<ApiCategories | null> => {
  // Version sync runs before the cache-first read: a new catalogue version must
  // invalidate these caches before anything is served from them.
  await ensureAssetsVersionSynced();
  const cached = readCache<ApiCategories>(CATEGORIES_CACHE_KEY);
  if (cached) return cached;

  const data = await fetchJson<ApiCategories>("/categories");
  if (data) {
    writeCache(CATEGORIES_CACHE_KEY, data);
    return data;
  }
  return readStaleCache<ApiCategories>(CATEGORIES_CACHE_KEY);
};

export const fetchCategory = async (category: string): Promise<Resource[]> => {
  await ensureAssetsVersionSynced();
  const normalized = normalizeCategory(category);
  if (!normalized) return [];

  const cacheKey = `${CATEGORY_CACHE_PREFIX}${normalized}`;
  const cached = readCache<ApiResource[]>(cacheKey);
  if (cached && cached.length > 0) {
    return cached.map(item => normalizeApiResource(item, normalized)).filter((r): r is Resource => r !== null);
  }

  const apiCategory = toApiCategory(normalized);
  const data = await fetchJson<{ category: string; files: ApiResource[] }>(
    `/category/${apiCategory}`
  );
  if (data && Array.isArray(data.files)) {
    // A successful response is authoritative, even when it is empty.
    if (data.files.length > 0) {
      try {
        writeCache(cacheKey, data.files);
      } catch (e) {
        console.warn(`Failed to cache category ${normalized}:`, e);
      }
    }
    return data.files.map(item => normalizeApiResource(item, normalized)).filter((r): r is Resource => r !== null);
  }

  // Unreachable upstream: serve what we already have rather than nothing.
  const stale = readStaleCache<ApiResource[]>(cacheKey);
  if (stale && stale.length > 0) {
    console.warn(`Using stale cache for category ${normalized}`);
    return stale.map(item => normalizeApiResource(item, normalized)).filter((r): r is Resource => r !== null);
  }

  const catalog = readCachedCatalog();
  if (catalog) {
    const fromCatalog = resourceFromCatalog(catalog, apiCategory);
    if (fromCatalog.length > 0) return fromCatalog;
  }

  throw new ResourceApiError(`Unable to load the "${normalized}" category`);
};

export const fetchAllResources = async (): Promise<Resource[]> => {
  // Before the cache read, so stale catalogue data is dropped before we serve it.
  await ensureAssetsVersionSynced();
  const cached = readCache<ApiAllResources>(ALL_RESOURCES_CACHE_KEY);
  if (cached && cached.categories && Object.keys(cached.categories).length > 0) {
    const categoryNames = Object.keys(cached.categories)
      .map(normalizeCategory)
      .filter((c): c is Resource["category"] => c !== null);
    const existingCategoriesCache = readCache<ApiCategories>(CATEGORIES_CACHE_KEY);
    if (!existingCategoriesCache) {
      writeCache(CATEGORIES_CACHE_KEY, {
        categories: categoryNames,
        total: categoryNames.length
      });
    }
    return flattenCategories(cached.categories);
  }

  const data = await fetchJson<ApiAllResources>("/all");
  if (data?.categories && typeof data.categories === "object") {
    // A successful response is authoritative, even when the catalog is empty.
    if (Object.keys(data.categories).length > 0) {
      try {
        writeCache(ALL_RESOURCES_CACHE_KEY, data);
        const categoryNames = Object.keys(data.categories)
          .map(normalizeCategory)
          .filter((c): c is Resource["category"] => c !== null);
        writeCache(CATEGORIES_CACHE_KEY, {
          categories: categoryNames,
          total: categoryNames.length
        });
        Object.entries(data.categories).forEach(([category, items]) => {
          const normalized = normalizeCategory(category);
          if (normalized && items && items.length > 0) {
            try {
              writeCache(`${CATEGORY_CACHE_PREFIX}${normalized}`, items);
            } catch {
              // Ignore quota errors for individual category caches
            }
          }
        });
      } catch (e) {
        console.warn("Failed to cache all resources (likely quota exceeded):", e);
      }
    }
    return flattenCategories(data.categories);
  }

  // The catalog could not be fetched (expired/blocked session, outage, offline):
  // serve the cached copy and only report an error when there is nothing to show.
  const stale = readStaleCache<ApiAllResources>(ALL_RESOURCES_CACHE_KEY);
  if (stale?.categories && Object.keys(stale.categories).length > 0) {
    console.warn("Using stale all-resources cache after a failed catalog fetch");
    return flattenCategories(stale.categories);
  }

  const fromCategoryCaches = readResourcesFromCategoryCaches();
  if (fromCategoryCaches.length > 0) {
    console.warn("Rebuilt the catalog from category caches after a failed catalog fetch");
    return fromCategoryCaches;
  }

  throw new ResourceApiError("Unable to load resources from the assets API");
};

export const getResourceByCategory = async (category: string): Promise<Resource[]> => {
  // Before the cache read (see fetchAllResources).
  await ensureAssetsVersionSynced();
  const apiCategory = toApiCategory(category);
  const catalog = readCachedCatalog();
  if (catalog) {
    const fromCatalog = resourceFromCatalog(catalog, apiCategory);
    if (fromCatalog.length > 0) return fromCatalog;
  }

  return fetchCategory(category);
};

export const getAvailableCategories = (): string[] => {
  const cached = readCache<ApiCategories>(CATEGORIES_CACHE_KEY);
  return cached?.categories || [];
};
