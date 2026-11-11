import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { downloadCountKey } from "@/lib/resourceKeys";

export const useDownloadCounts = () => {
  const { user } = useAuth();
  const [downloadCounts, setDownloadCounts] = useState<Record<string, number>>(
    {},
  );

  useEffect(() => {
    if (!user) {
      setDownloadCounts({});
      return;
    }

    const fetchCounts = async () => {
      try {
        const { data, error } = await supabase
          .from("downloads")
          .select("resource_id, count");

        if (error) {
          console.error("Error fetching download counts:", error);
          return;
        }

        if (data) {
          const mapped = data.reduce(
            (acc, row) => {
              if (row.resource_id) {
                acc[row.resource_id.toString()] = row.count || 0;
              }
              return acc;
            },
            {} as Record<string, number>,
          );
          setDownloadCounts(mapped);
        }
      } catch (err) {
        console.error("Unexpected error fetching download counts:", err);
      }
    };

    fetchCounts();
  }, [user]);

  const incrementDownload = useCallback(
    async (resourceId: string | number) => {
      if (!user) return;
      try {
        const resIdStr = resourceId.toString();
        const currentCount = downloadCounts[resIdStr] || 0;
        const newCount = currentCount + 1;

        // Extract numeric ID if possible for DB persistence
        const countKey = downloadCountKey(resourceId);
        let numericId: number | null = null;
        if (typeof resourceId === "number") {
          numericId = resourceId;
        } else if (countKey !== resourceId && !isNaN(Number(countKey))) {
          numericId = Number(countKey);
        }

        if (numericId !== null) {
          const { data, error } = await supabase.rpc(
            "increment_download_count",
            { target_resource_id: numericId },
          );

          if (error) {
            console.error("Error incrementing download count:", error);
            return;
          }

          const next = typeof data === "number" ? data : newCount;
          setDownloadCounts((prev) => ({
            ...prev,
            [resIdStr]: next,
          }));
          return;
        }

        setDownloadCounts((prev) => ({
          ...prev,
          [resIdStr]: newCount,
        }));
      } catch (err) {
        console.error("Unexpected error incrementing download count:", err);
      }
    },
    [downloadCounts, user],
  );

  return { downloadCounts, incrementDownload };
};
