export const ASSETS_API_BASE_URL = 'https://assets.codersoft.xyz';
export const ASSETS_API_FALLBACK_BASE_URL = 'https://hamburger-api.powernplant101-c6b.workers.dev';

const ASSETS_API_BASE_URLS = [ASSETS_API_BASE_URL, ASSETS_API_FALLBACK_BASE_URL];

export async function fetchFromAssetsApi(path: string, init?: RequestInit): Promise<Response> {
  let lastError: unknown;

  for (const base of ASSETS_API_BASE_URLS) {
    try {
      const response = await fetch(`${base}${path}`, init);
      if (response.ok) return response;
      lastError = new Error(`Assets API error ${response.status} ${response.statusText} for ${base}${path}`);
      console.error(`Assets API error ${response.status} ${response.statusText} for ${base}${path}`);
    } catch (error) {
      lastError = error;
      console.error(`Assets API fetch failed for ${base}${path}:`, error);
    }
  }

  throw lastError instanceof Error ? lastError : new Error('Assets API unavailable');
}
