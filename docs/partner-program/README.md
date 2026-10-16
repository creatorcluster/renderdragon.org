# RenderDragon Partner Program — plan

**Status: PLAN ONLY. Nothing here is built yet. Do not implement until explicitly told to.**

An invite-only program where hand-picked, verified partners get:

- **"Sign in with RenderDragon"** (OAuth 2.1 / OIDC) so partners can authenticate RenderDragon
  users inside their own services and apps.
- A **read-only Asset API** key scoped to the asset catalog.
- A **partner dashboard**: manage their app, see the users who signed in through it, and view
  statistics.
- A transparent **consent screen** that lists exactly what is shared (avatar/icon, name, email,
  and any extras the app requests, e.g. favourites).

## Program rules (non-negotiable)

- **Invite-only.** Only people we trust are given access; there is no self-serve signup and no
  public client registration. Every partner is reviewed and verified by us.
- **No tiers.** Every partner is a verified partner with the same footing.
- **1 organization = 1 OAuth app.**
- **Least privilege, read-only by default.** Partners never get write access to the catalog.
- **Transparency.** Users see exactly which fields are shared and can revoke at any time.

## Platform decision

**Use Supabase Auth's OAuth 2.1 server** as the protocol backbone (no custom auth server). See
[`oauth-consent.md`](./oauth-consent.md) for the caveats that shape the rest of the design.

## Read order

1. [`PLAN.md`](./PLAN.md) — scope, architecture, phases, risks, open questions.
2. [`oauth-consent.md`](./oauth-consent.md) — the OAuth flow and the consent screen spec.
3. [`data-model.md`](./data-model.md) — tables, RLS, analytics events.
4. [`api-security.md`](./api-security.md) — read-only asset API, keys, scopes, enforcement.
5. [`dashboard-stats.md`](./dashboard-stats.md) — partner dashboard pages and metrics.
6. [`page-benefits.md`](./page-benefits.md) — the public `/partners` page and final benefit list.
