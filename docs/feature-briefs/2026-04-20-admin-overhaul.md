# Admin Overhaul — Prototype Brief

**Date:** 2026-04-20
**Feature slug:** `admin-overhaul`
**Audience:** parallel HTML prototype agents (Stage 8 of mb-development)
**Output location:** `docs/prototypes/admin-overhaul/<angle-slug>.html`

Every prototype agent reads this single file instead of exploring the FE codebase. If something isn't in here, you don't need it.

---

## 1. Requirement

bwell is an Expo React Native CBT therapy app (iOS / Android / web) with three roles: Patient, Therapist, Admin. Patient and Therapist surfaces are deep and considered; Admin today is a placeholder (three text rows + a verify-therapists picker). We are defining what the Admin role should *do* and shipping a first-class surface for it. The admin is explicitly non-clinical — they do not read individual clinical notes; they read aggregates, queues, and audit logs. Every prototype you produce is a candidate design for the admin's first-class home, backed by the BE surface described below.

---

## 2. API contract (authoritative)

All endpoints live under `/api/admin/*`, guarded by `authenticateUser + authorizeAdmin`. Responses are JSON; cookie-based session auth.

### 2.1 `GET /api/admin/overview`

No query params. One call per dashboard load.

```ts
type AdminOverviewResponse = {
  asOf: string                              // ISO UTC request time
  rollupAsOf: string | null                 // ISO UTC — last successful rollup; null pre-rollup
  privacyMode: 'production' | 'reduced'     // 'reduced' in dev

  operational: {
    users: {
      total: number
      patients: number
      therapists: {
        total: number
        verified: number
        unverified: number
        zeroPatients: number                // verified therapists with no assigned patients
      }
      newThisWeek: number
      newLastWeek: number
      activeLast30d: number                 // users with ≥1 submitted attempt last 30d
      activeLast30dPrevious: number         // same metric, preceding 30d window
    }
    work: {
      completedAttemptsLast7d: number
      completedAttemptsPreviousWeek: number
      stalledAttempts7d: number             // started, not touched for 7+ days
      orphanedAssignments: number           // assignments for missing/unverified therapists
      byType: Array<{ moduleType: ModuleType; count: number }>
    }
    audit: {
      eventsLast7d: number
    }
  }

  programmes: Array<{
    programmeId: string
    title: string                           // e.g. 'Depression', 'Generalised Anxiety'
    enrolledUsers: number                   // distinct users with ≥1 attempt
    outcomes: {
      window: 'last_90d'
      instrument: Instrument                // 'phq9' | 'gad7' | 'pdss'
      recovery: OutcomeResult
      reliableImprovement: OutcomeResult
      reliableRecovery: OutcomeResult
    } | null                                 // null if the programme has no clinical instrument
  }>

  verificationQueue: {
    count: number
    oldest: Array<{
      userId: string
      username: string
      email: string
      name?: string
      createdAt: string                     // ISO UTC
      therapistTier: 'cbt' | 'pwp' | null
    }>                                       // up to 5 entries, oldest first
  }
}
```

### 2.2 `GET /api/admin/outcomes`

Filtered IAPT outcome time-series.

```
?instrument=phq9|gad7|pdss        REQUIRED
&programmeId=<ObjectId|'all'>      default 'all'
&careTier=self_help|cbt_guided|pwp_guided|'all'   default 'all'
&granularity=week|month            default 'month'
&from=<ISO>                        default: 12 months ago (or 12 weeks if granularity=week)
&to=<ISO>                          default: now
```

```ts
type AdminOutcomesResponse = {
  asOf: string
  rollupAsOf: string | null
  privacyMode: PrivacyMode
  dimension: {
    programmeId: string | null
    careTier: CareTier | null
    instrument: Instrument
  }
  range: { from: string; to: string; granularity: 'week' | 'month' }
  series: Array<{
    bucket: { startsAt: string; endsAt: string }    // ISO UTC, contiguous, non-overlapping
    recovery: OutcomeResult
    reliableImprovement: OutcomeResult
    reliableRecovery: OutcomeResult
  }>
}
```

### 2.3 `GET /api/admin/programmes/:id`

Single programme detail.

```ts
type AdminProgrammeDetailResponse = {
  asOf: string
  rollupAsOf: string | null
  privacyMode: PrivacyMode
  programme: { _id: string; title: string; description: string }
  enrolment: {
    total: number
    byCareTier: Array<{ careTier: CareTier; count: number }>
  }
  outcomesByInstrument: Array<{
    instrument: Instrument
    cutoff: number
    reliableChangeDelta: number | null
    window: 'last_90d'
    overall: {
      recovery: OutcomeResult
      reliableImprovement: OutcomeResult
      reliableRecovery: OutcomeResult
    }
    byCareTier: Array<{
      careTier: CareTier
      recovery: OutcomeResult
      reliableImprovement: OutcomeResult
      reliableRecovery: OutcomeResult
    }>
  }>
  work: {
    completedAttemptsLast7d: number
    stalledAttempts7d: number
    byType: Array<{ moduleType: ModuleType; count: number }>
  }
}
```

### 2.4 `GET /api/admin/audit`

Paginated, filterable audit log.

```
?actorId=<ObjectId>            optional
&action=<AuditedAction>         optional
&resourceType=<string>          optional
&resourceId=<ObjectId>          optional
&cursor=<ISO>                   optional (paginate by `at` DESC)
&limit=<number>                 default 50, max 200
```

```ts
type AdminAuditResponse = {
  success: true
  events: Array<AdminAuditEvent>
  nextCursor: string | null
}

type AdminAuditEvent = {
  _id: string
  actorId: string
  actor: { _id: string; username: string; name?: string }
  actorRole: 'admin'
  impersonatorId: string | null               // always null today
  action: AuditedAction
  resourceType: string
  resourceId: string | null
  outcome: 'success' | 'failure'
  context?: Record<string, unknown>
  ip?: string
  userAgent?: string
  at: string                                    // ISO UTC
}
```

### 2.5 `GET /api/admin/system/health`

Ops-facing; not typically on the landing view but available for drill-in.

```ts
type AdminSystemHealthResponse = {
  rollupLastRun: {
    startedAt: string
    completedAt: string | null
    status: 'success' | 'partial' | 'failure'
    rowsWritten: number
  } | null
  auditEventsTotal: number
}
```

### 2.6 Shared-types names (for FE integration later — not for HTML decks)

Defined in `@milobedini/shared-types@1.0.100`:

- `AdminOverviewResponse`, `AdminOutcomesResponse`, `AdminProgrammeDetailResponse`, `AdminAuditResponse`, `AdminAuditEvent`, `AdminSystemHealthResponse`
- Primitives: `Instrument`, `CareTier`, `TherapistTier`, `AuditedAction`, `MetricName`, `PrivacyMode`, `Granularity`, `OutcomeResult`

---

## 3. Business rules & invariants

These are data-level contracts. Your design must not imply a surface that would violate them.

1. Every response includes `asOf: string`.
2. Every outcome-bearing response includes `rollupAsOf: string | null` and `privacyMode: 'production' | 'reduced'`.
3. **Every `OutcomeResult` is `{ rate: number | null; n: number; suppressed: boolean; reason: 'below_k' | 'below_min_n' | null }`.** `rate === null` iff `suppressed === true`. The FE must not divide anything itself.
4. **Suppression is k-anonymity + min-N.** In production, cells with fewer than 5 qualifying patients are suppressed (`reason: 'below_k'`); cells with ≥5 but <20 are suppressed (`reason: 'below_min_n'`). `n` is always returned — you can say "fewer than 5 patients" without displaying the rate.
5. **`privacyMode: 'reduced'`** means dev/staging thresholds are lowered. Designs may include a visible "dev mode" marker when this is `'reduced'`.
6. Series buckets in `/outcomes` are contiguous and non-overlapping. **Zero-denominator buckets still appear** as `{ rate: null, n: 0, suppressed: true, reason: 'below_k' }`. Your timeline must be able to render a populated time-axis with mostly empty cells (small-scale state).
7. Dimensions always include `instrument`. `programmeId` / `careTier` may be `null` to denote "aggregate across all".
8. **Role semantics:** admin is non-clinical. Do not surface free-text clinical notes, answers, or individual patient questionnaire scores on admin screens — even by accident. Admins see:
   - Aggregate rates, counts, queues, timelines
   - User profiles (read-only — fields like name/email/role/tier/createdAt/lastLogin)
   - Audit log entries (who did what when)
9. **IAPT metric definitions** (a design can't show three different recovery rates for the same window):
   - `recovery` = started above clinical cutoff, finished below
   - `reliableImprovement` = baseline − endpoint ≥ clinically-meaningful Δ (regardless of baseline severity)
   - `reliableRecovery` = both of the above. Strictest; always ≤ recovery rate.
10. **Care tiers:** `self_help` (no therapist), `cbt_guided` (CBT therapist), `pwp_guided` (PWP therapist). These are derived from the current therapist assignment, not from attempt history.
11. **Verification queue shows up to 5 oldest unverified therapists on `/overview`.** Full list lives behind the existing `/api/user?roles=therapist&isVerifiedTherapist=false` — designs can hint at "View all" but don't need to render the full list.
12. **`therapistTier` is required at verify time** (values `'cbt' | 'pwp'`). The verify flow is a simple form: pick therapist → pick tier → confirm. Designs can include a compact verify UI on the home, or defer it to a modal.
13. **Audit log context is opaque.** Keys vary per action. Do not assume a schema; render the known fields (`action`, `actor`, `resourceType`, `at`, `outcome`) and treat `context` as opaque metadata.

---

## 4. UX stimuli (inventory — no verdict)

Raw inventory from Stage 2 research. **Contradictions are kept on purpose.** Your angle (given to you separately in the Stage 8 prompt) is the lens you read this through.

### Paradigms seen in the wild

- **Classic KPI grid** — Stripe, Mixpanel, Amplitude, GA. Tiles + charts. First unit: big number + delta.
- **Activity stream / inbox** — Linear Inbox, GitHub Notifications, Front. Reverse-chrono rows of things needing attention.
- **Ops queue** — Zendesk, Intercom, Jira SM, PagerDuty. Prioritised tickets with ownership + severity.
- **Command palette / search-first** — Superhuman, Raycast, Linear Cmd-K. Near-empty with one input.
- **Story / storyboard** — Baremetrics Forecast+, Geckoboard Sendable. Weekly narrative with charts inline.
- **Cohort / retention matrix** — Amplitude, Mixpanel. Colour-gradient grid.
- **Alert / incident board** — PagerDuty, Opsgenie, Datadog Incidents. Status lights dominate.
- **Narrative / natural-language** — Notion AI Home, Akkio, Glean. LLM-authored summary at top.
- **Widget board (configurable)** — Grafana, Kibana, Datadog. User drags tiles.
- **Register / ledger** — Retool, Airtable admin, Ragic. Spreadsheet-first, no charts.
- **Population health panel** (EHR-specific) — Epic Healthy Planet, Cerner. Patient roster by risk tier.
- **Compliance posture** — Vanta. Big gauge % + failing controls list.

### Named examples & their first visual element

- **Stripe Dashboard home** → line chart + today's money figure.
- **Linear Inbox** → two-pane, list of notification rows.
- **PagerDuty home** → red/amber/green severity pill row.
- **Intercom Inbox** → conversation row with avatar + snippet.
- **Epic Healthy Planet** → horizontally-banded patient roster by risk tier.
- **Athenahealth admin** → task count bucket.
- **SimplePractice therapist admin** → today's calendar strip.
- **Spring Health employer admin** → one hero utilisation %.
- **Lyra Health provider portal** → caseload rows with sparklines.
- **Notion AI Home** → one generated English sentence.
- **Grafana** → user-built tile grid, charts only.
- **Datadog home** → SLO banner + infra health map.
- **Segment admin** → source→destination topology diagram.
- **Discourse admin** → "Problems Found" pill count.
- **Baremetrics Forecast+** → projected MRR in 90 days (forward-looking, not backward).
- **Vanta** → one big circular % + failing controls list.
- **Ragic / Retool / Airtable admin** → filterable data grid.

### Contradictions worth preserving

- **Hero number vs wall of rows** — Spring Health: single utilisation figure. Intercom: 50+ rows.
- **Surface alerts loudly vs hide them** — PagerDuty: red dominates. Linear: urgent moved to a separate tab; home is calm.
- **Charts vs tables** — Grafana charts-only; Retool/Ragic tables-only. Both claim "admin home".
- **Configurable vs opinionated** — Grafana: drag-your-own-grid. Stripe/Linear: hand-curated, no customisation.
- **Search-first vs list-first** — Superhuman: one input, no list. Intercom: list of 50, search is an icon.
- **Narrative vs numeric** — Notion AI Home: a sentence. Mixpanel Boards: a funnel diagram.
- **Today-only vs rolling-30** — Calendly: today first. Stripe: last 7d. Amplitude: last 30d.
- **Action-centric vs informational** — Zendesk: "claim a ticket now". Headspace B2B: "look at a chart, do nothing".

### Anti-patterns documented in literature

- Vanity metrics (DAU/MAU with no comparator).
- Generic "last 30 days" — hides weekly cyclicality; therapy volume differs Mon vs Sun.
- Alert fatigue — everything red = nothing red.
- Sparkline wallpaper — 20 unreadable sparklines none help decisions.
- No empty state — assumes data exists.
- Pie-chart overload — categorical breakdowns that don't sum meaningfully.
- Click-through maze — every tile requires drill-down; home never lets admin finish a task.
- Hidden role scoping — admin seeing cross-org data without clear scope indicator.
- Metric soup without time comparison.
- Colour-only coding — fails for colour-blind users.
- Dashboard-as-export-trigger — home is useless, only used to export CSV.

### Divergent treatments worth noting

- **Discourse "Problems Found" pill** — self-diagnostic: the app tells the admin what needs attention, not what users are doing.
- **Linear "My Issues" as home** — personalised to the logged-in human, not the org.
- **Notion AI Home sentence** — one paragraph, no chart.
- **Segment topology diagram** — admin reads a graph, not a list.
- **Superhuman empty-inbox celebration** — dashboard *disappears* on clean state.
- **Baremetrics Forecast+** — dashboard projects forward, not backward.
- **Vanta gauge** — one big %, one failing list, nothing else.
- **Retool app-builder-as-admin** — admin edits the admin panel in place.

---

## 5. Design tokens

The production bwell design language is documented at `.claude/rules/figma-design-system.md` (in this repo). Full file is the source of truth for RN implementation, but for HTML decks these are the tokens you want in your CSS `:root`:

```css
:root {
  /* Core palette */
  --sway-dark: #0c1527;             /* app background */
  --sway-lightGrey: #e0e9f3;        /* primary text */
  --sway-darkGrey: #a6adbb;         /* secondary text */
  --sway-bright: #18cdba;           /* primary teal */
  --sway-buttonBg: rgb(43, 59, 91); /* solid button bg */

  /* Status / signal */
  --error: #FF6D5E;
  --success: #76AB70;
  --warning: #FFB300;
  --info: #FFD15D;

  /* Card surfaces */
  --card: #262E42;
  --card-alt: #334368;
  --card-deep: #0B1A2A;

  /* Chip / pill */
  --chip-pill: #1E2A45;
  --chip-pill-pressed: #253352;

  /* Tints (translucent accents) */
  --tint-teal: rgba(24, 205, 186, 0.15);
  --tint-teal-border: rgba(24, 205, 186, 0.3);
  --tint-error: rgba(255, 109, 94, 0.15);
  --tint-info: rgba(255, 209, 93, 0.15);
  --tint-neutral: rgba(166, 173, 187, 0.12);

  /* Therapist accent (optional — can use for admin differentiation) */
  --therapist-purple: #7C3AED;

  /* Overlays */
  --overlay-medium: rgba(0, 0, 0, 0.5);
  --divider: rgba(166, 173, 187, 0.1);
}
```

### Typography

Font family: **Lato** (load from Google Fonts). Body uses regular; headings Black/Bold. **SpaceGrotesk** is used for toast text in production but not needed for HTML decks.

| Role | Weight | Size (px) |
|---|---|---|
| Title | Bold | 32 (36 on web) |
| Subtitle | Black | 24 (28 on web) |
| Small title | Black | 20 |
| Button | Bold | 20 |
| Default body | Regular | 18 |
| Small | Regular | 14 |
| Small bold | Bold | 14 |
| Link (uppercase) | Regular | 13 |

### Spacing

Tailwind default scale via NativeWind in production. For HTML, use `gap: 8px / 16px / 24px / 32px` as your ladder.

### Overall feel

Dark-themed only. No light variant. Prefer teal sparingly as an accent, lean on typography + spacing + contrast. Subtle motion; respect `prefers-reduced-motion`.

---

## 6. Existing component inventory (conceptual, RN — use as reference, not pixel spec)

Your HTML decks **do not need to use these** — they're a flat HTML file. But they're the vocabulary the production build will speak, so your design should be achievable with them + a small number of new components.

**Layout wrappers**
- `Container` — full-bleed dark background, headerless
- `ContentContainer` — same with `px-4` + visible screen header

**Text & buttons**
- `ThemedText type="title" | "subtitle" | "smallTitle" | "button" | "default" | "small" | "smallBold" | "link" | "italic" | "error"` — the only text component
- `ThemedButton variant="default" | "outline" | "error"` — teal / bordered / destructive
- `PrimaryButton` — wide hero button for onboarding / CTA moments
- `SecondaryButton` — full-width rounded profile/settings button

**Data display**
- `StatStrip` (existing therapist dashboard) — row of KPI numbers
- `Chip` — small pill
- `StatusChip` / `AssignmentStatusChip` — coloured status pill
- `BarSparkline` — tiny bar-chart row of trend data
- `Sparkline` — line sparkline for patient scores
- `Collapsible` — section expander
- `EmptyState` — icon + message
- `TypewriterText` — animated text reveal
- `BloomBurst` — imperative celebratory burst animation

**Lists & navigation**
- `ClientCard` (therapist dashboard) — patient row with score + status + caretier
- `TriageBucket` — grouped list with a header and collapse state
- `FocusCard` / `ComingUpList` / `EffortStrip` / `ProgressSection` — patient dashboard atoms
- `ActionMenu` — contextual actions modal with built-in destructive confirmation

**Form fields**
- `SelectField`, `SearchPickerDialog`, `DueDateField`, `RecurrenceField`, `KeyboardAvoidingWrapper`

**Icons**
- `IconSymbol` — cross-platform wrapper (SF Symbols on iOS, Material Icons fallback)
- Material Design Icons (primary) + Material Icons + Ionicons already installed

**Colour system**
- All `Colors` tokens from `constants/Colors.ts` (mirrored in §5 above)

---

## 7. Reference file paths (for pattern, not for exhaustive reading)

If you must see production code for inspiration, these three are the most informative:

1. **`components/home/PatientDashboard.tsx`** — how a role's home is composed from smaller cards (FocusCard / ProgressSection / EffortStrip / ComingUpList). Stacked, deliberate, no chrome.
2. **`components/home/TherapistDashboard.tsx`** — a data-dense dashboard with triage buckets (needsAttention / completed / noActivity), each rendering `ClientCard` rows. Good reference for queues + grouped lists.
3. **`components/home/dashboard/StatStrip.tsx`** — the KPI row component. Four numbers + labels.

**Hooks for data shape** (you won't wire data, but these show how the FE consumes the BE):
- `hooks/useTherapistDashboard.ts`
- `hooks/usePatientDashboard.ts`
- `hooks/useUsers.ts` (contains `useProfile`, `useAdminStats`, etc.)

---

## 8. Out of scope for exploration

Do **not** read or scan these directories — everything you need is either in this brief or in the 3 reference files named above. Prototype agents that explore the codebase burn tokens and converge on generic designs; the constraint is deliberate.

- `components/attempts/**` — patient-facing CBT tool presenters
- `components/journey/**` — patient-only progress screens
- `components/practice/**` — patient-only
- `components/module/**` — patient-only module flow
- `components/review/**` / anything named `*Review*` — therapist review queue
- `components/therapist/**` — therapist-specific
- `components/patient/**` — patient-specific
- `components/user/**`, `components/admin/**`
- `app/**` — expo-router pages; not relevant to HTML decks
- `api/**`, `stores/**`, `utils/**` — implementation wiring

---

## 9. HTML format spec (MANDATORY — follow exactly)

Your deliverable is a **single self-contained `.html` file** — presentation-style, not pixel-perfect mock. The goal is to communicate thinking so the user can compare N prototypes in ~10 minutes.

**File location:** `docs/prototypes/admin-overhaul/<angle-slug>.html`

**Required sections, in order:**

1. **Hero panel** — feature name, the angle this prototype embodies, one-sentence design philosophy.
2. **Flow map** — 3–6 annotated wireframe panels showing the main user journey at mobile width (~375px wide). Each panel has a caption and labelled callouts (arrows or numbered pins to elements with notes).
3. **State gallery** — empty, loading, success, error, and edge cases, shown as smaller thumbnails with state labels.
4. **Animation callouts** — 2–4 motion moments described in words, with simple inline CSS `transition` or `@keyframes` so the feel is visible. Label each: what triggers it, what moves, rough timing.
5. **Component breakdown** — short list of custom components this design introduces, plus which existing components (from §6) it reuses.
6. **Rationale** — 3–5 bullets on why this design serves the angle.

**Style rules:**

- Inline CSS only. No build step. No external JS frameworks (Google Fonts and bwell iconography-via-emoji or inline SVG are fine).
- Bwell colour tokens declared as CSS variables at `:root` (copy from §5).
- Lato loaded from Google Fonts (or use a local fallback stack if you prefer).
- Mobile panels framed at roughly 375px wide inside a wider desktop layout so the user can scan multiple panels at once.
- Designed to be read by scrolling top-to-bottom in a desktop browser.

**Explicitly NOT required:**

- Pixel parity with production
- Real data binding or API calls (invent realistic sample data per §2 contract shapes)
- Working interactions beyond CSS `:hover`, `:focus`, `@keyframes`, and basic form state
- React Native feasibility checks (the component inventory already lists achievable primitives — trust it)

**Sample data to use** (for realism — invent around these):

- Admin account: `admin@bwell.test`
- 3 programmes: Depression, Generalised Anxiety, Sleep Health
- Clinical instruments enabled today: PHQ-9 (Depression), GAD-7 (Generalised Anxiety). Sleep Health has no clinical outcome.
- ~30 patients (10 self-help, 10 CBT-guided, 10 PWP-guided)
- 3 therapists (2 CBT, 1 PWP, 18 other verified therapists in queue hypothetically)
- Recovery rates that feel plausible in dev: PHQ-9 Depression recovery ≈ 40%, GAD-7 Anxiety recovery ≈ 35%, suppressed for smaller tiers
- Sample audit actions: `therapist.verified`, `user.viewed`, `module.created`
- Sample stalled attempts: 3. Orphaned assignments: 1. Zero-patient verified therapists: 2.

**Accessibility:** ensure contrast meets WCAG AA against the dark palette. Use semantic HTML where it makes sense (`<main>`, `<section>`, `<nav>`, `<table>` for tabular data). Include a `prefers-reduced-motion` query that disables decorative animations.

---

## 10. BE change requests

If something in your design would need a BE contract change to work, **do not invent BE behaviour**. Add a short note to your rationale section flagging it: *"This design assumes X; if we want to ship it we'd need the BE to add Y"*. The controller will collect these notes at the start of Stage 9 before any RN build begins.
