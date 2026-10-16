// Avatar URLs are served through our own origin (see api/avatar.js) because third-party
// avatar hosts are frequently blocked by ad/tracker blockers and privacy DNS, which leaves
// users with a blank avatar. Anything not on the allowlist is left untouched.

const PROXY_HOSTS = new Set([
  "lh3.googleusercontent.com",
  "lh4.googleusercontent.com",
  "lh5.googleusercontent.com",
  "lh6.googleusercontent.com",
  "avatars.githubusercontent.com",
  "cdn.discordapp.com",
  "media.discordapp.net",
]);

/** Turn a remote avatar URL into a same-origin proxied URL (or leave it as-is). */
export function toDisplayAvatarUrl(url?: string | null): string | undefined {
  if (!url) return undefined;
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return undefined; // relative/invalid
  }
  if (parsed.protocol !== "https:" && parsed.protocol !== "http:") return undefined;
  if (!PROXY_HOSTS.has(parsed.hostname.toLowerCase())) return parsed.toString();
  return `/api/avatar?u=${encodeURIComponent(parsed.toString())}`;
}
