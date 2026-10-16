# Partner dashboard + statistics

Route: `/partners/dashboard` (signed-in partner org members only). Separate from the public
`/partners` page.

## Pages

### Overview
- App status (active/suspended), verified badge.
- Headline numbers: total sign-ins, unique users, API calls (30d), quota used.
- Quick links: docs, rotate key, request support.

### App settings
- Name, logo, description (these appear on the **consent screen** — changes are shown to users).
- Redirect URIs (validated; mirrored to the Supabase OAuth client).
- Requested **permissions** (from our registry): `profile`, `email`, `favourites:read`,
  `uploads:read`, `stats:read`. Adding an email/favourite permission changes the consent screen.
- Client type (public/confidential) and token auth method (read-only display).
- Danger zone: suspend app (RenderDragon-only), rotate client secret.

### Users
- The list of RenderDragon users who **authorized this app** (from `partner_consents`).
- Columns: avatar/icon, display name, username, email (only if `email` was consented),
  granted permissions, granted date, last seen, status.
- Actions: **revoke** a user's access (deletes the consent + invalidates their refresh token).
- Export (CSV/JSON) of consented users, limited to consented fields.
- **Privacy:** this page can only ever show users of *this* app and only the fields they
  approved. No access to RenderDragon's user base at large.

### Keys (read-only Asset API)
- Create/rotate/revoke read-only keys; secret shown once.
- Per key: scopes (`assets:read`), rate limit, `last_used_at`, usage sparkline.

### Stats
See below.

### Docs & support
- Quickstart, signing examples, error codes, consent/data-sharing reference, support contact /
  Discord channel.

## Statistics

| Metric | Definition | Source |
| --- | --- | --- |
| Sign-ins | completed consents / token issuances | `partner_usage_events` (`sign_in`, `token_issued`) |
| Unique users | distinct `user_id` per app | `partner_consents` |
| Active users | distinct users with a token use in the window | `partner_usage_events` |
| API calls | requests by `key_id` / `client_id` | router usage events |
| Calls by endpoint | breakdown over `/all`, `/category/*`, `/mcicons`, … | router |
| Error rate | non-2xx / total | router |
| p95 latency | per endpoint | router |
| Top assets/categories | most requested | router (endpoint + params) |
| Version checks | `/__version` hits vs refreshes | router |
| Downloads | asset download events (if instrumented) | router/analytics |
| Quota / rate-limit headroom | current usage vs limit | Durable Object counters |

- Time ranges: 24h / 7d / 30d / custom.
- Charts: line (calls, users), bar (top endpoints/assets), table (recent events).
- **Partner-scoped API**: `GET /partners/api/stats?range=30d` returns only the caller org's
  aggregates (RLS/org check).

## Data sources & plumbing

- **Sign-in / token events**: log from the consent page on `approveAuthorization`, and/or a
  Custom Access Token Hook that records `client_id` + `user_id` on token issuance.
- **API call events**: emit from `workers/api-router` after auth, keyed by `key_id`/`client_id`,
  into the existing analytics worker.
- Aggregation: pre-aggregate daily rollups so the dashboard queries are cheap; keep raw events
  for a bounded window.

## Retention & privacy

- Raw events: keep ~90 days (TBD); daily aggregates kept longer.
- Partners see only aggregate stats for their app plus their own consented-user list.
- User-level analytics respect consent: if a user revokes, associated `user_id` rows are removed
  or anonymized per policy.
- Export endpoints are org-scoped and rate-limited.
