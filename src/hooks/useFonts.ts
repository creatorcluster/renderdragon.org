import { useEffect, useState } from "react";
import { fetchAllResources } from "@/lib/api";
import { Resource } from "@/types/resources";

/**
 * Loads the font entries from the whole catalogue, mirroring the previous
 * behaviour (the text generator filtered `resources` by category).
 */
export const useFonts = () => {
  const [fonts, setFonts] = useState<Resource[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    const loadFonts = async () => {
      setIsLoading(true);

      try {
        const all = await fetchAllResources();
        if (!cancelled) {
          setFonts(all.filter((resource) => resource.category === "fonts"));
        }
      } catch (error) {
        console.error("Error fetching fonts:", error);
        if (!cancelled) {
          setFonts([]);
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    };

    loadFonts();

    return () => {
      cancelled = true;
    };
  }, []);

  return { fonts, isLoading };
};
