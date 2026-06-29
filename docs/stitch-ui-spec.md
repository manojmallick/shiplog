# ShipLog — Google Stitch Design Spec

> Stitch (stitch.withgoogle.com) is **design-first**: it generates high-fidelity visual mockups you
> export to Figma or code. It responds best to **vivid visual/mood language, one screen at a time**.
> Set the GLOBAL STYLE once, then prompt each screen; keep the same project so the theme stays
> consistent. Use **Experimental mode (Gemini 2.5 Pro)** for Screen 1 (the live status page).
>
> **Recommended combo: Stitch for the look, v0 for the code** ([v0-ui-spec.md](v0-ui-spec.md)). The
> screens depict the *exact* data shapes the backend returns (`StatusPayload` / `Component` /
> `IncidentUpdate` — see [../lib/types.ts](../lib/types.ts)), so the mockups stay truthful.

---

## GLOBAL STYLE (set this first — applies to every screen)

```
Design a web app for "ShipLog", a multi-region status page + incident timeline for global on-call
teams. Desktop-first, responsive. Mood: calm, trustworthy, operationally confident — "the page you
trust when everything else is on fire." Think Statuspage.io meets Linear meets a cloud console.

Color theme:
- Primary: slate #0F172A (nav, headings, primary buttons, body text)
- Surfaces: white cards on a soft #F8FAFC background, hairline #E2E8F0 borders, soft shadows
- Accent / healthy: green #16A34A (CTAs, links, the "operational" state) — confident, not loud
- Status semantic colors, reserved ONLY for status dots, pills, and the uptime bar:
  green #16A34A = operational, amber #D97706 = degraded, orange #EA580C = partial outage,
  red #DC2626 = major outage, blue #2563EB = maintenance
- REGION badges (the signature multi-region cue), monospace, with a flag glyph:
  us-east-1 "Virginia" = sky blue (#0369A1 text on #F0F9FF),
  ap-southeast-1 "Singapore" = violet (#6D28D9 text on #F5F3FF)

Typography: elegant serif headlines (Source Serif 4 feel) for calm gravitas; clean sans (Inter) for
body/UI; monospace for region codes and UTC timestamps. Generous whitespace, 12–16px rounded corners.

Signature components: status pill WITH a leading colored status dot; a live "pulse" dot; a 90-day
uptime bar made of 90 thin colored day-segments; a region segmented-control ("This window: 🇺🇸 us-east-1
| 🇸🇬 ap-southeast-1"); a vertical incident timeline with a region badge on every entry.

Persistent top nav: a green Activity (pulse) logo + "ShipLog", links Status / History / Admin.
Accessible contrast, clear focus states.
```

---

## SCREEN 1 — Public status page (use Experimental mode — most important screen)
```
The public status page for ShipLog.

TOP: an Overall Status Banner card — a large green check icon with serif headline "All systems
operational" (and an amber-warning variant: triangle icon + "Some systems are experiencing issues").
Underneath, a muted line: "Live · refreshed every 5s · served from [region badge: 🇺🇸 us-east-1]".
Far right: a small pulsing green dot labeled "live". Top-right of the page header: the region
segmented-control switcher.

COMPONENTS CARD: a clean list, one row per component (API, Database, CDN, Dashboard, Auth). Each row =
a colored status dot + the component name on the left, and a status pill on the right
(green "Operational", amber "Degraded", etc.). Show CDN in amber "Degraded".

ACTIVE INCIDENTS: a section "Active incidents". One incident card titled "Elevated CDN error rates in
APAC" with a blue "Monitoring" status pill + an amber "Major" severity pill + "started 42m ago". Inside
it, a vertical timeline (newest first) of 3 updates — EACH update carries a colored REGION BADGE showing
which AWS region the engineer posted from: alternate 🇸🇬 ap-southeast-1 (violet) and 🇺🇸 us-east-1 (blue),
with author + relative time + UTC clock, and the message text. This region-badge timeline is the visual
proof of multi-region writes — make the badges crisp and legible.

BOTTOM: a "Get notified" card with an email input + green "Subscribe" button, and a centered link
"View 90-day uptime history →".

Also depict (as a thin amber banner under the overall banner) an optional "Mock mode" state:
"Mock mode — no Aurora DSQL endpoint configured, serving an in-memory store. Region badges reflect the
demo lens, not real cross-region writes." It should look like an honest dev affordance, not an error.
```

## SCREEN 2 — On-call console (/admin)
```
The ShipLog on-call console. Header "On-call console", subhead "Declare incidents, post updates, flip
component status — from any region." Region switcher top-right. A red "+ Declare incident" button.

INCIDENTS LIST: a bordered card, one row per incident — a status pill (Investigating/Identified/
Monitoring/Resolved) + a severity pill (Minor/Major/Critical) + the title, and on the right a muted
"opened from [region badge] · 28m ago". Rows hover-highlight and link to the incident detail.

COMPONENT STATUS controls: a card titled "Component status", one row per component: status dot + name +
a status dropdown (Operational / Degraded / Partial outage / Major outage / Maintenance). After a change,
show an inline monospace confirmation on the right in green: "✓ us-east-1 · retried 2×" (or "· consistent").
A footer line: "writing as [region badge]".

Show the "Declare incident" form expanded in one variant: a title input, a first-update textarea, a
severity dropdown, a name field, a "from [region badge]" hint, and Cancel / red "Declare" buttons.
```

## SCREEN 3 — Incident detail (/admin/incident/[id]) — the multi-region writing surface
```
A single-incident page. Back link "← Console" top-left, region switcher top-right. A row of pills:
status ("Monitoring", blue) + severity ("Major", amber) + "opened from [🇸🇬 ap-southeast-1 badge] · 42m ago".
Big serif incident title.

POST-AN-UPDATE CARD: titled "Post an update". A large textarea placeholder "Post an update as
us-east-1…", a status dropdown ("— keep status —" / Set: investigating / identified / monitoring /
resolved), a name input, a hint "posting from [region badge]", and a primary "Post update" button.
Below the form, show the SIGNATURE confirmation line in green:
"✓ Committed via us-east-1 — DSQL detected a concurrent edit and we auto-retried 2×; nothing lost."
Also depict the conflict variant in amber: "⚠ Write conflict after max retries — by design, DSQL
rejected rather than lose a write. Try again." Make this OCC-retry messaging feel like a feature.

TIMELINE: section "Timeline" — the full vertical timeline of updates, newest first, each with its
status pill, region badge, author, relative + UTC time, and message. A connector line with node dots.
```

## SCREEN 4 — Uptime history (/history)
```
The uptime history page. Header "Uptime history", subhead "90-day uptime per component. Each bar is one
day — hover for the exact figure." For each component (API, Database, CDN, Dashboard, Auth): the
component name, then a 90-DAY UPTIME BAR — 90 thin vertical segments side by side, mostly green
(operational), with a few amber/orange dips, and a small right-aligned "99.98% uptime" figure. Under the
bar, tiny captions "90 days ago" (left) and "Today" (right). Crisp, calm, lots of whitespace — the
uptime bar is the signature visual, make it the hero of this screen.
```

---

## Tips for Stitch specifically
- Generate **one screen per prompt**; Stitch keeps the theme across generations in the same project.
- If a screen reads busy: follow up with *"simplify — more whitespace, fewer borders, calmer."*
- To push brand: *"make headlines more serif/editorial; reserve color strictly for status + region badges."*
- The single most important things to get right visually are the **region badge on every timeline entry**
  and the **OCC-retry confirmation line** — they ARE the submission's story. Ask Stitch to make them prominent.
- Export to **Figma** to refine, or to code for direction — then let **v0** ([v0-ui-spec.md](v0-ui-spec.md))
  produce the actual React/Tailwind that wires onto the DSQL backend.
