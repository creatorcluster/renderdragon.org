import { useEffect, useState } from "react";
import { fetchAllResources } from "@/lib/api";
import type { Resource } from "@/types/resources";

/**
 * The whole catalogue, for surfaces that must resolve any favourite regardless
 * of which category the hub is currently showing. `fetchAllResources` reads the
 * shared cache first, so this does not add a network round-trip in practice.
 */
export const useAllResources = () => {
  const [resources, setResources] = useState<Resource[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let active = true;

    fetchAllResources()
      .then((data) => {
        if (active) setResources(data);
      })
      .catch((error) => {
        console.error("Error fetching all resources:", error);
        if (active) setResources([]);
      })
      .finally(() => {
        if (active) setIsLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  return { resources, isLoading };
};
