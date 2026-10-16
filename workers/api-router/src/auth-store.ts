import { hmacHex, timingSafeEqual } from "./signing";

export interface AuthStoreEnv {}

interface ClientRow {
  id: string;
  secret: string;
  enabled: number;
  description: string | null;
  scopes: string | null;
  rate_limit_per_min: number | null;
  created_at: number;
  updated_at: number;
}

const parseScopes = (value: string | null): string[] => {
  if (!value) return [];
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed.filter((scope): scope is string => typeof scope === "string") : [];
  } catch {
    return [];
  }
};

interface VerifyPayload {
  clientId: string;
  timestamp: string;
  nonce: string;
  signature: string;
  canonical: string;
  storeNonce: boolean;
  maxSkewSeconds: number;
}

const json = (body: unknown, status = 200): Response =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });

export class AuthStore implements DurableObject {
  private readonly state: DurableObjectState;
  private readonly sql: SqlStorage;

  constructor(state: DurableObjectState, _env: AuthStoreEnv) {
    this.state = state;
    this.sql = state.storage.sql;
    this.sql.exec(`
      CREATE TABLE IF NOT EXISTS clients (
        id TEXT PRIMARY KEY,
        secret TEXT NOT NULL,
        enabled INTEGER NOT NULL DEFAULT 1,
        description TEXT,
        scopes TEXT,
        rate_limit_per_min INTEGER,
        created_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL
      );
    `);
    // Backfill columns for namespaces created before scopes/rate limits existed.
    for (const statement of [
      "ALTER TABLE clients ADD COLUMN scopes TEXT",
      "ALTER TABLE clients ADD COLUMN rate_limit_per_min INTEGER",
    ]) {
      try {
        this.sql.exec(statement);
      } catch {
        // column already exists
      }
    }
    // Single-use nonce store used for replay protection on signed requests.
    this.sql.exec(`
      CREATE TABLE IF NOT EXISTS nonces (
        client_id TEXT NOT NULL,
        nonce TEXT NOT NULL,
        exp INTEGER NOT NULL,
        PRIMARY KEY (client_id, nonce)
      );
    `);
    this.sql.exec(`CREATE INDEX IF NOT EXISTS idx_nonces_exp ON nonces (exp);`);
    this.sql.exec(`
      CREATE TABLE IF NOT EXISTS meta (
        key TEXT PRIMARY KEY,
        value TEXT NOT NULL,
        updated_at INTEGER NOT NULL
      );
    `);
    this.sql.exec(`
      CREATE TABLE IF NOT EXISTS rate_limits (
        client_id TEXT PRIMARY KEY,
        window_start INTEGER NOT NULL,
        count INTEGER NOT NULL
      );
    `);
  }

  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);
    const segments = url.pathname.split("/").filter(Boolean);

    // GET/PUT/DELETE /version — cached asset-catalog version (shared across isolates).
    if (segments.length === 1 && segments[0] === "version") {
      if (request.method === "GET") return this.readVersion();
      if (request.method === "PUT") return this.writeVersion((await request.json()) as { version: string; generatedAt: number });
      if (request.method === "DELETE") {
        this.sql.exec("DELETE FROM meta WHERE key = 'version'");
        return json({ ok: true });
      }
    }

    // POST /verify
    if (request.method === "POST" && segments.length === 1 && segments[0] === "verify") {
      return this.verify((await request.json()) as VerifyPayload);
    }

    // /clients [...]
    if (segments[0] === "clients") {
      const id = segments[1];
      if (!id && request.method === "GET") return this.listClients();
      if (id && request.method === "GET") return this.getClient(id);
      if (id && request.method === "PUT") {
        const body = (await request.json()) as {
          secret?: string;
          description?: string;
          enabled?: boolean;
        };
        return this.putClient(id, body);
      }
      if (id && request.method === "DELETE") return this.deleteClient(id);
      if (id && segments[2] && request.method === "POST" && (segments[2] === "enable" || segments[2] === "disable")) {
        return this.setEnabled(id, segments[2] === "enable");
      }
    }

    return json({ error: "not_found" }, 404);
  }

  async alarm(): Promise<void> {
    const now = Math.floor(Date.now() / 1000);
    this.sql.exec("DELETE FROM nonces WHERE exp < ?", now);
    const remaining = Number(this.sql.exec("SELECT COUNT(*) AS count FROM nonces").toArray()[0]?.count ?? 0);
    if (remaining > 0) {
      await this.state.storage.setAlarm(Date.now() + 60_000);
    }
  }

  private async verify(payload: VerifyPayload): Promise<Response> {
    const row = this.sql
      .exec("SELECT secret, enabled, scopes, rate_limit_per_min FROM clients WHERE id = ?", payload.clientId)
      .toArray()[0] as Pick<ClientRow, "secret" | "enabled" | "scopes" | "rate_limit_per_min"> | undefined;

    if (!row) return json({ ok: false, reason: "unknown_client" }, 401);
    if (!row.enabled) return json({ ok: false, reason: "client_disabled" }, 403);

    const now = Math.floor(Date.now() / 1000);
    const timestamp = Number(payload.timestamp);
    const skew = Number.isFinite(payload.maxSkewSeconds) && payload.maxSkewSeconds > 0 ? payload.maxSkewSeconds : 300;
    if (!Number.isFinite(timestamp) || Math.abs(now - timestamp) > skew) {
      return json({ ok: false, reason: "timestamp_out_of_window" }, 401);
    }

    const expected = await hmacHex(row.secret, payload.canonical);
    if (!timingSafeEqual(expected, payload.signature)) {
      return json({ ok: false, reason: "bad_signature" }, 401);
    }

    if (!this.enforceRateLimit(payload.clientId, row.rate_limit_per_min)) {
      return json({ ok: false, reason: "rate_limited" }, 429);
    }

    if (payload.storeNonce) {
      const exp = now + skew * 2;
      try {
        this.sql.exec(
          "INSERT INTO nonces (client_id, nonce, exp) VALUES (?, ?, ?)",
          payload.clientId,
          payload.nonce,
          exp,
        );
      } catch {
        // PRIMARY KEY conflict => this exact signed request already ran.
        return json({ ok: false, reason: "replayed_nonce" }, 401);
      }
      await this.scheduleCleanup();
    }

    return json({
      ok: true,
      clientId: payload.clientId,
      scopes: parseScopes(row.scopes),
      rateLimitPerMin: row.rate_limit_per_min ?? 0,
    });
  }

  private enforceRateLimit(clientId: string, limitPerMin: number | null | undefined): boolean {
    const limit = typeof limitPerMin === "number" && limitPerMin > 0 ? limitPerMin : 0;
    if (limit === 0) return true;
    const windowStart = Math.floor(Date.now() / 60_000) * 60;
    const row = this.sql
      .exec("SELECT window_start, count FROM rate_limits WHERE client_id = ?", clientId)
      .toArray()[0] as { window_start: number; count: number } | undefined;

    if (!row || row.window_start !== windowStart) {
      this.sql.exec(
        `INSERT INTO rate_limits (client_id, window_start, count) VALUES (?, ?, 1)
         ON CONFLICT(client_id) DO UPDATE SET window_start = excluded.window_start, count = 1`,
        clientId,
        windowStart,
      );
      return true;
    }
    if (row.count >= limit) return false;
    this.sql.exec("UPDATE rate_limits SET count = count + 1 WHERE client_id = ?", clientId);
    return true;
  }

  private async scheduleCleanup(): Promise<void> {
    const existing = await this.state.storage.getAlarm();
    if (existing === null) {
      await this.state.storage.setAlarm(Date.now() + 60_000);
    }
  }

  private readVersion(): Response {
    const row = this.sql.exec("SELECT value FROM meta WHERE key = 'version'").toArray()[0] as
      | { value: string }
      | undefined;
    if (!row) return json({});
    try {
      return json(JSON.parse(row.value));
    } catch {
      return json({});
    }
  }

  private writeVersion(input: { version: string; generatedAt: number }): Response {
    const record = { version: input.version, generatedAt: input.generatedAt, cachedAt: Date.now() };
    this.sql.exec(
      `INSERT INTO meta (key, value, updated_at) VALUES ('version', ?, ?)
       ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at`,
      JSON.stringify(record),
      Date.now(),
    );
    return json(record);
  }

  private listClients(): Response {
    const rows = this.sql
      .exec("SELECT id, enabled, description, scopes, rate_limit_per_min, created_at, updated_at FROM clients ORDER BY id")
      .toArray();
    return json({ clients: rows });
  }

  private getClient(id: string): Response {
    const row = this.sql
      .exec("SELECT id, enabled, description, created_at, updated_at FROM clients WHERE id = ?", id)
      .toArray()[0];
    if (!row) return json({ error: "not_found" }, 404);
    return json({ client: row });
  }

  private putClient(
    id: string,
    body: { secret?: string; description?: string; enabled?: boolean; scopes?: string[]; rateLimitPerMin?: number },
  ): Response {
    const existing = this.sql
      .exec("SELECT secret, description, enabled, scopes, rate_limit_per_min FROM clients WHERE id = ?", id)
      .toArray()[0] as
      | Pick<ClientRow, "secret" | "description" | "enabled" | "scopes" | "rate_limit_per_min">
      | undefined;

    const secret = body.secret ?? existing?.secret;
    if (!secret || secret.length < 16) {
      return json({ error: "secret_required_min_16_chars" }, 400);
    }
    const description = body.description ?? existing?.description ?? null;
    const enabled = body.enabled ?? (existing ? Boolean(existing.enabled) : true);
    const scopes = Array.isArray(body.scopes) ? body.scopes : parseScopes(existing?.scopes ?? null);
    const rateLimit =
      typeof body.rateLimitPerMin === "number" ? body.rateLimitPerMin : existing?.rate_limit_per_min ?? null;
    const now = Date.now();

    this.sql.exec(
      `INSERT INTO clients (id, secret, enabled, description, scopes, rate_limit_per_min, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)
       ON CONFLICT(id) DO UPDATE SET
         secret = excluded.secret,
         enabled = excluded.enabled,
         description = excluded.description,
         scopes = excluded.scopes,
         rate_limit_per_min = excluded.rate_limit_per_min,
         updated_at = excluded.updated_at`,
      id,
      secret,
      enabled ? 1 : 0,
      description,
      JSON.stringify(scopes),
      rateLimit,
      now,
      now,
    );

    return json({ client: { id, enabled, description, scopes, rateLimitPerMin: rateLimit } }, existing ? 200 : 201);
  }

  private deleteClient(id: string): Response {
    this.sql.exec("DELETE FROM clients WHERE id = ?", id);
    this.sql.exec("DELETE FROM nonces WHERE client_id = ?", id);
    return json({ deleted: id });
  }

  private setEnabled(id: string, enabled: boolean): Response {
    const result = this.sql.exec(
      "UPDATE clients SET enabled = ?, updated_at = ? WHERE id = ?",
      enabled ? 1 : 0,
      Date.now(),
      id,
    );
    if (result.rowsWritten === 0) return json({ error: "not_found" }, 404);
    return json({ client: { id, enabled } });
  }
}
