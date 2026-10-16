# OAuth + consent screen

## Supabase OAuth 2.1 server configuration

```toml
# supabase/config.toml
[auth.oauth_server]
enabled = true
authorization_url_path = "/oauth/consent"
allow_dynamic_registration = false   # invite-only: we register clients ourselves
```

- **Asymmetric signing (RS256/ES256) is required** for OIDC/ID tokens. Enable it, since partners
  will validate ID tokens via the JWKS endpoint.
- OAuth sign-ins count toward the project's **MAU**.
- Client registration via the Supabase dashboard or admin SDK. We disable dynamic registration
  because access is invite-only.

## Client registration (1 org = 1 app)

On approval, we register exactly one Supabase OAuth client per organization and store the
mapping:

| Supabase client | Ours |
| --- | --- |
| `client_id` | `partner_apps.supabase_client_id` |
| `redirect_uris` | `partner_apps.redirect_uris` |
| `client_type` (public/confidential) | `partner_apps.type` |
| `token_endpoint_auth_method` | `partner_apps.token_auth_method` |

- **Confidential** clients (server-side) get a client secret (stored hashed by Supabase; we
  never store it).
- **Public** clients (SPA/mobile) use PKCE, no secret.

## Flow (what the partner integrates)

1. Partner redirects to `https://<project>.supabase.co/auth/v1/oauth/authorize?client_id=…&
   redirect_uri=…&response_type=code&code_challenge=…&scope=openid email profile&state=…`.
2. Supabase validates and 302s the user to our `authorization_url_path` with `authorization_id`.
3. Our SPA route `/oauth/consent`:
   - If the user isn't signed in → send to our sign-in, preserving `authorization_id`.
   - `supabase.auth.oauth.getAuthorizationDetails(authorization_id)` → client name, redirect URI,
     requested scopes, and (our addition) the partner app + its requested permissions.
   - Render the consent screen (below).
   - On approve → `approveAuthorization(authorization_id)`; on deny → `denyAuthorization(...)`;
     redirect to the returned `redirect_url`.
4. Supabase issues the code; the partner exchanges it for access + refresh (+ ID) token.

## Consent screen — required content

The screen must be unambiguous about **the exact data shared** and **who** is asking. It shows:

**The requester**
- Partner app **name**, **logo/icon**, description.
- Owning org name + **Verified partner** badge.
- The redirect URI / domain the user will be sent back to.

**The data that will be shared** (only what the app requested). Rendered as a field-by-field list
with icons, not vague scope names:

| Group (permission) | Shown when requested | Fields displayed to the user |
| --- | --- | --- |
| Basic profile (`profile`) | always (part of sign-in) | **Avatar/icon**, **display name**, **username** |
| Email (`email`) | if requested | **Email address** and whether it's verified |
| Favourites (`favourites:read`) | if requested | The user's **favourited assets** (list) |

Rules:
- **Default sign-in** shows at least avatar + name + username; email/others appear only if the
  app requests them.
- Each requested extra is a separate line the user can read; nothing is bundled under an opaque
  label.
- Show a short plain-language sentence per item (e.g. "See the assets you have favourited").
- Links to TOS + Privacy. Buttons: **Approve** / **Deny**. A note that the user can revoke later
  from **Settings → Connected apps**.

## Mapping to real capabilities (important)

Supabase only supports `openid email profile phone`. We therefore:

- Send the standard `scope` to Supabase for token/ID-token content.
- Keep our own **`partner_apps.permissions`** registry as the authoritative request list, and drive
  the consent UI from it.
- Record `partner_consents` (app_id, user_id, granted permissions, timestamps) on approval.
- Enforce the granted permissions in **our** API + RLS using the token's `client_id` claim and the
  consent record — never trusting the `scope` string alone.

## Consent lifecycle

- **First time**: show the screen.
- **Already consented** (Supabase auto-approve) — still show a lightweight confirmation or skip,
  per the open question in `PLAN.md`.
- **Deny**: `denyAuthorization`, return the user to the partner with an error.
- **Revoke**:
  - User side: `/settings/connected-apps` lists apps + granted fields with a **Revoke** button.
  - Partner side: dashboard "remove user".
  - Revocation must invalidate the partner's refresh token (verify Supabase revocation support;
    otherwise call the admin revoke endpoint) and delete our `partner_consents` row.

## Edge cases

- Not signed in when hitting `/oauth/consent` → sign-in, then resume with same `authorization_id`.
- Signed in as the wrong account → allow "use a different account".
- Unknown/disabled `client_id` → error page, never fall through to approval.
- Missing/expired `authorization_id` → error page.
- Partner app in `suspended` state → block approval, show a message.
