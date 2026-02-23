import React, { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { Resource } from "@/types/resources";
import { useDownloadCounts } from "@/hooks/useDownloadCounts";
import {
  fetchAllResources,
  fetchCategory,
  getAvailableCategories,
  MCICONS_BLACKLISTED_SUBCATEGORIES,
} from "@/lib/api";
import { getWaveform, cacheAudio, cacheImage } from "@/lib/cache";

type Category = Resource["category"];
type Subcategory = Resource["subcategory"];

export const useResources = () => {
  const [resources, setResources] = useState<Resource[]>([]);
  const { downloadCounts: externalDownloadCounts, incrementDownload } =
    useDownloadCounts();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<
    Category | null | "favorites"
  >(null);
  const [selectedSubcategory, setSelectedSubcategory] = useState<string | null>(
    null
  );
  const [sortOrder, setSortOrder] = useState("newest");
  const [isLoading, setIsLoading] = useState(true);
  const [selectedResource, setSelectedResource] = useState<Resource | null>(
    null
  );
  const [isSearching, setIsSearching] = useState(false);
  const [lastAction, setLastAction] = useState<string>("");
  const [loadedFonts, setLoadedFonts] = useState<string[]>([]);
  const [availableCategories, setAvailableCategories] = useState<string[]>([]);
  const fetchIdRef = useRef(0);

  useEffect(() => {
    const currentFetchId = ++fetchIdRef.current;
    
    const loadResources = async () => {
      setIsLoading(true);
      setResources([]);

      try {
        const categories = getAvailableCategories();
        if (categories.length > 0) {
          setAvailableCategories(categories);
        }

        let data: Resource[];
        
        if (selectedCategory === null || selectedCategory === "favorites") {
          data = await fetchAllResources();
        } else {
          data = await fetchCategory(selectedCategory as string);
        }

        if (currentFetchId === fetchIdRef.current) {
          setResources(data);
        }
      } catch (error) {
        console.error("Error fetching resources:", error);
        if (currentFetchId === fetchIdRef.current) {
          setResources([]);
        }
      } finally {
        if (currentFetchId === fetchIdRef.current) {
          setIsLoading(false);
        }
      }
    };

    loadResources();
  }, [selectedCategory]);

  const handleSearchSubmit = useCallback((e?: React.FormEvent) => {
    e?.preventDefault();
    setIsSearching(true);
    setLastAction("search");
  }, []);

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
    []
  );

  const handleSubcategoryChange = useCallback(
    (subcategory: Subcategory | "all" | null) => {
      setSelectedSubcategory(subcategory);
      setLastAction("subcategory");
    },
    []
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
      .filter((r) => {
        if (r.category !== selectedCategory || !r.subcategory) return false;
        if (selectedCategory === "minecraft-icons" && MCICONS_BLACKLISTED_SUBCATEGORIES.includes(r.subcategory)) {
          return false;
        }
        return true;
      })
      .map((r) => r.subcategory as string);
    return Array.from(new Set(subs)).sort();
  }, [resources, selectedCategory]);

  const hasCategoryResources = useMemo(() => {
    if (!selectedCategory || selectedCategory === "favorites") return true;
    return resources.some((resource) => {
      if (resource.category !== selectedCategory) return false;
      if (selectedCategory === "minecraft-icons" && resource.subcategory && MCICONS_BLACKLISTED_SUBCATEGORIES.includes(resource.subcategory)) {
        return false;
      }
      return true;
    });
  }, [resources, selectedCategory]);

  const filteredResources = useMemo(() => {
    let result = [...resources];

    const getCount = (id: string | number) => {
      if (typeof id === "number") return externalDownloadCounts[id] || 0;
      if (id.startsWith("main-")) {
        const numericId = id.replace("main-", "");
        return externalDownloadCounts[numericId] || 0;
      }
      return externalDownloadCounts[id] || 0;
    };

    if (selectedCategory && selectedCategory !== "favorites") {
      result = result.filter((r) => r.category === selectedCategory);
    } else if (selectedCategory === null) {
      result = result.filter((r) => r.category !== "minecraft-icons" && r.category !== "mcsounds");
    }

    if (selectedCategory === "minecraft-icons") {
      result = result.filter(
        (r) => !r.subcategory || !MCICONS_BLACKLISTED_SUBCATEGORIES.includes(r.subcategory)
      );
    }

    if (selectedSubcategory && selectedSubcategory !== "all") {
      if (selectedCategory === "mcsounds") {
        result = result.filter((r) => 
          r.subcategory === selectedSubcategory || 
          r.subcategory?.startsWith(selectedSubcategory + "/")
        );
      } else if (availableSubcategories.includes(selectedSubcategory)) {
        result = result.filter((r) => r.subcategory === selectedSubcategory);
      }
    }

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter((r) => r.title.toLowerCase().includes(query));
    }

    const getNumericId = (id: Resource["id"]) => {
      if (typeof id === "number") return id;
      const parsed = Number(id.toString().replace(/^[^0-9]+/, ""));
      return Number.isFinite(parsed) ? parsed : 0;
    };

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
    externalDownloadCounts,
    availableSubcategories,
  ]);

  const resolveDownloadUrl = (resource: Resource) => {
    return resource.download_url || resource.preview_url || resource.image_url;
  };

  const handleDownload = useCallback(
    async (resource: Resource): Promise<boolean> => {
      if (!resource) return false;

      const fileUrl = resolveDownloadUrl(resource);
      if (!fileUrl) return false;

      const filename = `${resource.title}.${resource.filetype || "file"}`;

      try {
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

        incrementDownload(resource.id);
        return true;
      } catch (err) {
        console.error("Download failed", err);
        return false;
      }
    },
    [incrementDownload]
  );

  const loadWaveform = useCallback(async (resource: Resource) => {
    const url = resource.download_url;
    if (!url) return null;
    return getWaveform(url);
  }, []);

  const loadCachedAudio = useCallback(async (resource: Resource) => {
    const url = resource.download_url;
    if (!url) return null;
    return cacheAudio(url);
  }, []);

  const loadCachedImage = useCallback(async (resource: Resource) => {
    const url = resource.download_url || resource.image_url;
    if (!url) return null;
    return cacheImage(url);
  }, []);

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
    availableCategories,
    hasCategoryResources,
    handleSearchSubmit,
    handleClearSearch,
    handleCategoryChange,
    handleSubcategoryChange,
    sortOrder,
    handleSortOrderChange: setSortOrder,
    handleSearch,
    handleDownload,
    loadWaveform,
    loadCachedAudio,
    loadCachedImage,
    refreshResources: () => {
      fetchIdRef.current++;
      setSelectedCategory(null);
    },
  };
};
