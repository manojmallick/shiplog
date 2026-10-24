# ShipLog

**Status that never goes down.** A multi-region status page + incident timeline for global on-call
teams, built on **Amazon Aurora DSQL** (active-active, us-east-1 ⟷ ap-southeast-1) and deployed on Vercel.

[![Live](https://img.shields.io/badge/▶_Live_Demo-shiplog--sandy.vercel.app-22C55E?style=for-the-badge&logo=vercel&logoColor=white)](https://shiplog-sandy.vercel.app)
&nbsp;[![Deck](https://img.shields.io/badge/Pitch-DECK.pdf-EF4444?style=for-the-badge&logo=adobeacrobatreader&logoColor=white)](./DECK.pdf)

![Next.js](https://img.shields.io/badge/Next.js_16-000000?style=flat-square&logo=nextdotjs&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=flat-square&logo=typescript&logoColor=white)
![Aurora DSQL](https://img.shields.io/badge/Aurora_DSQL-527FFF?style=flat-square&logo=amazonrds&logoColor=white)
![Multi-region](https://img.shields.io/badge/active--active-us--east--1_⟷_ap--southeast--1-FF9900?style=flat-square&logo=amazonaws&logoColor=white)
![Vercel](https://img.shields.io/badge/Vercel-000000?style=flat-square&logo=vercel&logoColor=white)

> 🟢 **Live:** https://shiplog-sandy.vercel.app &nbsp;·&nbsp; 📊 **Pitch deck:** [DECK.pdf](./DECK.pdf)

## Architecture

```mermaid
flowchart TD
  A[👀 On-call team<br/>Next.js on Vercel · region lens] -->|read/write| Q[lib/queries + lib/occ<br/>optimistic concurrency]
  Q -->|"writes (region-tagged)"| D1[(Aurora DSQL<br/>us-east-1 · ACTIVE)]
  Q -->|"writes (region-tagged)"| D2[(Aurora DSQL<br/>ap-southeast-1 · ACTIVE)]
  D1 <-->|"strongly-consistent active-active"| D2
  Q -.->|no AWS configured| M[lib/store.ts<br/>in-memory mock · clearly labeled]
```

> Track 4 · Open Innovation · AWS × Vercel Hackathon. UI generated with **v0**, then wired onto the real
> Aurora DSQL backend. The strongest *Most Original* shot: DSQL used for the one workload it was built
> for — strongly-consistent writes from multiple regions at once, surviving any single-region failure.

This is the **canonical ShipLog app**: the polished v0 frontend on a production DSQL data layer
(`lib/dsql.ts` + `lib/occ.ts` + `lib/queries.ts`), with an in-memory mock fallback so it runs with zero AWS.

## Run it locally (mock mode, no AWS needed)

```bash
npm install
npm run dev      # http://localhost:3000
```

With no DSQL endpoint configured, ShipLog serves an in-memory store ([lib/store.ts](lib/store.ts))
seeded with a live two-region incident. **Mock mode is clearly labelled** in the UI — it never fakes the
cross-region guarantee. Explore the status page, the on-call console, and the conflict/retry UX.

### Drive the multi-region demo

Open two browser windows of the same app:

- Window A → `/admin?region=ap-southeast-1` (Singapore lens)
- Window B → `/admin?region=us-east-1` (Virginia lens)

Each window's writes are tagged with — and on real DSQL, routed to — its region. The `?region=` lens
is switchable in-app too. Post updates / flip component status from both at once and watch the timeline
stay consistent; on live DSQL, same-row edits show the OCC auto-retry.

## Go live on Aurora DSQL

1. **Provision** a DSQL **multi-region cluster** with peers in `us-east-1` and `ap-southeast-1`. Note the
   two endpoint hostnames.
2. **Configure** `.env.local` (see [.env.example](.env.example)):
   ```bash
   DSQL_HOST_VIRGINIA=<virginia-endpoint>.dsql.us-east-1.on.aws
   DSQL_HOST_SINGAPORE=<singapore-endpoint>.dsql.ap-southeast-1.on.aws
   DSQL_HOST=$DSQL_HOST_VIRGINIA      # used by the db scripts
   AWS_REGION=us-east-1
   AWS_ROLE_ARN=arn:aws:iam::<acct>:role/shiplog-dsql   # credential-less via Vercel OIDC
   ```
   IAM auth — **no password**. The `DsqlSigner` mints a short-lived (~15 min) admin token per connection.
3. **Apply schema + seed** (DDL propagates across the multi-region cluster):
   ```bash
   npm run db:schema
   npm run db:seed
   ```
4. `npm run dev` — same UI, now reading/writing real DSQL. The mock banner disappears and real OCC
   `retries` start surfacing in the post-update toast.

## How it's wired

```
components/shiplog/*   v0-generated UI (status board, timeline, region badge/switcher, forms) — unchanged
app/api/*              thin routes: parse region + body → call lib/queries.ts → return UI-shaped JSON
lib/queries.ts         real Aurora DSQL when configured; else delegates to lib/store.ts (mock)
lib/dsql.ts            one cached Pool per region; per-connection IAM token (DsqlSigner / OIDC)
lib/occ.ts             OCC retry on SQLSTATE 40001 — this IS the multi-region story
lib/store.ts           in-memory mock used only when no DSQL host is set
db/schema.sql          DSQL-safe schema (app UUIDs, no FKs, no sequences)
scripts/               db.mjs · run-sql.mjs (one statement per tx) · seed.mjs
docs/                  architecture.md · stitch-ui-spec.md · v0-ui-spec.md
```

Full architecture + the DSQL-correctness decisions: [docs/architecture.md](docs/architecture.md).

## The 60-second story

When your service is down, your status page can't be too — and your on-call team is global. Engineers in
**Singapore** and **Virginia** post to the same incident timeline simultaneously:

- **Different-row writes** → both commit, strongly consistent, correctly ordered.
- **Same-row writes** → DSQL's optimistic concurrency control rejects one with a retryable error; ShipLog
  auto-retries and shows the count (`✓ Committed via us-east-1 — auto-retried 2×; nothing lost`).
  You can never get a silent lost write — and that's exactly why we chose Aurora DSQL.

## Pages and API

| Page | Purpose |
|---|---|
| `/` | Public status page: component health, active incidents, uptime bars, subscribe form |
| `/history` | Past incidents |
| `/admin` | On-call console: open incidents, post updates, change component status |
| `/admin/incident/[id]` | Incident detail and timeline |

All pages and APIs take a `?region=us-east-1` or `?region=ap-southeast-1` lens.

| Endpoint | Method | Purpose |
|---|---|---|
| `/api/status` | GET | Components and active incidents for a region |
| `/api/incident` | GET, POST | List incidents / open a new incident |
| `/api/incident/[id]` | GET | One incident with its timeline |
| `/api/update` | POST | Post a timeline update (OCC-retried on conflict) |
| `/api/component` | POST | Change a component's status |
| `/api/subscribe` | POST | Subscribe to status notifications |

## Environment variables

Copy `.env.example` to `.env.local`. With no `DSQL_HOST*` set the app runs in mock mode.

| Variable | Needed for | Description |
|---|---|---|
| `DSQL_HOST_VIRGINIA` | live DSQL | Aurora DSQL endpoint in `us-east-1` |
| `DSQL_HOST_SINGAPORE` | live DSQL | Aurora DSQL endpoint in `ap-southeast-1` |
| `DSQL_HOST` | db scripts | Endpoint used by `db:schema` / `db:seed` (use the Virginia host) |
| `DSQL_REGION` | db scripts | Region of `DSQL_HOST`; falls back to `AWS_REGION`, then `us-east-1` |
| `AWS_REGION` | live DSQL | Default AWS region, `us-east-1` |
| `AWS_ROLE_ARN` | live DSQL (preferred) | IAM role assumed through Vercel OIDC, no static keys. Locally, `vercel env pull .env.local` provides `VERCEL_OIDC_TOKEN` |
| `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `AWS_SESSION_TOKEN` | live DSQL (fallback) | Static credentials with `dsql:DbConnectAdmin`, for local use only |

## Scripts

| Command | What it does |
|---|---|
| `npm run dev` | Start the dev server on `http://localhost:3000` |
| `npm run build` / `npm start` | Production build and server |
| `npm run lint` | ESLint |
| `npm run db:schema` | Apply `db/schema.sql` (one statement per transaction, as DSQL requires) |
| `npm run db:seed` | Load sample components and incidents |
| `npm run db:reset` | `db:schema` then `db:seed` |

## Deploying to Vercel

1. Import the repo into Vercel.
2. Add the environment variables above (use `AWS_ROLE_ARN` with the Vercel AWS integration rather than static keys).
3. Deploy. Without DSQL variables the deployment serves the labelled mock mode.

## Troubleshooting

| Symptom | Likely cause |
|---|---|
| "Mock mode" banner is showing | No `DSQL_HOST*` is set, or `.env.local` wasn't loaded |
| Token or auth errors when connecting | Missing `AWS_ROLE_ARN`/credentials, or the role lacks `dsql:DbConnectAdmin`. OIDC tokens from `vercel env pull` are short-lived; pull again |
| Schema script fails | DSQL accepts one DDL statement per transaction and has no foreign keys or sequences; use `run-sql.mjs`, not `psql` with a multi-statement file |
| Updates show "auto-retried N×" | Expected: two writers touched the same row and OCC retried one of them |

## Tech

Next.js 16 (App Router) · React 19 · Tailwind v4 · base-ui · `pg` · `@aws-sdk/dsql-signer` ·
`@vercel/oidc-aws-credentials-provider` · Amazon Aurora DSQL · Vercel.

---

*ShipLog · Track 4 Open Innovation · Aurora DSQL · lowest competition, highest novelty.*
