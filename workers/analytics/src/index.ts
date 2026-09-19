interface Env {
  DB: D1Database;
  STATS_TOKEN: string;
  ALLOWED_ORIGIN?: string;
}

const COOKIE_NAME = "rd_vid";
const COOKIE_MAX_AGE = 60 * 60 * 24 * 365;
const SESSION_WINDOW_MS = 30 * 60 * 1000;
const MAX_FIELD_LENGTH = 512;
const DEFAULT_RANGE_MS = 30 * 60 * 24 * 1000;
const VISITOR_ID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const BOT_RE =
  /bot|crawl|spider|slurp|bingpreview|headless|lighthouse|pingdom|uptime|monitor|facebookexternalhit|whatsapp|telegram|discordbot|preview/i;

type CfRequest = Request & { cf?: { country?: string } };

function allowedOrigin(env: Env, origin: string | null): string | null {
  if (!origin) return null;
  if (env.ALLOWED_ORIGIN && origin === env.ALLOWED_ORIGIN) return origin;
  return null;
}

function withCors(env: Env, request: Request, headers: Headers): Headers {
  const origin = allowedOrigin(env, request.headers.get("Origin"));
  if (origin) {
    headers.set("Access-Control-Allow-Origin", origin);
    headers.set("Access-Control-Allow-Credentials", "true");
    headers.set("Vary", "Origin");
  }
  return headers;
}

function json(
  env: Env,
  request: Request,
  data: unknown,
  status = 200,
  extra?: Headers,
): Response {
  const headers = withCors(env, request, new Headers(extra));
  headers.set("Content-Type", "application/json");
  headers.set("Cache-Control", "no-store");
  return new Response(JSON.stringify(data), { status, headers });
}

function readCookie(request: Request, name: string): string | null {
  const header = request.headers.get("Cookie");
  if (!header) return null;
  for (const part of header.split(";")) {
    const [key, ...rest] = part.trim().split("=");
    if (key === name) return decodeURIComponent(rest.join("="));
  }
  return null;
}

function visitorCookie(id: string): string {
  return `${COOKIE_NAME}=${id}; Path=/; Max-Age=${COOKIE_MAX_AGE}; HttpOnly; Secure; SameSite=Lax`;
}

function constantTimeEqual(a: string, b: string): boolean {
  const enc = new TextEncoder();
  const left = enc.encode(a);
  const right = enc.encode(b);
  if (left.length !== right.length) return false;
  let diff = 0;
  for (let i = 0; i < left.length; i += 1) diff |= left[i] ^ right[i];
  return diff === 0;
}

function bearerToken(request: Request): string | null {
  const header = request.headers.get("Authorization");
  if (header?.toLowerCase().startsWith("bearer ")) return header.slice(7).trim();
  return null;
}

function authorized(request: Request, env: Env): boolean {
  const token = bearerToken(request) ?? new URL(request.url).searchParams.get("token");
  if (!token || !env.STATS_TOKEN) return false;
  return constantTimeEqual(token, env.STATS_TOKEN);
}

function toMs(value: string | null, fallback: number): number {
  if (!value) return fallback;
  if (/^\d+$/.test(value)) return Number(value);
  const parsed = Date.parse(value);
  return Number.isNaN(parsed) ? fallback : parsed;
}

function truncate(value: unknown): string | null {
  if (typeof value !== "string" || value.length === 0) return null;
  return value.slice(0, MAX_FIELD_LENGTH);
}

async function handleTrack(request: Request, env: Env): Promise<Response> {
  if (request.method !== "POST") return json(env, request, { error: "method not allowed" }, 405);

  const userAgent = request.headers.get("User-Agent") ?? "";
  if (!userAgent || BOT_RE.test(userAgent)) return new Response(null, { status: 204 });

  let payload: { path?: unknown; referrer?: unknown } = {};
  try {
    payload = (await request.json()) as typeof payload;
  } catch {
    payload = {};
  }

  const cookieId = readCookie(request, COOKIE_NAME);
  const isNewVisitor = !cookieId || !VISITOR_ID_RE.test(cookieId);
  const visitorId = isNewVisitor ? crypto.randomUUID() : cookieId;
  const now = Date.now();

  const existing = await env.DB.prepare(
    "SELECT last_seen FROM visitors WHERE visitor_id = ?1",
  )
    .bind(visitorId)
    .first<{ last_seen: number }>();

  const isSession = !existing || now - Number(existing.last_seen) > SESSION_WINDOW_MS;

  if (!existing) {
    await env.DB.prepare(
      "INSERT OR IGNORE INTO visitors (visitor_id, first_seen, last_seen, visits) VALUES (?1, ?2, ?2, 1)",
    )
      .bind(visitorId, now)
      .run();
  } else if (isSession) {
    await env.DB.prepare(
      "UPDATE visitors SET last_seen = ?1, visits = visits + 1 WHERE visitor_id = ?2",
    )
      .bind(now, visitorId)
      .run();
  } else {
    await env.DB.prepare("UPDATE visitors SET last_seen = ?1 WHERE visitor_id = ?2")
      .bind(now, visitorId)
      .run();
  }

  if (isSession) {
    const country = (request as CfRequest).cf?.country ?? null;
    const bound = env.DB.prepare(
      "INSERT INTO visits (visitor_id, ts, path, referrer, country, is_new) VALUES (?1, ?2, ?3, ?4, ?5, ?6)",
    ).bind(
      visitorId,
      now,
      truncate(payload.path),
      truncate(payload.referrer),
      country,
      isNewVisitor ? 1 : 0,
    );
    await bound.run();
  }

  const headers = new Headers();
  if (isNewVisitor) headers.set("Set-Cookie", visitorCookie(visitorId));
  return new Response(null, { status: 204, headers: withCors(env, request, headers) });
}

async function statsFor(env: Env, from: number, to: number) {
  const totals = await env.DB.prepare(
    `SELECT
       COUNT(DISTINCT CASE WHEN is_new = 1 THEN visitor_id END) AS new_users,
       COUNT(DISTINCT CASE WHEN is_new = 0 THEN visitor_id END) AS returning_users,
       COUNT(DISTINCT visitor_id) AS total_users,
       COUNT(*) AS visits
     FROM visits
     WHERE ts >= ?1 AND ts < ?2`,
  )
    .bind(from, to)
    .first<{
      new_users: number | null;
      returning_users: number | null;
      total_users: number | null;
      visits: number | null;
    }>();

  const daily = await env.DB.prepare(
    `SELECT
       date(ts / 1000, 'unixepoch') AS day,
       COUNT(DISTINCT CASE WHEN is_new = 1 THEN visitor_id END) AS new_users,
       COUNT(DISTINCT CASE WHEN is_new = 0 THEN visitor_id END) AS returning_users,
       COUNT(*) AS visits
     FROM visits
     WHERE ts >= ?1 AND ts < ?2
     GROUP BY day
     ORDER BY day DESC
     LIMIT 120`,
  )
    .bind(from, to)
    .all<{
      day: string;
      new_users: number;
      returning_users: number;
      visits: number;
    }>();

  return {
    from,
    to,
    newUsers: Number(totals?.new_users ?? 0),
    returningUsers: Number(totals?.returning_users ?? 0),
    totalUsers: Number(totals?.total_users ?? 0),
    visits: Number(totals?.visits ?? 0),
    daily: (daily.results ?? []).map((row) => ({
      day: row.day,
      newUsers: Number(row.new_users ?? 0),
      returningUsers: Number(row.returning_users ?? 0),
      visits: Number(row.visits ?? 0),
    })),
  };
}

async function handleStats(request: Request, env: Env): Promise<Response> {
  if (!authorized(request, env)) return json(env, request, { error: "unauthorized" }, 401);

  const url = new URL(request.url);
  const to = toMs(url.searchParams.get("to"), Date.now());
  const from = toMs(url.searchParams.get("from"), to - DEFAULT_RANGE_MS);
  if (from >= to) return json(env, request, { error: "invalid range" }, 400);

  return json(env, request, await statsFor(env, from, to));
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

async function handleDashboard(request: Request, env: Env): Promise<Response> {
  const url = new URL(request.url);
  if (!authorized(request, env)) {
    const html = `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>RenderDragon analytics</title><style>body{font-family:ui-monospace,monospace;background:#0b0b0c;color:#e7e7e7;display:grid;place-items:center;height:100vh;margin:0}form{display:flex;gap:8px}input{background:#17171a;border:1px solid #333;color:#e7e7e7;padding:10px;border-radius:6px}button{background:#e7e7e7;color:#0b0b0c;border:0;padding:10px 14px;border-radius:6px;cursor:pointer}</style></head><body><form><input name="token" type="password" placeholder="stats token" autofocus><button>view</button></form></body></html>`;
    return new Response(html, {
      status: 200,
      headers: { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-store" },
    });
  }

  const to = toMs(url.searchParams.get("to"), Date.now());
  const from = toMs(url.searchParams.get("from"), to - DEFAULT_RANGE_MS);
  const stats = from < to ? await statsFor(env, from, to) : await statsFor(env, to - DEFAULT_RANGE_MS, to);

  const rows = stats.daily
    .map(
      (row) =>
        `<tr><td>${escapeHtml(row.day)}</td><td>${row.newUsers}</td><td>${row.returningUsers}</td><td>${row.visits}</td></tr>`,
    )
    .join("");

  const html = `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>RenderDragon analytics</title><style>
    body{font-family:ui-monospace,monospace;background:#0b0b0c;color:#e7e7e7;margin:0;padding:32px}
    h1{font-size:18px;font-weight:600;margin:0 0 4px}
    .sub{color:#8a8a8a;font-size:12px;margin-bottom:24px}
    .cards{display:flex;gap:12px;flex-wrap:wrap;margin-bottom:24px}
    .card{background:#141417;border:1px solid #26262b;border-radius:8px;padding:16px 20px;min-width:120px}
    .card b{display:block;font-size:26px;font-weight:600}
    .card span{color:#8a8a8a;font-size:12px}
    table{border-collapse:collapse;width:100%;font-size:13px}
    th,td{text-align:left;padding:8px 10px;border-bottom:1px solid #1e1e22}
    th{color:#8a8a8a;font-weight:500}
  </style></head><body>
    <h1>RenderDragon analytics</h1>
    <div class="sub">${escapeHtml(new Date(stats.from).toISOString().slice(0, 10))} to ${escapeHtml(new Date(stats.to).toISOString().slice(0, 10))} (UTC)</div>
    <div class="cards">
      <div class="card"><b>${stats.newUsers}</b><span>new users</span></div>
      <div class="card"><b>${stats.returningUsers}</b><span>returning users</span></div>
      <div class="card"><b>${stats.totalUsers}</b><span>unique users</span></div>
      <div class="card"><b>${stats.visits}</b><span>visits</span></div>
    </div>
    <table><thead><tr><th>day</th><th>new</th><th>returning</th><th>visits</th></tr></thead><tbody>${rows}</tbody></table>
  </body></html>`;

  return new Response(html, {
    status: 200,
    headers: { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-store" },
  });
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const { pathname } = new URL(request.url);

    if (request.method === "OPTIONS") {
      const headers = withCors(env, request, new Headers());
      headers.set("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
      headers.set("Access-Control-Allow-Headers", "Content-Type, Authorization");
      headers.set("Access-Control-Max-Age", "86400");
      return new Response(null, { status: 204, headers });
    }

    try {
      if (pathname === "/track") return await handleTrack(request, env);
      if (pathname === "/stats") return await handleStats(request, env);
      if (pathname === "/" || pathname === "/dashboard")
        return await handleDashboard(request, env);
      return json(env, request, { error: "not found" }, 404);
    } catch (error) {
      return json(env, request, { error: "internal error", detail: String(error) }, 500);
    }
  },
};
