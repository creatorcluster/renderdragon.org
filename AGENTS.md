# AGENTS.md

## Which checkout to work in

- **Canonical:** the worktree **`/Users/techspot/renderdragon-redesign`** (branch `redesign/app`)
  of the main repo `/Users/techspot/renderdragon.org`. Do your work here.
- `/Users/techspot/reddragon/renderdragon.org` is a **separate, stale clone** (behind by many
  commits). Do not work in it; it caused a lot of "wrong code / wrong port" confusion.
- `/Users/techspot/renderdragon.org` (main checkout) is a worktree on `feat/admin-panel-redesign`.
- `origin` = `Coder-soft/renderdragon.org` (fork), `upstream` = `creatorcluster/renderdragon.org`.

## Repository layout / pull requests

This checkout is the `Coder-soft/renderdragon.org` fork. The canonical upstream for this project is
**`creatorcluster/renderdragon.org`** (base branch `main`), which itself forks `Yxmura/renderdragon`.

Open every pull request against upstream **`creatorcluster/renderdragon.org` `main`**, not against the
`Coder-soft` fork. Push the branch to `origin` (the fork) and open a cross-repository PR:

```sh
git push -u origin <branch>
gh pr create --repo creatorcluster/renderdragon.org --base main --head Coder-soft:<branch>
```

GitHub's native linked-branch feature (`gh issue develop`) does not work in the fork, so reference the
relevant fork issue by URL in the PR body instead. There is an existing open redesign+partners PR
(`Coder-soft:redesign/app` → `creatorcluster:main`); pushing to that branch updates it.

## Dev environment

- `pnpm dev` runs **Vite on :8080** plus an **Express server on :3000** (`server.js`, which adapts the
  `api/*.js` Vercel handlers and `/api/uploadthing`). Run **one** dev server only.
- **Dev assets bypass the gateway**: `vite.config.ts` proxies `/api/assets-gw/*` straight to the public
  upstreams. Only production goes through `gateway.codersoft.xyz`.
- Commands: `pnpm lint`, `pnpm exec tsc -b`, `pnpm exec vite build`.
  - `tsc` has **pre-existing errors** in `ProfileEditor`/`useCreatorPacks`/`useProfile`/`migrateResources`/
    `AdminResourcesManager`/`chart`/`Analytics` — ignore them; do not "fix" unrelated ones.
  - If deps look stale/wrong (missing module, version mismatch): `pnpm install --frozen-lockfile --config.confirmModulesPurge=false`.
- `/account` = Connected apps; `/partners/dashboard` = partner dashboard; `/oauth/consent` = consent screen.

## Infrastructure map

- **Supabase** project `bmywdrwjdqmrkafhiuwn`. Schema/RLS in `supabase/migrations/*.sql` (all applied).
  Edge Function `partner-keys` (key provisioning). Auth config via Management API.
- **Cloudflare account** "Powernplant101@gmail.com's Account" (id `c6bc31479acbdc8f997bcfa3cacb42b4`).
  Zone **`codersoft.xyz` is in this account; `renderdragon.org` is in a DIFFERENT Cloudflare account** —
  that's why the browser gateway lives on `gateway.codersoft.xyz` instead of a `renderdragon.org` route.
- **Workers** (sources in `workers/`):
  - `codersoft-api-router` → **`api.codersoft.xyz`** (Durable Object `AuthStore`). Verified request auth,
    scopes/rate limits, ordered origin pools with per-origin circuit breaking (`RESOURCES_ORIGINS` /
    `ASSETS_ORIGINS`), `__version`, `__admin/*`.
  - `codersoft-assets-gateway` → **`gateway.codersoft.xyz`** (holds `GATEWAY_SECRET`, minted browser
    sessions, CORS + `SameSite=None` cookies, proxies to the router).
- **e3** (ssh alias `e3`, `home@192.168.100.30`, Debian): systemd service **`hamburger-api`** on
  `127.0.0.1:8788`, source `/home/home/assets-api/server.mjs`, env `/etc/hamburger-api.env`. It builds
  the asset catalog from a local clone `/home/home/assets-renderdragon` (of
  `Renderdragonorg/resources_renderdragon`) and serves the **files from disk** (not GitHub). Exposed via
  the Cloudflare Tunnel as **`hamburger.codersoft.xyz`**.
- **Data flow:** browser → `gateway.codersoft.xyz` (session, signs) → `api.codersoft.xyz` (verifies) →
  e3 `hamburger.codersoft.xyz` (resources catalog + files) / `assets-api-worker` (uploads) → on e3 down,
  fall back to `hamburger-api`/`assets-api-worker`.

## Auth model (why "network manipulation" can't bypass)

- The router requires **HMAC-SHA256 signed requests** (`X-Auth-Client/Timestamp/Nonce/Signature`) for
  every endpoint except `OPTIONS`, `/__router/health`, `/__version`, `/__admin/*`. Canonical string:
  `v1\nMETHOD\nPATH?QUERY\nCLIENT_ID\nTIMESTAMP\nNONCE\nSHA256_HEX(BODY)`. ±300s window; nonce replay
  cache (Durable Object) for writes.
- **Partner keys** carry scopes (e.g. `assets:read`) and rate limits; read-only + path-limited.
- **e3** verifies the router's `X-E3-*` signature with `E3_SHARED_SECRET` (same canonical string, client
  id `api-router`).
- **Supabase OAuth 2.1 server** is enabled (`site_url=https://renderdragon.org`,
  `oauth_server_authorization_path=/oauth/consent`, dynamic registration off). Consent notes below.

## Secrets (NAMES ONLY — never print, echo, or commit values)

- Router Worker: `ADMIN_KEY`, `E3_SHARED_SECRET`.
- Gateway Worker: `GATEWAY_SECRET`, `TURNSTILE_SECRET`; var `SUPABASE_ANON_KEY` (publishable, not secret).
- Edge Function `partner-keys`: `ROUTER_ADMIN_KEY` (= the router's `ADMIN_KEY`).
- e3: `/etc/hamburger-api.env` → `E3_SHARED_SECRET`, `WEBHOOK_SECRET`.
- GitHub webhook on `Renderdragonorg/resources_renderdragon` → `WEBHOOK_SECRET`.
- Frontend `.env`: `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY`; production also needs
  `VITE_TURNSTILE_SITE_KEY`.
- Tooling creds: `~/.config/sbase/.env` (`SBASE_ACCESS_TOKEN`), `~/.wrangler/config/default.toml`
  (Cloudflare OAuth token). e3 root password is documented in the global `e3-server` skill.

## Partner program model

- Invite-only. **1 organization = 1 OAuth app** (`partner_apps.org_id` unique).
- Permissions live in **`src/lib/partners/permissions.ts`** (currently `profile`, `email`,
  `favourites:read`) — the single source of truth driving the consent screen, the dashboard, and API
  scopes. Add/remove there and it propagates everywhere.
- `partner_consents` stores the approved profile snapshot; the user-facing **Connected apps** section on
  `/account` reads the `get_my_connected_apps()` RPC and revokes via `partner_consents.revoked_at`.
- The consent page only records a consent when the OAuth client maps to a
  `partner_apps.supabase_client_id` (via the `partner_app_public` RPC). A raw OAuth client that isn't a
  provisioned partner app won't appear in Connected apps.
- Register partner/clients: `POST /auth/v1/admin/oauth/clients` (service role). Delete demo clients when
  done.

## Operational pitfalls (learned the hard way)

- **Cloudflare bot protection** returns `1010` for clients with no/blocked `User-Agent`. Real clients send
  one; python-urllib is blocked.
- **wrangler OAuth token expires**; running any `wrangler` command refreshes it. The token has **no DNS
  scope** — create DNS records with `cloudflared tunnel route dns <tunnel-id> <hostname>` on e3 (uses
  `~/.cloudflared/cert.pem`), not the CF API.
- **sbase / ssh sudo:** never feed the root password and a `bash -s` heredoc down the same stdin (sudo eats
  it). Stage the script to a file and run `echo root | sudo -S -p "" bash /tmp/x.sh`.
- **React StrictMode** double-invokes effects in dev — a one-time request (OAuth authorization) gets
  consumed twice and 400s. Guard with a ref (`startedRef` in `OAuthConsent.tsx`).
- **Supabase OAuth consent endpoints** (`/oauth/authorizations/*`) require the **legacy anon JWT** as the
  `apikey` header (the `sb_publishable_…` key is rejected there). Confidential clients authenticate at
  `/oauth/token` with **`client_secret_basic`**. Consent POST body is `{ "action": "approve"|"deny" }`.
- **e3 powers off nightly 03:00–05:00 PKT** (RTC wake 05:00), so the router falls back to the Cloudflare
  workers. While e3's catalog is empty (e.g. mid-clone) it returns `503` so the router also falls back.
- **Avatars:** third-party hosts get hidden by ad/tracker blockers — served same-origin via `/api/avatar`
  (`api/avatar.js` + the `server.js` route), and the client rewrites URLs with `toDisplayAvatarUrl`.
- **Assets in dev bypass the gateway**; production uses `gateway.codersoft.xyz`.
- **This Mac's tooling:** `jq` is NOT installed (parse with `python3`); `python3` lacks a CA bundle (use an
  unverified `ssl` context, or just `curl`); in zsh never `echo "$JSON"` (interprets escapes) — use
  `printf '%s'`.
- **Design language:** the redesign `index.css` zeroes every radius
  (`[class*="rounded-"]:not(.rounded-full){border-radius:0!important}`) and uses `chamfer`; avoid `rounded-*`
  corners. Colors/type come from the token system (dark, primary purple, Geist/Montserrat).
- **Multi-checkout port confusion** is real — keep a single dev server and kill strays on :8080–:8084.

## Deploy & verify

```sh
# Workers
cd workers/<api-router|assets-gateway> && pnpm install --ignore-workspace && pnpm exec wrangler deploy

# SQL migration
sbase apply-migration --project-id bmywdrwjdqmrkafhiuwn --name <name> --file <path.sql>

# Edge Function
sbase deploy-edge-function --project-id bmywdrwjdqmrkafhiuwn --name partner-keys \
  --file index.ts=supabase/functions/partner-keys/index.ts --entrypoint-path index.ts

# e3 assets service (after editing /home/home/assets-api/server.mjs or credits.json)
ssh e3 'echo root | sudo -S -p "" systemctl restart hamburger-api'

# Health
curl https://api.codersoft.xyz/__router/health
curl https://gateway.codersoft.xyz/__version
curl https://hamburger.codersoft.xyz/__health
```

- **Auto-update:** pushing to `Renderdragonorg/resources_renderdragon` fires its webhook →
  `https://hamburger.codersoft.xyz/__update` (HMAC-verified) → `git pull` + rebuild the catalog.
- **Signed-request check:** mint a key via the `partner-keys` Edge Function, then sign
  `v1\nGET\n/all\n<clientId>\n<ts>\n<nonce>\n<sha256(body)>` (HMAC-SHA256 hex) into `X-Auth-*` and call
  `api.codersoft.xyz/all`; check the `x-api-router-upstream` header (`e3` vs `fallback`).
- **Asset pipeline:** catalog = dir tree of `Renderdragonorg/resources_renderdragon`; item fields
  `{id,title,credit,filename,ext,url,size,subcategory}`. Credits come from the site's resource exports
  (by repo path/filename) plus the `<name>__<credit>` filename convention (`credits.json` on e3). File
  `url`s point at `hamburger.codersoft.xyz/<path>`.

## Still-open / config-only (as of last touch)

- `VITE_TURNSTILE_SITE_KEY` must be set in the deploy env for anonymous asset sessions (logged-in users
  bypass Turnstile via their Supabase token).
- OIDC asymmetric signing keys are not yet enabled in Supabase. `standardScopesFor` requests
  `openid` (per `oauth-consent.md`), which needs RS256/ES256 signing keys enabled before ID tokens work.
- Demo OAuth clients should be deleted.
- The site must be deployed from this branch for production to call the gateway.
