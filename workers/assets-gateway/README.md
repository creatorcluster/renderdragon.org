# codersoft-assets-gateway

Cloudflare Worker hosted at **`gateway.codersoft.xyz`** (custom domain). It is the
**server-side** component the browser talks to, so no signing secret ever ships to the
browser. Cloudflare Workers have no request-body size limit, so large asset uploads are fine.

`renderdragon.org` lives in a **different Cloudflare account**, so the gateway is hosted on
its own domain and the site calls it **cross-origin** (CORS + `SameSite=None; Secure`
cookies). Paths are served at the root (`/__session`, `/all`, `/__version`, …).

```
browser ──> gateway.codersoft.xyz            (this Worker; holds GATEWAY_SECRET)
        ──> api.codersoft.xyz                 (codersoft-api-router; verifies the signature)
        ──> e3 / fallback workers
```

## Session flow

The gateway only signs requests for a caller that proves it is a real renderdragon.org visitor:

1. `GET /api/assets-gw/__session` — tells the SPA whether it already has a valid session.
2. `POST /api/assets-gw/__session` — establishes one. Body:
   - `{ "supabaseToken": "<access token>" }` for a logged-in visitor (verified against
     Supabase; skips the challenge), or
   - `{ "turnstileToken": "<token>" }` for an anonymous visitor (verified server-side against
     Cloudflare Turnstile, including the hostname).
   On success the gateway returns `Set-Cookie: rdgw=…; HttpOnly; Secure; SameSite=None`
   Path=/api/assets-gw` — a short-lived HMAC-signed session.
3. Any other `/api/assets-gw/<path>` request must carry that cookie. The gateway signs it
   (HMAC-SHA256, same canonical string as the router) with `GATEWAY_SECRET` and proxies to
   `ROUTER_ORIGIN`.

`GET /api/assets-gw/__version` is **public** — no session, no challenge. The SPA caches the
catalog and compares this version; it only establishes a session (step 2) when the version
changed, so returning visitors are not challenged.

Spoofed `Origin`, `Referer`, or `X-Auth-*` headers cannot mint a session: the cookie requires a
server-verified Turnstile result (or a Supabase login), and the router independently verifies
the gateway's signature. Cookies are `HttpOnly` (no JS access), `Secure`, and `SameSite=None`
(cross-site; `Lax` in local dev), which also blocks CSRF to the upload endpoint.

## Config (`wrangler.toml` `[vars]`)

| Var | Default | Purpose |
| --- | --- | --- |
| `ROUTER_ORIGIN` | `https://api.codersoft.xyz` | Where signed requests are sent. |
| `GATEWAY_CLIENT_ID` | `renderdragon-gateway` | Client id registered in the router. |
| `SESSION_TTL_SECONDS` | `1800` | Session cookie lifetime. |
| `REQUIRE_TURNSTILE` | `true` | Require a Turnstile challenge for anonymous visitors. |
| `TURNSTILE_HOSTNAMES` | `renderdragon.org,www.renderdragon.org,localhost` | Allowed Turnstile hostnames. |
| `SUPABASE_URL` / `SUPABASE_ANON_KEY` | project / empty | Enable the logged-in (no-challenge) path. |
| `COOKIE_SECURE` | `true` | `false` only for local HTTP dev. |
| `ALLOWED_ORIGINS` | renderdragon.org + www (+ localhost) | Browser origins allowed to call the gateway. |

Secrets (`wrangler secret put`):

```sh
cd workers/assets-gateway
pnpm wrangler secret put GATEWAY_SECRET     # same value registered for GATEWAY_CLIENT_ID
pnpm wrangler secret put TURNSTILE_SECRET   # Turnstile widget secret
```

## Frontend

The SPA calls same-origin `/api/assets-gw/...` (see `src/lib/assetsApi.ts`) and drives the
session via `src/lib/turnstile.ts`. Set the Turnstile **site** key in the app env:

```
VITE_TURNSTILE_SITE_KEY=<turnstile site key>
```

The matching secret is `TURNSTILE_SECRET` above. In the Turnstile widget settings, allow the
hostnames in `TURNSTILE_HOSTNAMES`.

## Deploy

```sh
cd workers/assets-gateway && pnpm install && pnpm deploy
```

`wrangler.toml` scopes the route to `/api/assets-gw/*`; every other path on the zone is
untouched and keeps going to the Vercel origin.

## Local dev

The Vite dev server proxies `/api/assets-gw` (see `vite.config.ts`). By default it points at the
deployed gateway; to run the gateway locally instead:

```sh
cd workers/assets-gateway
pnpm wrangler dev --var REQUIRE_TURNSTILE:false --var COOKIE_SECURE:false   # http://localhost:8788
# then, in the repo root:
ASSETS_GW_DEV_ORIGIN=http://localhost:8788 pnpm dev
```

## Verify

```sh
curl -s -o /dev/null -w '%{http_code}\n' https://renderdragon.org/api/assets-gw/__session          # 401
curl -s -o /dev/null -w '%{http_code}\n' https://renderdragon.org/api/assets-gw/categories         # 401 (no session)
```
