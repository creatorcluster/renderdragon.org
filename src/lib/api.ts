import { readCache, writeCache, clearCache } from "@/lib/cache";
import { Resource } from "@/types/resources";

const API_BASE = "https://hamburger-api.powernplant101-c6b.workers.dev";
const ALL_RESOURCES_CACHE_KEY = "api:all-resources";
const CATEGORIES_CACHE_KEY = "api:categories";
const CATEGORY_CACHE_PREFIX = "api:category:";

export const MCICONS_BLACKLISTED_SUBCATEGORIES = ['backgrounds'];

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

const fetchJson = async <T>(url: string): Promise<T | null> => {
  try {
    const res = await fetch(url, {
      cache: "default",
      headers: {
        Accept: "application/json",
      },
    });
    if (!res.ok) {
      console.error(`API error: ${res.status} ${res.statusText} for ${url}`);
      return null;
    }
    return (await res.json()) as T;
  } catch (error) {
    console.error(`Fetch error for ${url}:`, error);
    return null;
  }
};

const normalizeCategory = (category: string): Resource["category"] => {
  if (category === "mcicons") return "minecraft-icons";
  if (category === "mcsounds") return "mcsounds";
  if (category === "resources") return "images";
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

const normalizeApiResource = (item: ApiResource, category: string): Resource => {
  const normalizedCategory = normalizeCategory(category);
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
  };
};

export const fetchCategories = async (): Promise<ApiCategories | null> => {
  const cached = readCache<ApiCategories>(CATEGORIES_CACHE_KEY);
  if (cached) return cached;

  const data = await fetchJson<ApiCategories>(`${API_BASE}/categories`);
  if (data) {
    writeCache(CATEGORIES_CACHE_KEY, data);
    return data;
  }
  return null;
};

export const fetchCategory = async (category: string): Promise<Resource[]> => {
  const cacheKey = `${CATEGORY_CACHE_PREFIX}${category}`;
  const cached = readCache<ApiResource[]>(cacheKey);
  if (cached && cached.length > 0) {
    return cached.map(item => normalizeApiResource(item, category));
  }

  const apiCategory = toApiCategory(category);
  const data = await fetchJson<{ category: string; files: ApiResource[] }>(
    `${API_BASE}/category/${apiCategory}`
  );
  if (data?.files && data.files.length > 0) {
    try {
      writeCache(cacheKey, data.files);
    } catch (e) {
      console.warn(`Failed to cache category ${category}:`, e);
    }
    return data.files.map(item => normalizeApiResource(item, category));
  }
  console.error(`Failed to fetch category ${category} from API`);
  return [];
};

export const fetchAllResources = async (): Promise<Resource[]> => {
  const cached = readCache<ApiAllResources>(ALL_RESOURCES_CACHE_KEY);
  if (cached && cached.categories && Object.keys(cached.categories).length > 0) {
    const categoryNames = Object.keys(cached.categories);
    const existingCategoriesCache = readCache<ApiCategories>(CATEGORIES_CACHE_KEY);
    if (!existingCategoriesCache) {
      writeCache(CATEGORIES_CACHE_KEY, { 
        categories: categoryNames, 
        total: categoryNames.length 
      });
    }
    return Object.entries(cached.categories).flatMap(([category, items]) =>
      items.map(item => normalizeApiResource(item, category))
    );
  }

  const data = await fetchJson<ApiAllResources>(`${API_BASE}/all`);
  if (data?.categories && Object.keys(data.categories).length > 0) {
    try {
      writeCache(ALL_RESOURCES_CACHE_KEY, data);
      const categoryNames = Object.keys(data.categories);
      writeCache(CATEGORIES_CACHE_KEY, { 
        categories: categoryNames, 
        total: categoryNames.length 
      });
      Object.entries(data.categories).forEach(([category, items]) => {
        if (items && items.length > 0) {
          try {
            writeCache(`${CATEGORY_CACHE_PREFIX}${normalizeCategory(category)}`, items);
          } catch {
            // Ignore quota errors for individual category caches
          }
        }
      });
    } catch (e) {
      console.warn("Failed to cache all resources (likely quota exceeded):", e);
    }
    return Object.entries(data.categories).flatMap(([category, items]) =>
      items.map(item => normalizeApiResource(item, category))
    );
  }
  console.error("Failed to fetch all resources from API");
  return [];
};

export const refreshAllResources = async (): Promise<Resource[]> => {
  const data = await fetchJson<ApiAllResources>(`${API_BASE}/all`);
  if (data?.categories) {
    writeCache(ALL_RESOURCES_CACHE_KEY, data);
    return Object.entries(data.categories).flatMap(([category, items]) =>
      items.map(item => normalizeApiResource(item, category))
    );
  }
  return [];
};

export const getResourceByCategory = async (category: string): Promise<Resource[]> => {
  const apiCategory = toApiCategory(category);
  const allCached = readCache<ApiAllResources>(ALL_RESOURCES_CACHE_KEY);
  if (allCached?.categories?.[apiCategory]) {
    return allCached.categories[apiCategory].map(item =>
      normalizeApiResource(item, category)
    );
  }

  return fetchCategory(category);
};

export const getAvailableCategories = (): string[] => {
  const cached = readCache<ApiCategories>(CATEGORIES_CACHE_KEY);
  return cached?.categories || [];
};

export const clearResourceCache = (): void => {
  clearCache(ALL_RESOURCES_CACHE_KEY);
  clearCache(CATEGORIES_CACHE_KEY);
  clearCache(`${CATEGORY_CACHE_PREFIX}mcsounds`);
  clearCache(`${CATEGORY_CACHE_PREFIX}mcicons`);
  clearCache(`${CATEGORY_CACHE_PREFIX}music`);
  clearCache(`${CATEGORY_CACHE_PREFIX}sfx`);
  clearCache(`${CATEGORY_CACHE_PREFIX}images`);
  clearCache(`${CATEGORY_CACHE_PREFIX}animations`);
  clearCache(`${CATEGORY_CACHE_PREFIX}fonts`);
  clearCache(`${CATEGORY_CACHE_PREFIX}presets`);
};
