# Public `/partners` page + benefit list

A separate marketing page (not the dashboard). Invite-only: the page sells the program and lets
people **request an invite**; it does not let anyone self-serve.

## Page sections

1. **Hero** — "Build with RenderDragon." One line: verified partners get sign-in, a read-only
   asset API, and a dashboard. CTA: **Request an invite** / **Partner docs**.
2. **Who it's for** — tools, bots, editors, studios, and services in the Minecraft creator
   ecosystem. Note it's invite-only and each partner is verified by us.
3. **Benefits** (cards — see list below).
4. **How it works** — 4 steps: request invite → we verify & approve → you get an OAuth app +
   read-only key → build with "Sign in with RenderDragon".
5. **Partner directory** — opted-in partners (logo, name, blurb, link).
6. **Trust & privacy** — exactly what's shared, on-screen consent, one-click revoke, read-only,
   least privilege.
7. **FAQ** — invite-only? cost? what data is shared? can I write assets? rate limits?
8. **Apply** — invite request form (`partner_requests`).
9. **Footer** — links to docs, TOS, privacy.

## Benefit list (final)

### Core
- **"Sign in with RenderDragon" (OAuth 2.1 / OIDC)** — standards-compliant; verify tokens via
  JWKS; PKCE.
- **Read-only Asset API** — the full catalog: resources, Minecraft icons, sounds, fonts, presets,
  with a catalog **version** endpoint for cheap, consistent caching.
- **Partner dashboard** — manage your app, see the users who signed in through it, and view
  statistics.
- **User management** — see and revoke the users who authorized your app (only your users, only
  consented fields).
- **Transparent consent** — users see exactly which fields are shared (avatar/icon, name,
  username, email, and any extras such as favourites).

### Developer platform
- **Signed webhooks** — catalog version changed, user revoked, new asset published.
- **OpenAPI spec + typed SDKs + sandbox fixtures.**
- **Bulk snapshots** and **stable, versioned API** with a deprecation policy and changelog feed.
- **Embeddable asset-browser widget** ("Powered by RenderDragon").
- **Per-key rate limits, IP allowlists, and audit logs.**

### Distribution & growth
- **Partner directory** listing + backlink.
- **"Built with RenderDragon" badge.**
- **Co-marketing**: blog feature, changelog shout-out, newsletter/Discord spotlight.
- **Early access** to new features and **new Minecraft-version asset packs**.
- **Priority support** via a private Discord channel.

### Trust
- **Verified partner badge** (domain-verified, manually reviewed).
- **Read-only, least-privilege, instantly revocable.**
- **Clear data-sharing disclosure** and user-side revocation.

*(No tiers and no pricing on the page — every partner is a verified partner. If support/marketing
asks for it later, add a note that the program is by invitation and free to approved partners.)*

## Copy notes / guardrails

- Don't overclaim: say "read-only", "invite-only", "verified". Never imply partners can write or
  that they can see all RenderDragon users.
- Always show the data-sharing example so applicants know what users will consent to.
- Mention that OAuth sign-ins count toward RenderDragon's auth usage only if we want to; likely
  omit from public copy.
