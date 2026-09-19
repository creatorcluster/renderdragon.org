const ANALYTICS_ORIGIN = (import.meta.env.VITE_ANALYTICS_URL as string | undefined)?.replace(/\/$/, "");
const TRACK_URL = ANALYTICS_ORIGIN ? `${ANALYTICS_ORIGIN}/track` : "/api/track";
const STATS_URL = ANALYTICS_ORIGIN ? `${ANALYTICS_ORIGIN}/stats` : "/api/stats";
const SESSION_KEY = "rd_analytics_last";
const SESSION_WINDOW_MS = 30 * 60 * 1000;

function doNotTrack(): boolean {
  return navigator.doNotTrack === "1" || (window as unknown as { doNotTrack?: string }).doNotTrack === "1";
}

export function trackPageView(path: string): void {
  if (typeof window === "undefined") return;
  if (!import.meta.env.PROD && !ANALYTICS_ORIGIN) return;
  if (doNotTrack()) return;

  const now = Date.now();
  try {
    const last = Number(window.sessionStorage.getItem(SESSION_KEY) ?? 0);
    if (now - last < SESSION_WINDOW_MS) return;
    window.sessionStorage.setItem(SESSION_KEY, String(now));
  } catch {
    // sessionStorage can throw in private mode; fall through and let the worker dedupe
  }

  const body = JSON.stringify({ path, referrer: document.referrer || null });
  void fetch(TRACK_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body,
    keepalive: true,
    credentials: "same-origin",
  }).catch(() => undefined);
}

export interface DailyPoint {
  day: string;
  newUsers: number;
  returningUsers: number;
  visits: number;
}

export interface AnalyticsStats {
  from: number;
  to: number;
  newUsers: number;
  returningUsers: number;
  totalUsers: number;
  visits: number;
  daily: DailyPoint[];
}

export async function fetchAnalyticsStats(token: string, days: number): Promise<AnalyticsStats> {
  const to = Date.now();
  const from = to - days * 24 * 60 * 60 * 1000;
  const url = new URL(STATS_URL, window.location.origin);
  url.searchParams.set("from", String(from));
  url.searchParams.set("to", String(to));

  const response = await fetch(url.toString(), {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (response.status === 401) throw new Error("unauthorized");
  if (!response.ok) throw new Error(`request failed (${response.status})`);
  return (await response.json()) as AnalyticsStats;
}
