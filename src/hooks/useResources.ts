/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect, useCallback, useMemo } from "react";
import { Resource } from "@/types/resources";
import { useDownloadCounts } from "@/hooks/useDownloadCounts";

type Category = Resource["category"];
type Subcategory = Resource["subcategory"];

type IndexFile = {
  generated_at?: string;
  categories?: Record<string, { count: number; file: string }>;
};

type CachedPayload<T> = {
  savedAt: number;
  data: T;
};

const CACHE_TTL_MS = 1000 * 60 * 60 * 7; // 7 hours
const INDEX_CACHE_KEY = "resources-cache:index-v1";
const CATEGORY_CACHE_PREFIX = "resources-cache:category-v1:";
const ALL_CACHE_KEY = "resources-cache:all-v1";

const INDEX_URL = "/resources.index.json";
const LEGACY_URL = "/resources.json";

const isSafeUrl = (value?: string) => {
  if (!value || typeof value !== "string") return false;
  try {
    const parsed = new URL(value);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
};

const pickFirstSafeUrl = (...candidates: Array<string | undefined>) =>
  candidates.find((value) => isSafeUrl(value));

const getExtension = (url?: string) => {
  if (!url) return undefined;
  const clean = url.split("?")[0];
  const last = clean.split("/").pop();
  if (!last || !last.includes(".")) return undefined;
  return last.split(".").pop();
};

const normalizeCategoryItems = (category: string, items: any[]): Resource[] => {
  const list = Array.isArray(items) ? items : [];
  const normalized: Resource[] = [];

  list.forEach((item, index) => {
    let categoryName = category;
    if (category === "minecraft_icons" || category === "mcicons") {
      categoryName = "minecraft-icons";
    }

    const title = String(item?.title || "").trim();
    if (!title) return;

    const fallbackDownload = pickFirstSafeUrl(
      item.download_url,
      item.url,
      item.preview_url,
      item.image_url,
    );

    let inferredSubcategory: string | undefined = item.subcategory || undefined;
    if (!inferredSubcategory && categoryName === "presets") {
      const lower = (fallbackDownload || "").toLowerCase();
      if (lower.includes("/adobe/")) inferredSubcategory = "adobe";
      else if (lower.includes("/davinci/")) inferredSubcategory = "davinci";
      else if (lower.includes("/previews/")) inferredSubcategory = "previews";
    }

    const filetype =
      item.filetype || item.ext || getExtension(fallbackDownload);

    normalized.push({
      id: item.id ?? `${categoryName}-${index}`,
      title,
      category: categoryName as Resource["category"],
      subcategory: inferredSubcategory,
      credit: item.credit || undefined,
      filetype,
      download_url: fallbackDownload,
      preview_url: item.preview_url || undefined,
      image_url: item.image_url || undefined,
      software: item.software || undefined,
      description: item.description || undefined,
    });
  });

  return normalized;
};

const readCache = <T>(key: string): T | null => {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as CachedPayload<T>;
    if (!parsed?.savedAt || parsed?.data === undefined) return null;
    if (Date.now() - parsed.savedAt > CACHE_TTL_MS) return null;
    return parsed.data;
  } catch {
    return null;
  }
};

const writeCache = <T>(key: string, data: T) => {
  try {
    localStorage.setItem(
      key,
      JSON.stringify({
        savedAt: Date.now(),
        data,
      } satisfies CachedPayload<T>),
    );
  } catch {
    // ignore quota/storage errors
  }
};

const fetchJson = async <T>(url: string): Promise<T | null> => {
  try {
    const res = await fetch(url, { cache: "default" });
    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch {
    return null;
  }
};

export const useResources = () => {
  const [resources, setResources] = useState<Resource[]>([]);
  const { downloadCounts: externalDownloadCounts, incrementDownload } =
    useDownloadCounts();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<
    Category | null | "favorites"
  >(null);
  const [selectedSubcategory, setSelectedSubcategory] = useState<string | null>(
    null,
  );
  const [sortOrder, setSortOrder] = useState("newest");
  const [isLoading, setIsLoading] = useState(true);
  const [selectedResource, setSelectedResource] = useState<Resource | null>(
    null,
  );
  const [isSearching, setIsSearching] = useState(false);
  const [lastAction, setLastAction] = useState<string>("");
  const [loadedFonts, setLoadedFonts] = useState<string[]>([]);
  const [indexData, setIndexData] = useState<IndexFile | null>(null);
  const [allResources, setAllResources] = useState<Resource[]>([]);

  // Load index on mount
  const loadIndex = useCallback(async (): Promise<IndexFile | null> => {
    const cached = readCache<IndexFile>(INDEX_CACHE_KEY);
    if (cached) return cached;

    const index = await fetchJson<IndexFile>(INDEX_URL);
    if (index?.categories) {
      writeCache(INDEX_CACHE_KEY, index);
      return index;
    }
    return null;
  }, []);

  useEffect(() => {
    setIsLoading(true);
    loadIndex().then((idx) => {
      setIndexData(idx);
      setIsLoading(false);
    });
  }, [loadIndex]);

  // Load a single category file
  const loadCategoryResources = useCallback(
    async (category: string): Promise<Resource[]> => {
      const cacheKey = `${CATEGORY_CACHE_PREFIX}${category}`;
      const cached = readCache<any>(cacheKey);
      if (cached) return normalizeCategoryItems(category, cached);

      const index = await loadIndex();
      const fileFromIndex = index?.categories?.[category]?.file;
      const categoryUrl = fileFromIndex
        ? `/${fileFromIndex}`
        : `/resources/${category}.json`;

      const categoryJson = await fetchJson<any>(categoryUrl);
      if (categoryJson) {
        writeCache(cacheKey, categoryJson);
        return normalizeCategoryItems(category, categoryJson);
      }

      return [];
    },
    [loadIndex],
  );

  // Load all non-minecraft-icons categories in parallel (for search/favorites)
  const loadAllCategories = useCallback(async (): Promise<Resource[]> => {
    const cached = readCache<Resource[]>(ALL_CACHE_KEY);
    if (cached) return cached;

    const idx = indexData || (await loadIndex());
    if (!idx?.categories) return [];

    const categories = Object.keys(idx.categories).filter(
      (c) => c !== "minecraft-icons",
    );

    const results = await Promise.all(
      categories.map((cat) => loadCategoryResources(cat)),
    );

    const all = results.flat();
    writeCache(ALL_CACHE_KEY, all);
    return all;
  }, [indexData, loadIndex, loadCategoryResources]);

  // Main fetch: triggered when category changes
  useEffect(() => {
    let cancelled = false;

    const fetchData = async () => {
      setIsLoading(true);

      if (selectedCategory === "favorites") {
        if (allResources.length > 0) {
          if (!cancelled) {
            setResources(allResources);
            setIsLoading(false);
          }
        } else {
          const all = await loadAllCategories();
          if (!cancelled) {
            setAllResources(all);
            setResources(all);
            setIsLoading(false);
          }
        }
        return;
      }

      if (selectedCategory === null) {
        if (!cancelled) {
          setResources([]);
          setIsLoading(false);
        }
        return;
      }

      // Specific category
      const items = await loadCategoryResources(selectedCategory as string);
      if (!cancelled) {
        setResources(items);
        setIsLoading(false);
      }
    };

    fetchData();
    return () => {
      cancelled = true;
    };
  }, [selectedCategory, allResources, loadAllCategories, loadCategoryResources]);

  // When search is triggered on "All", load all non-icon categories
  const handleSearchSubmit = useCallback(
    async (e?: React.FormEvent) => {
      e?.preventDefault();
      setLastAction("search");

      if (selectedCategory === null && allResources.length === 0) {
        setIsLoading(true);
        const all = await loadAllCategories();
        if (all.length > 0) {
          setAllResources(all);
          setResources(all);
        }
        setIsLoading(false);
      }
      setIsSearching(true);
    },
    [selectedCategory, allResources.length, loadAllCategories],
  );

  const handleClearSearch = useCallback(() => {
    setSearchQuery("");
    setIsSearching(false);
    setLastAction("clear");
  }, []);

  const handleCategoryChange = useCallback(
    (category: Category | null | "favorites") => {
      setIsLoading(true);
      setSelectedCategory(category);
      setSelectedSubcategory(null);
      setLastAction("category");
    },
    [],
  );

  const handleSubcategoryChange = useCallback(
    (subcategory: Subcategory | "all" | null) => {
      setSelectedSubcategory(subcategory);
      setLastAction("subcategory");
    },
    [],
  );

  const handleSearch = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
    setLastAction("search");
    if (e.target.value === "") {
      setIsSearching(false);
    } else {
      setIsSearching(true);
    }
  }, []);

  const availableSubcategories = useMemo(() => {
    if (!selectedCategory || selectedCategory === "favorites") return [];
    const subs = resources
      .filter((r) => r.category === selectedCategory && r.subcategory)
      .map((r) => r.subcategory as string);
    return Array.from(new Set(subs)).sort();
  }, [resources, selectedCategory]);

  const getCount = useCallback(
    (id: string | number) => {
      if (typeof id === "number") return externalDownloadCounts[id] || 0;
      if (String(id).startsWith("main-")) {
        const numericId = String(id).replace("main-", "");
        return externalDownloadCounts[numericId] || 0;
      }
      return externalDownloadCounts[String(id)] || 0;
    },
    [externalDownloadCounts],
  );

  const getNumericId = useCallback((id: Resource["id"]) => {
    if (typeof id === "number") return id;
    const parsed = Number(String(id).replace(/^[^0-9]+/, ""));
    return Number.isFinite(parsed) ? parsed : 0;
  }, []);

  const hasCategoryResources = useMemo(() => {
    if (!selectedCategory || selectedCategory === "favorites") return true;
    return resources.some((resource) => resource.category === selectedCategory);
  }, [resources, selectedCategory]);

  const filteredResources = useMemo(() => {
    let result = resources.slice();

    if (selectedCategory && selectedCategory !== "favorites") {
      result = result.filter((r) => r.category === selectedCategory);
    }

    if (selectedSubcategory && selectedSubcategory !== "all") {
      if (availableSubcategories.includes(selectedSubcategory)) {
        result = result.filter((r) => r.subcategory === selectedSubcategory);
      }
    }

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter((r) => r.title.toLowerCase().includes(query));
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
  }, [
    resources,
    selectedCategory,
    selectedSubcategory,
    searchQuery,
    sortOrder,
    getCount,
    getNumericId,
    availableSubcategories,
  ]);

  const resolveDownloadUrl = (resource: Resource) => {
    const direct =
      resource.download_url || resource.preview_url || resource.image_url;
    if (direct) return direct;

    const titleLowered = resource.title.toLowerCase().replace(/ /g, "%20");
    const base =
      "https://raw.githubusercontent.com/Yxmura/resources_renderdragon/main";

    if (resource.category === "presets") {
      const prefix = resource.subcategory === "adobe" ? "a" : "d";
      return `${base}/presets/PREVIEWS/${prefix}${titleLowered}.mp4`;
    }

    if (resource.credit) {
      const creditName = resource.credit.replace(/ /g, "_");
      return `${base}/${resource.category}/${titleLowered}__${creditName}.${resource.filetype || "file"}`;
    }

    return `${base}/${resource.category}/${titleLowered}.${resource.filetype || "file"}`;
  };

  const handleDownload = useCallback(
    async (resource: Resource): Promise<boolean> => {
      if (!resource) return false;

      const fileUrl = resolveDownloadUrl(resource);
      if (!fileUrl) return false;

      const filename = `${resource.title}.${resource.filetype || "file"}`;
      const shouldForceDownload = [
        "presets",
        "images",
        "animations",
        "fonts",
        "music",
        "sfx",
        "minecraft-icons",
      ].includes(resource.category);

      try {
        if (shouldForceDownload) {
          const res = await fetch(fileUrl);
          if (!res.ok) throw new Error(`Failed to fetch: ${res.statusText}`);
          const blob = await res.blob();

          const a = document.createElement("a");
          a.href = URL.createObjectURL(blob);
          a.download = filename;
          document.body.appendChild(a);
          a.click();
          a.remove();
          URL.revokeObjectURL(a.href);
        } else {
          const a = document.createElement("a");
          a.href = fileUrl;
          a.download = filename;
          document.body.appendChild(a);
          a.click();
          a.remove();
        }

        incrementDownload(resource.id);
        return true;
      } catch (err) {
        console.error("Download failed", err);
        return false;
      }
    },
    [incrementDownload],
  );

  return {
    resources,
    selectedResource,
    setSelectedResource,
    searchQuery,
    selectedCategory,
    selectedSubcategory,
    isLoading,
    isSearching,
    downloadCounts: externalDownloadCounts,
    lastAction,
    loadedFonts,
    setLoadedFonts,
    filteredResources,
    availableSubcategories,
    hasCategoryResources,
    handleSearchSubmit,
    handleClearSearch,
    handleCategoryChange,
    handleSubcategoryChange,
    sortOrder,
    handleSortOrderChange: setSortOrder,
    handleSearch,
    handleDownload,
    indexData,
  };
};
