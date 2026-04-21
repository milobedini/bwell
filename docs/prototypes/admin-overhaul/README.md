# Admin Overhaul — Session Handoff

**Last updated:** 2026-04-21 (evening pass)
**Branch (FE):** `feat/admin-overhaul`
**Branch (BE):** `main` (BE commits land direct-to-main per project convention)
**Status:** Stages 1–9 complete, plus two 2026-04-21 refinement passes. The
morning pass covered visual fidelity, the data-pairing model, scheduler
resilience, and seed realism. The evening pass worked through the first three
near-term items from `docs/plans/admin-future.md` (programme detail screen,
suppressed-hero collapse, audit log list view) and corrected a sort/filter/facet
convention slip that surfaced during the audit work. Stages 10 (test audit) +
11 (finalise PR) still pending.

This document is a self-contained handoff. A future session can pick up from here
without any of the conversational context. Everything material lives in the
spec, the plan, the prototype brief, and the commits — this README is the map.

If the handoff conflicts with what you see in code, **trust the code** and
update this file. Authoritative order when specs disagree: spec → plan →
brief → this README.

---

## 1. What this feature is

Define and ship a first-class Admin role for bwell. The admin is
**explicitly non-clinical**: they do not read individual patient notes or scores.
They see aggregates, queues, audit events, and IAPT-style clinical outcomes
(recovery / reliable improvement / reliable recovery) across the platform.

Today, admin had a placeholder home (three text rows + a verify-therapists
picker). After this work, admin has:

- A full backend surface under `/api/admin/*` (5 endpoints + audit + nightly rollup job)
- A full-screen `AdminHome` dashboard built in React Native
- A verify/unverify-therapist flow that captures and records `therapistTier`
- A curated audit trail on admin actions and admin PHI access

---

## 2. Where we are in the mb-development workflow

| Stage | Name | Status |
|---|---|---|
| 1 | Capture requirement | ✅ |
| 2 | Research | ✅ (two outputs — in conversation, not saved to disk) |
| 3 | Brainstorm BE architecture | ✅ → spec below |
| 4 | Write BE implementation plan | ✅ → plan below |
| 5 | Build backend | ✅ → commits below |
| 6 | Divergence angles | ✅ (6 angles — one per deck below) |
| 7 | Prototype brief | ✅ → brief below |
| 8 | Parallel HTML prototypes | ✅ (6 decks in this folder) |
| 9 | Winner selection + RN build | ✅ (clinical-outcomes-first + blend, built + full-screen) |
| 10 | Test audit | ⏸ optional; not started |
| 11 | Finalise PR(s) | ⏸ not started |

Deliverable alongside the workflow:

| | Future-plan notes doc | ✅ `docs/plans/admin-future.md` — shipped §1.1 / §1.2 / §1.3 on 2026-04-21 evening, renumbered remaining items |

A second refinement pass on 2026-04-21 (morning) landed on top of stage 9
(not a separate stage). It covered four areas:

1. **Visual fidelity** — the `AttentionBanner` was rebuilt as an SVG
   ring-gauge with per-contributor MDI icons and inline CTAs, and a
   12-month recovery sparkline was added to `LeadProgrammeCard`. Icon
   vocabulary ported from the `compliance-gauge` blend source. Icons rather
   than unicode glyphs are now the project rule.
2. **Data-pairing model** — the rollup switched from within-bucket pairing
   to trailing-90d patient-level pairing snapshotted at each bucket
   endpoint (§4.8). Restores correct recovery rates for arcs that span
   more than one month.
3. **Scheduler resilience** — on-boot catch-up replays every missed 02:00
   slot (cap 60), plus a new `rollup-metrics:backfill` CLI for populating
   historical snapshots. Render free-tier spin-down no longer silently
   drops nightly rollups.
4. **Seed realism** — `seed:admin-dev` now produces ~12 months of
   staggered cohorts with four lifecycle archetypes (active / recovered /
   stable / dropout), so the trailing-90d sparkline renders a realistic
   trend line. Seed commands renamed into a consistent `seed:*` namespace
   with a new `seed:all` orchestrator.

A third refinement pass on 2026-04-21 (evening) walked through the first
three near-term items from `admin-future.md` and corrected an FE sort/filter/facet
convention slip that surfaced along the way:

1. **Programme detail screen (was `admin-future.md §1.1`)** — new route
   `home/programmes/[id]` (thin wrapper) + `ProgrammeDetailScreen` component
   composing `FreshnessRow`, per-tier enrolment stat cards, one per-instrument
   block containing the overall `OutcomeTriplet` and a refactored
   `CareTierBreakdown` (now a 3-col tier × triplet table matching the
   winning deck's Panel B), a conditional k-anonymity suppression note, and
   a work section with completed/stalled cards + by-module-type rows.
   `LeadProgrammeCard` and `ProgrammeRow` now wrap in `Pressable` with
   `router.push` to the detail route. Non-clinical programmes (empty
   `outcomesByInstrument`) fall back to a "No clinical instrument attached"
   card and skip the clinical outcomes section. `useAdminProgrammeDetail`
   hook added, 5-min staleTime, key `['admin', 'programme', id]`.
2. **Lead hero suppressed state (was `admin-future.md §1.2`)** — when
   `outcomes.recovery.suppressed` is true, `LeadProgrammeCard` now drops the
   56pt italic `—` hero + `%` glyph + "Recovery · n = ..." caption entirely.
   In their place: a header-weight "Awaiting data · needs 5+ paired
   assessments" line (or "20+" for `below_min_n`) plus a small "Currently N
   paired · last 90 days" caption. The triplet below is the canonical source
   of truth. Populated rendering is unchanged.
3. **Audit log list view (was `admin-future.md §1.3`)** — new route
   `home/audit` + `AdminAuditScreen` with header, filters pill showing active
   count, `FlatList` of bordered-card rows, `onEndReached` infinite scroll,
   refresh control, filter-aware empty-state copy. `AuditRow` renders the
   action name with outcome-aware colour (teal for high-salience success like
   `therapist.verified` / `module.created`, grey for read actions like
   `user.viewed`, red for `failure`), a relative timestamp, a one-line summary
   built from `actor.username + resource + context.tier`, and expands on tap
   to show the opaque `context` JSON in a dark-deep box. `AuditFilterDrawer`
   slides in from the right (matches `UserFilterDrawer`) with action chips
   (single-select, 6 enum values) and actor chips (with counts). Entry
   link-row on `AdminHome` under the ops footer shows the last-7d event total
   and navigates to the screen. `useAdminAudit` infinite-query hook uses
   cursor pagination (`nextCursor`) and `keepPreviousData`.
4. **Sort/filter/facet convention correction** — during the audit log work,
   the FE was initially deriving actor filter options from loaded pages
   client-side (incomplete as you scroll, collapses when you select an
   actor, empty when the filter returns zero rows). This violates the
   project convention that the BE owns sorting/filtering/faceting. Corrected:
   `GET /admin/audit` now returns `facets: { actors: [{ _id, username, name?,
   count }] }` keyed off the current non-actor filter, so the list stays
   stable across scroll and doesn't collapse when one actor is selected.
   `AdminAuditActorFacet` + `AdminAuditFacets` types added to shared-types.
   FE swapped to reading `data.pages[0].facets.actors`. Matches the
   `UsersFacets` precedent on `/user/users`.

---

## 3. Canonical artefacts

All paths relative to the FE repo root `/Users/milobedini/Documents/git/bwell`.

| Artefact | Path | First commit |
|---|---|---|
| Spec (brainstorm output) | `docs/superpowers/specs/2026-04-20-admin-overhaul-design.md` | `2cd1211` |
| BE implementation plan | `docs/superpowers/plans/2026-04-20-admin-overhaul-plan.md` | `3521def` |
| Prototype brief (for Stage 8 agents) | `docs/feature-briefs/2026-04-20-admin-overhaul.md` | `fbd6c34` |
| 6 HTML prototype decks | `docs/prototypes/admin-overhaul/*.html` | `e3d7781` onward |
| This file | `docs/prototypes/admin-overhaul/README.md` | |

If any future work disagrees with this README, **the spec is authoritative**, then
the plan, then the brief.

---

## 4. Locked-in design decisions (and why)

Read these before touching any admin code. Every single one is enforced in the
spec and the shipped code.

### 4.1 Admin is the top of the role tree (no owner)

**Why:** SimplePractice / Linear / Notion split a top-level "owner" tier from
"admin" for billing + security settings. We're single-tenant today with one
admin. Introducing an owner tier is scope creep. Flagged for future-plan.

### 4.2 Admin is non-clinical

**Why:** UK GDPR Art. 5 (data minimisation) + DCB0129. An admin who can see
individual clinical notes is harder to defend than one who only sees aggregates.
Admin surfaces show: counts, queues, outcome *rates*, audit events, read-only
user profile fields. Admin surfaces do **not** show: free-text notes, individual
questionnaire scores, patient answers, therapist notes.

### 4.3 IAPT three-rate metric model

**Why:** IAPT has published, defensible definitions for three rates — using
them gives us clinically credible numbers rather than vanity metrics.

- **Recovery** = started above clinical cutoff, finished below.
- **Reliable improvement** = baseline − endpoint ≥ clinically-meaningful Δ
  (regardless of baseline severity).
- **Reliable recovery** = both of the above. Strictest. Always ≤ recovery rate.

Every admin UI that shows recovery **must show all three together** — showing
recovery alone invites regression-to-mean interpretation errors. Enforced by
`OutcomeTriplet`.

### 4.4 k-anonymity + min-N suppression at read time

**Why:** PHI special-category data rules. Any slice with `< K_ANONYMITY_THRESHOLD`
qualifying patients returns `{ rate: null, n, suppressed: true, reason: 'below_k' }`.
Any slice ≥ k but `< METRICS_MIN_N_FOR_DISPLAY` returns `reason: 'below_min_n'`.

- **Production defaults:** k=5, minN=20.
- **Production boot-guard:** if NODE_ENV=production and either env var is below its
  floor, the default is forced and a warning is logged. In `src/utils/thresholds.ts`.
- **Dev:** set `K_ANONYMITY_THRESHOLD=1` and `METRICS_MIN_N_FOR_DISPLAY=1` in BE
  `.env` to see populated numbers while the user base is small. Response
  includes `privacyMode: 'reduced'` so UI can flag dev state.

### 4.5 Care tier is a first-class cut (self_help / cbt_guided / pwp_guided)

**Why:** the product is effectively three products sharing a codebase. Knowing
whether they work differently is the kind of signal admin exists to see.
Per-therapist cuts were **deliberately excluded** — employment/supervision
territory that needs HR/legal sign-off before we expose.

Derived at rollup time from the therapist field on attempts. `therapistTier`
lives on `User` (new field). Unverified therapists or missing therapist → tier
falls back to `self_help`.

### 4.6 Operational vs analytical: separate query paths

**Why:** operational counts (user totals, queues, week-over-week deltas) are
cheap index lookups. IAPT rates are pairwise joins with suppression and
bucketing — different query shape entirely. Mixing them in one endpoint or one
query forces the cheap ones to wait behind the expensive ones.

- **Operational:** live Mongo aggregation, served request-time.
- **Analytical:** pre-computed in a `MetricsRollup` collection by a nightly job
  at **02:00 Europe/London**. Read-time apply suppression.

### 4.7 Audit log, sensitive-actions-only (curated)

**Why:** "log every admin write" middleware always regrets itself — log fills
with low-value HTTP entries and the important ones get buried. We curate a
semantic `AuditedAction` enum and call `logAdminAction()` at each call site. The
log becomes directly queryable by action name.

Current `AuditedAction` values:
`therapist.verified`, `therapist.unverified`, `user.viewed`,
`patient.attemptsViewed`, `module.created`, `admin.loggedIn`.

Impersonation is **deferred** (full token-propagation + write-blocking is its
own brainstorm). `impersonatorId` is reserved on `AdminAuditEvent` but always null.

### 4.8 Trailing-90d snapshot rollups (revised 2026-04-21)

**Why:** each bucket is now a *snapshot point*, not a data window. Every
rollup row answers "what is the trailing-90d recovery rate as of
`bucket.endsAt`?" This matches how IAPT / NHS Talking Therapies actually
publish outcomes and is stable against recovery arcs that straddle bucket
boundaries.

`/overview` reads the most recent snapshot row per dimension (no summing
over buckets). `/outcomes` returns a proper rolling trend line rather than a
stitched set of per-month rates. Suppression still applies per row;
denominators are larger so cells trip `< K` less often.

**Supersedes** the earlier within-bucket pairing trade-off. That model had
the failure mode of hiding any 2-month recovery arc because the monthly
bucket only saw the downstream tail (baseline below cutoff → excluded). See
spec §5.3 for the full computation rules and the migration note. Proper
IAPT-strict episode pairing (explicit episode boundaries + gap detection)
remains deferred.

### 4.9 Winning FE design (Stage 9): **clinical-outcomes-first + blend from compliance-gauge**

**Why:** of the 6 prototype decks, clinical-outcomes-first scored 93% against
the research. It was the only deck whose hero answers the question the admin
role exists to answer. The compliance-gauge deck scored 86% — its composite
"X items need your attention" chip + day-one "unknown" treatment + privacy-mode
chip were superior to anything in the winner.

The blend:
- Base design: clinical-outcomes-first (layered IAPT triplet hero + programme
  strip + operational footer).
- Borrowed atop: composite attention banner (4 bands: green / amber / red /
  unknown) derived from existing `/overview` fields — no BE change required.
- Borrowed: suppression state treatment (dashed ring for unknown, honest
  "< N patients" language, privacy-mode chip).

**Rejected angles** (and why):
- **mission-control** — action-first queue. Misread the admin cadence
  (solo weekly-check-in, not daily fluent operator). Would have an empty queue
  most days.
- **narrative-brief** — prose-first. Strongest angle-commitment of all six
  but needed a new BE endpoint + LLM integration to ship. Deferred.
- **command-centre** — two-pane keyboard-first. Optimises for web density; bwell
  is RN-first with web as an also-ran.
- **kpi-dashboard** — baseline stacked cards. Safe and mergeable, but by
  definition hedges — no sharp opinion. We took its suppression-first-class
  language via osmosis but not its layout.

### 4.10 Icons, not unicode glyphs (2026-04-21)

**Why:** the first FE build used unicode glyphs (▲ ◆ ✕ ✓ ⟳) inside the
attention banner rows. Rendering is inconsistent across iOS / Android /
web font stacks, there is no control over stroke weight, and baselines
drift. The `compliance-gauge` deck itself used glyphs because it was
HTML, but the production app should use real icons.

All admin-dashboard icons now come from
`@react-native-vector-icons/material-design-icons` (MDI):

- verification → `account-clock-outline`
- stalled → `timer-sand`
- orphaned → `link-variant-off`
- rollup (fresh) → `check-circle-outline`
- rollup (stale) → `sync-alert`
- sparkline delta → `trending-up` / `trending-down` / `trending-neutral`

The rollup icon flips on state via `iconFor({ key, tripped })`; other
icons stay stable because they represent the *concept* regardless of
state. The ring-gauge centre ("0" / "?" / numeric) stays as text because
it's a figure, not iconography.

Enshrined as a project-wide convention in `CLAUDE.md` (FE).

### 4.11 Trailing-90d snapshot pairing replaces within-bucket (2026-04-21)

**Why:** the original within-bucket model treated each `(granularity,
startsAt, endsAt)` as a data window and paired attempts that landed
inside it. A patient whose baseline was in February and endpoint in April
would have both attempts excluded from the April monthly bucket (only
the April tail was in the window, baseline below cutoff). With 8-week
seed arcs, this produced **0% recovery** on a dataset that was supposed
to show ~40%.

The new model makes each bucket a **snapshot point**:
`completedAt ∈ [bucket.endsAt − 90d, bucket.endsAt)`. This matches IAPT /
NHS Talking Therapies' published reporting and is stable against arcs
that span multiple calendar months. `/overview` reads the most recent
snapshot row per dimension rather than summing buckets; the sparkline
shows trailing-90d rates at each bucket endpoint for a smooth rolling
trend. Full details in spec §5.3.

**Migration:** pre-2026-04-21 rollup rows are semantically stale the
moment this ships. Either wait for the on-boot catch-up (§4.12) or
`npm run rollup-metrics:backfill` in the BE repo to rewrite them. The
`upsertRollup` key is unchanged, so replay overwrites cleanly.

### 4.12 Scheduler catch-up on boot + explicit backfill (2026-04-21)

**Why:** `node-cron` is in-process. On free-tier Render web services
(where the BE currently lives), the container spins down after 15 min of
no HTTP traffic — if nothing pings it in the 02:00 London window, the
nightly rollup silently fails to fire. This was observable on Atlas:
zero `JobRun` rows across multiple nights.

`startScheduler()` now calls `catchUpIfMissed()` after wiring the cron.
Catch-up walks back every missed 02:00 slot since the last successful
`JobRun.completedAt` (or just the most recent slot on first boot),
capped at **60 slots** to guard against a months-long outage creating a
stampede at wake. Each slot runs `runNightlyRollup(slot)`, which writes
its own `JobRun` and upserts the week + month buckets for that date.

For rebuilds beyond the 60-slot cap (or for a fresh DB after `seed:all`
wants 12 months of sparkline history), the BE exposes
`npm run rollup-metrics:backfill [months] [weeks]` (defaults 12/12) —
explicit rather than inferring from JobRun state. Idempotent via the
same upsert.

### 4.13 Seed realism: staggered cohorts + four lifecycles (2026-04-21)

**Why:** the original `seed:admin-dev` gave every patient a uniform
8-week trajectory with a single `willRecover` flag. Combined with the
now-deprecated within-bucket pairing, this produced dashboards reading
0% recovery. Combined with the new trailing-90d pairing, it produced a
single populated monthly bucket (April) with no historical signal for
the sparkline.

The seed now models 30 patients with `startWeeksAgo ∈ [4, 52]` and a
lifecycle distribution (`LIFECYCLE_WEIGHTS` constant):

- `active` (45%) — joined in the last 4 months, still submitting.
- `recovered` (25%) — completed a full descent, stopped submitting.
- `stable` (20%) — long-term in-treatment, flat-ish.
- `dropout` (10%) — brief engagement then silence.

Combined with `npm run rollup-metrics:backfill` after seeding, the
sparkline renders a realistic rising trend as cohorts mature. Tuning
knobs live at the top of `../cbt/src/seeds/seedAdminDev.ts`.

### 4.14 Seed command layout: consistent `seed:*` namespace (2026-04-21)

**Why:** the old `seed-all` was ambiguous (did not actually seed
everything — clinical metadata and admin-dev were separate scripts).
Renamed to reflect what each script actually does:

- `seed:baseline` — destructive wipe + content + users (was `seed-all`).
- `seed:clinical-metadata` — idempotent cutoff/delta/tier backfill.
- `seed:admin-dev` — dev-only 12-month admin dataset.
- `seed:all` — **new orchestrator**: chains baseline →
  clinical-metadata → admin-dev as a fail-fast shell composition.

Full workflow for a fresh dev DB: `npm run seed:all && npm run
rollup-metrics:backfill`. Documented in
`../cbt/src/seeds/CLAUDE.md`.

### 4.15 BE owns sorting, filtering, and faceting (2026-04-21 evening)

**Why:** during the audit-log build the FE initially derived actor filter
options by walking loaded `useInfiniteQuery` pages — which made the list
incomplete (actors on unfetched pages were invisible), unstable (the list
grew as you scrolled), and self-collapsing (selecting an actor left only
themselves in the options). The project convention is that the BE computes
sorting, filtering, and faceting and the FE just passes query params and
renders results. Matches the `UsersFacets` precedent on `/user/users`.

Rule: whenever a new admin list surface needs filter options, the BE
returns them. Two good patterns:

- **Inline facets on the same response** (preferred when the facet set is
  small — admins, actors, action enums). Used by `/admin/audit`.
- **Separate `/facets` endpoint** (if the facet set is large or expensive
  to compute per request). Not used today; candidate for future list
  surfaces with heavy facet computation.

Facet filter should mirror the page filter **minus the cursor** (so
pagination doesn't reshuffle options) and **minus the facet key itself**
(so selecting one value doesn't collapse the options to just that value).

Enshrined in memory: `feedback_sort_filter_on_be.md`.

---

## 5. What exists on disk — BE (`/Users/milobedini/Documents/git/cbt`)

### 5.1 Models (new)

- `src/models/metricsRollupModel.ts` — IAPT rollup collection with `{ metric,
  dimension: { programmeId, careTier, instrument }, bucket: { granularity,
  startsAt, endsAt }, numerator, denominator, n, computedAt, schemaVersion }`.
  Unique key on `(metric, dimension.*, bucket.granularity, bucket.startsAt)`.
- `src/models/adminAuditEventModel.ts` — audit event collection.
- `src/models/jobRunModel.ts` — scheduled-job observability. **Note:** the
  subdocument array is called `failures` (not `errors`, which is a Mongoose
  reserved path name — caught during local dev).

### 5.2 Models (changed)

- `src/models/userModel.ts` — added `therapistTier?: 'cbt' | 'pwp'`. Existing
  verified therapists backfilled to `'cbt'` (see seed below).
- `src/models/moduleModel.ts` — added `instrument?`, `clinicalCutoff?`,
  `reliableChangeDelta?`. Has a `.pre('validate')` hook: if `instrument` is set,
  `clinicalCutoff` is required.

### 5.3 Utilities

- `src/utils/thresholds.ts` — env-driven thresholds + production boot-guard.
- `src/utils/suppression.ts` — `applySuppression({ numerator, denominator }, { k, minN })`.
  Every outcome response runs through this. Callers never divide.
- `src/utils/careTier.ts` — pure tier derivation.
- `src/utils/londonBuckets.ts` — Luxon-based week/month boundary helpers; DST-safe.
- `src/utils/iaptPairing.ts` — pure `computeIaptMetrics(attempts, instrumentDef)`
  with all three rate rules. 6 unit tests.
- `src/utils/audit.ts` — `logAdminAction(req, { action, resourceType, resourceId,
  outcome, context? })`. Never throws; catches and logs errors so audit
  failures don't break callers.

### 5.4 Rollup job + scheduler

- `src/jobs/rollupMetrics.ts` — `runRollupForBucket()` + `runNightlyRollup()`.
  **Trailing-90d snapshot pairing** (§4.8 / §4.11): each bucket is a
  snapshot point, the filter reads
  `completedAt ∈ [bucket.endsAt − 90d, bucket.endsAt)`. Sources
  `instrument` / `clinicalCutoff` / `reliableChangeDelta` from the
  **current** `Module` (not the attempt snapshot — clinical definitions
  are stable). Sources `therapistTier` from the **current** `User`
  (tier-at-time fidelity deferred).
- `src/jobs/scheduler.ts` — `node-cron` wiring, `0 2 * * *` in Europe/London,
  disabled when `ROLLUP_JOB_ENABLED=false`. Also exports three helpers for
  **on-boot catch-up** (§4.12): `mostRecentScheduledSlot(now)`,
  `listMissedSlots(lastSuccessAt, now)`, and `catchUpIfMissed(now)`. `startScheduler()`
  calls catch-up async after wiring the cron task. Catch-up replay is capped
  at 60 slots.
- `src/jobs/rollupMetricsCli.ts` — standalone CLI. Run via
  `npm run rollup-metrics`. Fires `runNightlyRollup(now)` once.
- `src/jobs/rollupBackfillCli.ts` — standalone historical-rebuild CLI. Run
  via `npm run rollup-metrics:backfill [months] [weeks]` (defaults 12/12).
  Walks back N months and M weeks writing one snapshot per bucket endpoint.
  Idempotent via the same upsert as the nightly job.

### 5.5 Endpoints (new)

Mounted at `/api/admin/*` behind `authenticateUser + authorizeAdmin`.

- `GET /api/admin/overview` — landing-page payload (operational stats +
  programme cards with lead-90d outcomes + verification queue preview).
- `GET /api/admin/outcomes?instrument=&programmeId=&careTier=&granularity=&from=&to=`
  — time-series of the three IAPT rates. **Always populates the time-axis** —
  empty buckets return suppressed cells (zero-denominator, `reason: 'below_k'`)
  so the FE can render a continuous axis. (This was a bug in the initial
  prototype implementation; fixed in `62c3138`.)
- `GET /api/admin/programmes/:id` — single-programme detail with per-instrument
  per-tier breakdowns.
- `GET /api/admin/audit` — paginated audit log, filterable by actorId / action /
  resourceType / resourceId. **2026-04-21 evening:** response now carries
  `facets: { actors: [{ _id, username, name?, count }] }` keyed off the
  current non-actor filter (matches `UsersFacets` precedent). Cursor pagination
  via `nextCursor`.
- `GET /api/admin/system/health` — ops-facing; returns last-rollup summary
  (without the full failures list) + audit total.

### 5.6 Endpoints (changed)

- `POST /api/user/verify` — now **requires** `therapistTier` in the request body.
  Emits `therapist.verified` audit event.
- `POST /api/user/unverify` — **new**. Mirror of verify. Emits
  `therapist.unverified`.
- `GET /api/user/:id` — authorisation relaxed so admin can read any user. Emits
  `user.viewed` when viewer is admin viewing a different user.
- `GET /api/attempts/patient/:patientId/timeline` + `.../modules` — same
  relaxation. Emits `patient.attemptsViewed`.
- `POST /api/modules` — emits `module.created`.
- `GET /api/user/admin/stats` — **deprecated** (superseded by `/api/admin/overview`).
  Kept for one release to avoid FE outage.

### 5.7 Environment variables (new — BE `.env`)

```
K_ANONYMITY_THRESHOLD=5              # production floor; dev may lower to 1
METRICS_MIN_N_FOR_DISPLAY=20         # production floor; dev may lower to 1
ROLLUP_JOB_ENABLED=true              # set false for tests
```

Production boot-guard: if `NODE_ENV=production` and either value is below its
floor, the default is forced and a warning is logged.

### 5.8 Seeds

See `../cbt/src/seeds/CLAUDE.md` for the full table. Short summary:

- `src/seeds/seedBaseline.ts` — destructive baseline (wipe + content + 90
  users). Renamed from `seedAll.ts` on 2026-04-21 (§4.14). GAD-7 has its
  own "Generalised Anxiety" programme, split from Depression.
  `npm run seed:baseline`.
- `src/seeds/seedClinicalMetadata.ts` — idempotent. Backfill for PHQ-9
  (cutoff 10, Δ 6), GAD-7 (cutoff 8, Δ 4), PDSS (cutoff 8, Δ null =
  reliable-improvement suppressed for PDSS). Also backfills existing
  verified therapists to `therapistTier: 'cbt'`. `npm run seed:clinical-metadata`.
- `src/seeds/seedAdminDev.ts` — **dev only**; 3 therapists + 30 patients
  with staggered 12-month PHQ-9 / GAD-7 histories across four lifecycle
  archetypes (§4.13). Tuning constants at top of file.
  **Refuses to run in production.** Not idempotent.
  `npm run seed:admin-dev`.
- **Orchestrator:** `npm run seed:all` chains baseline →
  clinical-metadata → admin-dev as a fail-fast shell composition.

**Fresh dev DB workflow:** `npm run seed:all && npm run rollup-metrics:backfill`.

### 5.9 Shared-types (`@milobedini/shared-types` on npm)

Four publishes to date:

- **v1.0.99** — admin primitives: `Instrument`, `CareTier`, `TherapistTier`,
  `AuditedAction`, `MetricName`, `PrivacyMode`, `Granularity`, `OutcomeResult`;
  plus `Module`/`AuthUser`/`UsersListItem` extensions.
- **v1.0.100** — response shapes: `AdminOverviewResponse`,
  `AdminOutcomesResponse`, `AdminProgrammeDetailResponse`, `AdminAuditEvent`,
  `AdminAuditResponse`, `AdminSystemHealthResponse`.
- **v1.0.101** — `VerifyTherapistInput` now requires `therapistTier`;
  `UnverifyTherapistInput` + `UnverifyTherapistResponse` added.
- **v1.0.102** (2026-04-21 evening) — `AdminAuditActorFacet` +
  `AdminAuditFacets` types; `AdminAuditResponse.facets` added so the FE
  filter drawer can read actor options with counts from the BE rather
  than deriving them from loaded pages.

Publish script: `npm run publish` from `/Users/milobedini/Documents/git/cbt`
root. It auto-bumps patch + publishes. After publishing, FE runs
`npm run update-types`.

### 5.10 Tests (BE)

Jest + ts-jest + `mongodb-memory-server` + supertest (all new to the BE
repo this feature). Run via `npm test`. Current total: **13 suites, 53
tests, all green** — up from 37 at initial build. Morning pass added
coverage for scheduler catch-up + slot list (`scheduler.test.ts`),
cross-bucket pairing + 90d-window exclusion (`rollupMetrics.test.ts`),
and `/overview` latest-snapshot reading (`adminController.test.ts`).
Evening pass added 2 tests in `adminAuditController.test.ts` for actor
facet computation across actor + action filters.

### 5.11 Controllers — 2026-04-21 changes

Morning pass:

- `src/controllers/adminController.ts` — `/overview` programme outcomes
  now read the **most recent snapshot row per metric** (via a `$sort` +
  `$group` pipeline), not a sum across buckets. See §4.11 for why.
- `src/controllers/adminProgrammesController.ts` — same change at
  `/programmes/:id` for both the overall and per-care-tier outcome
  breakdowns. Each metric × tier combo is one `findOne` sorted by
  `bucket.endsAt` desc.

Evening pass:

- `src/controllers/adminAuditController.ts` — `/audit` now runs a parallel
  aggregation for actor facets alongside the event query. The facet filter
  mirrors the page filter **minus the cursor** (so facets stay stable across
  scroll) and **minus the actor filter itself** (so selecting an actor
  doesn't collapse the list to one option). Counts per `actorId`, sorted
  desc, capped at 50. User lookup is reused between event and facet rows to
  avoid a second `User.find`. See §4.15 below.

---

## 6. What exists on disk — FE (`/Users/milobedini/Documents/git/bwell`)

### 6.1 Hooks (new)

- `hooks/useAdminOverview.ts` — single React Query hook for the landing
  dashboard. `queryKey: ['admin', 'overview']`, `staleTime: 5min`.
- `hooks/useAdminOutcomes.ts` (2026-04-21 morning) — wraps
  `GET /admin/outcomes`, accepts `{ instrument, programmeId, careTier?,
  granularity?, from?, to?, enabled? }` and defaults to monthly granularity
  over the BE's default 12-month window. Drives the sparkline on
  `LeadProgrammeCard`. 5-min staleTime.
- `hooks/useAdminProgrammeDetail.ts` (2026-04-21 evening) — wraps
  `GET /admin/programmes/:id`. `queryKey: ['admin', 'programme', id]`,
  5-min staleTime. Drives `ProgrammeDetailScreen`.
- `hooks/useAdminAudit.ts` (2026-04-21 evening) — `useInfiniteQuery` over
  `GET /admin/audit`. Cursor pagination via `nextCursor`. Filters:
  `{ action?, actorId?, resourceType?, resourceId? }`. 1-min staleTime,
  `keepPreviousData` for smooth filter transitions. 50 events per page.

### 6.2 Hooks (changed)

- `hooks/useUsers.ts` — `useAdminVerifyTherapist` now takes
  `VerifyTherapistInput` with `therapistTier`. `useAdminUnverifyTherapist`
  added. Both invalidate `['admin', 'overview']` on success.

### 6.3 Util

- `utils/attentionScore.ts` — `computeAttentionScore(overview, now?)` derives a
  4-band composite from 4 contributors: verification-age > 7d, stalled > 5,
  orphaned > 0, rollup null or > 48h. Day-one posture is `'unknown'` (no false
  all-clear before first rollup). Contributor shape on 2026-04-21 grew to
  `{ key, tripped, label, value, detail, ctaLabel? }` to feed the richer
  banner rows.

### 6.4 Components — leaf atoms in `components/home/admin-dashboard/`

- `AttentionBanner.tsx` + `.test.tsx` (7 tests) — blended-from-compliance-gauge
  banner. **Rebuilt 2026-04-21** (§4.10) as an SVG ring-gauge (circumference
  314, stroke-dasharray sweep sized to `trippedCount / totalChecks`; dashed
  when `band === 'unknown'`) with MDI icons per contributor. Verification-row
  tap opens the picker; `ctaLabel` renders inline under the detail when set.
- `FreshnessRow.tsx` — `asOf` + `rollupAsOf` + optional reduced-privacy chip.
- `LeadProgrammeCard.tsx` — hero card with the giant recovery % + the triplet.
  **Wired to `OutcomesSparkline`** on 2026-04-21 below the triplet when trend
  data is available.
- `OutcomeTriplet.tsx` + `.test.tsx` (4 tests) — the three-rate atom (recovery /
  reliable improvement / reliable recovery) with inline definitions + suppressed
  states.
- `OutcomesSparkline.tsx` + `.test.tsx` (6 tests) — **new 2026-04-21**.
  12-bar trailing-90d trend chart with a delta chip (`trending-up` /
  `trending-down` / `trending-neutral` MDI icons). Caps at 12 buckets via
  `maxBuckets` prop so mid-month 13-bucket BE responses render truthfully.
  Suppressed cells are drawn as pale notches so the axis stays contiguous.
- `CareTierBreakdown.tsx` — **rebuilt 2026-04-21 evening** as a 3-col
  tier × triplet table (matches the winning deck's Panel B). Props now
  `rows: { careTier, recovery, reliableImprovement, reliableRecovery }[]`.
  Wired into `ProgrammeDetailScreen`. Header row shows `Tier / Rec. /
  Rel. imp. / Rel. rec.`; body rows show tier pill (Self-help neutral, CBT
  teal, PWP purple tints) + three rate cells with inline `n=N` subscripts.
  Suppressed cells render `< 5 patients` / `insufficient` in italic grey.
- `ProgrammeRow.tsx` — compact row for non-lead programmes; handles
  non-clinical programmes (no instrument → enrolment shown, no %).
  **2026-04-21 evening:** wrapped in `Pressable` + `router.push` to
  `home/programmes/[id]`.
- `OpsFooter.tsx` — bottom grid of 4 operational metrics (active 30d /
  verification queue count / stalled 7d+ / orphaned assignments).
- `ProgrammeDetailScreen.tsx` (2026-04-21 evening) — full screen
  composed of `FreshnessRow` + enrolment stat-card row (total + per-tier
  counts) + per-instrument block (`OutcomeTriplet` for overall +
  `CareTierBreakdown` for tier slice + conditional k-anonymity suppression
  note) + work section (`StatCard` for completed/stalled + module-type
  list with icons from `getModuleIcon`). Fallback "No clinical instrument
  attached" block when `outcomesByInstrument` is empty.
- `AuditRow.tsx` (2026-04-21 evening) — one row per `AdminAuditEvent`.
  Top line: action name (teal for high-salience success:
  `therapist.verified`/`therapist.unverified`/`module.created`, grey for
  read actions: `user.viewed`/`patient.attemptsViewed`/`admin.loggedIn`,
  red for `outcome === 'failure'`) + relative `at` timestamp. Bottom
  line: summary built from `actor.username + resource + context.tier`.
  Tap-to-expand reveals opaque `context` JSON in a dark-deep box when
  present.
- `AuditFilterDrawer.tsx` (2026-04-21 evening) — slide-in drawer matching
  `UserFilterDrawer` pattern. Action chips (single-select from the 6
  `AuditedAction` values) + actor chips sourced from BE facets with
  counts. Reset / Cancel / Apply footer. Portal + `Animated.View`.
- `AdminAuditScreen.tsx` (2026-04-21 evening) — header (`Admin` eyebrow +
  "Audit log" title) + filters pill showing active count + `FlatList` of
  bordered-card rows + infinite scroll via `onEndReached` + refresh
  control + filter-aware empty-state copy.

### 6.5 Components (changed)

- `components/home/AdminHome.tsx` — rebuilt as a clinical-outcomes dashboard.
  Full-screen (no `HomeScreen` canvas wrapper — mirrors the pattern in
  `VerifiedTherapistHome` + populated `PatientHome`). **2026-04-21 evening:**
  added a link-row below the ops footer with `clipboard-list-outline` icon,
  "Audit log" title, "{eventsLast7d} events in the last 7 days" subcaption,
  chevron right. `router.push` → `/(main)/(tabs)/home/audit`.
- `components/home/admin-dashboard/LeadProgrammeCard.tsx` — **2026-04-21
  evening:** wrapped in `Pressable` + `router.push` to the detail route.
  When `recovery.suppressed`, the 56pt `—` hero + `%` glyph + "Recovery ·
  n = ..." caption are dropped in favour of a smallTitle-weight "Awaiting
  data · needs N+ paired assessments" line and a small "Currently N paired
  · last 90 days" caption. The triplet below remains the canonical answer.
  Populated rendering unchanged.
- `components/user/TherapistPicker.tsx` — added a tier-selection step using
  `ActionMenu`. After the admin picks a therapist, a two-button action menu
  offers "Verify as CBT therapist" or "Verify as PWP practitioner".

### 6.6 Test coverage (FE)

**895 tests, 109 suites, all green** after the 2026-04-21 evening pass.
Suites added across the admin work:

- `utils/attentionScore.test.ts` — 12 tests (7 original + 5 added for the
  new `value`, `detail`, `ctaLabel` shape + day-zero / one-day copy + relative
  rollup age formatting).
- `components/home/admin-dashboard/AttentionBanner.test.tsx` — 7 tests
  (5 original + 2 added for the stateful rollup icon flip and the
  concept-stable verification / stalled / orphaned icons).
- `components/home/admin-dashboard/OutcomeTriplet.test.tsx` — 4 tests.
- `components/home/admin-dashboard/OutcomesSparkline.test.tsx` — 6 tests
  (delta chip direction + axis labels + suppressed → "Not enough data" path
  + 12-bucket cap against BE returning 13).
- `components/home/admin-dashboard/CareTierBreakdown.test.tsx` (evening) —
  4 tests: 3×3 table rendering, below-k and below-min-n suppressed labels,
  header row.
- `components/home/admin-dashboard/ProgrammeDetailScreen.test.tsx` (evening) —
  9 tests: loading + error + title + freshness chips + enrolment counts +
  overall triplet + tier breakdown table + suppression note + non-IAPT
  fallback + no-suppression note omission.
- `components/home/admin-dashboard/LeadProgrammeCard.test.tsx` (evening) —
  4 tests: populated hero + suppressed below-k collapse + suppressed
  below-min-n collapse + triplet always present.
- `components/home/admin-dashboard/AuditRow.test.tsx` (evening) — 5 tests:
  formatting + failure styling + context expand + empty-context guard +
  resource-id shortening.
- `components/home/admin-dashboard/AdminAuditScreen.test.tsx` (evening) —
  5 tests: loading + error + flattened page rendering + empty state +
  filter drawer open.

No top-level `AdminHome.test.tsx` — follows the existing pattern where tests
live on the atomic components, not the screen wrapper.

### 6.7 Prettier

Added `docs/prototypes/**/*.html` to `.prettierignore` so `npm run lint`
doesn't try to parse the presentation-style decks.

---

## 7. Feature-branch commit anchors

All commits on `feat/admin-overhaul` (FE) — run `git log --oneline main..feat/admin-overhaul`.

Key anchors, most-recent first:

```
# 2026-04-21 evening pass — admin-future §1.1–§1.3 + facet fix
aff86c7 test(admin): extend AdminAuditScreen mock response with BE-shaped facets
41095ce refactor(admin): read audit actor facets from BE response instead of deriving client-side
512e088 feat(admin): show counts on audit actor chips
e854f60 chore(deps): bump @milobedini/shared-types to 1.0.102
b592df8 feat(admin): add audit log entry-row to AdminHome below ops footer
63c557f feat(admin): register audit screen in home stack with titled header
973cdb9 feat(admin): add home/audit route
a0f9f15 test(admin): cover AdminAuditScreen loading, error, empty and filter-open paths
59c4d6f feat(admin): add AdminAuditScreen with infinite scroll and filter drawer
c2d96db feat(admin): add AuditFilterDrawer with action and actor chips
6c93b4d test(admin): cover AuditRow summary, failure state and context expand
cb589ae feat(admin): add AuditRow with outcome-aware colour and expand-in-place context
7cb149c feat(admin): add useAdminAudit cursor-paginated query hook
868355e test(admin): cover LeadProgrammeCard suppressed-hero branches
d5de438 fix(admin): collapse lead hero to 'Awaiting data' when recovery suppressed
704c116 feat(admin): make ProgrammeRow press navigate to detail screen
ea769df feat(admin): make LeadProgrammeCard press navigate to detail screen
7b19bd6 feat(admin): register programmes/[id] screen in home stack
9e719d4 feat(admin): add programmes/[id] route under home tab
33b15d7 test(admin): cover ProgrammeDetailScreen happy, empty and suppressed paths
773fc46 feat(admin): add programme detail screen composing IAPT triplet, tier table, enrolment and work
b66562e test(admin): cover CareTierBreakdown tier x triplet rendering
98bb8b1 refactor(admin): rebuild CareTierBreakdown as tier x triplet table
12b5dc5 feat(admin): add useAdminProgrammeDetail query hook

# 2026-04-21 morning pass
f106fb7 docs(admin): recommend rollup-metrics:backfill after seed:all
06b5d7e docs(admin): update seed references for baseline/all rename
498d9d1 docs(admin): adopt trailing-90d snapshot pairing across spec + plans
3f6eb88 docs(admin-future): reflect shipped UI + scheduler catch-up work
4bfbe2f docs(claude): prefer MDI icons and SVGs over unicode glyphs
9c65f14 refactor(admin): swap sparkline delta arrows for trending icons
9b6c302 refactor(admin): swap attention banner glyphs for MDI icons
7d950e9 fix(admin): soften verification copy for day-zero and one-day waits
51a7d9f fix(admin): flip rollup glyph to cycle icon when stale
1d054bc fix(admin): cap outcomes sparkline to trailing 12 buckets
18b035b feat(admin): wire outcomes sparkline into LeadProgrammeCard
b52fe23 feat(admin): add OutcomesSparkline with suppression-aware bars
297ffd4 feat(admin): add useAdminOutcomes query hook
238cad9 feat(admin): rebuild attention banner as SVG ring-gauge
164a74d feat(admin): enrich attention contributor with value, detail and CTA

# 2026-04-20 initial build
98b9c8c docs(admin): catalogue deferred + future work in admin-future.md
c73c1f6 chore(deps): bump @milobedini/shared-types to 1.0.101
b3e5ea6 docs(admin): add session handoff README for admin overhaul
9f04390 fix(admin): drop HomeScreen wrapper for full-screen dashboard
aa6c4b8 chore(prettier): ignore prototype HTML decks
119a5bc feat(admin): rebuild AdminHome as clinical-outcomes dashboard
3705a3e feat(admin): add LeadProgrammeCard hero with layered IAPT triplet
69507b7 feat(admin): add OpsFooter with below-the-fold operational grid
c09c537 feat(admin): add ProgrammeRow with suppression-aware rate display
ba3170b feat(admin): add CareTierBreakdown component
99ce0d3 feat(admin): add FreshnessRow (asOf, rollup, privacy mode)
23d220d feat(admin): add OutcomeTriplet with IAPT three-rate definitions
5066ed2 feat(admin): add AttentionBanner with 4-band composite score
845bf6d feat(admin): derive composite attention score from overview response
0451654 feat(admin): tier selection step in verify-therapist picker
9d25a7b feat(admin): require therapistTier on verify; add unverify hook
124dac4 feat(admin): add useAdminOverview query hook
10f21a4 docs(prototypes): add command-centre deck for admin overhaul
8e51d9a docs(prototypes): add clinical-outcomes-first deck for admin overhaul   ← winner
1b99485 docs(prototypes): add compliance-gauge deck for admin overhaul          ← blend source
02448aa docs(prototypes): add mission-control deck for admin overhaul
e8e5ba8 docs(prototypes): add narrative-brief deck for admin overhaul
e3d7781 docs(prototypes): add kpi-dashboard deck for admin overhaul
fbd6c34 docs(brief): prototype brief for admin overhaul
3521def docs(admin): BE implementation plan for admin overhaul
2cd1211 docs(admin): brainstorm design for admin overhaul
```

BE recent anchors (on `main`):

```
# 2026-04-21 evening pass
f6d0439 test(admin): cover audit actor facets across actor + action filters
57a99af feat(admin): compute audit actor facets per current non-actor filter
713d929 feat(shared-types): add audit actor facets to AdminAuditResponse

# 2026-04-21 morning pass
91e0cf7 docs(claude): document rollup jobs, admin metrics, current seeds
032cb33 feat(rollup): add backfill CLI for historical snapshot rebuild
e14ace4 feat(seed): extend admin-dev to 12 months with staggered lifecycles
c235c40 refactor(seeds): rename seedAll→seedBaseline, add seed:all orchestrator
6221806 feat(admin): read latest snapshot for /programmes/:id outcomes
4f9e53f feat(admin): read latest rollup snapshot for /overview outcomes
1d000a1 feat(rollup): snapshot trailing-90d pairing at bucket endpoint
dc508df feat(scheduler): replay every missed slot in catch-up (cap 60)
672ffd7 feat(scheduler): catch up missed rollup on boot

# 2026-04-20 initial build
d52f68d fix(jobrun): rename errors field to failures to avoid mongoose reserved path
8d852a4 chore(shared-types): publish v1.0.101 with tier+unverify inputs
a3c0ff6 feat(shared-types): require therapistTier on verify; add unverify types
5096b74 feat(seed): extract GAD-7 into its own Generalised Anxiety programme
5c78f4d docs(admin): mark legacy adminStats endpoint as deprecated
d239fc9 chore(shared-types): sync lockfile after v2 publish
0af65e6 chore(shared-types): publish v2 admin response types
63ee177 feat(shared-types): add admin response types (v2)
2f3cc4e feat(seed): dev-only admin dataset with realistic recovery distribution
62c3138 fix(admin): always populate outcomes time-axis with suppressed cells
c044b87 feat(admin): GET /api/admin/system/health
a3848a7 feat(admin): GET /api/admin/audit paginated + filterable
508bea6 feat(admin): GET /api/admin/programmes/:id with per-instrument/per-tier outcomes
1ac349b feat(admin): GET /api/admin/outcomes with bucketed IAPT series
b8d6bc2 feat(admin): GET /api/admin/overview with operational stats + programme cards
ca44151 feat(admin): mount /api/admin router behind auth+admin middleware
0faa1c9 feat(admin): emit module.created audit event
c88fbc5 feat(admin): allow admin to view patient timelines; emit audit
e16b9e3 feat(admin): relax getUser for admin lookups; emit user.viewed
fd15960 feat(admin): add unverify-therapist endpoint with audit
cf98e75 feat(admin): verify-therapist now requires therapistTier and emits audit
```

And then further back: Phase 5 utilities (thresholds / suppression / careTier /
londonBuckets / iaptPairing / audit), Phase 3 models (MetricsRollup /
AdminAuditEvent / JobRun), Phase 2 User / Module schema changes + backfill,
Phase 1 shared-types v1.

---

## 8. BE-change requests from non-winning decks

Each non-winning deck flagged BE changes it would want. **None are implemented.**
Captured here so they're not lost:

- **narrative-brief** wanted `GET /api/admin/brief?week=<ISO>` returning
  `AdminOverviewResponse` + `{ brief: { paragraphs, generatedAt, model } }`.
  Template-by-default, LLM opt-in. Large scope; defer to a dedicated feature
  brainstorm.
- **mission-control** wanted a server-sorted `actionQueue` (either a new
  endpoint or a subfield on `/overview`). Small. Defer until we have a
  mission-control-style view worth pursuing.
- **compliance-gauge** wanted `POST /api/admin/attempts/:id/nudge` +
  `POST /api/admin/assignments/:id/reassign`. Nice-to-haves, not required for
  the banner we borrowed.
- **command-centre** wanted a `recentAudit: AdminAuditEvent[]` slice on
  `/overview` for fused list rendering + verify auto-advance return. Small; not
  needed for current winner.
- **clinical-outcomes-first** (winner) wanted an optional `shortfall` field on
  `OutcomeResult`. Derivable client-side as `minN - n`; skip unless asked.

---

## 9. Known limitations / what's deliberately out of scope

Everything in the spec's §2.2 Deferred list is out of scope for this feature.
After the 2026-04-21 evening pass, the biggest remaining gaps are:

- **System health view** — the BE endpoint exists; not surfaced in the UI.
  See `admin-future.md §1.1` (was §1.4 before the 2026-04-21 evening
  renumber).
- **Navigation from banner contributors** — `AttentionBanner` wires
  verification → `TherapistPicker`. Other contributors (stalled, orphaned,
  rollup staleness) are informational only. See `admin-future.md §1.2`
  (was §1.5). The audit log now exists as a natural destination for the
  rollup-stale contributor; the system-health view (§1.1) is the other
  natural target once it ships.
- **Prototype decks still in-tree** — all 6 HTML decks are in this folder.
  The user explicitly had not decided whether to archive non-winners to
  `.archive/` or delete them. Either is fine per mb-development Stage 9
  cleanup guidance. See `admin-future.md §1.3` (was §1.6).
- **No time-range filter on audit log** — the winning prototype showed a
  `Last 7d` chip; the BE endpoint accepts `cursor` but not `from`/`to`,
  and the `admin-future.md §1.3` "minimum filter set" explicitly didn't
  list time range. Can be added later with a small BE change (`from`/`to`
  params) + one more chip in `AuditFilterDrawer`.

---

## 10. What's next

### 10.1 Stage 10 — Test audit (optional)

Not started. Would cover the new AdminHome surface + attentionScore util +
the new components. Current coverage is good (45+ admin-area tests on the
high-value units). The remaining gap is integration-level: an end-to-end
test that renders AdminHome with mocked hooks and confirms all five
composition slots render for happy-path + empty-state + suppressed-state.
See `test-audit` skill.

### 10.2 Stage 11 — Finalise PR

BE changes landed direct to `main` per project convention — no BE PR
needed. **Note before opening the FE PR:** deploy BE `main` (which now
includes the trailing-90d rollup semantics and the on-boot catch-up)
first, otherwise the FE will be reading stale within-bucket rollup rows
until the next cron fires.

FE PR: `feat/admin-overhaul` → `main`. Suggested title:

> feat(admin): overhaul admin home with IAPT outcomes + audit

Suggested PR body should cover: capabilities added (11 points in spec
§2.1), BE additions (5 endpoints, 3 models, 6 utilities, 1 nightly job
with on-boot catch-up, 3 seeds + an orchestrator, backfill CLI), FE
additions (AdminHome + 8 components + 2 hooks + 1 util + picker update),
shared-types versions published (1.0.99, 1.0.100, 1.0.101), env vars
added (K / MIN_N / ROLLUP_JOB_ENABLED), design conventions added
(MDI-over-glyphs in FE CLAUDE.md, trailing-90d snapshot in spec §5.3).

### 10.3 Future-plan notes doc ✅

Written at `docs/plans/admin-future.md`. Captures §1 near-term follow-ups
(programme detail, lead hero duplicate, audit log list, system health,
banner drill-ins, archive decks) and §2 substantive features (owner
tier, impersonation, role change, per-therapist outcomes, episode-of-care,
scheduler runtime, etc.).

---

## 11. How to test the dashboard locally

```bash
# BE
cd /Users/milobedini/Documents/git/cbt

# Seeds are already populated in the dev DB — do NOT re-run unless you've
# dropped the DB. If you do drop: `npm run seed:all` (runs baseline +
# clinical-metadata + admin-dev as a fail-fast chain).

# Compute rollups so outcome cards have data. Pick one:
#   - `npm run rollup-metrics` — today's snapshot only (fast). The hero
#     figures and current cards populate; the 12-month sparkline stays
#     "Not enough data" until future cron runs accumulate history.
#   - `npm run rollup-metrics:backfill` — walks back 12 months of monthly +
#     12 weeks of weekly snapshots. Required after a fresh `seed:all` for
#     the sparkline to render a full trend line.
npm run rollup-metrics:backfill

# Optional: see populated percentages in dev by lowering thresholds.
echo "K_ANONYMITY_THRESHOLD=1" >> .env
echo "METRICS_MIN_N_FOR_DISPLAY=1" >> .env

npm run dev
```

```bash
# FE
cd /Users/milobedini/Documents/git/bwell
npx expo start --clear
# Or: npx expo start --web --port 8082   (web target)
```

Login as an admin user, navigate to the Home tab. Expected view: eyebrow +
"Clinical outcomes first" title, freshness chips, attention banner, lead
programme hero, other programmes, ops footer.

Tap the verification row inside the banner (only tappable when tripped) → the
existing `TherapistPicker` opens → pick a therapist → the tier action sheet
appears → pick CBT or PWP → verify fires and the banner should refresh.

---

## 12. Glossary for future sessions

- **IAPT** = Improving Access to Psychological Therapies — the NHS's national
  CBT-delivery programme. Now rebranded "NHS Talking Therapies". We borrow
  their metric definitions (recovery / reliable improvement / reliable
  recovery) because they're well-documented, defensible, and free.
- **PWP** = Psychological Wellbeing Practitioner — IAPT's shorter-training tier
  that delivers behavioural (not full CBT) therapy.
- **PHQ-9** = Patient Health Questionnaire — 9-item depression measure.
  Clinical cutoff 10. Reliable-change Δ 6.
- **GAD-7** = Generalised Anxiety Disorder scale — 7 items. Cutoff 8. Δ 4.
- **PDSS** = Panic Disorder Severity Scale. Cutoff 8. Reliable-change Δ not yet
  defined in shared-types — reliable-improvement metric is suppressed for this
  instrument.
- **Care tier** = `self_help` | `cbt_guided` | `pwp_guided`. Derived from the
  attempt's therapist + their current `therapistTier`.
- **Rollup** = a pre-computed row in the `MetricsRollup` collection;
  `(metric × dimension × bucket)`. Written by the nightly job; read by admin
  endpoints.
- **k-anonymity** = the rule that any cell must represent at least k
  individuals. k=5 is the standard floor for health data; we default to 5 in
  production.
