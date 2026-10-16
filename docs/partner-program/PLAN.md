# Partner Program — implementation plan

## Goals

1. Let an approved partner add **"Sign in with RenderDragon"** to their app.
2. Give partners **read-only** access to the asset catalog.
3. Give partners a **dashboard** to manage their app, its users, and usage statistics.
4. Keep the whole thing **invite-only, verified, and transparent** to end users.

## Non-goals (for now)

- Public/self-serve developer signup.
- Write access to assets for partners.
- Custom OAuth scopes (blocked upstream — see below).
- Billing/monetization, tiering, or a marketplace.

## Key constraint that shapes everything

Supabase OAuth scopes are limited to `openid email profile phone`, and OAuth **access tokens
carry full user privileges** (RLS decides what they can read). Custom scopes are "planned" but
not available. Therefore:

- The **consent screen is ours** and is authoritative for *what we tell the user is shared*.
- **Granular partner permissions** (e.g. `favourites:read`, `stats:read`) live in **our** registry
  and are enforced by **our** API/RLS using the token's `client_id` claim — never assumed from
  the OAuth `scope` string.
- We treat the OAuth layer as *identity only*; data authorization is ours.

## Architecture

```
Partner app ──"Sign in with RenderDragon"──► Supabase Auth /oauth/authorize
      │                                            │ (validates client, PKCE)
      │                                            ▼
      │                              RenderDragon consent UI  /oauth/consent
      │                              (SPA page: shows app + shared fields)
      │                                            │ approve / deny
      │                                            ▼
      │                              Supabase Auth issues code → partner exchanges
      │                                     for access + refresh (+ ID) token
      ▼
Partner uses token ──► RenderDragon data endpoints ──► enforce via client_id + our registry + RLS
Partner server ──────► read-only Asset API (HMAC key) ──► api.codersoft.xyz (scoped, GET-only)

RenderDragon dashboard (SPA, /partners/dashboard)
      ├─ app settings (redirect URIs, branding, requested permissions)
      ├─ users (consents for THIS app only)
      ├─ API keys (read-only)
      └─ stats (sign-ins, users, calls, top assets)
```

Components:

| Component | Lives in | Notes |
| --- | --- | --- |
| OAuth/OIDC protocol | Supabase Auth | OAuth 2.1 server; asymmetric signing for OIDC |
| Consent UI | RenderDragon SPA | `/oauth/consent` (authorization path) |
| Partner registry | Supabase (Postgres) | orgs, apps, permissions, consents, keys metadata |
| Partner dashboard | RenderDragon SPA | `/partners/dashboard` |
| Read-only Asset API | `workers/api-router` | existing HMAC keys + scope/method enforcement |
| Usage analytics | `workers/analytics` | events attributed by `client_id` / key id |
| Webhooks (later) | worker | signed HMAC, reuse existing signing scheme |

## Phases

### Phase 0 — Enabling + pilot (manual)
- Enable `[auth.oauth_server]`, set `authorization_url_path = /oauth/consent`, enable
  asymmetric JWT signing, disable dynamic client registration.
- Build the consent page ([`oauth-consent.md`](./oauth-consent.md)).
- Register 1–2 pilot partners' OAuth clients by hand in the Supabase dashboard.
- Deliverable: a real partner can complete "Sign in with RenderDragon" end to end.

### Phase 1 — Registry + invite
- `partner_orgs`, `partner_apps`, permissions; invite + verification flow (manual approve).
- Provision OAuth client via Supabase admin API on approval; map `client_id ↔ org/app`.
- Read-only API keys issued and registered in the router's Durable Object.
- Deliverable: onboarding without touching the Supabase dashboard by hand.

### Phase 2 — Dashboard: users + revocation
- Partner dashboard app settings, users list (consented users of this app only), revoke.
- User-facing "Connected apps" page + revoke.
- Deliverable: partners can manage their users; users can revoke.

### Phase 3 — Statistics
- Emit per-app usage events; aggregate; expose partner-scoped stats endpoints + dashboard charts.
- Deliverable: sign-ins, active users, calls by endpoint, top assets, quota.

### Phase 4 — Extras
- Webhooks (signed), SDK + OpenAPI, sandbox env, partner directory, badge, embeddable widget.

## Deliverables checklist (when building)

- [ ] Supabase OAuth server config + asymmetric keys + RLS policies for `client_id`.
- [ ] `/oauth/consent` page + consent records + revocation.
- [ ] `/partners` marketing page ([`page-benefits.md`](./page-benefits.md)).
- [ ] `/partners/dashboard` (app, users, keys, stats).
- [ ] Partner registry schema + RLS + admin provisioning flow.
- [ ] Scoped read-only keys in `workers/api-router` (scopes, method allowlist, rate limit).
- [ ] Analytics events + partner stats API.
- [ ] Docs for partners (quickstart, scopes, error codes, attribution).

## Risks & mitigations

| Risk | Mitigation |
| --- | --- |
| Custom OAuth scopes unavailable | Own permission registry; enforce in API + RLS; disclose on consent screen. Document on partner docs which fields are shared and why. |
| OAuth tokens are full-privilege | Tight RLS keyed on `client_id`; API re-checks permissions; audit logs; least-privilege grants. |
| Supabase OAuth is beta / could change | Wrap in a thin abstraction (a `partnerAuth` module) so a self-hosted OIDC provider (e.g. Ory Hydra on e3) can replace it without touching the dashboard/consent UI contracts. |
| MAU billing impact | Track OAuth MAUs; note on the page that sign-ins count toward MAU. |
| Consent fatigue / unclear disclosure | One screen, exact field list, extras only if requested, per-app "remember" via Supabase auto-approve. |
| Partner abuse / scraping | Verified-only, read-only, per-key rate limits, audit, revocable instantly. |
| One-app-per-org blocks dev/staging | Decide: allow a linked *test* redirect + test key on the same app, or a hidden second client not shown to users (see open questions). |

## Open questions

1. **Dev vs prod**: 1 org = 1 app is firm — but do we allow a separate test client/redirect for
   development, or a sandbox mode on the same app?
2. **Consent auto-approve**: rely on Supabase's "already consented" behaviour, or always show
   the screen? (Recommend: show once per app, then auto-approve, with a "not you?" path.)
3. **Which extras can partners request?** Proposed initial set: `profile`, `email`,
   `favourites:read`, `uploads:read` (their own users' uploads), `stats:read`. Confirm.
4. **Stats retention window** and whether partners can pull raw event exports.
5. **Attribution requirements** wording for the Asset API license.
6. **Partner directory**: opt-in? logo/link moderation rules?
7. **Revocation semantics**: revoking an app's access — invalidate refresh tokens too? (Supabase
   token revocation behaviour to verify.)
