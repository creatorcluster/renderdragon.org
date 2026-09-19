CREATE TABLE IF NOT EXISTS visitors (
  visitor_id TEXT PRIMARY KEY,
  first_seen INTEGER NOT NULL,
  last_seen  INTEGER NOT NULL,
  visits     INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS visits (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  visitor_id TEXT NOT NULL,
  ts         INTEGER NOT NULL,
  path       TEXT,
  referrer   TEXT,
  country    TEXT,
  is_new     INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_visits_ts ON visits(ts);
CREATE INDEX IF NOT EXISTS idx_visits_visitor ON visits(visitor_id);
