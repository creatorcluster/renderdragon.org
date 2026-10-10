import { getSupabase } from "@/integrations/supabase/lazyClient";

const TRACK_URL = "/api/track";
const STATS_URL = "/api/stats";
const BROWSER_ID_KEY = "rd_browser_id";
const SESSION_ID_KEY = "rd_session_id";
const SESSION_KEY = "rd_analytics_last";
const SESSION_WINDOW_MS = 30 * 60 * 1000;

function doNotTrack(): boolean {
  return navigator.doNotTrack === "1" || (window as unknown as { doNotTrack?: string }).doNotTrack === "1";
}

function randomId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID();
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (char) => {
    const rand = (Math.random() * 16) | 0;
    const value = char === "x" ? rand : (rand & 0x3) | 0x8;
    return value.toString(16);
  });
}

function browserId(): string {
  try {
    const existing = window.localStorage.getItem(BROWSER_ID_KEY);
    if (existing) return existing;
    const created = randomId();
    window.localStorage.setItem(BROWSER_ID_KEY, created);
    return created;
  } catch {
    return randomId();
  }
}

function sessionId(): string {
  try {
    const existing = window.sessionStorage.getItem(SESSION_ID_KEY);
    if (existing) return existing;
    const created = randomId();
    window.sessionStorage.setItem(SESSION_ID_KEY, created);
    return created;
  } catch {
    return randomId();
  }
}

function shouldSend(): boolean {
  const now = Date.now();
  try {
    const last = Number(window.sessionStorage.getItem(SESSION_KEY) ?? 0);
    if (now - last < SESSION_WINDOW_MS) return false;
    window.sessionStorage.setItem(SESSION_KEY, String(now));
  } catch {
    // sessionStorage can throw in private mode; fall through and let the API dedupe
  }
  return true;
}

export function trackPageView(path: string): void {
  if (typeof window === "undefined") return;
  if (doNotTrack()) return;
  if (!shouldSend()) return;

  void (async () => {
    let accessToken: string | null = null;
    try {
      const supabase = await getSupabase();
      const { data } = await supabase.auth.getSession();
      accessToken = data.session?.access_token ?? null;
    } catch {
      // Unauthenticated / offline: still record an anonymous page view.
    }

    const headers: Record<string, string> = { "Content-Type": "application/json" };
    if (accessToken) headers.Authorization = `Bearer ${accessToken}`;

    void fetch(TRACK_URL, {
      method: "POST",
      headers,
      body: JSON.stringify({
        path,
        referrer: document.referrer || null,
        browserId: browserId(),
        sessionId: sessionId(),
      }),
      keepalive: true,
      credentials: "same-origin",
    }).catch(() => undefined);
  })();
}

export type Granularity = "day" | "week" | "month";

export interface StatBucket {
  bucket: string;
  newUsers: number;
  returningUsers: number;
  uniques: number;
  visits: number;
}

export interface AnalyticsStats {
  from: string;
  to: string;
  granularity: Granularity;
  totals: {
    newUsers: number;
    returningUsers: number;
    totalUsers: number;
    visits: number;
  };
  buckets: StatBucket[];
  topPages: { path: string; views: number }[];
  topReferrers: { referrer: string; views: number }[];
}

export interface FetchStatsOptions {
  days?: number;
  granularity?: Granularity;
  topLimit?: number;
}

export async function fetchAnalyticsStats(
  accessToken: string,
  options: FetchStatsOptions = {},
): Promise<AnalyticsStats> {
  const { days = 30, granularity = "day", topLimit = 10 } = options;
  const url = new URL(STATS_URL, window.location.origin);
  url.searchParams.set("days", String(days));
  url.searchParams.set("granularity", granularity);
  url.searchParams.set("topLimit", String(topLimit));

  const response = await fetch(url.toString(), {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (response.status === 401) throw new Error("unauthorized");
  if (response.status === 403) throw new Error("forbidden");
  if (!response.ok) throw new Error(`request failed (${response.status})`);
  return (await response.json()) as AnalyticsStats;
}
