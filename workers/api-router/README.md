# codersoft-api-router

Cloudflare Worker serving `https://api.codersoft.xyz`. Every endpoint is **authenticated**:
a request must carry a valid HMAC-SHA256 signature (see below). It routes each request to an
ordered pool of origins and fails over automatically.

| Group | Paths | Pool (first is primary) |
| --- | --- | --- |
| assets | `/api/assets` (upload/list) and anything not matched below | `assets-api-worker.powernplant101-c6b.workers.dev` |
| resources | `/categories`, `/category/*`, `/all`, `/fonts`, `/mcicons*` | `hamburger.codersoft.xyz` (e3), then `hamburger-api.powernplant101-c6b.workers.dev` |

Pools are set with `RESOURCES_ORIGINS` / `ASSETS_ORIGINS` (comma-separated, ordered). Each
request tries the origins in order, skipping any recently failed one, and returns the first
success. An origin that fails the failover probe (no first byte within `PRIMARY_TIMEOUT_MS`)
or returns 5xx is marked down for `FAILOVER_COOLDOWN_MS` and retried last. Only the probe is
time-boxed, so the chosen origin's response streams in full. A `502` is returned only when
every origin fails. `GET /__router/health` reports per-origin state.

```
browser → renderdragon.org/api/assets-gw/*   (workers/assets-gateway, holds the secret)
        → api.codersoft.xyz                   (this Worker: verifies the signature)
        → e3 / fallback workers               (this Worker signs to e3; e3 rejects anything else)
```

## Auth model

Two independent checks protect every request:

1. **Caller authentication (this Worker).** The caller signs the request with an HMAC-SHA256
   secret; the Worker verifies it against the client registry in a Durable Object.
2. **e3 origin authentication.** When proxying to e3, the Worker adds its own signature so e3
   can reject traffic that did not come through it.

`Origin`, `Referer`, IP, and every other caller-controlled header are **not** trusted.

### Signed request

Headers:

| Header | Value |
| --- | --- |
| `X-Auth-Client` | client id |
| `X-Auth-Timestamp` | unix seconds (must be within ±300s of the Worker clock) |
| `X-Auth-Nonce` | random ≥ 16 bytes, hex (single-use when replay protection applies) |
| `X-Auth-Signature` | hex HMAC-SHA256 of the canonical string |

Canonical string — six lines joined by `\n`:

```
v1
<METHOD>
<PATH_WITH_QUERY>
<CLIENT_ID>
<TIMESTAMP>
<NONCE>
<SHA256_HEX(BODY)>
```

For a bodyless request (GET/HEAD), `SHA256_HEX(BODY)` is the SHA-256 of the empty string
(`e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855`).

`PATH_WITH_QUERY` is exactly the path the router sees, e.g. `/category/mcicons?x=1`.

### Replay protection (`REPLAY_PROTECTION` var)

- `writes` (default): the nonce is stored (single-use) for non-GET/HEAD requests only. This
  keeps Durable Object writes proportional to uploads rather than to every read, so the free
  plan is not exhausted by browsing. Reads rely on the ±300s timestamp window.
- `all`: store a nonce for every request.
- `off`: timestamp window only.

Nonces live in the `AuthStore` Durable Object (SQLite), so the check-and-insert is atomic and
a replayed signature is rejected with `401 replayed_nonce`.

## Catalog version (keeps Turnstile challenges rare)

`GET /__version` is **public** (no auth, no session). It returns `{ version, generatedAt }`,
where `version` is a hash of the upstream `VERSION_SOURCES` (default `/all` and `/api/assets`),
cached in the Durable Object for `VERSION_CACHE_TTL_SECONDS` (default 300).

The browser stores the full catalog alongside this version and only re-fetches — and therefore
only needs a session (and possibly a challenge) — when the version changes. A successful write
through the router drops the cached version, so uploads surface immediately instead of waiting
out the TTL.

## Provisioning access ("give access to whoever I want")

Client ids + secrets live in the `AuthStore` Durable Object. Manage them with the admin API —
no redeploy, changes take effect immediately.

Set the master admin key once:

```sh
cd workers/api-router
pnpm wrangler secret put ADMIN_KEY      # long random value, e.g. `openssl rand -hex 32`
```

Then, from anywhere:

```sh
# create / rotate a client
curl -X PUT https://api.codersoft.xyz/__admin/clients/alice \
  -H "X-Admin-Key: $ADMIN_KEY" -H 'content-type: application/json' \
  -d '{"secret":"'"$(openssl rand -hex 32)"'","description":"Alice\'s server"}'

# list, disable, delete
curl https://api.codersoft.xyz/__admin/clients -H "X-Admin-Key: $ADMIN_KEY"
curl -X POST https://api.codersoft.xyz/__admin/clients/alice/disable -H "X-Admin-Key: $ADMIN_KEY"
curl -X DELETE https://api.codersoft.xyz/__admin/clients/alice -H "X-Admin-Key: $ADMIN_KEY"
```

The admin API is protected only by `ADMIN_KEY`. Keep it long/random, and ideally also put
Cloudflare Access in front of `/__admin/*` on the zone.

### Provisioning the browser gateway

The gateway Worker (`workers/assets-gateway`) is just another client. Register its id and give
it the same secret:

```sh
curl -X PUT https://api.codersoft.xyz/__admin/clients/renderdragon-gateway \
  -H "X-Admin-Key: $ADMIN_KEY" -H 'content-type: application/json' \
  -d '{"secret":"'"$(openssl rand -hex 32)"'","description":"renderdragon.org assets gateway"}'
# then: cd workers/assets-gateway && pnpm wrangler secret put GATEWAY_SECRET   # same value
```

A helper that prints the client id, secret, and the exact commands:

```sh
node workers/api-router/scripts/new-client.mjs alice
```

## Router → e3 signing

Set the shared secret on both sides:

```sh
cd workers/api-router && pnpm wrangler secret put E3_SHARED_SECRET
# on e3, put the same value in the assets API's environment
```

The Worker sends `X-E3-Timestamp`, `X-E3-Nonce`, `X-E3-Signature` (client id `api-router`)
using the same canonical string. e3 must verify before serving:

```js
// e3 assets API (Node) — reject anything that is not signed by the router
import crypto from "node:crypto";
const SECRET = process.env.E3_SHARED_SECRET;
const SKEW = 300;

function verifyRouter(req, rawBody) {
  const ts = req.headers["x-e3-timestamp"];
  const nonce = req.headers["x-e3-nonce"];
  const signature = req.headers["x-e3-signature"];
  if (!ts || !nonce || !signature) return false;
  if (Math.abs(Date.now() / 1000 - Number(ts)) > SKEW) return false;

  const bodyHash = crypto.createHash("sha256").update(rawBody ?? "").digest("hex");
  const canonical = ["v1", req.method.toUpperCase(), req.originalUrl, "api-router", ts, nonce, bodyHash].join("\n");
  const expected = crypto.createHmac("sha256", SECRET).update(canonical).digest("hex");
  const a = Buffer.from(expected), b = Buffer.from(signature);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return false;

  // single-use nonce (match the router): enforce on writes
  if (req.method !== "GET" && req.method !== "HEAD" && seenNonce(nonce)) return false;
  return true;
}
```

Cache seen nonces for ~10 minutes and reject duplicates. `req.originalUrl` must include the
query string, and the body must be the raw bytes the router signed.

## Secrets

| Name | Where | Purpose |
| --- | --- | --- |
| `E3_SHARED_SECRET` | router + e3 | signs router → e3 |
| `ADMIN_KEY` | router | `/__admin/*` master key |
| client secret for `renderdragon-gateway` | registry + gateway | gateway ↔ router signing |
| `TURNSTILE_SECRET` | gateway | verifies Turnstile challenges |

## Deploy

```sh
cd workers/api-router && pnpm install && pnpm deploy
```

`wrangler.toml` binds `api.codersoft.xyz` as a custom domain and creates the `AuthStore`
Durable Object (SQLite migration `v1`).

## Verify

```sh
# unsigned → 401
curl -s -o /dev/null -w '%{http_code}\n' https://api.codersoft.xyz/categories   # 401
# health (public)
curl -s https://api.codersoft.xyz/__router/health
```

## Scope / threat model

- Protects against: unauthenticated callers, header/Origin spoofing, replayed signed writes,
  direct access to e3, and key leakage is revocable per client.
- Does **not** make the browser's own traffic secret: the browser path goes through the
  gateway, which requires a server-verified Turnstile challenge (or a Supabase login) before
  issuing a short-lived HttpOnly session. See `workers/assets-gateway/README.md`.
- TLS is provided by Cloudflare. Do not expose the Worker on a plaintext hostname.
