import { fetchAssetsVersion } from "@/lib/assetsApi";
import { clearCachePrefixes, touchCaches } from "@/lib/cache";

const VERSION_KEY = "rd-assets-version";

// Caches whose lifetime is governed by the catalog version instead of their own TTL.
const CATALOG_CACHE_PREFIXES = [
  "api:all-resources",
  "api:categories",
  "api:category:",
  "api:showcases",
];

let syncPromise: Promise<void> | null = null;

async function runSync(): Promise<void> {
  const version = await fetchAssetsVersion();
  if (!version) return; // endpoint unavailable -> leave existing caches alone

  let stored: string | null = null;
  try {
    stored = localStorage.getItem(VERSION_KEY);
  } catch {
    stored = null;
  }

  if (stored === version) {
    // Catalog is current: keep the caches alive so no auth (and no challenge) is needed.
    touchCaches(CATALOG_CACHE_PREFIXES);
    return;
  }

  // Catalog changed (or first visit): drop the stale data and remember the new version.
  clearCachePrefixes(CATALOG_CACHE_PREFIXES);
  try {
    localStorage.setItem(VERSION_KEY, version);
  } catch {
    // ignore
  }
}

// Best-effort, runs once per page load, and is awaited before any catalog fetch so the
// version decision is made before we ever touch the authenticated path.
export function ensureAssetsVersionSynced(): Promise<void> {
  if (!syncPromise) {
    syncPromise = runSync().catch((error) => {
      console.warn("Assets version sync failed:", error);
    });
  }
  return syncPromise;
}

export function resetAssetsVersionSync(): void {
  syncPromise = null;
}
