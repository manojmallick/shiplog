-- ─────────────────────────────────────────────────────────────
-- ShipLog schema — Amazon Aurora DSQL safe.
--
-- DSQL is a subset of PostgreSQL. This schema deliberately avoids the early-
-- DSQL landmines (verify against the CURRENT DSQL docs before a live demo):
--   • NO gen_random_uuid() column default → ids are generated in app code.
--   • NO FOREIGN KEY / REFERENCES         → relations enforced in app code.
--   • NO SERIAL / sequences.
--   • now() / literal defaults are fine.
--
-- run-sql.mjs executes each statement SEPARATELY (DSQL allows one DDL per
-- transaction). On DSQL, secondary indexes are created asynchronously — use
-- `CREATE INDEX ASYNC ...` (shown commented below) instead of plain CREATE
-- INDEX, and wait for it to report ACTIVE. Plain CREATE INDEX is kept here so
-- the same file also runs on a local PostgreSQL during development.
-- ─────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS components (
  id            UUID PRIMARY KEY,            -- app-supplied
  name          TEXT NOT NULL,
  status        TEXT NOT NULL DEFAULT 'operational',
  display_order INT  NOT NULL DEFAULT 0,
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS incidents (
  id             UUID PRIMARY KEY,
  title          TEXT NOT NULL,
  status         TEXT NOT NULL DEFAULT 'investigating',
  severity       TEXT NOT NULL DEFAULT 'minor',
  started_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  resolved_at    TIMESTAMPTZ,
  created_region TEXT
);

CREATE TABLE IF NOT EXISTS incident_updates (
  id            UUID PRIMARY KEY,
  incident_id   UUID NOT NULL,               -- relation enforced in app, not via FK
  message       TEXT NOT NULL,
  status        TEXT,
  author        TEXT,
  author_region TEXT,
  posted_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS incident_components (
  incident_id   UUID NOT NULL,
  component_id  UUID NOT NULL,
  PRIMARY KEY (incident_id, component_id)
);

CREATE TABLE IF NOT EXISTS uptime_history (
  id            UUID PRIMARY KEY,
  component_id  UUID NOT NULL,
  date          DATE NOT NULL,
  uptime_pct    NUMERIC(5,2) NOT NULL
);

CREATE TABLE IF NOT EXISTS subscribers (
  id            UUID PRIMARY KEY,
  email         TEXT NOT NULL,
  confirmed     BOOLEAN NOT NULL DEFAULT false,
  subscribed_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Secondary indexes. On Aurora DSQL prefer the ASYNC form, e.g.:
--   CREATE INDEX ASYNC idx_updates_incident ON incident_updates (incident_id, posted_at);
--   CREATE INDEX ASYNC idx_uptime_component  ON uptime_history  (component_id, date);
--   CREATE UNIQUE INDEX ASYNC idx_subscribers_email ON subscribers (email);
-- Plain form (also valid on local PostgreSQL):
CREATE INDEX IF NOT EXISTS idx_updates_incident ON incident_updates (incident_id, posted_at);
CREATE INDEX IF NOT EXISTS idx_uptime_component ON uptime_history (component_id, date);
CREATE UNIQUE INDEX IF NOT EXISTS idx_subscribers_email ON subscribers (email);
