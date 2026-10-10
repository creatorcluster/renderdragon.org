import { createClient } from '@supabase/supabase-js';
import { isAllowedOrigin } from './cors.js';

const MAX_PATH = 512;
const MAX_REFERRER = 1024;
const MAX_USER_AGENT = 512;
const SESSION_WINDOW_SECONDS = 30 * 60;
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const BOT_RE =
  /bot|crawl|spider|slurp|bingpreview|headless|lighthouse|pingdom|uptime|monitor|facebookexternalhit|whatsapp|telegram|discordbot|preview/i;

function corsHeaders(request) {
  const origin = request.headers.get('origin');
  const headers = {
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    Vary: 'Origin',
  };
  if (origin && isAllowedOrigin(origin)) headers['Access-Control-Allow-Origin'] = origin;
  return headers;
}

function truncate(value, max) {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  return trimmed.slice(0, max);
}

function supabaseConfig() {
  const url = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
  const anonKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_PUBLISHABLE_KEY || process.env.SUPABASE_ANON_KEY;
  const secretKey =
    process.env.SUPABASE_SECRET_KEY ||
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.SUPABASE_SERVICE_ROLE_SECRET;
  return { url, anonKey, secretKey };
}

async function resolveUser(url, anonKey, request) {
  const header = request.headers.get('authorization') || request.headers.get('Authorization');
  if (!header || !header.toLowerCase().startsWith('bearer ')) return null;
  const accessToken = header.slice(7).trim();
  if (!accessToken) return null;
  try {
    const userClient = createClient(url, anonKey, {
      global: { headers: { Authorization: `Bearer ${accessToken}` } },
      auth: { autoRefreshToken: false, persistSession: false },
    });
    const { data, error } = await userClient.auth.getUser();
    if (error || !data?.user) return null;
    return data.user;
  } catch {
    return null;
  }
}

export async function handler(request) {
  const headers = corsHeaders(request);

  if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers });
  if (request.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'method not allowed' }), {
      status: 405,
      headers: { ...headers, 'Content-Type': 'application/json' },
    });
  }

  const userAgent = request.headers.get('user-agent') || '';
  if (!userAgent || BOT_RE.test(userAgent)) return new Response(null, { status: 204, headers });

  let payload = {};
  try {
    payload = await request.json();
  } catch {
    payload = {};
  }

  const browserId = truncate(payload?.browserId, 64);
  if (!browserId || !UUID_RE.test(browserId)) return new Response(null, { status: 204, headers });

  const { url, anonKey, secretKey } = supabaseConfig();
  if (!url || !secretKey) {
    console.error('[track] Supabase configuration missing (url or service role key)');
    return new Response(null, { status: 204, headers });
  }

  try {
    const user = anonKey ? await resolveUser(url, anonKey, request) : null;
    const visitorKey = user ? `u:${user.id}` : `b:${browserId}`;
    const country = request.headers.get('x-vercel-ip-country') || null;

    const admin = createClient(url, secretKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    const { error } = await admin.rpc('analytics_track', {
      p_visitor_key: visitorKey,
      p_browser_id: browserId,
      p_user_id: user?.id ?? null,
      p_session_id: truncate(payload?.sessionId, 64),
      p_path: truncate(payload?.path, MAX_PATH),
      p_referrer: truncate(payload?.referrer, MAX_REFERRER),
      p_country: country,
      p_user_agent: truncate(userAgent, MAX_USER_AGENT),
      p_session_window_seconds: SESSION_WINDOW_SECONDS,
    });

    if (error) console.error('[track] rpc error:', error.message);
  } catch (error) {
    console.error('[track] unexpected error:', error);
  }

  return new Response(null, { status: 204, headers });
}

export default { fetch: handler };
