import { useEffect, useState } from "react";
import { fetchCategory } from "@/lib/api";
import { Resource } from "@/types/resources";

/**
 * Loads only the fonts catalogue, for consumers that just need the font list
 * (e.g. the text generator dropdown) instead of the whole resource hub state.
 */
export const useFonts = () => {
  const [fonts, setFonts] = useState<Resource[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    const loadFonts = async () => {
      setIsLoading(true);

      try {
        const data = await fetchCategory("fonts");
        if (!cancelled) {
          setFonts(data);
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
