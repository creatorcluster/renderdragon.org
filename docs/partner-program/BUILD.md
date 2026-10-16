# Partner Program — build notes

Status: **built**. Pages, data layer, schema, read-only API scoping and key
provisioning are in place. Remaining items are deployment/secrets (below).

## What shipped

### Supabase (applied)
- `supabase/migrations/20261015120000_partner_program.sql` — `partner_orgs`,
  `partner_members`, `partner_apps` (one per org, `unique (org_id)`), `partner_consents`
  (stores the approved profile snapshot), `partner_api_keys`, `partner_requests`,
  `partner_usage_events`, all with RLS.
- `supabase/migrations/20261015120100_partner_app_public.sql` — public
  `partner_app_public(client_id)` lookup for the consent screen + user consent insert policy.
- Edge Function `partner-keys` (deployed) — issues/revokes read-only keys and registers the
  secret in the router's Durable Object.

### Frontend
- There is **no public `/partners` page**; partners are handled through contacts, not a
  self-serve page. `/partners` does not exist (404). The private `/partners/dashboard`
  remains and is reachable only via a "Partner dashboard" link in the account menu for
  users who belong to a partner org.
- `/partners/dashboard` — Overview / App / Users / Keys / Stats.
- **First-time onboarding wizard** on the dashboard (shown until `partner_apps.onboarded_at`
  is set): 2 steps (app setup → permissions & first key). Motion comes from the
  `transitions-dev` skill (`jakubantalik/transitions-dev`, installed at
  `~/.agents/skills/transitions-dev`): page side-by-side between steps, text-states-swap on the
  title, success-check finale. Snippets + tokens live in `src/styles/transitions.css`.
- `/oauth/consent` — the consent screen; lists every field shared, approve/deny, records consent.
- Modules: `src/lib/partners/{permissions,client,oauthConsent,provisioning}.ts`
  (`permissions.ts` is the single source of truth for what is requested and shown).

### Router (`workers/api-router`)
- Client registry now carries `scopes` and `rate_limit_per_min`.
- Partner keys with `assets:read` are enforced read-only and limited to
  `/all`, `/categories`, `/category/*`, `/mcicons`, `/fonts`; per-key rate limiting (429) in
  the Durable Object.

## To finish (owner actions)

1. **Router**: `cd workers/api-router && pnpm wrangler secret put ADMIN_KEY` (long random).
2. **Edge Function secret**: set `ROUTER_ADMIN_KEY` to the same value at
   https://supabase.com/dashboard/project/bmywdrwjdqmrkafhiuwn/settings/functions, then re-run
   `sbase create-edge-function-secret --name ROUTER_ADMIN_KEY` to confirm `stored: true`.
3. **OAuth server**: enable it (Authentication → OAuth Server), set the authorization path to
   `/oauth/consent`, enable asymmetric JWT signing (RS256/ES256), disable dynamic registration.
   Register each approved partner's client and set `partner_apps.supabase_client_id`.
4. **Provision a partner**: insert a `partner_orgs` row, a `partner_members` row for the owner,
   and a `partner_apps` row (with permissions + redirect URIs + client id).
5. Deploy the three frontend routes with the normal site deploy.

## Notes / follow-ups
- The consent flow prefers `supabase.auth.oauth.*` and falls back to the documented GoTrue REST
  routes; update `@supabase/supabase-js` (installed tree is stale) before relying on it.
- `partner_usage_events` has no writer yet — the router should emit usage events per partner key
  to populate the Stats charts (currently shows zeros until then).
- Local `pnpm install` is stale (`@fontsource/montserrat`, `@supabase/auth-js` mismatch); run a
  clean install before building the site locally.
