// ─────────────────────────────────────────────────────────────
// Amazon Aurora DSQL connection — one POOLED, CACHED connection per region.
//
// Landmine #3 fix (and then some): we do NOT sign a fresh IAM token per
// request, nor open a Pool per request. Instead:
//   • One Pool per region, cached on globalThis across hot Function invocations.
//   • pg's `password` is a FUNCTION — pg calls it only when it opens a *new*
//     physical connection, and the DsqlSigner mints a fresh (~15 min) token
//     then. Reused pooled connections reuse their token; new ones always get a
//     valid one. This sidesteps the "cached token string expired" failure mode
//     the original doc's snippet still had.
//
// Auth is IAM, credential-less when possible:
//   • AWS_ROLE_ARN set  → assume it via Vercel OIDC (no static keys).
//   • otherwise          → default AWS credential chain (env keys, local).
// ─────────────────────────────────────────────────────────────
import { Pool } from 'pg'
import { DsqlSigner } from '@aws-sdk/dsql-signer'
import { awsCredentialsProvider } from '@vercel/oidc-aws-credentials-provider'
import type { RegionId } from './types'

const HOSTS: Record<RegionId, string | undefined> = {
  'us-east-1': process.env.DSQL_HOST_VIRGINIA,
  'ap-southeast-1': process.env.DSQL_HOST_SINGAPORE,
}

/** True when at least one real DSQL endpoint is configured. */
export function dsqlConfigured(): boolean {
  return Boolean(HOSTS['us-east-1'] || HOSTS['ap-southeast-1'])
}

/** Region we can actually serve. Falls back to whichever single host exists. */
export function resolveServableRegion(region: RegionId): RegionId {
  if (HOSTS[region]) return region
  if (HOSTS['us-east-1']) return 'us-east-1'
  if (HOSTS['ap-southeast-1']) return 'ap-southeast-1'
  return region
}

declare global {
  // eslint-disable-next-line no-var
  var __shiplogPools: Partial<Record<RegionId, Pool>> | undefined
}
const pools = (globalThis.__shiplogPools ??= {})

function credentials(region: RegionId) {
  const roleArn = process.env.AWS_ROLE_ARN
  if (!roleArn) return undefined // fall through to the default AWS chain
  return awsCredentialsProvider({ roleArn, clientConfig: { region } })
}

function makePool(region: RegionId): Pool {
  const host = HOSTS[region]
  if (!host) {
    throw new Error(
      `No Aurora DSQL host configured for ${region}. Set DSQL_HOST_${
        region === 'us-east-1' ? 'VIRGINIA' : 'SINGAPORE'
      } or run in mock mode.`
    )
  }
  const signer = new DsqlSigner({ hostname: host, region, credentials: credentials(region) })

  return new Pool({
    host,
    port: 5432,
    database: 'postgres',
    user: 'admin',
    // pg awaits this per new physical connection → always a fresh, valid token.
    password: () => signer.getDbConnectAdminAuthToken(),
    ssl: { rejectUnauthorized: true }, // DSQL presents a publicly-trusted cert
    max: 5,
    idleTimeoutMillis: 30_000,
    connectionTimeoutMillis: 15_000,
  })
}

/** Reuse the per-region pool across invocations; build it lazily on first use. */
export function getDsqlPool(region: RegionId): Pool {
  const r = resolveServableRegion(region)
  if (!pools[r]) pools[r] = makePool(r)
  return pools[r]!
}
