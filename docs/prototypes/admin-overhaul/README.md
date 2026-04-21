# Admin Overhaul — Session Handoff

**Last updated:** 2026-04-20
**Branch (FE):** `feat/admin-overhaul`
**Branch (BE):** `main` (BE commits land direct-to-main per project convention)
**Status:** Stages 1–9 complete. Stages 10 (test audit) + 11 (finalise PR) pending.

This document is a self-contained handoff. A future session can pick up from here
without any of today's conversational context. Everything material lives in the
spec, the plan, the prototype brief, and the commits — this README is the map.

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

Plus a deliverable flagged alongside the workflow:

| | Future-plan notes doc | ⏸ `docs/plans/admin-future.md` — not written |

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

### 5.4 Rollup job

- `src/jobs/rollupMetrics.ts` — `runRollupForBucket()` + `runNightlyRollup()`.
  Within-bucket pairing (§4.8). Sources `instrument` / `clinicalCutoff` /
  `reliableChangeDelta` from the **current** `Module` (not the attempt snapshot
  — clinical definitions are stable). Sources `therapistTier` from the
  **current** `User` (tier-at-time fidelity deferred).
- `src/jobs/scheduler.ts` — `node-cron` wiring, `0 2 * * *` in Europe/London.
  Disabled when `ROLLUP_JOB_ENABLED=false` (useful for tests).
- `src/jobs/rollupMetricsCli.ts` — standalone CLI. Run via `npm run rollup-metrics`.

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
  resourceType / resourceId.
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

- `src/seeds/seedBaseline.ts` — updated: GAD-7 moved from the Depression programme
  into its own new "Generalised Anxiety" programme.
- `src/seeds/seedClinicalMetadata.ts` — backfill for PHQ-9 (cutoff 10, Δ 6),
  GAD-7 (cutoff 8, Δ 4), PDSS (cutoff 8, Δ null = reliable-improvement
  suppressed for PDSS). Also backfills existing verified therapists to
  `therapistTier: 'cbt'`. **Idempotent-ish.** `npm run seed:clinical-metadata`.
- `src/seeds/seedAdminDev.ts` — **dev only**; creates 3 therapists + 30 patients
  across Depression + GAD with ~8 weeks of PHQ-9 / GAD-7 attempts and a roughly
  realistic recovery distribution (~40% cross threshold). `npm run seed:admin-dev`.
  **Refuses to run in production.**

### 5.9 Shared-types (`@milobedini/shared-types` on npm)

Three publishes today:

- **v1.0.99** — admin primitives: `Instrument`, `CareTier`, `TherapistTier`,
  `AuditedAction`, `MetricName`, `PrivacyMode`, `Granularity`, `OutcomeResult`;
  plus `Module`/`AuthUser`/`UsersListItem` extensions.
- **v1.0.100** — response shapes: `AdminOverviewResponse`,
  `AdminOutcomesResponse`, `AdminProgrammeDetailResponse`, `AdminAuditEvent`,
  `AdminAuditResponse`, `AdminSystemHealthResponse`.
- **v1.0.101** — `VerifyTherapistInput` now requires `therapistTier`;
  `UnverifyTherapistInput` + `UnverifyTherapistResponse` added.

Publish script: `npm run publish` from `/Users/milobedini/Documents/git/cbt`
root. It auto-bumps patch + publishes. After publishing, FE runs
`npm run update-types`.

### 5.10 Tests (BE)

Jest + ts-jest + `mongodb-memory-server` + supertest are all new to the BE repo
this session. 12 test suites, 37 tests, all green. Lives alongside source files
as `*.test.ts`. Run via `npm test`.

---

## 6. What exists on disk — FE (`/Users/milobedini/Documents/git/bwell`)

### 6.1 Hooks (new)

- `hooks/useAdminOverview.ts` — single React Query hook for the landing
  dashboard. `queryKey: ['admin', 'overview']`, `staleTime: 5min`.

### 6.2 Hooks (changed)

- `hooks/useUsers.ts` — `useAdminVerifyTherapist` now takes
  `VerifyTherapistInput` with `therapistTier`. `useAdminUnverifyTherapist`
  added. Both invalidate `['admin', 'overview']` on success.

### 6.3 Util

- `utils/attentionScore.ts` — `computeAttentionScore(overview, now?)` derives a
  4-band composite from 4 contributors: verification-age > 7d, stalled > 5,
  orphaned > 0, rollup null or > 48h. Day-one posture is `'unknown'` (no false
  all-clear before first rollup). 7 unit tests in `.test.ts`.

### 6.4 Components — new leaf atoms in `components/home/admin-dashboard/`

- `AttentionBanner.tsx` + `.test.tsx` (5 tests) — borrowed-from-compliance-gauge
  banner with contributor rows. Verification-row tap opens the picker.
- `FreshnessRow.tsx` — `asOf` + `rollupAsOf` + optional reduced-privacy chip.
- `LeadProgrammeCard.tsx` — hero card with the giant recovery % + the triplet.
- `OutcomeTriplet.tsx` + `.test.tsx` (4 tests) — the three-rate atom (recovery /
  reliable improvement / reliable recovery) with inline definitions + suppressed
  states.
- `CareTierBreakdown.tsx` — per-tier rows (self-help / CBT / PWP) for a
  programme. Currently a pure component; not yet wired into the home (a
  programme-detail screen would use it).
- `ProgrammeRow.tsx` — compact row for non-lead programmes; handles
  non-clinical programmes (no instrument → enrolment shown, no %).
- `OpsFooter.tsx` — bottom grid of 4 operational metrics (active 30d /
  verification queue count / stalled 7d+ / orphaned assignments).

### 6.5 Components (changed)

- `components/home/AdminHome.tsx` — rebuilt as a clinical-outcomes dashboard.
  Full-screen (no `HomeScreen` canvas wrapper — mirrors the pattern in
  `VerifiedTherapistHome` + populated `PatientHome`).
- `components/user/TherapistPicker.tsx` — added a tier-selection step using
  `ActionMenu`. After the admin picks a therapist, a two-button action menu
  offers "Verify as CBT therapist" or "Verify as PWP practitioner".

### 6.6 Test coverage (FE)

854 tests, 103 suites, all green. New:

- `utils/attentionScore.test.ts` — 7 tests
- `components/home/admin-dashboard/AttentionBanner.test.tsx` — 5 tests
- `components/home/admin-dashboard/OutcomeTriplet.test.tsx` — 4 tests

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
The biggest MVP gaps worth calling out:

- **Programme detail screen** — the BE endpoint `GET /api/admin/programmes/:id`
  exists but there's no FE route. Tapping a programme on the home doesn't
  navigate anywhere today.
- **Outcomes time-series / sparkline** — on-home sparkline is not built.
  `/api/admin/outcomes` returns the data; the FE would need a small chart
  component (BarSparkline already exists and could be adapted).
- **Audit log list view** — the BE endpoint exists; no FE route.
- **System health view** — the BE endpoint exists; not surfaced in the UI.
- **Navigation from banner contributors** — the `AttentionBanner` wires
  verification → `TherapistPicker`. Other contributors (stalled, orphaned,
  rollup staleness) are informational only.
- **`CareTierBreakdown` is built but unused** — lives in the
  `admin-dashboard/` folder; would be rendered by the programme-detail screen
  once it's built.
- **Prototype decks still in-tree** — all 6 HTML decks are in this folder.
  The user explicitly had not decided whether to archive non-winners to
  `.archive/` or delete them. Either is fine per mb-development Stage 9
  cleanup guidance.

---

## 10. What's next

### 10.1 Stage 10 — Test audit (optional)

Not started. Would cover the new AdminHome surface + attentionScore util + the
new components. Current coverage is already good (27 new tests on the
high-value units). The gap is integration-level: an end-to-end test that
renders AdminHome with a mocked `useAdminOverview` and confirms all five
composition slots render for happy-path + empty-state. See `test-audit` skill.

### 10.2 Stage 11 — Finalise PR

BE changes landed direct to `main` per project convention — no BE PR needed.

FE PR: `feat/admin-overhaul` → `main`. Suggested title:

> feat(admin): overhaul admin home with IAPT outcomes + audit

Suggested PR body should cover: capabilities added (11 points in spec §2.1),
BE additions (5 endpoints, 3 models, 6 utilities, 1 job, 3 seeds), FE additions
(AdminHome + 7 components + 1 hook + 1 util + picker update), shared-types
versions published (1.0.99, 1.0.100, 1.0.101), env vars added (K / MIN_N /
ROLLUP_JOB_ENABLED).

### 10.3 Future-plan notes doc

Spec §2.2 enumerates 15+ deferred items (owner tier, impersonation, admin
password reset, GDPR erasure, role change, per-therapist outcomes, data-quality
dashboard, programme catalogue editor, export workflow, per-resource access
restriction, episode-of-care model, tier-at-time fidelity, rollup archival,
multi-role user handling, audit retention policy, additional instruments).

Target path: `docs/plans/admin-future.md` (in FE repo). Not yet written.
Should be a one-per-item list with: name, motivation, rough scope, any
dependencies the current BE already satisfies.

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
