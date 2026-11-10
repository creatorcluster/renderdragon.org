import React, { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { Resource } from "@/types/resources";
import { useDownloadCounts } from "@/hooks/useDownloadCounts";
import {
  fetchAllResources,
  fetchCategory,
  getAvailableCategories,
} from "@/lib/api";
import {
  filterAndSort,
  deriveSubcategories,
  hasResourcesForCategory,
} from "@/lib/catalogue";
import { downloadFile, DownloadProgress } from "@/lib/download";
import { resolveDownloadUrl } from "@/lib/resourcesRepo";

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
  const [loadedFonts, setLoadedFonts] = useState<string[]>([]);
  const [fontPreviewText, setFontPreviewText] = useState<string>("Aa Bb Cc");
  const [availableCategories, setAvailableCategories] = useState<string[]>([]);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const fetchIdRef = useRef(0);

  useEffect(() => {
    const currentFetchId = ++fetchIdRef.current;

    const loadResources = async () => {
      setIsLoading(true);
      setResources([]);
      setLoadError(null);

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
          // Re-read after the fetch: the catalogue version sync may have
          // invalidated the categories cache since the seed read above.
          const freshCategories = getAvailableCategories();
          if (freshCategories.length > 0) {
            setAvailableCategories(freshCategories);
          }
        }
      } catch (error) {
        console.error("Error fetching resources:", error);
        if (currentFetchId === fetchIdRef.current) {
          setResources([]);
          setLoadError(
            error instanceof Error && error.message ? error.message : "Unable to load resources"
          );
        }
      } finally {
        if (currentFetchId === fetchIdRef.current) {
          setIsLoading(false);
        }
      }
    };

    loadResources();
  }, [selectedCategory, refreshKey]);

  const handleSearchSubmit = useCallback((e?: React.FormEvent) => {
    e?.preventDefault();
    setIsSearching(true);
  }, []);

  const handleClearSearch = useCallback(() => {
    setSearchQuery("");
    setIsSearching(false);
  }, []);

  const handleCategoryChange = useCallback(
    (category: Category | null | "favorites") => {
      setIsLoading(true);
      setSelectedCategory(category);
      setSelectedSubcategory(null);
    },
    []
  );

  const handleSubcategoryChange = useCallback(
    (subcategory: Subcategory | "all" | null) => {
      setSelectedSubcategory(subcategory);
    },
    []
  );

  const handleSearch = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
    if (e.target.value === "") {
      setIsSearching(false);
    } else {
      setIsSearching(true);
    }
  }, []);

  const availableSubcategories = useMemo(
    () => deriveSubcategories(resources, selectedCategory),
    [resources, selectedCategory]
  );

  const hasCategoryResources = useMemo(
    () => hasResourcesForCategory(resources, selectedCategory),
    [resources, selectedCategory]
  );

  const filteredResources = useMemo(
    () =>
      filterAndSort(resources, {
        category: selectedCategory,
        subcategory: selectedSubcategory,
        searchQuery,
        sortOrder,
        availableSubcategories,
        downloadCounts: externalDownloadCounts,
      }),
    [
      resources,
      selectedCategory,
      selectedSubcategory,
      searchQuery,
      sortOrder,
      externalDownloadCounts,
      availableSubcategories,
    ]
  );

  const handleDownload = useCallback(
    async (
      resource: Resource,
      onProgress?: (progress: DownloadProgress) => void
    ): Promise<boolean> => {
      if (!resource) return false;

      const fileUrl = resolveDownloadUrl(resource);
      if (!fileUrl) return false;

      const filename = `${resource.title}.${resource.filetype || "file"}`;

      const success = await downloadFile(fileUrl, { filename, onProgress });
      if (success) {
        incrementDownload(resource.id);
      }
      return success;
    },
    [incrementDownload]
  );

  const retryResources = useCallback(() => {
    fetchIdRef.current++;
    setRefreshKey(prev => prev + 1);
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
    loadedFonts,
    setLoadedFonts,
    fontPreviewText,
    setFontPreviewText,
    filteredResources,
    availableSubcategories,
    availableCategories,
    hasCategoryResources,
    loadError,
    handleSearchSubmit,
    handleClearSearch,
    handleCategoryChange,
    handleSubcategoryChange,
    sortOrder,
    handleSortOrderChange: setSortOrder,
    handleSearch,
    handleDownload,
    retryResources,
  };
};
