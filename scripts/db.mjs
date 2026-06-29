// Shared DSQL pool for node scripts (run-sql, seed). Mirrors lib/dsql.ts.
//   • IAM auth, no password. DsqlSigner mints a fresh admin token per connection.
//   • Credential-less when AWS_ROLE_ARN is set (Vercel OIDC); otherwise the
//     default AWS credential chain (env keys) — needed for local `db:seed`.
//   • Host/region come from DSQL_HOST / DSQL_REGION (default the Virginia host).
import pg from 'pg'
import { DsqlSigner } from '@aws-sdk/dsql-signer'
import { awsCredentialsProvider } from '@vercel/oidc-aws-credentials-provider'

export function dsqlConfigured() {
  return Boolean(process.env.DSQL_HOST || process.env.DSQL_HOST_VIRGINIA || process.env.DSQL_HOST_SINGAPORE)
}

export function createPool() {
  const host =
    process.env.DSQL_HOST ||
    process.env.DSQL_HOST_VIRGINIA ||
    process.env.DSQL_HOST_SINGAPORE
  if (!host) {
    console.error(
      'No DSQL host configured. Set DSQL_HOST (or DSQL_HOST_VIRGINIA) in .env.local.'
    )
    process.exit(1)
  }
  const region = process.env.DSQL_REGION || process.env.AWS_REGION || 'us-east-1'

  const roleArn = process.env.AWS_ROLE_ARN
  const credentials = roleArn
    ? awsCredentialsProvider({ roleArn, clientConfig: { region } })
    : undefined

  const signer = new DsqlSigner({ hostname: host, region, credentials })

  return new pg.Pool({
    host,
    port: 5432,
    database: 'postgres',
    user: 'admin',
    password: () => signer.getDbConnectAdminAuthToken(),
    ssl: { rejectUnauthorized: true },
    max: 3,
    connectionTimeoutMillis: 15_000,
  })
}
