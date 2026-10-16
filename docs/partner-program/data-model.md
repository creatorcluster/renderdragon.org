# Data model

All partner data lives in Supabase (Postgres) with RLS. OAuth tokens carry a `client_id` claim;
RLS uses it (plus our consent records) to scope access. Partners never query these tables
directly — the dashboard reads them through our API/RLS with the partner's own org context.

## Tables

### `partner_orgs`
| Column | Type | Notes |
| --- | --- | --- |
| `id` | uuid pk | |
| `name` | text | display / legal name |
| `verified` | boolean | set by us on approval |
| `verified_domain` | text | domain-verified for badge |
| `status` | text | `invited` \| `active` \| `suspended` |
| `contact_email` | text | |
| `created_at` / `updated_at` | timestamptz | |

Constraint: a `partner_orgs` row is created only through our invite/approval flow.

### `partner_apps` (one per org)
| Column | Type | Notes |
| --- | --- | --- |
| `id` | uuid pk | |
| `org_id` | uuid fk | **UNIQUE** → 1 org = 1 app |
| `supabase_client_id` | text unique | Supabase OAuth client |
| `name` | text | shown on the consent screen |
| `description` | text | |
| `logo_url` | text | shown on the consent screen |
| `redirect_uris` | text[] | mirrored from Supabase |
| `type` | text | `public` \| `confidential` |
| `token_auth_method` | text | e.g. `client_secret_basic` |
| `permissions` | text[] | requested capabilities (our registry) |
| `status` | text | `active` \| `suspended` |
| `created_at` / `updated_at` | timestamptz | |

### `partner_consents`
One row per (app, user) authorization; the source of truth for "who signed in through this app".

| Column | Type | Notes |
| --- | --- | --- |
| `id` | uuid pk | |
| `app_id` | uuid fk | |
| `user_id` | uuid fk → auth.users | |
| `granted_permissions` | text[] | subset of app permissions the user approved |
| `granted_at` | timestamptz | |
| `revoked_at` | timestamptz null | |
| `last_seen_at` | timestamptz | updated on token use |

**Visibility rule:** a partner can only see users in `partner_consents` for **their own app** and
only the fields those users consented to.

### `partner_api_keys` (read-only asset API)
| Column | Type | Notes |
| --- | --- | --- |
| `id` | uuid pk | |
| `org_id` | uuid fk | |
| `key_id` | text unique | public identifier sent as `X-Auth-Client` |
| `label` | text | |
| `scopes` | text[] | e.g. `assets:read` |
| `rate_limit_per_min` | int | |
| `status` | text | `active` \| `revoked` |
| `last_used_at` | timestamptz | |
| `created_at` / `revoked_at` | timestamptz | |

The **secret** is never stored here — it is registered in the router's Durable Object
(`workers/api-router`), and Postgres stores only the key id + label — no secret or hash.

### `partner_requests` (invite/application queue)
| Column | Type | Notes |
| --- | --- | --- |
| `id`, `org_name`, `contact_email`, `use_case`, `status`, `reviewed_by`, `created_at` | | intake for our review; only approved entries become `partner_orgs` |

## RLS outline

- `partner_orgs` / `partner_apps` / `partner_api_keys` / `partner_consents`: readable by the
  owning partner's users (via an org-membership table) and by RenderDragon admins; never public.
- End-user visibility of their own consents via `partner_consents.user_id = auth.uid()` for the
  "Connected apps" page.
- For user-data endpoints called with an OAuth token: policies check
  `auth.jwt() ->> 'client_id'` maps to a `partner_apps` row with the needed permission
  **and** a non-revoked `partner_consents` row for the requesting `user_id`.

## Analytics events

Emitted by `workers/api-router` (and the consent/token hooks) and aggregated by
`workers/analytics`.

`partner_usage_events` (append-only, aggregated for the dashboard):
| Column | Notes |
| --- | --- |
| `ts` | |
| `app_id` / `key_id` | attribution (from `client_id` claim or key id) |
| `user_id` | nullable (user-context calls) |
| `type` | `sign_in` \| `token_issued` \| `api_call` \| `download` \| `consent_granted` \| `consent_revoked` |
| `endpoint` | for `api_call` |
| `status` | |
| `latency_ms` | |

Retention and raw-export policy: see `dashboard-stats.md`.

## Notes

- Keep the OAuth client mapping in one place so a future migration off Supabase OAuth (e.g. to a
  self-hosted OIDC provider) only changes how `supabase_client_id` is populated.
- All admin/provisioning actions are audited (`audit_log`) since access is invite-only and
  manual.
