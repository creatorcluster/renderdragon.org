import { supabase } from "@/integrations/supabase/client";
import { fetchFromAssetsApi } from "@/lib/assetsApi";
import { ensureAssetsVersionSynced, resetAssetsVersionSync } from "@/lib/assetsVersion";
import { clearCache, readCache, writeCache } from "@/lib/cache";
import type { SupabaseClient } from "@supabase/supabase-js";

const SHOWCASES_CACHE_KEY = "api:showcases";

// Use a broadly-typed client so we can work with tables created by migrations
const sb = supabase as SupabaseClient;

export type ShowcaseTag = "All";

export type Showcase = {
  id: string;
  user_id: string;
  description: string | null;
  created_at: string;
};

export type ShowcaseAsset = {
  id: string;
  showcase_id: string;
  kind: "image" | "video" | "audio" | "file";
  url: string;
  provider: "uploadthing" | "external";
  position: number;
  created_at: string;
  filename?: string;
};

export interface NewApiAsset {
  _id: string;
  _creationTime: number;
  email: string;
  filename: string;
  message: string;
  slug: string;
  storageId: string;
  url: string;
}

export async function listShowcases(search?: string) {
  // Fetch only from New Assets API (cached; refreshed only when the catalog version changes)
  const newApiShowcases: Showcase[] = [];
  const newApiAssetsByShowcase = new Map<string, ShowcaseAsset[]>();

  await ensureAssetsVersionSynced();

  try {
    let assets = readCache<NewApiAsset[]>(SHOWCASES_CACHE_KEY);
    if (!assets) {
      const response = await fetchFromAssetsApi('/api/assets');
      assets = (await response.json()) as NewApiAsset[];
      if (Array.isArray(assets)) {
        try {
          writeCache(SHOWCASES_CACHE_KEY, assets);
        } catch {
          // ignore quota errors
        }
      }
    }

    if (Array.isArray(assets)) {
      assets.forEach((asset) => {
        const description = asset.message;

        // Apply filters
        if (search && !description.toLowerCase().includes(search.toLowerCase()) && !asset.filename.toLowerCase().includes(search.toLowerCase())) return;

        const showcaseId = `new-${asset._id}`;
        newApiShowcases.push({
          id: showcaseId,
          user_id: asset.email, // Using email as a unique identifier for profile fetching
          description: description,
          created_at: new Date(asset._creationTime).toISOString(),
        });

        const isImage = /\.(png|jpe?g|gif|webp|bmp|svg)(\?|$)/i.test(asset.filename);
        const isVideo = /\.(mp4|mov|webm)(\?|$)/i.test(asset.filename);
        const isAudio = /\.(mp3|wav|flac|ogg|aac|m4a)(\?|$)/i.test(asset.filename);
        const kind: ShowcaseAsset["kind"] = isImage ? "image" : isVideo ? "video" : isAudio ? "audio" : "file";

        newApiAssetsByShowcase.set(showcaseId, [{
          id: asset.storageId,
          showcase_id: showcaseId,
          kind: kind,
          url: asset.url,
          provider: "external",
          position: 0,
          created_at: new Date(asset._creationTime).toISOString(),
          filename: asset.filename,
        }]);
      });
    }
  } catch (err) {
    console.error("Failed to fetch from new Assets API:", err);
  }

  // Sort by creation time
  const allShowcases = newApiShowcases.sort((a, b) =>
    new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );

  return { showcases: allShowcases, assetsByShowcase: newApiAssetsByShowcase };
}

export type ShowcaseWithAssets = Showcase & {
  assets: ShowcaseAsset[];
  profile?: {
    display_name?: string | null;
    avatar_url?: string | null;
    email?: string | null;
    username?: string | null
  }
};

export async function getShowcasesWithProfiles(search?: string): Promise<ShowcaseWithAssets[]> {
  const { showcases, assetsByShowcase } = await listShowcases(search);

  const legacyIds = showcases.filter(s => !s.id.startsWith('new-')).map(s => s.user_id);
  const newEmails = showcases.filter(s => s.id.startsWith('new-')).map(s => s.user_id);

  const profilesMap: Record<string, { display_name?: string | null; avatar_url?: string | null; username?: string | null }> = {};

  if (legacyIds.length > 0 || newEmails.length > 0) {
    let query = sb.from("profiles").select("id, display_name, avatar_url, username");

    const conditions: string[] = [];
    if (legacyIds.length > 0) {
      conditions.push(`id.in.(${legacyIds.join(',')})`);
    }

    if (conditions.length > 0) {
      query = query.or(conditions.join(','));
    }

    const { data } = await query;

    if (data) {
      type ProfileRow = { id: string; display_name?: string | null; avatar_url?: string | null; username?: string | null };
      for (const row of (data as ProfileRow[])) {
        if (row.id) profilesMap[row.id] = row;
      }
    }
  }

  return showcases.map((s) => ({
    ...s,
    assets: assetsByShowcase.get(s.id) || [],
    profile: profilesMap[s.user_id],
  }));
}

export async function createShowcase(params: {
  description: string;
  file: File;
}) {
  const {
    data: { user },
    error: userErr,
  } = await sb.auth.getUser();
  if (userErr) throw userErr;
  if (!user) throw new Error("Must be logged in to create a showcase");

  const formData = new FormData();
  formData.append('file', params.file);
  // Auto-generate a slug: "user-timestamp-random"
  const slug = `asset-${user.id.substring(0, 8)}-${Date.now()}-${Math.random().toString(36).substring(7)}`;
  formData.append('slug', slug);
  // Pass the user's email automatically
  formData.append('email', user.email || 'anonymous@renderdragon.org');
  // Pass message directly
  formData.append('message', params.description);

  const response = await fetchFromAssetsApi('/api/assets', {
    method: 'POST',
    body: formData,
  });

  const result = await response.json();

  // New upload changed the catalog; drop the cached list so the next read refreshes.
  clearCache(SHOWCASES_CACHE_KEY);
  resetAssetsVersionSync();

  // Return synthetic showcase object based on the upload
  return {
    id: `new-${result.id}`,
    user_id: user.email || 'anonymous@renderdragon.org',
    description: params.description,
    created_at: new Date().toISOString()
  } as Showcase;
}
