// Seed Aurora DSQL with demo components, two incidents (one active two-region
// timeline + one resolved), 90 days of uptime, and a subscriber.
// App-generated UUIDs (no gen_random_uuid()); relations enforced here in code.
// Usage: node --env-file=.env.local scripts/seed.mjs
import { randomUUID } from 'node:crypto'
import { createPool } from './db.mjs'

const uuid = () => randomUUID()
const client = createPool()

const COMPONENTS = ['API', 'Database', 'CDN', 'Dashboard', 'Auth']

try {
  // Clear (idempotent reseed). DELETE is DML — fine on DSQL.
  for (const t of [
    'incident_components',
    'incident_updates',
    'uptime_history',
    'incidents',
    'components',
    'subscribers',
  ]) {
    await client.query(`DELETE FROM ${t}`)
  }

  // ── Components ──
  const compIds = {}
  for (let i = 0; i < COMPONENTS.length; i++) {
    const id = uuid()
    compIds[COMPONENTS[i]] = id
    await client.query(
      `INSERT INTO components (id, name, status, display_order)
       VALUES ($1,$2,$3,$4)`,
      [id, COMPONENTS[i], COMPONENTS[i] === 'CDN' ? 'degraded' : 'operational', i]
    )
  }
  console.log(`✓ Seeded ${COMPONENTS.length} components`)

  // ── Active incident with a two-region timeline ──
  const activeId = uuid()
  await client.query(
    `INSERT INTO incidents (id, title, status, severity, started_at, created_region)
     VALUES ($1,$2,$3,$4, now() - INTERVAL '42 minutes', $5)`,
    [activeId, 'Elevated CDN error rates in APAC', 'monitoring', 'major', 'ap-southeast-1']
  )
  const timeline = [
    ['Investigating elevated 5xx from the Singapore edge. CDN marked degraded.', 'investigating', 'Priya (SRE)', 'ap-southeast-1', '42 minutes'],
    ['Confirmed from Virginia: origin healthy, issue isolated to APAC PoPs. Rerouting.', 'identified', 'Dale (SRE)', 'us-east-1', '28 minutes'],
    ['Reroute applied. Error rates falling. Monitoring 30 min.', 'monitoring', 'Priya (SRE)', 'ap-southeast-1', '9 minutes'],
  ]
  for (const [msg, status, author, region, ago] of timeline) {
    await client.query(
      `INSERT INTO incident_updates (id, incident_id, message, status, author, author_region, posted_at)
       VALUES ($1,$2,$3,$4,$5,$6, now() - INTERVAL '${ago}')`,
      [uuid(), activeId, msg, status, author, region]
    )
  }
  await client.query(
    `INSERT INTO incident_components (incident_id, component_id) VALUES ($1,$2)`,
    [activeId, compIds['CDN']]
  )

  // ── Resolved incident ──
  const resolvedId = uuid()
  await client.query(
    `INSERT INTO incidents (id, title, status, severity, started_at, resolved_at, created_region)
     VALUES ($1,$2,'resolved','minor', now() - INTERVAL '2 days', now() - INTERVAL '2 days', 'us-east-1')`,
    [resolvedId, 'Scheduled database failover']
  )
  await client.query(
    `INSERT INTO incident_updates (id, incident_id, message, status, author, author_region, posted_at)
     VALUES ($1,$2,$3,'resolved','Dale (SRE)','us-east-1', now() - INTERVAL '2 days')`,
    [uuid(), resolvedId, 'Failover completed cleanly. No customer impact.']
  )
  console.log('✓ Seeded 2 incidents (1 active two-region timeline, 1 resolved)')

  // ── 90 days uptime per component ──
  let rows = 0
  for (const name of COMPONENTS) {
    for (let d = 89; d >= 0; d--) {
      let pct = 100
      if (name === 'CDN' && d === 0) pct = 98.7
      else if (name === 'API' && d === 14) pct = 99.2
      else if (name === 'Database' && d === 47) pct = 99.2
      await client.query(
        `INSERT INTO uptime_history (id, component_id, date, uptime_pct)
         VALUES ($1,$2, (CURRENT_DATE - $3::int), $4)`,
        [uuid(), compIds[name], d, pct]
      )
      rows++
    }
  }
  console.log(`✓ Seeded ${rows} uptime rows`)

  await client.query(`INSERT INTO subscribers (id, email, confirmed) VALUES ($1,$2,true)`, [
    uuid(),
    'oncall@example.com',
  ])
  console.log('✓ Seeded 1 subscriber')
  console.log('\nDone. Active incident id:', activeId)
} catch (err) {
  console.error('\n✗ Seed failed:', err.message)
  process.exit(1)
} finally {
  await client.end()
}
