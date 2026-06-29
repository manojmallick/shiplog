// Apply a .sql file to Aurora DSQL, ONE statement per transaction.
// DSQL allows only a single DDL statement per transaction, so we split the file
// on statement boundaries and run each separately (rather than one big query).
// Usage: node --env-file=.env.local scripts/run-sql.mjs db/schema.sql
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { createPool } from './db.mjs'

const file = process.argv[2]
if (!file) {
  console.error('Usage: node scripts/run-sql.mjs <path-to.sql>')
  process.exit(1)
}

// Strip line comments, then split on semicolons that end a statement.
function splitStatements(sql) {
  return sql
    .split('\n')
    .filter((line) => !line.trim().startsWith('--'))
    .join('\n')
    .split(';')
    .map((s) => s.trim())
    .filter(Boolean)
}

const statements = splitStatements(readFileSync(resolve(file), 'utf8'))
const pool = createPool()

let ok = 0
try {
  for (const stmt of statements) {
    const label = stmt.replace(/\s+/g, ' ').slice(0, 60)
    try {
      await pool.query(stmt)
      ok++
      console.log(`  ✓ ${label}…`)
    } catch (err) {
      // CREATE INDEX (non-ASYNC) can fail on DSQL — warn but keep going so the
      // tables (which matter) still get created.
      console.warn(`  ⚠ ${label}… → ${err.message}`)
    }
  }
  console.log(`✓ Applied ${ok}/${statements.length} statements from ${file}`)
} finally {
  await pool.end()
}
