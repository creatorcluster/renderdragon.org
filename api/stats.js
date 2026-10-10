import { createClient } from '@supabase/supabase-js';
import { isAllowedOrigin } from './cors.js';

const FALLBACK_ADMIN_EMAILS = [
  'yamura@duck.com',
  'theckie@protonmail.com',
  'vovoplaygame3@gmail.com',
];

const GRANULARITIES = new Set(['day', 'week', 'month']);

function adminEmails() {
  const configured = (process.env.ANALYTICS_ADMIN_EMAILS || '')
    .split(',')
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean);
  return configured.length > 0 ? configured : FALLBACK_ADMIN_EMAILS;
}

function corsHeaders(request) {
  const origin = request.headers.get('origin');
  const headers = {
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    Vary: 'Origin',
  };
  if (origin && isAllowedOrigin(origin)) headers['Access-Control-Allow-Origin'] = origin;
  return headers;
}

function json(data, status, headers) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...headers, 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
  });
}

function clampInt(value, fallback, min, max) {
  const parsed = Number.parseInt(value, 10);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.min(Math.max(parsed, min), max);
}

export async function handler(request) {
  const headers = corsHeaders(request);

  if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers });
  if (request.method !== 'GET') return json({ error: 'method not allowed' }, 405, headers);

  const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
  const anonKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_PUBLISHABLE_KEY || process.env.SUPABASE_ANON_KEY;
  const secretKey =
    process.env.SUPABASE_SECRET_KEY ||
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.SUPABASE_SERVICE_ROLE_SECRET;

  if (!supabaseUrl || !anonKey || !secretKey) {
    return json({ error: 'server not configured' }, 500, headers);
  }

  const authHeader = request.headers.get('authorization') || '';
  if (!authHeader.toLowerCase().startsWith('bearer ')) {
    return json({ error: 'unauthorized' }, 401, headers);
  }

  const accessToken = authHeader.slice(7).trim();
  let user;
  try {
    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: `Bearer ${accessToken}` } },
      auth: { autoRefreshToken: false, persistSession: false },
    });
    const { data, error } = await userClient.auth.getUser();
    if (error || !data?.user) return json({ error: 'unauthorized' }, 401, headers);
    user = data.user;
  } catch {
    return json({ error: 'unauthorized' }, 401, headers);
  }

  const email = (user.email || '').toLowerCase();
  if (!email || !adminEmails().includes(email)) {
    return json({ error: 'forbidden' }, 403, headers);
  }

  const url = new URL(request.url);
  const granularityParam = (url.searchParams.get('granularity') || 'day').toLowerCase();
  const granularity = GRANULARITIES.has(granularityParam) ? granularityParam : 'day';
  const days = clampInt(url.searchParams.get('days'), 30, 1, 366);
  const topLimit = clampInt(url.searchParams.get('topLimit'), 10, 1, 50);

  const to = Date.now();
  const from = to - days * 24 * 60 * 60 * 1000;

  try {
    const admin = createClient(supabaseUrl, secretKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });
    const { data, error } = await admin.rpc('analytics_overview', {
      p_from: new Date(from).toISOString(),
      p_to: new Date(to).toISOString(),
      p_granularity: granularity,
      p_top_limit: topLimit,
    });
    if (error) {
      console.error('[stats] rpc error:', error.message);
      return json({ error: 'query failed' }, 500, headers);
    }
    return json(data, 200, headers);
  } catch (error) {
    console.error('[stats] unexpected error:', error);
    return json({ error: 'internal error' }, 500, headers);
  }
}

export default { fetch: handler };
