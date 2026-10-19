const CACHE_PREFIX = "rd-cache:";
const CACHE_TTL_MS = 1000 * 60 * 60; // 1 hour
const BINARY_CACHE_NAME = "rd-binary-cache-v1";

type CachedPayload<T> = {
  savedAt: number;
  data: T;
};

const readRawCache = <T>(key: string): CachedPayload<T> | null => {
  try {
    const raw = localStorage.getItem(`${CACHE_PREFIX}${key}`);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as CachedPayload<T>;
    if (!parsed?.savedAt || parsed?.data === undefined) return null;
    return parsed;
  } catch {
    return null;
  }
};

export const readCache = <T>(key: string): T | null => {
  const parsed = readRawCache<T>(key);
  if (!parsed) return null;
  if (Date.now() - parsed.savedAt > CACHE_TTL_MS) return null;
  return parsed.data;
};

// Reads an entry even when its TTL has passed. Used as a last-resort fallback so a
// visitor still sees the catalog when the asset API (or their session) is unavailable.
export const readStaleCache = <T>(key: string): T | null =>
  readRawCache<T>(key)?.data ?? null;

const pruneExpiredCaches = (): void => {
  try {
    for (const key of Object.keys(localStorage)) {
      if (!key.startsWith(CACHE_PREFIX)) continue;
      try {
        const parsed = JSON.parse(localStorage.getItem(key) || "") as CachedPayload<unknown>;
        if (!parsed?.savedAt || Date.now() - parsed.savedAt > CACHE_TTL_MS) {
          localStorage.removeItem(key);
        }
      } catch {
        localStorage.removeItem(key);
      }
    }
  } catch {
    // ignore
  }
};

export const writeCache = <T>(key: string, data: T): void => {
  const serialized = JSON.stringify({
    savedAt: Date.now(),
    data,
  } satisfies CachedPayload<T>);

  try {
    localStorage.setItem(`${CACHE_PREFIX}${key}`, serialized);
  } catch {
    // Most likely out of quota: drop expired entries and try once more.
    try {
      pruneExpiredCaches();
      localStorage.setItem(`${CACHE_PREFIX}${key}`, serialized);
    } catch {
      // ignore quota/storage errors
    }
  }
};

export const clearCache = (key: string): void => {
  try {
    localStorage.removeItem(`${CACHE_PREFIX}${key}`);
  } catch {
    // ignore
  }
};

// Reset the TTL clock on caches whose lifetime is governed by the assets catalog
// version: while the server version is unchanged, the cached data stays valid.
export const touchCaches = (prefixes: string[]): void => {
  try {
    const now = Date.now();
    for (const key of Object.keys(localStorage)) {
      if (!key.startsWith(CACHE_PREFIX)) continue;
      const bare = key.slice(CACHE_PREFIX.length);
      if (!prefixes.some((prefix) => bare.startsWith(prefix))) continue;
      const raw = localStorage.getItem(key);
      if (!raw) continue;
      const parsed = JSON.parse(raw) as CachedPayload<unknown>;
      if (!parsed || parsed.data === undefined) continue;
      parsed.savedAt = now;
      localStorage.setItem(key, JSON.stringify(parsed));
    }
  } catch {
    // ignore
  }
};

export const clearCachePrefixes = (prefixes: string[]): void => {
  try {
    for (const key of Object.keys(localStorage)) {
      if (!key.startsWith(CACHE_PREFIX)) continue;
      const bare = key.slice(CACHE_PREFIX.length);
      if (prefixes.some((prefix) => bare.startsWith(prefix))) localStorage.removeItem(key);
    }
  } catch {
    // ignore
  }
};

export const getCacheAge = (key: string): number | null => {
  try {
    const raw = localStorage.getItem(`${CACHE_PREFIX}${key}`);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as CachedPayload<unknown>;
    if (!parsed?.savedAt) return null;
    return Date.now() - parsed.savedAt;
  } catch {
    return null;
  }
};

export const openBinaryCache = async (): Promise<Cache | null> => {
  if (!("caches" in window)) return null;
  try {
    return await caches.open(BINARY_CACHE_NAME);
  } catch {
    return null;
  }
};

export const cacheBinaryFile = async (url: string, response: Response): Promise<boolean> => {
  const cache = await openBinaryCache();
  if (!cache) return false;
  try {
    await cache.put(url, response.clone());
    return true;
  } catch {
    return false;
  }
};

export const getCachedBinaryFile = async (url: string): Promise<Response | null> => {
  const cache = await openBinaryCache();
  if (!cache) return null;
  try {
    const cached = await cache.match(url);
    if (!cached) return null;
    const dateHeader = cached.headers.get("sw-cache-date");
    if (dateHeader) {
      const cacheDate = parseInt(dateHeader, 10);
      if (Date.now() - cacheDate > CACHE_TTL_MS) {
        await cache.delete(url);
        return null;
      }
    }
    return cached;
  } catch {
    return null;
  }
};

export const fetchWithBinaryCache = async (url: string): Promise<Response | null> => {
  const cached = await getCachedBinaryFile(url);
  if (cached) return cached;

  try {
    const response = await fetch(url);
    if (!response.ok) return null;
    
    const headers = new Headers(response.headers);
    headers.set("sw-cache-date", Date.now().toString());
    const cachedResponse = new Response(await response.clone().blob(), {
      status: response.status,
      statusText: response.statusText,
      headers,
    });
    
    await cacheBinaryFile(url, cachedResponse);
    return response;
  } catch {
    return null;
  }
};

export const cacheImage = async (url: string): Promise<string | null> => {
  try {
    const response = await fetchWithBinaryCache(url);
    if (!response) return null;
    const blob = await response.blob();
    return URL.createObjectURL(blob);
  } catch {
    return null;
  }
};

export const cacheAudio = async (url: string): Promise<Blob | null> => {
  try {
    const response = await fetchWithBinaryCache(url);
    if (!response) return null;
    return await response.blob();
  } catch {
    return null;
  }
};

export interface WaveformData {
  peaks: number[];
  duration: number;
  sampleRate: number;
}

export const generateWaveform = async (audioUrl: string): Promise<WaveformData | null> => {
  const cacheKey = `waveform:${audioUrl}`;
  const cached = readCache<WaveformData>(cacheKey);
  if (cached) return cached;

  try {
    const audioBlob = await cacheAudio(audioUrl);
    if (!audioBlob) return null;

    const audioContext = new AudioContext();
    const arrayBuffer = await audioBlob.arrayBuffer();
    const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
    
    const rawData = audioBuffer.getChannelData(0);
    const samples = 200;
    const blockSize = Math.floor(rawData.length / samples);
    const peaks: number[] = [];

    for (let i = 0; i < samples; i++) {
      let sum = 0;
      for (let j = 0; j < blockSize; j++) {
        sum += Math.abs(rawData[i * blockSize + j] || 0);
      }
      peaks.push(sum / blockSize);
    }

    const maxPeak = Math.max(...peaks);
    const normalizedPeaks = peaks.map(p => p / maxPeak);

    const waveformData: WaveformData = {
      peaks: normalizedPeaks,
      duration: audioBuffer.duration,
      sampleRate: audioBuffer.sampleRate,
    };

    writeCache(cacheKey, waveformData);
    audioContext.close();
    
    return waveformData;
  } catch (error) {
    console.error("Failed to generate waveform:", error);
    return null;
  }
};

export const getWaveform = async (audioUrl: string): Promise<WaveformData | null> => {
  return generateWaveform(audioUrl);
};

export const clearAllCaches = async (): Promise<void> => {
  try {
    Object.keys(localStorage)
      .filter(key => key.startsWith(CACHE_PREFIX))
      .forEach(key => localStorage.removeItem(key));
    
    if ("caches" in window) {
      const cache = await openBinaryCache();
      if (cache) {
        const keys = await cache.keys();
        await Promise.all(keys.map(req => cache.delete(req)));
      }
    }
  } catch {
    // ignore
  }
};
