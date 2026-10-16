// Same-origin avatar proxy.
//
// Third-party avatar hosts (Google, GitHub, Discord) are routinely blocked by ad/tracker
// blockers and privacy DNS, which leaves users with a blank avatar. Serving them from our
// own origin sidesteps that entirely and keeps the image request first-party.
//
// SSRF guard: only a fixed allowlist of avatar hosts may be fetched, and redirects are
// never followed.

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

const ALLOWED_AVATAR_HOSTS = new Set([
  'lh3.googleusercontent.com',
  'lh4.googleusercontent.com',
  'lh5.googleusercontent.com',
  'lh6.googleusercontent.com',
  'avatars.githubusercontent.com',
  'cdn.discordapp.com',
  'media.discordapp.net',
]);

export function isAllowedAvatarUrl(rawUrl) {
  let url;
  try {
    url = new URL(rawUrl);
  } catch {
    return false;
  }
  if (url.protocol !== 'https:' && url.protocol !== 'http:') return false;
  return ALLOWED_AVATAR_HOSTS.has(url.hostname.toLowerCase());
}

export default async function handler(req) {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  try {
    const target = new URL(req.url, `http://${req.headers.host}`).searchParams.get('u');
    if (!target) {
      return new Response('Missing avatar url', { status: 400, headers: corsHeaders });
    }
    if (!isAllowedAvatarUrl(target)) {
      return new Response('URL not allowed', { status: 400, headers: corsHeaders });
    }

    // redirect: 'manual' — never follow redirects (they could point at internal hosts)
    const upstream = await fetch(target, { redirect: 'manual' });
    if (upstream.status >= 300 && upstream.status < 400) {
      return new Response('Redirect not allowed', { status: 502, headers: corsHeaders });
    }
    if (!upstream.ok) {
      return new Response('Upstream error', { status: 502, headers: corsHeaders });
    }

    const contentType = upstream.headers.get('content-type') || '';
    if (!contentType.startsWith('image/')) {
      return new Response('Not an image', { status: 502, headers: corsHeaders });
    }

    return new Response(upstream.body, {
      status: 200,
      headers: {
        ...corsHeaders,
        'Content-Type': contentType,
        // Avatars change rarely; cache hard at the edge and lightly in the browser.
        'Cache-Control': 'public, max-age=86400, s-maxage=604800, stale-while-revalidate=86400',
      },
    });
  } catch (error) {
    console.error('Avatar proxy error:', error);
    return new Response('Avatar proxy error', { status: 502, headers: corsHeaders });
  }
}
