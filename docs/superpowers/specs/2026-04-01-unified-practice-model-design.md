# Unified Practice Model — Design Spec

**Date:** 2026-04-01
**Status:** Approved
**Scope:** FE + BE — rethink how assignments and attempts are presented, navigated, and managed across patient and therapist experiences.

---

## Problem

The current app exposes two separate concepts to users — **Assignments** (therapist directives) and **Attempts** (patient work). These are implemented as separate tabs, separate hooks, separate routes, and separate components. This mirrors the data model but not the user's mental model:

- **Patients** think "what do I need to work on?" — not "what was I assigned?" vs "what have I attempted?"
- **Therapists** think "how is this patient doing?" and "what needs my attention?" — not "what did I assign?" vs "what was submitted?"
- **Self-help patients** (tier 1) have no therapist, so the assignment concept doesn't apply to them at all — yet they still need to track their practice.

The dual-tab structure creates cognitive overhead, fragments the user experience, and makes the app feel like a homework portal rather than a therapeutic companion.

---

## Solution Overview

Merge assignments and attempts into a single patient-facing concept called **"Practice."** The BE keeps its clean assignment/attempt data separation but evolves the API to serve unified views. Self-initiated work auto-creates assignments. The FE gets new navigation, new screens, and new hooks — all organised around how users actually think.

---

## Terminology

| Internal (BE/code) | Patient-facing (UI) | Therapist-facing (UI) |
|---------------------|---------------------|----------------------|
| Assignment | Practice item | Assignment (in patient context) |
| Attempt | (hidden — just "doing" a practice item) | Submission (in review context) |
| Assignment + latest Attempt | Practice item (unified card) | Practice item (dense card) |

The words "assignment" and "attempt" never appear in patient-facing UI. Therapists see "assignment" when managing patient work and "submission" when reviewing completed work.

---

## Data Model Changes

### Assignment Model (`moduleAssignmentModel`)

**Modified fields:**
- `therapist` — becomes **optional** (nullable). `null` = self-initiated practice.

**New fields:**
- `source` — enum `'therapist' | 'self'`. Explicit origin marker. Existing records default to `'therapist'`.
- `recurrenceGroupId` — ObjectId, nullable. Links recurring assignments into a chain. The first assignment in a recurring series generates this ID; subsequent auto-created occurrences inherit it.

**Unchanged:** All other fields, indexes, and the active uniqueness guard (one active assignment per user+module, regardless of source).

### Attempt Model (`moduleAttemptModel`)

**No structural changes.** Attempts remain the work record. The `dueAt` field (copied from assignment at start) continues to work as-is.

### Self-Initiated Assignment Auto-Creation

When `POST /modules/:moduleId/attempts` is called:
1. If `assignmentId` is provided — existing behaviour, no change.
2. If no `assignmentId` AND an active assignment exists for this user+module — auto-discover it (existing behaviour via `findActiveAssignment`).
3. If no `assignmentId` AND no active assignment exists:
   - If module `accessPolicy === 'assigned'` — reject (403). Therapist-gated modules stay gated.
   - Otherwise — auto-create an assignment: `{ user, therapist: null, source: 'self', module, moduleType, program, status: 'in_progress' }`. Then create the attempt linked to it.

### Recurring Auto-Generation

On attempt submit, if the completed assignment has `recurrence.freq !== 'none'`:

1. Compute next due date from the **current assignment's `dueAt`** by adding the recurrence interval. This anchors the cadence to the therapist's intended schedule, not the patient's actual completion date.
2. If the current assignment has no `dueAt` (edge case), fall back to computing from `completedAt`.
3. Create a new assignment: same `user`, `therapist`, `module`, `moduleType`, `program`, `recurrence`, `notes`. New `dueAt`. Same `recurrenceGroupId`. Status `assigned`.
4. Mark the current assignment `completed` as normal.

---

## API Changes

### New Endpoints

#### `GET /api/user/practice` — Patient Practice View

Replaces `GET /user/assignments` and `GET /user/attempts` for the patient's primary screen.

**Response:**
```typescript
interface PracticeResponse {
  today: PracticeItem[]            // due today or overdue
  thisWeek: PracticeItem[]         // due this week (excluding today)
  upcoming: PracticeItem[]         // due beyond this week, or no due date
  recentlyCompleted: PracticeItem[] // last 5 completed items
}

interface PracticeItem {
  assignmentId: string
  moduleId: string
  moduleTitle: string
  moduleType: ModuleType
  programTitle: string
  source: 'therapist' | 'self'
  therapistName?: string
  status: 'not_started' | 'in_progress' | 'completed'
  dueAt?: string                   // ISO date
  recurrence?: { freq: string; interval: number }
  notes?: string                   // therapist notes
  percentComplete: number
  attemptCount: number
  latestAttempt?: {
    attemptId: string
    status: AttemptStatus
    totalScore?: number
    scoreBandLabel?: string
    completedAt?: string
    iteration: number
  }
}
```

**Bucketing logic:** Server queries all assignments for the user, populates `latestAttempt` and module/program data, then buckets by `dueAt` relative to the current date (London timezone for consistency with existing `weekStart` logic). Items with no `dueAt` go to `upcoming`. Completed assignments go to `recentlyCompleted` (limited to 5, ordered by `completedAt` descending).

#### `GET /api/user/practice/history` — Patient History

Cursor-paginated list of completed practice items for the Journey tab. Replaces `GET /user/attempts` for the completed history use case.

**Query params:** `moduleId`, `moduleType`, `cursor`, `limit`

**Response:** Same `PracticeItem` shape, cursor-paginated.

#### `GET /api/user/therapist/patients/:id/practice` — Therapist Patient Practice View

Returns the unified practice view for a specific patient. Replaces both the therapist's assignment list and patient timeline endpoints for per-patient context.

**Response:** Same `PracticeResponse` shape as the patient endpoint, plus:
- `sparklines` — map of `moduleId` → last 5 `totalScore` values for scored modules. Powers the inline sparkline on dense cards.

#### `GET /api/user/therapist/review` — Therapist Review Feed

**Response:**
```typescript
interface ReviewResponse {
  needsAttention: ReviewItem[]     // capped at 20, not paginated
  submissions: {
    items: ReviewItem[]
    nextCursor?: string
    total: number
  }
}

interface ReviewItem extends PracticeItem {
  patientId: string
  patientName: string
  attentionReason?: 'severe_score' | 'score_regression' | 'overdue' | 'first_submission'
  attentionPriority?: 'high' | 'medium' | 'low'
}
```

**Query params:** `sort` (newest/oldest/severity), `groupBy` (date/patient/module), `patientId`, `moduleId`, `severity`, `dateFrom`, `dateTo`, `cursor`, `limit`

### Enhanced Existing Endpoints

- `POST /modules/:moduleId/attempts` — enhanced with self-initiated assignment auto-creation (see Data Model section).
- `POST /attempts/:id/submit` — enhanced with recurring auto-generation (see Data Model section).

### Deprecated Endpoints (remove after FE migration)

| Old | Replaced by |
|-----|-------------|
| `GET /user/assignments` | `GET /user/practice` |
| `GET /user/attempts` | `GET /user/practice` + `GET /user/practice/history` |
| `GET /user/therapist/attempts/latest` | `GET /user/therapist/review` |
| `GET /user/therapist/patients/:id/timeline` | `GET /user/therapist/patients/:id/practice` |
| `GET /user/therapist/attempts/modules` | Filter data from `/user/therapist/review` or lightweight modules hook |

### Unchanged Endpoints

- `POST /assignments` (therapist creates)
- `PATCH /assignments/:id` (therapist edits)
- `DELETE /assignments/:id` (therapist removes)
- `PATCH /attempts/:id` (save progress)
- `GET /attempts/:id` (patient attempt detail)
- `GET /attempts/therapist/:id` (therapist attempt detail)
- `GET /user/score-trends` (Journey tab)
- `GET /assignments/mine` (therapist's own assignments — used within patient practice view)

---

## Needs Attention Logic

Evaluated server-side for the therapist Review tab. Items appear in the `needsAttention` array.

### Criteria

| Rule | Description | Priority |
|------|-------------|----------|
| Severe score | Latest attempt `scoreBandLabel` is `'Severe'` or `'Moderately Severe'` | High |
| Score regression | Latest `totalScore` > previous `totalScore` on the same user+module (higher = worse). Requires 2+ submitted attempts. | High |
| Overdue + not started | Assignment `dueAt` is 2+ days past, status is `assigned` (no attempt started). Indicates disengagement. | Medium |
| First submission | Patient's first-ever submitted attempt across all modules. Therapist should review baseline. | Low |

### Rules

- **Ordering:** High priority first, then medium, then low. Within the same priority, newest first.
- **Cap:** Maximum 20 items. Excess items are still visible in "All Submissions."
- **Deduplication:** If the same attempt triggers multiple rules (e.g., severe AND regression), it appears once at the highest priority.
- **Stateless:** No read/unread tracking. Items leave "Needs Attention" naturally (next attempt scores lower, patient starts overdue item, therapist cancels assignment).
- **Score direction assumption:** All current scored questionnaires follow higher-is-worse. If a future module inverts this, add a `scoreDirection` field to the module model. Out of scope for this spec.

---

## FE Navigation

### Patient Tab Bar

| Tab | Icon | Route prefix |
|-----|------|-------------|
| Home | `home` | `/(main)/(tabs)/home` |
| Practice | `clipboard-text-clock` | `/(main)/(tabs)/practice` |
| Journey | `chart-line` | `/(main)/(tabs)/journey` |
| Profile | `account` | `/(main)/(tabs)/profile` |

### Patient Routes

| Route | Screen | Purpose |
|-------|--------|---------|
| `/practice/` | `PracticeScreen` | Today / This Week / Upcoming / Recently Completed |
| `/practice/[id]` | `PracticeItemDetail` | Resolves assignmentId → latest attempt → AttemptPresenter. Auto-starts attempt if `not_started`. |
| `/journey/` | `JourneyScreen` | Score trends, program progress, history |
| `/journey/history` | `JourneyHistoryList` | Full paginated completed history with filters |

### Therapist Tab Bar

| Tab | Icon | Route prefix |
|-----|------|-------------|
| Dashboard | `view-dashboard` | `/(main)/(tabs)/home` |
| Patients | `account-group` | `/(main)/(tabs)/patients` |
| Review | `clipboard-check` | `/(main)/(tabs)/review` |
| Profile | `account` | `/(main)/(tabs)/profile` |

### Therapist Routes

| Route | Screen | Purpose |
|-------|--------|---------|
| `/patients/` | Client list | Existing clients tab, relocated |
| `/patients/[id]` | `PatientPracticeView` | Dense cards with inline scores, sparklines. Assignment CRUD here. |
| `/patients/[id]/[assignmentId]` | Attempt detail | Drill into specific practice item |
| `/review/` | `ReviewScreen` | Needs Attention + All Submissions |
| `/review/[attemptId]` | Attempt detail | Detail from review feed |

### Removed Routes

- `/assignments/` and all sub-routes
- `/attempts/` and all sub-routes

---

## FE Hooks

### New

| Hook | Replaces | Endpoint |
|------|----------|----------|
| `useMyPractice()` | `useViewMyAssignments` | `GET /user/practice` |
| `useMyPracticeHistory(filters)` | `useGetMyAttempts` | `GET /user/practice/history` (cursor-paginated) |
| `usePatientPractice(patientId)` | `useGetPatientTimeline` + `useTherapistAssignments` | `GET /user/therapist/patients/:id/practice` |
| `useTherapistReview(filters)` | `useTherapistGetLatestAttempts` | `GET /user/therapist/review` |

### Kept (unchanged)

- `useStartModuleAttempt` — still creates attempts; BE now handles auto-assignment creation
- `useSaveModuleAttempt` — unchanged
- `useSubmitAttempt` — unchanged; BE handles recurring auto-generation
- `useCreateAssignment`, `useUpdateAssignment`, `useRemoveAssignment` — used by therapists within `PatientPracticeView`
- `useGetMyAttemptDetail`, `useTherapistGetAttemptDetail` — used by detail screens
- `useScoreTrends` — used by Journey tab

### Removed

- `useViewMyAssignments` → `useMyPractice`
- `useViewTherapistOutstandingAssignments` → `usePatientPractice`
- `useTherapistAssignments` → `usePatientPractice`
- `useGetMyAttempts` → `useMyPracticeHistory`
- `useTherapistGetLatestAttempts` → `useTherapistReview`
- `useTherapistAttemptModules` → filter data from `useTherapistReview` or lightweight modules hook

---

## FE Components

### New

| Component | Purpose |
|-----------|---------|
| `PracticeScreen` | Patient main screen — Today / This Week / Upcoming / Recently Completed sections |
| `PracticeItem` | Card component for a single practice item in the patient view |
| `PracticeItemDetail` | Screen: resolves assignmentId → latest attempt → renders AttemptPresenter |
| `JourneyScreen` | Score trends, program progress, history list |
| `JourneyHistoryList` | Paginated completed practice history with module/type filters |
| `PatientPracticeView` | Therapist's per-patient view — dense cards with inline scores and sparklines |
| `PatientPracticeCard` | Dense card: module, score, band, sparkline, due date, attempt count |
| `ReviewScreen` | Therapist review tab — Needs Attention + All Submissions |
| `NeedsAttentionSection` | Non-sortable severity-driven list at top of Review |
| `ReviewSubmissionsList` | Sortable / groupable / filterable submissions feed |
| `ReviewFilterDrawer` | Filter drawer for Review tab |

### Kept (unchanged)

- All presenters: `AttemptPresenter`, `QuestionnairePresenter`, `ActivityDiaryPresenter`, `ReadingPresenter`
- `PatientAttemptDetail`, `TherapistAttemptDetail` — minor updates for assignmentId routing
- `EditAssignmentModal` — reused within `PatientPracticeView`
- All reusable UI primitives: `EmptyState`, `StatusChip`, `ActionMenu`, `Chip`, `SearchPickerDialog`, etc.

### Removed

| Component | Replaced by |
|-----------|-------------|
| `PatientActiveAssignments` | `PracticeScreen` |
| `PatientCompletedAssignments` | `PracticeScreen` |
| `AssignmentsListPatient` | `PracticeScreen` |
| `TherapistActiveAssignments` | `PatientPracticeView` |
| `AssignmentsListTherapist` | `PatientPracticeView` |
| `AssignmentCard` | `PatientPracticeCard` |
| `PatientGroupHeader` | N/A (grouping moves to per-patient view) |
| `TherapistLatestAttempts` | `ReviewScreen` |
| `TherapistAttemptListItem` | `ReviewSubmissionsList` |
| `PatientAttempts` | `JourneyHistoryList` |
| `AssignmentFilterDrawer` | Filters within `PatientPracticeView` |
| `AttemptFilterDrawer` | `ReviewFilterDrawer` |

---

## Dashboard Wiring (Out of Scope)

Dashboards are **not** redesigned. Minor changes only:

- **Patient Home:** "Coming Up" card and "Focus Card" pull from `useMyPractice()` instead of `useViewMyAssignments()`. Links navigate to Practice tab.
- **Therapist Dashboard:** "Needs attention" stat links to Review tab. "Completed this week" stat links to Review tab with date filter. Other stats unchanged.

---

## Seed Data Requirements

The `seedAll` file must be updated to exercise the new model thoroughly. Required seed scenarios:

### Patient Practice States

- **Not started:** Assignment exists, no attempt created yet. Due dates varying: due today, due this week, due next week, overdue.
- **In progress:** Assignment with an active attempt at various completion levels (25%, 50%, 75%). All three module types (questionnaire, diary, reading).
- **Completed:** Multiple completed assignments with submitted attempts. Varying scores and bands for questionnaires.
- **Self-initiated:** Assignments with `source: 'self'`, `therapist: null`. Mix of active and completed.

### Recurring Assignments

- Active recurring assignment (weekly PHQ-9) with 3+ completed occurrences sharing a `recurrenceGroupId`. Shows chain history.
- Recurring assignment mid-cycle (current occurrence in progress, past occurrences completed).
- Recurring assignment with no due date (edge case).

### Therapist Review Scenarios

- **Severe score:** Patient with a PHQ-9 score in the severe band (20+).
- **Score regression:** Patient whose latest score is higher than previous (e.g., PHQ-9 went from 8 to 14).
- **Overdue + not started:** Assignment due 3+ days ago, still in `assigned` status.
- **First submission:** A patient with exactly one submitted attempt (their first).
- **Normal submissions:** Several routine completions that should NOT trigger Needs Attention.

### Multi-Patient Therapist View

- Therapist with 4-5 patients, each at different stages:
  - One patient with all practice up to date (model patient)
  - One patient with overdue items (disengaged)
  - One patient with concerning score trends (regression)
  - One patient who is new (first submission only)
  - One patient with a mix of therapist-assigned and self-initiated practice

### Score Trends

- At least one patient with 5+ completed questionnaire attempts on the same module to produce meaningful sparkline data.
- At least one patient with scores across multiple questionnaire types (PHQ-9 and GAD-7) for the Journey tab.

### Edge Cases

- Assignment with `recurrence` but no `dueAt`
- Completed assignment with multiple attempts (iteration 1, 2, 3)
- Self-initiated practice on a module that also has a therapist assignment (different patients)

---

## Out of Scope

- Dashboard redesigns (beyond link/data-source rewiring)
- Read/unread tracking for therapist submissions
- Score direction inversion (future module types that score lower-is-worse)
- Admin role changes (admin views are unaffected by this redesign)
- Notification system for Needs Attention items
- Offline support / optimistic updates for practice items
