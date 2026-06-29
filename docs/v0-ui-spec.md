# ShipLog — v0 UI Spec (paste into v0.dev)

> Goal: generate the ShipLog frontend in v0, then drop it onto the Aurora DSQL backend with zero rework.
> **The component props below match the exact JSON the API routes return** (`/api/status`, `/api/update`,
> `/api/component`, `/api/incident`, `/api/subscribe`). Keep components **presentational** — take a
> `StatusPayload` / `IncidentWithUpdates` prop; the server passes data in. Interfaces mirror
> [../lib/types.ts](../lib/types.ts) 1:1.

---

## STEP 1 — Initial scaffold prompt (paste this first)

```
Build a Next.js 16 (App Router) + TypeScript + Tailwind app called ShipLog — a multi-region status page
and incident timeline for global on-call teams. Use shadcn/ui components and lucide-react icons.

DESIGN SYSTEM (use throughout):
- Aesthetic: calm, trustworthy, operationally confident — "the page you trust when everything is on fire."
  Statuspage.io meets Linear meets a cloud console.
- Palette: slate (#0F172A) primary, white/#F8FAFC surfaces with #E2E8F0 hairline borders, single accent
  green (#16A34A) for healthy/CTA. Status colors reserved ONLY for status dots/pills/uptime bars:
  operational #16A34A, degraded #D97706, partial_outage #EA580C, major_outage #DC2626, maintenance #2563EB.
- REGION badges (signature), monospace + flag glyph: us-east-1 "Virginia" sky-blue, ap-southeast-1
  "Singapore" violet. A region badge appears on every incident-timeline entry — this is the key UI motif.
- Typography: serif headers ("Source Serif 4" / Georgia fallback) for gravitas; Inter for body/UI;
  monospace for region codes + UTC timestamps. Generous line-height, rounded-xl cards, soft shadows.

PAGES (App Router routes):
1. /                         Public status page (see DETAILED SPEC, Step 2). The most important screen.
2. /admin                    On-call console: incidents list + "Declare incident" + component status controls.
3. /admin/incident/[id]      Incident detail: post-update form + full region-tagged timeline.
4. /history                  90-day uptime bars per component.

GLOBAL UI:
- Shared top nav: a green Activity (pulse) logo + "ShipLog", links Status / History / Admin.
- A REGION SWITCHER segmented control (top-right of each page) reading/writing a ?region= URL param
  ("This window: 🇺🇸 us-east-1 | 🇸🇬 ap-southeast-1"). This lets two browser windows of the SAME deploy act
  as Singapore and Virginia for the demo. Forms send their writes with the current ?region=.
- Components are presentational (take typed props). Type all mock data with the interfaces in the
  DATA CONTRACT below and render from them. Mobile responsive. No auth.
```

---

## STEP 2 — Public status page detail (paste after scaffold)

```
Refine the / page. It renders live system status from a StatusPayload.

OVERALL BANNER: a card with a big green CheckCircle + serif "All systems operational" when every
component is operational; otherwise an amber AlertTriangle + "Some systems are experiencing issues".
Sub-line: "Live · refreshed every 5s · served from [RegionBadge servedRegion]". Right side: a small
pulsing green dot + "live". (Poll GET /api/status every 5 seconds; when a component's status changes
between polls, briefly flash that row.)

MOCK BANNER: if payload.mock is true, render a thin amber banner: "Mock mode — no Aurora DSQL endpoint
configured… Region badges reflect the demo lens, not real cross-region writes." Honest, not an error.

COMPONENTS CARD: list rows of {dot + name} on the left, a StatusPill on the right. StatusPill = a
rounded pill with a leading status dot and label, colored per status.

ACTIVE INCIDENTS: a section rendering payload.incidents (status !== 'resolved'). Each = a card with an
IncidentStatusBadge + SeverityBadge + title (link to /admin/incident/[id]) + "started {relative}". Inside,
an IncidentTimeline of its updates — newest first, EACH entry showing an IncidentStatusBadge (if set), a
RegionBadge (author_region, with flag + monospace region code), author · relative time · UTC clock, and
the message. The region badge per entry is the visual proof of multi-region writes — make it prominent.

GET NOTIFIED: an email input + green "Subscribe" button (POST /api/subscribe). A footer link
"View 90-day uptime history →".
```

---

## STEP 3 — Console + incident detail (paste after Step 2)

```
/admin — On-call console. Header "On-call console". Region switcher top-right. A red "+ Declare incident"
button that expands a form (title, first-update textarea, severity dropdown, name, "from [RegionBadge]"
hint, Declare → POST /api/incident, then route to the new incident page).

Incidents list card: one row per incident (from GET /api/incident) — IncidentStatusBadge + SeverityBadge
+ title + right-aligned "opened from [RegionBadge created_region] · {relative}". Rows link to detail.

Component status card: one row per component — status dot + name + a status <select> (the 5 statuses).
On change, POST /api/component and show an inline monospace confirmation on the right:
green "✓ {region} · retried {n}×" when n>0, else "✓ {region} · consistent"; red "✗ {error}" on failure.
Footer: "writing as [RegionBadge]".

/admin/incident/[id] — Incident detail. Back "← Console" link, region switcher. Pills row: status +
severity + "opened from [RegionBadge] · {relative}". Serif title. A "Post an update" card: textarea
(placeholder "Post an update as {region}…"), a status <select> ("— keep status —" + the 4 statuses), a
name input, a "posting from [RegionBadge]" hint, and a "Post update" button → POST /api/update.

CRITICAL — surface the OCC story from the response {region, retries, mock}:
- success: green "✓ Committed via {region} — strongly consistent." and when retries>0:
  "✓ Committed via {region} — DSQL detected a concurrent edit and we auto-retried {retries}×; nothing lost."
- HTTP 409: amber "⚠ Write conflict after max retries — by design, DSQL rejected rather than lose a write."
Then render the full IncidentTimeline below (region badge on every entry).
```

---

## STEP 4 — Uptime history (optional paste)

```
/history — header "Uptime history", subhead "90-day uptime per component. Each bar is one day — hover for
the exact figure." For each ComponentUptime: the name, then an UptimeBar — 90 thin vertical day-segments
(green ≥99.9%, amber ≥99%, orange ≥95%, red below), each with a title tooltip "{date}: {pct}%", and a
right-aligned average "{avg}% uptime". Tiny "90 days ago" / "Today" captions under the bar.
```

---

## DATA CONTRACT — make v0 mock these exact shapes (critical for backend wiring)

Tell v0: *"Type the mock data with these TypeScript interfaces and render from them."* These mirror
[`../lib/types.ts`](../lib/types.ts) 1:1.

```typescript
export type RegionId = 'us-east-1' | 'ap-southeast-1';
export type ComponentStatus =
  | 'operational' | 'degraded' | 'partial_outage' | 'major_outage' | 'maintenance';
export type IncidentStatus = 'investigating' | 'identified' | 'monitoring' | 'resolved';
export type Severity = 'minor' | 'major' | 'critical';

export interface Component {
  id: string; name: string; status: ComponentStatus;
  display_order: number; updated_at: string;
}
export interface Incident {
  id: string; title: string; status: IncidentStatus; severity: Severity;
  started_at: string; resolved_at: string | null; created_region: RegionId | null;
}
export interface IncidentUpdate {
  id: string; incident_id: string; message: string; status: IncidentStatus | null;
  author: string | null; author_region: RegionId | null; posted_at: string;
}
export interface IncidentWithUpdates extends Incident { updates: IncidentUpdate[]; }

export interface UptimeDay { date: string; uptime_pct: number; }            // date = YYYY-MM-DD
export interface ComponentUptime { component_id: string; name: string; days: UptimeDay[]; }

export interface StatusPayload {
  components: Component[];
  incidents: IncidentWithUpdates[];
  mock: boolean;            // true => in-memory store, NOT a real DSQL cluster (render the banner)
  servedRegion: RegionId;
}

// every write route returns this so the UI can SHOW the multi-region/OCC story:
export interface WriteResult { retries: number; region: RegionId; mock: boolean; }
```

### Realistic mock content to seed v0 (so the demo looks real)
- 5 components: API, Database, CDN (**degraded**), Dashboard, Auth — all others operational.
- One **active** incident "Elevated CDN error rates in APAC" (status `monitoring`, severity `major`,
  created_region `ap-southeast-1`) with **3 updates alternating regions**: ap-southeast-1 →
  us-east-1 → ap-southeast-1. This alternation is the multi-region proof — keep it.
- One **resolved** incident "Scheduled database failover" (created_region `us-east-1`).
- 90 days of uptime per component: mostly 100%, a couple ~99.2% dips, CDN dips to ~98.7% today.

---

## Integration notes (how this connects to the backend)
- Pages fetch real routes server-side: `/` and the poller → `GET /api/status`; console →
  `GET /api/incident`; writes → `POST /api/update | /api/component | /api/incident | /api/subscribe`.
- **Keep components presentational** (take a `StatusPayload` / `IncidentWithUpdates` prop). Don't bake
  fetch logic into the timeline/pills — the server passes data in. This is the one rule that avoids a rewrite.
- The `?region=` lens drives which DSQL endpoint a write hits — always forward it on write fetches.
- **Never fake the multi-region claim**: if `mock` is true, show the mock banner. The `retries` count is
  real OCC behavior on live DSQL — surface it as the feature, don't hide it.
