# Read-only Asset API + security

## What partners get

- **Read-only** access to the asset catalog over `api.codersoft.xyz`.
- A dedicated **API key** (HMAC-signed requests, using the scheme already built for the router).
- Per-key **scopes** and **rate limits**, revocable instantly.

Partners do **not** get write access. Upload endpoints (`POST /api/assets`) are never granted to
partner keys.

## Endpoints (read-only scope `assets:read`)

| Path | Returns |
| --- | --- |
| `GET /all` | full catalog grouped by category |
| `GET /categories` | category list |
| `GET /category/:name` | one category |
| `GET /mcicons` | Minecraft icons |
| `GET /fonts` | fonts |
| `GET /__version` | catalog version (public; usable for cache validation) |

Only `GET`/`HEAD` are accepted for partner keys; everything else is rejected by the router.

## Enforcement in `workers/api-router`

Extend the existing auth layer (HMAC client registry in the Durable Object):

1. The client record gains `scopes: string[]` and `rateLimitPerMin`.
2. After signature verification, enforce:
   - **Method allowlist** — `GET`/`HEAD` only for `assets:read` clients.
   - **Path allowlist** — the endpoints above only; no `/api/assets` writes.
   - **Rate limit** — per key (and optionally per key+IP), counted in the Durable Object.
3. Attribution is logged as a usage event (`key_id`).

Because the router is the single chokepoint and the key registry already lives in a Durable
Object, scopes/limits are enforceable and revocable in one place with no redeploy.

## Key lifecycle

- Issued by RenderDragon on approval (partner dashboard "Keys" page can show `last_used_at` and
  allow rotation).
- Secret shown **once**; stored only in the router's Durable Object (never in Postgres).
- Rotation = register a new key, revoke the old.
- Revocation is immediate (Durable Object is strongly consistent).

## OAuth tokens vs API keys

Two distinct things, used for different jobs:

| | API key (HMAC) | OAuth token |
| --- | --- | --- |
| Who | partner's **server** | a RenderDragon **user** via the partner's app |
| Purpose | read the catalog | read that user's consented data |
| Scope | `assets:read` | token's `client_id` + consent record |

User-data endpoints (favourites, the user's uploads, per-user stats) require an **OAuth token**
whose `client_id` maps to a partner app that has that permission, plus a non-revoked
`partner_consents` row for `user_id`. The token's `scope` string is **not** trusted for this —
we check our registry + consent.

## Attribution & license

- Partners must display "Assets provided by RenderDragon" (wording TBD) and link back.
- `GET /__version` lets partners cache the catalog and only refresh when it changes
  (fewer calls, consistent snapshots).

## Threat model additions

- **Key leak** → revoke per key; scopes + rate limits bound the blast radius; read-only.
- **Scraping** → verified partners only, per-key limits, audit; catalog is public-ish by nature,
  so the goal is abuse control, not secrecy.
- **Token replay / forgery** → OAuth tokens are asymmetric JWTs verified via JWKS by partners;
  for our API, the `client_id` claim is verified by Supabase-issued signatures (or introspected),
  and the consent record is checked server-side.
- **Privilege escalation** → never derive authorization from the OAuth `scope` string; always from
  `partner_apps.permissions` + `partner_consents` + RLS.

## Partner-facing docs to produce

- Quickstart (get a key, first request), signing examples (Node/Python), error codes,
  rate-limit headers, `__version` caching, attribution rules, and the list of shared user fields.
