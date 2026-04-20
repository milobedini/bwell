# Admin Overhaul — Backend Architecture Design

**Date:** 2026-04-20
**Status:** Approved
**Scope:** Backend (bwell-cbt) only. Frontend handled separately via parallel prototype agents.

---

## 1. Purpose

Define the admin role holistically for the bwell CBT therapy app and ship a proper backend surface for it. Admin is currently a placeholder (five operational counts, an unverified-therapist picker, and the all-users list). This design replaces that surface with an explicit set of admin capabilities, an IAPT-aligned clinical outcomes pipeline, a lightweight audit trail, and a thin set of admin-focused endpoints.

Anything not in MVP scope is documented in `docs/plans/admin-future.md`.

---

## 2. Scope

### 2.1 Admin MVP capabilities

| # | Capability | Status | Notes |
|---|---|---|---|
| 1 | Verify therapist | Existing, rewired to audit | Emits `therapist.verified`; requires `therapistTier` from MVP onward |
| 2 | Unverify therapist | New | Emits `therapist.unverified` |
| 3 | Expanded operational stats | New | Metrics 1–13 from §6.1 (minus 4, 11) |
| 4 | Programme health summary | New | Per-programme enrolment + primary-instrument outcomes |
| 5 | Programme detail endpoint | New | `/admin/programmes/:id` |
| 6 | Filterable IAPT outcomes endpoint | New | `/admin/outcomes?...` |
| 7 | Read access to any user's profile | New | Auth relaxation on existing endpoint; emits `user.viewed` |
| 8 | Read access to any patient's attempts timeline | New | Auth relaxation; emits `patient.attemptsViewed` |
| 9 | Audit log endpoint | New | Paginated, filterable |
| 10 | All-users list | Existing, unchanged | Already supports role / verified filters |
| 11 | Module creation | Existing, rewired to audit | Emits `module.created` |

### 2.2 Deferred (future-plan)

Captured in `docs/plans/admin-future.md`:

- Owner tier above admin (billing / security separation)
- Impersonation
- Admin-triggered password reset
- Soft-delete user / GDPR right-of-erasure workflow
- Role change (grant / revoke)
- Per-therapist outcome metrics
- Data-quality dashboard (IAPT DQ-equivalent)
- Programme catalogue editor (visual)
- Export / DSAR workflow
- Per-resource access restriction (SimplePractice-style)
- Episode-of-care concept (strict IAPT denominator)
- Tier-at-time fidelity for rollups
- Rollup and audit archival
- Multi-role user handling
- Audit log retention policy
- Additional instruments (OCI-R, IES-R, Mini-SPIN, HAI, …)

### 2.3 Clinical / regulatory posture

- Admin is explicitly non-clinical. No free-text clinical notes, no individual-patient clinical record content on admin surfaces.
- All PHI slices apply k-anonymity suppression at read time. `K_ANONYMITY_THRESHOLD` defaults to `5`, overridable via env var.
- Outcome rates apply an additional display threshold. `METRICS_MIN_N_FOR_DISPLAY` defaults to `20`, overridable via env var.
- Production boot-guard forces both thresholds to their defaults if `NODE_ENV === 'production'` and a lower value is configured.
- All admin PHI-adjacent actions emit audit events.

---

## 3. Data model changes

### 3.1 User model — add `therapistTier`

```ts
therapistTier?: 'cbt' | 'pwp'   // only meaningful when roles includes 'therapist'
```

- Backfill: existing verified therapists default to `'cbt'`.
- Enforcement: verify-therapist rejects requests where `therapistTier` is missing.
- Unverified therapists may have `therapistTier` unset.

### 3.2 Module model — add clinical instrument fields

```ts
instrument?: Instrument          // 'phq9' | 'gad7' | 'pdss' | …
clinicalCutoff?: number
reliableChangeDelta?: number
```

- Rule: if `instrument` is set, `clinicalCutoff` must also be set. `reliableChangeDelta` is independently optional; if unset, reliable-improvement / reliable-recovery are suppressed for that instrument.
- Backfill: seed update populates PHQ-9 (`cutoff: 10, delta: 6`), GAD-7 (`cutoff: 8, delta: 4`), PDSS (`cutoff: 8, delta: null`). Non-clinical questionnaires stay `null`.

### 3.3 New collection — `MetricsRollup`

Pre-computed IAPT outcome rows written nightly.

```ts
type MetricsRollupDoc = {
  _id: ObjectId
  metric: 'recovery' | 'reliable_improvement' | 'reliable_recovery'
  dimension: {
    programmeId: ObjectId | null       // null = platform-wide
    careTier: CareTier | null          // null = all tiers aggregated
    instrument: Instrument
  }
  bucket: {
    granularity: 'week' | 'month'
    startsAt: Date                     // inclusive, anchored to Europe/London boundary, stored UTC
    endsAt: Date                       // exclusive
  }
  numerator: number
  denominator: number
  n: number                            // equals denominator; kept for future generalisation
  computedAt: Date
  schemaVersion: number                // starts at 1
}
```

**Indexes**

- Read: `{ metric, 'dimension.programmeId', 'dimension.careTier', 'dimension.instrument', 'bucket.startsAt' }`
- Freshness: `{ computedAt: -1 }`
- Unique: `{ metric, 'dimension.programmeId', 'dimension.careTier', 'dimension.instrument', 'bucket.granularity', 'bucket.startsAt' }`

**Write pattern:** upsert on the unique key. Idempotent across runs.
**Read pattern:** `findOne()` for point reads; `find().sort({ 'bucket.startsAt': 1 })` for series.

### 3.4 New collection — `AdminAuditEvent`

```ts
type AdminAuditEventDoc = {
  _id: ObjectId
  actorId: ObjectId
  actorRole: 'admin'                   // future-proofed; always 'admin' today
  impersonatorId: ObjectId | null      // reserved for future-plan; always null today
  action: AuditedAction
  resourceType: 'user' | 'therapist' | 'patient' | 'module' | 'attempt' | 'system'
  resourceId: ObjectId | null          // null for non-resource events (e.g. 'admin.loggedIn')
  outcome: 'success' | 'failure'
  context?: Record<string, unknown>    // sparse, no PHI
  ip?: string
  userAgent?: string
  at: Date
}
```

**Indexes**

- `{ actorId: 1, at: -1 }`
- `{ resourceType: 1, resourceId: 1, at: -1 }`
- `{ action: 1, at: -1 }`
- `{ at: -1 }`

**Helper:** `logAdminAction(req, { action, resourceType, resourceId, outcome, context? })` in `src/utils/audit.ts`. All writes go through this helper; no direct collection writes.
**In-product UI retention:** last 90 days (hardcoded for MVP; policy decision deferred).

### 3.5 Not added

- No `CohortAssignment` collection (derivable from attempts).
- No `Episode` / `CourseOfCare` collection (deferred).
- No `MetricDefinition` collection (instrument metadata lives on `Module`).

---

## 4. Shared-types additions

Lives in `@milobedini/shared-types` (`src/shared-types/types.ts` + `constants.ts`).

```ts
// types.ts
export type Instrument = 'phq9' | 'gad7' | 'pdss'
// extensible as more programmes seed clinical modules

export type CareTier = 'self_help' | 'cbt_guided' | 'pwp_guided'
export type TherapistTier = 'cbt' | 'pwp'

export type AuditedAction =
  | 'therapist.verified'
  | 'therapist.unverified'
  | 'user.viewed'
  | 'patient.attemptsViewed'
  | 'module.created'
  | 'admin.loggedIn'

export type MetricName = 'recovery' | 'reliable_improvement' | 'reliable_recovery'
export type PrivacyMode = 'production' | 'reduced'
export type Granularity = 'week' | 'month'

export type OutcomeResult = {
  rate: number | null                  // 0..1; null when suppressed
  n: number
  suppressed: boolean
  reason: 'below_k' | 'below_min_n' | null
}

export type AdminOverviewResponse = { … }          // see §6.2
export type AdminOutcomesResponse = { … }          // see §6.3
export type AdminProgrammeDetailResponse = { … }   // see §6.4
export type AdminAuditResponse = { … }             // see §6.5
```

**Extended existing types**

- `Module` gains `instrument?`, `clinicalCutoff?`, `reliableChangeDelta?`
- `AuthUser` / `User` / `UsersListItem` gain `therapistTier?`

**Runtime values (`constants.ts`)** — `as const` arrays matching each new string-union for FE comparisons.

---

## 5. Aggregation strategy

### 5.1 Operational vs analytical split

| Class | Source | Freshness | Path |
|---|---|---|---|
| Operational — counts, queues, deltas, WoW | Live Mongo aggregation against `users-data`, `moduleAttempts`, `moduleAssignments` on existing indexes | Request-time | Aggregation pipelines in controllers |
| Analytical — IAPT rates + time-series | `MetricsRollup` collection | Up to 24 h stale | `findOne()` + suppression wrapper |

Operational queries are cheap and idempotent; analytical queries never run live.

### 5.2 Nightly rollup job

- **Entrypoint:** `src/jobs/rollupMetrics.ts`
- **Scheduler:** `node-cron` (new dependency); cron expression `0 2 * * *` anchored to Europe/London.
- **Boot hook:** `src/index.ts` starts the scheduler, guarded by `process.env.ROLLUP_JOB_ENABLED !== 'false'`.
- **CLI entrypoint:** `npm run rollup-metrics` for manual / dev runs.

**Per-run scope**

1. Current-week bucket: re-upsert for every `(programmeId × careTier × instrument)` combination, including `null` programme (platform-wide) and `null` careTier (all-tiers-aggregated) rows.
2. Previous-week bucket: upsert once (first time it is fully settled).
3. Month buckets: rebuild just-closed month at month boundaries. Historical months never re-written.

**Idempotency:** all writes upsert on the unique index. Safe to re-run.

**Error handling:** per-combination try / catch. A failing dimension logs and does not abort the run.

**Observability:** `jobRuns` collection logs each run (`{ job, startedAt, completedAt, status, rowsWritten, errors? }`). `/overview.rollupAsOf` reads this collection.

### 5.3 IAPT computation rules

Input: all `ModuleAttempt` documents where `status === 'submitted'` and `moduleType === 'questionnaire'` and the referenced `Module.instrument !== null`.

For each dimension tuple `(programmeId, careTier, instrument)` and each bucket window:

**Step 1 — filter qualifying attempts.**

- Attempts whose `completedAt` falls in `[bucket.startsAt, bucket.endsAt)`.
- Module's `instrument` matches the dimension's `instrument`.
- If `programmeId` is not null, attempts whose `programme` matches.
- If `careTier` is not null, attempts whose derived tier matches. Derivation per attempt: no `therapist` → `self_help`; otherwise lookup current `User.therapistTier` (`'cbt' → 'cbt_guided'`, `'pwp' → 'pwp_guided'`); if therapist missing or tier null → `self_help` (fallback).

**Step 2 — per user, derive baseline and endpoint.**

- For each `userId` with ≥ 2 qualifying attempts in window:
  - `baseline` = min(`completedAt`) in window
  - `endpoint` = max(`completedAt`) in window

**Step 3 — denominator rules.**

- **Recovery / reliable recovery denominator:** users with `baseline.totalScore ≥ Module.clinicalCutoff`.
- **Reliable-improvement denominator:** all users with ≥ 2 qualifying attempts, regardless of baseline.

**Step 4 — numerator rules.**

- **Recovery:** `endpoint.totalScore < Module.clinicalCutoff`.
- **Reliable improvement:** `(baseline.totalScore − endpoint.totalScore) ≥ Module.reliableChangeDelta`. If `reliableChangeDelta` is null, metric is skipped (no rollup row written).
- **Reliable recovery:** both of the above.

**Step 5 — write rollup rows.**

- For each metric with `denominator > 0`, upsert one `MetricsRollup` document.

**Sources of truth**

- `instrument`, `clinicalCutoff`, `reliableChangeDelta` read from the **current** Module (not the attempt's `moduleSnapshot`). Clinical definitions are stable; if ever revised, rollups follow.
- `therapistTier` read from the **current** User. Tier churn redistributes historical rollup attribution. Tier-at-time fidelity deferred.

**Within-bucket pairing trade-off**

Pairing happens within each bucket (baseline and endpoint are both attempts inside `[startsAt, endsAt)`). At small user-base scale with weekly granularity, most buckets will have fewer than `K_ANONYMITY_THRESHOLD` qualifying pairs and return suppressed. This is expected behaviour, not a bug. Monthly granularity is the more informative default at current scale; weekly becomes useful as enrolment grows. Proper IAPT episode-based pairing (cross-bucket with gap detection) is deferred to the future-plan doc.

### 5.4 Suppression wrapper (read-time)

All outcome responses run through `applySuppression(rollupDoc, { k, minN, privacyMode })`:

- `denominator < k` → `{ rate: null, n: denominator, suppressed: true, reason: 'below_k' }`
- Else `denominator < minN` → `{ rate: null, n: denominator, suppressed: true, reason: 'below_min_n' }`
- Else → `{ rate: numerator / denominator, n: denominator, suppressed: false, reason: null }`

Callers never divide themselves. Every outcome-bearing response stamps `privacyMode: 'production' | 'reduced'` at the top level.

---

## 6. API contract

All endpoints require `req.user.roles` includes `'admin'` via existing role-check middleware.

### 6.1 Operational metrics inventory

The set surfaced in `/overview.operational` and in `/programmes/:id.work`. Dropped from the original pool (from Q7 analysis): `activeUsersLast7d` (DAU / MAU vanity risk) and `attemptsInProgress` (non-actionable point-in-time number).

| # | Metric | Query |
|---|---|---|
| 1 | `users.total` | `countDocuments({})` |
| 2 | `users.patients` | `countDocuments({ roles: 'patient' })` |
| 3 | `users.therapists.{total, verified, unverified}` | by role and `isVerifiedTherapist` |
| 4 | `users.therapists.zeroPatients` | therapist users with empty `patients[]` |
| 5 | `users.newThisWeek` / `newLastWeek` | `countDocuments({ createdAt: …window… })` |
| 6 | `users.activeLast30d` / `activeLast30dPrevious` | distinct users with ≥ 1 submitted attempt in window |
| 7 | `work.completedAttemptsLast7d` / `completedAttemptsPreviousWeek` | `moduleAttempts` by `completedAt` window |
| 8 | `work.byType` | `$group` by `moduleType` on submitted attempts last 7 d |
| 9 | `work.stalledAttempts7d` | `status: 'started'`, `lastInteractionAt < now - 7d` |
| 10 | `work.orphanedAssignments` | assignments whose `therapist` no longer exists or is unverified |
| 11 | `audit.eventsLast7d` | `AdminAuditEvent.countDocuments({ at: …window… })` |

### 6.2 `GET /api/admin/overview`

No query params.

```ts
type AdminOverviewResponse = {
  asOf: string
  rollupAsOf: string | null
  privacyMode: PrivacyMode
  operational: {
    users: {
      total: number
      patients: number
      therapists: {
        total: number
        verified: number
        unverified: number
        zeroPatients: number
      }
      newThisWeek: number
      newLastWeek: number
      activeLast30d: number
      activeLast30dPrevious: number
    }
    work: {
      completedAttemptsLast7d: number
      completedAttemptsPreviousWeek: number
      stalledAttempts7d: number
      orphanedAssignments: number
      byType: Array<{ moduleType: ModuleType, count: number }>
    }
    audit: {
      eventsLast7d: number
    }
  }
  programmes: Array<{
    programmeId: string
    title: string
    enrolledUsers: number
    outcomes: {
      window: 'last_90d'
      instrument: Instrument
      recovery: OutcomeResult
      reliableImprovement: OutcomeResult
      reliableRecovery: OutcomeResult
    } | null
  }>
  verificationQueue: {
    count: number
    oldest: Array<{
      userId: string
      username: string
      email: string
      name?: string
      createdAt: string
      therapistTier: TherapistTier | null
    }>
  }
}
```

**Programme "primary instrument" rule:** the instrument of the highest-score-weight questionnaire attached to the programme. Simple heuristic; future-plan flag if programmes gain multiple equally-weighted clinical measures.

### 6.3 `GET /api/admin/outcomes`

```
?programmeId=<ObjectId | 'all'>      default 'all'
&careTier=<CareTier | 'all'>          default 'all'
&instrument=<Instrument>              required
&granularity=<week | month>           default 'month'
&from=<ISO date>                      default 12 buckets ago (12 months or 12 weeks)
&to=<ISO date>                        default now
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
  range: { from: string, to: string, granularity: Granularity }
  series: Array<{
    bucket: { startsAt: string, endsAt: string }
    recovery: OutcomeResult
    reliableImprovement: OutcomeResult
    reliableRecovery: OutcomeResult
  }>
}
```

### 6.4 `GET /api/admin/programmes/:id`

```ts
type AdminProgrammeDetailResponse = {
  asOf: string
  rollupAsOf: string | null
  privacyMode: PrivacyMode
  programme: { _id: string, title: string, description: string }
  enrolment: {
    total: number
    byCareTier: Array<{ careTier: CareTier, count: number }>
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
    byType: Array<{ moduleType: ModuleType, count: number }>
  }
}
```

### 6.5 `GET /api/admin/audit`

```
?actorId=<ObjectId>
&action=<AuditedAction>
&resourceType=<string>
&resourceId=<ObjectId>
&cursor=<ISO date>
&limit=<number, default 50, max 200>
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
  actor: { _id: string, username: string, name?: string }
  actorRole: 'admin'
  impersonatorId: string | null
  action: AuditedAction
  resourceType: string
  resourceId: string | null
  outcome: 'success' | 'failure'
  context?: Record<string, unknown>
  ip?: string
  userAgent?: string
  at: string
}
```

### 6.6 Existing-endpoint deltas

- `POST /api/user/verify-therapist` — body now requires `therapistTier`. Emits `therapist.verified` audit event (success or failure).
- `POST /api/user/unverify-therapist` — **new**. Mirror of verify. Emits `therapist.unverified`.
- `GET /api/user/:id` — authorisation relaxed so admin can read any user. Emits `user.viewed` when the viewer is admin and the target is a different user.
- `GET /api/attempts/patient/:id/...` (existing therapist-scoped endpoints) — same relaxation. Emits `patient.attemptsViewed` when viewer is admin.
- Legacy `adminStats` endpoint — deprecated in favour of `/overview`. Kept unchanged for one release for safety, then removed.

### 6.7 Environment variables

```
K_ANONYMITY_THRESHOLD=5              # production floor; dev may lower
METRICS_MIN_N_FOR_DISPLAY=20         # production floor; dev may lower
ROLLUP_JOB_ENABLED=true              # disable for tests / one-off dev
```

Production boot-guard in `src/index.ts`: if `NODE_ENV === 'production'` and either threshold is below its floor, log a loud warning and force defaults.

---

## 7. Invariants

1. Every admin response includes `asOf`.
2. Every outcomes-bearing response includes `rollupAsOf` (nullable) and `privacyMode`.
3. Every `OutcomeResult` is `{ rate: number | null, n: number, suppressed: boolean, reason: 'below_k' | 'below_min_n' | null }`. `rate === null` iff `suppressed === true`.
4. Dimension objects always include `instrument`. `programmeId` / `careTier` may be `null` to denote "all".
5. Series buckets in `/outcomes` are contiguous and non-overlapping. Zero-denominator buckets still appear with `n: 0, suppressed: true, reason: 'below_k'`.
6. Suppression is never silently dropped. Even zero-denominator cells return explicit `suppressed: true`.
7. `AdminAuditEvent.context` is opaque to consumers. Known keys per action documented at the emit site, not assumed by readers.

---

## 8. Edge cases

### Role ambiguity

- User with no roles array — rejected at schema validation. Defensive 500 if it ever reaches read.
- Multi-role user (e.g. `['patient', 'therapist']`) — counted in each role total.
- Unverified therapist with assigned patients — counted in `therapists.total` and `.unverified`, not `.verified`. Their patients still derive `cbt_guided` / `pwp_guided` care tier if `therapistTier` is set.

### Time zones / DST

- All buckets anchored to **Europe/London**.
- `bucket.startsAt` / `endsAt` are UTC timestamps representing London-local boundaries; computed via Luxon.
- Attempts have UTC `completedAt`; bucketing compares UTC against the UTC-translation of the London boundary.

### Empty state / day-one admin

- `/overview` returns all zeros and empty arrays cleanly.
- Until the first nightly rollup run, `rollupAsOf === null` and all `OutcomeResult` objects are `{ rate: null, n: 0, suppressed: true, reason: 'below_k' }`.
- Empty verification queue → `{ count: 0, oldest: [] }`.

### Soft-delete vs hard-delete

- No delete flow today.
- Future soft-delete must preserve attempt data in rollups (historical rollups must not mutate).
- Hard-delete of a therapist leaves attempts with a dangling `therapist` reference. Rollup falls back to `self_help` care tier (§5.3 Step 1).

### Orphaned assignments

- `moduleAssignments` whose `therapist` is not in the set of currently-verified therapists. Counted in `/overview.work.orphanedAssignments`.

### Role / tier churn

- Rollups read current tier, not tier-at-time. Therapist switching CBT → PWP redistributes their patients' rollup attribution on next run.
- Flagged for future-plan if governance ever requires historical-fidelity tier reporting.

### Unverified therapist assigning work

- Possible in current code. Outcomes still compute; care tier derives from `therapistTier` if set; falls back to `self_help` if null.

### Below-k cohorts

- Handled by suppression wrapper. `denominator > 0 && denominator < k` → `{ rate: null, n: denominator, suppressed: true, reason: 'below_k' }`.
- `n` is always returned (tells the FE *how many* without exposing the rate).

### First-week post-rollout

- All buckets are partial. Acceptable. `rollupAsOf` + `bucket.endsAt` let consumers reason about partiality without extra flags.

### Instrument gains `reliableChangeDelta` mid-flight

- Next rollup run writes new `reliable_improvement` rows for that instrument. Historical buckets computed lazily in-situ on first run where the field is non-null.

### Instrument removed from a Module

- Should not happen. Defensive: rollup filters for `module.instrument != null` at query time.

---

## 9. Error handling

- `401 Unauthorized` — no session.
- `403 Forbidden` — session is not admin.
- `400 Bad Request` — validation failure on query params (unknown `instrument`, `from > to`, unknown `granularity`). Consistent error envelope.
- `404 Not Found` — `/programmes/:id` for a non-existent programme.
- `500` — unexpected; logged with correlation id; never exposes stack.

Audit log receives failure events as well as successes (e.g. `therapist.verified` with `outcome: 'failure'` if the backing write threw). Preserves forensic completeness.

---

## 10. Observability

- `jobRuns` collection logs each rollup run.
- `GET /api/admin/system/health` — minimal, admin-auth, returns `{ rollupLastRun, rollupStatus, auditEventsTotal }`. Not in MVP FE scope; exists for ops.

---

## 11. Testing strategy

Detail expanded in the implementation plan.

**Unit**

- IAPT computation rules against synthetic attempt fixtures (`recovery`, `reliable_improvement`, `reliable_recovery` across edge scores, missing deltas, below-cutoff baselines).
- Suppression wrapper (`below_k`, `below_min_n`, production-mode override).
- Care-tier derivation (self-help, CBT, PWP, fallback for missing tier).

**Integration**

- Rollup job end-to-end against an in-memory Mongo instance (`mongodb-memory-server`, new dev dependency) — idempotency, upsert keys, multi-dimension coverage, bucket boundaries across DST.
- `/overview` — shape stability, `asOf` presence, `privacyMode` respected, empty state.
- `/outcomes` — series continuity (no gap buckets), suppression behaviour, filter composition (`programmeId`, `careTier`, `instrument` combinations).
- `/programmes/:id` — enrolment counts, per-instrument / per-tier outcome shape.
- `/audit` — pagination, filter composition.
- Audit emission — every admin write emits the expected event shape, including failure paths.
- Boot-guard — production-mode threshold override triggers warning and forces defaults.

**Out of scope for this spec:** frontend tests.

---

## 12. Dev dataset

A dev seed script `src/seeds/seedAdminDev.ts` creates:

- ~30 patients across the depression and GAD programmes.
- ~8 weeks of PHQ-9 and GAD-7 attempts per patient.
- Roughly realistic recovery distribution (~40% cross threshold on penultimate attempt).
- A mix of self-help, CBT-guided, and PWP-guided assignments.

Never runs against production. Accessible via `npm run seed:admin-dev`.

Combined with dev-mode `K_ANONYMITY_THRESHOLD=1` and `METRICS_MIN_N_FOR_DISPLAY=1`, this produces a populated admin surface for prototype authoring and visual review without relying on real clinical data.
