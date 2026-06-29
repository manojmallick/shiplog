// ─────────────────────────────────────────────────────────────
// Data access for the v0 UI. One API, two backends:
//   • DSQL configured  → real Amazon Aurora DSQL; same-row writes wrapped in
//     withOccRetry so an OCC 40001 replays the transaction.
//   • not configured   → delegates to the in-memory mock (lib/store.ts), which
//     already simulates retries — so the polished demo runs with zero AWS.
//
// Every function returns the SHAPE the v0 client/routes already expect
// (StatusPayload, IncidentWithUpdates[], { incident, result }, { component,
// result }) so the UI is untouched — only the data source changes.
// ─────────────────────────────────────────────────────────────
import type { PoolClient } from 'pg'
import { dsqlConfigured, getDsqlPool, resolveServableRegion } from './dsql'
import { withOccRetry } from './occ'
import * as store from './store'
import { MOCK_COMPONENT_UPTIMES } from './mock-data'
import type {
  Component,
  ComponentStatus,
  ComponentUptime,
  Incident,
  IncidentStatus,
  IncidentUpdate,
  IncidentWithUpdates,
  RegionId,
  Severity,
  StatusPayload,
  WriteResult,
} from './types'

const uuid = () => crypto.randomUUID()

// ── transaction helper (real mode) ──────────────────────────────
async function tx<T>(region: RegionId, fn: (c: PoolClient) => Promise<T>): Promise<T> {
  const pool = getDsqlPool(region)
  const client = await pool.connect()
  try {
    await client.query('BEGIN')
    const out = await fn(client)
    await client.query('COMMIT')
    return out
  } catch (e) {
    try {
      await client.query('ROLLBACK')
    } catch {
      /* ignore */
    }
    throw e
  } finally {
    client.release()
  }
}

function stitch(incidents: Incident[], updates: IncidentUpdate[]): IncidentWithUpdates[] {
  return incidents.map((i) => ({
    ...i,
    updates: updates
      .filter((u) => u.incident_id === i.id)
      // newest first — matches the mock store + what the timeline expects
      .sort((a, b) => b.posted_at.localeCompare(a.posted_at)),
  }))
}

async function readIncident(region: RegionId, id: string): Promise<IncidentWithUpdates | null> {
  const pool = getDsqlPool(region)
  const inc = await pool.query<Incident>(
    `SELECT id, title, status, severity, started_at, resolved_at, created_region
       FROM incidents WHERE id = $1`,
    [id]
  )
  if (inc.rowCount === 0) return null
  const upd = await pool.query<IncidentUpdate>(
    `SELECT id, incident_id, message, status, author, author_region, posted_at
       FROM incident_updates WHERE incident_id = $1 ORDER BY posted_at DESC`,
    [id]
  )
  return { ...inc.rows[0], updates: upd.rows }
}

// ── reads ───────────────────────────────────────────────────────

export async function getStatus(region: RegionId): Promise<StatusPayload> {
  if (!dsqlConfigured()) {
    return {
      components: store.getComponents(),
      incidents: store.getIncidents(),
      mock: true,
      servedRegion: region,
    }
  }
  const served = resolveServableRegion(region)
  const pool = getDsqlPool(served)
  const [comps, incs, upds] = await Promise.all([
    pool.query<Component>(
      `SELECT id, name, status, display_order, updated_at
         FROM components ORDER BY display_order`
    ),
    pool.query<Incident>(
      `SELECT id, title, status, severity, started_at, resolved_at, created_region
         FROM incidents ORDER BY started_at DESC`
    ),
    pool.query<IncidentUpdate>(
      `SELECT id, incident_id, message, status, author, author_region, posted_at
         FROM incident_updates`
    ),
  ])
  return {
    components: comps.rows,
    incidents: stitch(incs.rows, upds.rows),
    mock: false,
    servedRegion: served,
  }
}

export async function listIncidents(region: RegionId): Promise<IncidentWithUpdates[]> {
  if (!dsqlConfigured()) return store.getIncidents()
  const served = resolveServableRegion(region)
  const pool = getDsqlPool(served)
  const [incs, upds] = await Promise.all([
    pool.query<Incident>(
      `SELECT id, title, status, severity, started_at, resolved_at, created_region
         FROM incidents ORDER BY started_at DESC`
    ),
    pool.query<IncidentUpdate>(
      `SELECT id, incident_id, message, status, author, author_region, posted_at
         FROM incident_updates`
    ),
  ])
  return stitch(incs.rows, upds.rows)
}

export async function getIncident(
  region: RegionId,
  id: string
): Promise<IncidentWithUpdates | null> {
  if (!dsqlConfigured()) return store.getIncidentById(id) ?? null
  return readIncident(resolveServableRegion(region), id)
}

export async function getUptime(region: RegionId): Promise<ComponentUptime[]> {
  if (!dsqlConfigured()) return MOCK_COMPONENT_UPTIMES
  const pool = getDsqlPool(resolveServableRegion(region))
  const r = await pool.query<{
    component_id: string
    name: string
    date: string
    uptime_pct: string
  }>(
    `SELECT u.component_id, c.name, u.date::text AS date, u.uptime_pct
       FROM uptime_history u JOIN components c ON c.id = u.component_id
      ORDER BY c.display_order, u.date ASC`
  )
  const byComp = new Map<string, ComponentUptime>()
  for (const row of r.rows) {
    let e = byComp.get(row.component_id)
    if (!e) {
      e = { component_id: row.component_id, name: row.name, days: [] }
      byComp.set(row.component_id, e)
    }
    e.days.push({ date: row.date, uptime_pct: Number(row.uptime_pct) })
  }
  return [...byComp.values()]
}

// ── writes (the multi-region / OCC story) ───────────────────────

export async function createIncident(
  region: RegionId,
  input: { title: string; message: string; severity: Severity; author: string }
): Promise<{ incident: IncidentWithUpdates; result: WriteResult }> {
  if (!dsqlConfigured()) {
    return store.createIncident(input.title, input.message, input.severity, input.author, region)
  }
  const served = resolveServableRegion(region)
  const incidentId = uuid()
  const { retries } = await withOccRetry(() =>
    tx(served, async (c) => {
      await c.query(
        `INSERT INTO incidents (id, title, status, severity, created_region)
         VALUES ($1,$2,'investigating',$3,$4)`,
        [incidentId, input.title, input.severity, served]
      )
      await c.query(
        `INSERT INTO incident_updates
           (id, incident_id, message, status, author, author_region)
         VALUES ($1,$2,$3,'investigating',$4,$5)`,
        [uuid(), incidentId, input.message, input.author, served]
      )
    })
  )
  const incident = (await readIncident(served, incidentId))!
  return { incident, result: { retries, region: served, mock: false } }
}

export async function postUpdate(
  region: RegionId,
  input: {
    incidentId: string
    message: string
    status: IncidentStatus | null
    author: string
  }
): Promise<{ incident: IncidentWithUpdates; result: WriteResult } | null> {
  if (!dsqlConfigured()) {
    return store.postUpdate(input.incidentId, input.message, input.status, input.author, region)
  }
  const served = resolveServableRegion(region)

  // exists check first (so we can 404 cleanly, before opening the write tx)
  const existing = await readIncident(served, input.incidentId)
  if (!existing) return null

  const { retries } = await withOccRetry(() =>
    tx(served, async (c) => {
      await c.query(
        `INSERT INTO incident_updates
           (id, incident_id, message, status, author, author_region)
         VALUES ($1,$2,$3,$4,$5,$6)`,
        [uuid(), input.incidentId, input.message, input.status, input.author, served]
      )
      if (input.status) {
        // same-row contended write that drives the OCC demo
        await c.query(
          `UPDATE incidents
              SET status = $1,
                  resolved_at = CASE WHEN $1 = 'resolved' THEN now() ELSE resolved_at END
            WHERE id = $2`,
          [input.status, input.incidentId]
        )
      }
    })
  )
  const incident = (await readIncident(served, input.incidentId))!
  return { incident, result: { retries, region: served, mock: false } }
}

export async function setComponentStatus(
  region: RegionId,
  input: { componentId: string; status: ComponentStatus }
): Promise<{ component: Component; result: WriteResult } | null> {
  if (!dsqlConfigured()) {
    return store.updateComponentStatus(input.componentId, input.status, region)
  }
  const served = resolveServableRegion(region)
  let notFound = false
  const { value, retries } = await withOccRetry(() =>
    tx(served, async (c) => {
      const r = await c.query<Component>(
        `UPDATE components SET status = $1, updated_at = now()
          WHERE id = $2
          RETURNING id, name, status, display_order, updated_at`,
        [input.status, input.componentId]
      )
      if (r.rowCount === 0) {
        notFound = true
        return null
      }
      return r.rows[0]
    })
  )
  if (notFound || !value) return null
  return { component: value, result: { retries, region: served, mock: false } }
}

export async function subscribe(
  region: RegionId,
  email: string
): Promise<{ success: true; mock: boolean }> {
  if (!dsqlConfigured()) return { success: true, mock: true }
  const served = resolveServableRegion(region)
  await withOccRetry(() =>
    tx(served, async (c) => {
      const exists = await c.query(`SELECT 1 FROM subscribers WHERE email = $1`, [
        email.toLowerCase(),
      ])
      if (exists.rowCount === 0) {
        await c.query(`INSERT INTO subscribers (id, email) VALUES ($1,$2)`, [
          uuid(),
          email.toLowerCase(),
        ])
      }
    })
  )
  return { success: true, mock: false }
}
