# Unified Practice Model Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Merge assignments and attempts into a single patient-facing "Practice" concept with unified API endpoints, restructured navigation, and a therapist review feed with clinical attention logic.

**Architecture:** BE changes first (shared types, schema, new endpoints, enhanced existing endpoints, seed data), then FE (new hooks, patient Practice + Journey tabs, therapist Patients + Review tabs, navigation restructure, cleanup old code). The BE keeps the assignment/attempt data separation internally but serves unified views. Self-initiated work auto-creates assignments with `therapist: null`.

**Tech Stack:** Node/Express + Mongoose (BE), React Native + Expo + expo-router (FE), TanStack React Query (data fetching), NativeWind/Tailwind (styling), Zustand (auth state)

**Spec:** `docs/superpowers/specs/2026-04-01-unified-practice-model-design.md`

---

## File Structure

### BE (`../cbt/`)

| Action | File | Responsibility |
|--------|------|---------------|
| Modify | `src/shared-types/types.ts` | Add `PracticeItem`, `PracticeResponse`, `ReviewItem`, `ReviewResponse`, `AssignmentSource`, update `ModuleAssignment` |
| Modify | `src/models/moduleAssignmentModel.ts` | Add `source`, `recurrenceGroupId` fields; make `therapist` optional |
| Modify | `src/controllers/attemptsController.ts` | Enhance `startAttempt` (auto-create assignment), enhance `submitAttempt` (recurring auto-generation) |
| Create | `src/controllers/practiceController.ts` | `getMyPractice`, `getMyPracticeHistory`, `getPatientPractice` |
| Create | `src/controllers/reviewController.ts` | `getTherapistReview` with needs-attention logic |
| Create | `src/utils/practiceUtils.ts` | Shared bucketing logic, needs-attention criteria, next-recurrence computation |
| Modify | `src/routes/userRoute.ts` | Register new practice and review routes |
| Modify | `src/seeds/seedAll.ts` | Add self-initiated assignments, recurring chains, regression/severity scenarios |

### FE (`./`)

| Action | File | Responsibility |
|--------|------|---------------|
| Create | `hooks/usePractice.ts` | `useMyPractice`, `useMyPracticeHistory`, `usePatientPractice`, `useTherapistReview` |
| Create | `components/practice/PracticeScreen.tsx` | Patient main screen — Today/This Week/Upcoming/Recently Completed |
| Create | `components/practice/PracticeItem.tsx` | Card component for a single practice item |
| Create | `components/practice/PracticeItemDetail.tsx` | Resolves assignmentId to attempt to AttemptPresenter |
| Create | `components/journey/JourneyScreen.tsx` | Score trends + program progress + history |
| Create | `components/journey/JourneyHistoryList.tsx` | Paginated completed history with filters |
| Create | `components/therapist/PatientPracticeView.tsx` | Per-patient view with dense cards + sparklines |
| Create | `components/therapist/PatientPracticeCard.tsx` | Dense card: score, band, sparkline, due date |
| Create | `components/therapist/ReviewScreen.tsx` | Needs Attention + All Submissions |
| Create | `components/therapist/NeedsAttentionSection.tsx` | Non-sortable severity-driven list |
| Create | `components/therapist/ReviewSubmissionsList.tsx` | Sortable/groupable/filterable feed |
| Create | `components/therapist/ReviewFilterDrawer.tsx` | Filter drawer for Review tab |
| Create | `app/(main)/(tabs)/practice/_layout.tsx` | Practice tab stack |
| Create | `app/(main)/(tabs)/practice/index.tsx` | Practice tab screen |
| Create | `app/(main)/(tabs)/practice/[id].tsx` | Practice item detail route |
| Create | `app/(main)/(tabs)/journey/_layout.tsx` | Journey tab stack |
| Create | `app/(main)/(tabs)/journey/index.tsx` | Journey tab screen |
| Create | `app/(main)/(tabs)/review/_layout.tsx` | Review tab stack |
| Create | `app/(main)/(tabs)/review/index.tsx` | Review tab screen |
| Create | `app/(main)/(tabs)/review/[id].tsx` | Review attempt detail route |
| Modify | `app/(main)/(tabs)/_layout.tsx` | New tab bar: patient Home/Practice/Journey/Profile; therapist Dashboard/Patients/Review/Profile |
| Modify | `app/(main)/(tabs)/home/index.tsx` | Rewire dashboard links to new tabs |
| Modify | `types/types.ts` | Add local enums for new filter/sort types |
| Delete | `app/(main)/(tabs)/assignments/` | Old assignments routes |
| Delete | `app/(main)/(tabs)/attempts/` | Old attempts routes |
| Delete | `components/assignments/` | Old assignment components |
| Delete | `components/attempts/PatientAttempts.tsx` | Replaced by JourneyHistoryList |
| Delete | `components/attempts/TherapistLatestAttempts.tsx` | Replaced by ReviewScreen |
| Modify | `hooks/useAssignments.ts` | Remove deprecated hooks, keep therapist CRUD mutations |
| Modify | `hooks/useAttempts.ts` | Remove deprecated hooks, keep start/save/submit mutations + detail queries |

---

## Phase 1: BE Data Model and Shared Types

### Task 1: Update Assignment Model Schema

**Files:**
- Modify: `../cbt/src/models/moduleAssignmentModel.ts`

- [ ] **Step 1: Make `therapist` optional and add new fields**

Replace the full file content of `../cbt/src/models/moduleAssignmentModel.ts`:

```typescript
import mongoose, { Schema, Document, Types } from 'mongoose'

type AssignmentStatus = 'assigned' | 'in_progress' | 'completed' | 'cancelled'
type AssignmentSource = 'therapist' | 'self'

interface IModuleAssignment extends Document {
  user: Types.ObjectId
  therapist?: Types.ObjectId // null for self-initiated
  program: Types.ObjectId
  module: Types.ObjectId
  moduleType:
    | 'questionnaire'
    | 'reading'
    | 'activity_diary'

  status: AssignmentStatus
  source: AssignmentSource
  createdAt: Date
  updatedAt: Date

  dueAt?: Date
  recurrence?: { freq: 'weekly' | 'monthly' | 'none'; interval?: number }
  recurrenceGroupId?: Types.ObjectId // links recurring chain
  latestAttempt?: Types.ObjectId
  notes?: string
}

const ModuleAssignmentSchema = new Schema<IModuleAssignment>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    therapist: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      index: true,
      default: null,
    },
    program: {
      type: Schema.Types.ObjectId,
      ref: 'Program',
      required: true,
      index: true,
    },
    module: {
      type: Schema.Types.ObjectId,
      ref: 'Module',
      required: true,
      index: true,
    },
    moduleType: {
      type: String,
      enum: ['questionnaire', 'reading', 'activity_diary'],
      required: true,
    },

    status: {
      type: String,
      enum: ['assigned', 'in_progress', 'completed', 'cancelled'],
      default: 'assigned',
      index: true,
    },
    source: {
      type: String,
      enum: ['therapist', 'self'],
      default: 'therapist',
    },
    dueAt: { type: Date, index: true },
    recurrence: {
      freq: {
        type: String,
        enum: ['weekly', 'monthly', 'none'],
        default: 'none',
      },
      interval: { type: Number, default: 1 },
    },
    recurrenceGroupId: { type: Schema.Types.ObjectId, default: null },
    latestAttempt: { type: Schema.Types.ObjectId, ref: 'ModuleAttempt' },
    notes: String,
  },
  { timestamps: true, collection: 'moduleAssignments' }
)

ModuleAssignmentSchema.index({ therapist: 1, status: 1, dueAt: 1 })
export default mongoose.model<IModuleAssignment>(
  'ModuleAssignment',
  ModuleAssignmentSchema
)
export type { IModuleAssignment, AssignmentSource }
```

- [ ] **Step 2: Verify the BE compiles**

Run: `cd ../cbt && npx tsc --noEmit`
Expected: No errors (or only pre-existing ones unrelated to assignment model).

- [ ] **Step 3: Commit**

```bash
cd ../cbt && git add src/models/moduleAssignmentModel.ts && git commit -m "feat(model): add source, recurrenceGroupId to assignment; make therapist optional"
```

---

### Task 2: Update Shared Types

**Files:**
- Modify: `../cbt/src/shared-types/types.ts`

- [ ] **Step 1: Add `AssignmentSource` and update `ModuleAssignment` type**

In `../cbt/src/shared-types/types.ts`, replace lines 242-266 (the Assignments section):

```typescript
export type AssignmentStatus =
  | 'assigned'
  | 'in_progress'
  | 'completed'
  | 'cancelled'
export type AssignmentRecurrence = {
  freq: 'weekly' | 'monthly' | 'none'
  interval?: number
}
export type AssignmentSource = 'therapist' | 'self'

export type ModuleAssignment = {
  _id: string
  user: string
  therapist?: string // null for self-initiated
  program: string
  module: string
  moduleType: ModuleType
  status: AssignmentStatus
  source: AssignmentSource
  dueAt?: string
  recurrence?: AssignmentRecurrence
  recurrenceGroupId?: string
  latestAttempt?: string
  notes?: string
  createdAt: string
  updatedAt: string
}
```

- [ ] **Step 2: Add `PracticeItem` and `PracticeResponse` types**

Append after the `MyAssignmentsResponse` type (after line 507):

```typescript
// ==================================
// API: Unified Practice
// ==================================
export type PracticeItemStatus = 'not_started' | 'in_progress' | 'completed'

export type PracticeLatestAttempt = {
  attemptId: string
  status: AttemptStatus
  totalScore?: number
  scoreBandLabel?: string
  completedAt?: string
  iteration: number
}

export type PracticeItem = {
  assignmentId: string
  moduleId: string
  moduleTitle: string
  moduleType: ModuleType
  programTitle: string
  source: AssignmentSource
  therapistName?: string
  status: PracticeItemStatus
  dueAt?: string
  recurrence?: AssignmentRecurrence
  notes?: string
  percentComplete: number
  attemptCount: number
  latestAttempt?: PracticeLatestAttempt
}

export type PracticeResponse = {
  success: boolean
  today: PracticeItem[]
  thisWeek: PracticeItem[]
  upcoming: PracticeItem[]
  recentlyCompleted: PracticeItem[]
}

export type PracticeHistoryQuery = {
  moduleId?: string
  moduleType?: ModuleType
  cursor?: string
  limit?: number
}

export type PracticeHistoryResponse = {
  success: boolean
  items: PracticeItem[]
  nextCursor: string | null
}

// ==================================
// API: Patient Practice for Therapist
// ==================================
export type SparklineMap = Record<string, number[]> // moduleId to last 5 scores

export type PatientPracticeResponse = PracticeResponse & {
  sparklines: SparklineMap
}

// ==================================
// API: Therapist Review
// ==================================
export type AttentionReason =
  | 'severe_score'
  | 'score_regression'
  | 'overdue'
  | 'first_submission'
export type AttentionPriority = 'high' | 'medium' | 'low'

export type ReviewItem = PracticeItem & {
  patientId: string
  patientName: string
  attentionReason?: AttentionReason
  attentionPriority?: AttentionPriority
}

export type ReviewGroupBy = 'date' | 'patient' | 'module'

export type ReviewFilters = {
  sort?: SortOption
  groupBy?: ReviewGroupBy
  patientId?: string
  moduleId?: string
  severity?: SeverityOption
  dateFrom?: string
  dateTo?: string
  cursor?: string
  limit?: number
}

export type ReviewResponse = {
  success: boolean
  needsAttention: ReviewItem[]
  submissions: {
    items: ReviewItem[]
    nextCursor: string | null
    total: number
  }
}
```

- [ ] **Step 3: Verify the BE compiles**

Run: `cd ../cbt && npx tsc --noEmit`

- [ ] **Step 4: Commit**

```bash
cd ../cbt && git add src/shared-types/types.ts && git commit -m "feat(types): add PracticeItem, PracticeResponse, ReviewItem, ReviewResponse shared types"
```

---

## Phase 2: BE New Endpoints

### Task 3: Create Practice Utilities

**Files:**
- Create: `../cbt/src/utils/practiceUtils.ts`

- [ ] **Step 1: Create the utility file**

Write `../cbt/src/utils/practiceUtils.ts`:

```typescript
import { DateTime } from 'luxon'
import type { Types } from 'mongoose'
import ModuleAttempt from '../models/moduleAttemptModel'
import type { PracticeItem, PracticeItemStatus } from '../shared-types/types'
import { computePercentCompleteForAttempt } from '../controllers/attemptsController'

const LONDON_TZ = 'Europe/London'

/**
 * Bucket practice items into today / thisWeek / upcoming / recentlyCompleted
 */
export const bucketPracticeItems = (
  items: PracticeItem[]
): {
  today: PracticeItem[]
  thisWeek: PracticeItem[]
  upcoming: PracticeItem[]
  recentlyCompleted: PracticeItem[]
} => {
  const now = DateTime.now().setZone(LONDON_TZ)
  const todayEnd = now.endOf('day')
  const weekEnd = now.endOf('week') // Sunday end

  const today: PracticeItem[] = []
  const thisWeek: PracticeItem[] = []
  const upcoming: PracticeItem[] = []
  const recentlyCompleted: PracticeItem[] = []

  for (const item of items) {
    if (item.status === 'completed') {
      recentlyCompleted.push(item)
      continue
    }

    if (!item.dueAt) {
      upcoming.push(item)
      continue
    }

    const due = DateTime.fromISO(item.dueAt, { zone: LONDON_TZ })

    if (due <= todayEnd) {
      // Due today or overdue
      today.push(item)
    } else if (due <= weekEnd) {
      thisWeek.push(item)
    } else {
      upcoming.push(item)
    }
  }

  return {
    today: today.sort(sortByDueAsc),
    thisWeek: thisWeek.sort(sortByDueAsc),
    upcoming: upcoming.sort(sortByDueAsc),
    recentlyCompleted: recentlyCompleted.slice(0, 5),
  }
}

const sortByDueAsc = (a: PracticeItem, b: PracticeItem): number => {
  if (!a.dueAt && !b.dueAt) return 0
  if (!a.dueAt) return 1
  if (!b.dueAt) return -1
  return new Date(a.dueAt).getTime() - new Date(b.dueAt).getTime()
}

/**
 * Map assignment status to practice item status
 */
export const toPracticeStatus = (
  assignmentStatus: string
): PracticeItemStatus => {
  switch (assignmentStatus) {
    case 'assigned':
      return 'not_started'
    case 'in_progress':
      return 'in_progress'
    case 'completed':
      return 'completed'
    case 'cancelled':
      return 'completed' // treat cancelled as done
    default:
      return 'not_started'
  }
}

/**
 * Compute the next due date for a recurring assignment.
 * Anchors to the ORIGINAL dueAt, not the completion date.
 */
export const computeNextDueDate = (
  currentDueAt: Date | undefined,
  completedAt: Date,
  freq: 'weekly' | 'monthly' | 'none',
  interval: number = 1
): Date | undefined => {
  if (freq === 'none') return undefined

  // Anchor to original due date if available, else fall back to completedAt
  const anchor = currentDueAt ?? completedAt
  const dt = DateTime.fromJSDate(anchor, { zone: LONDON_TZ })

  const next =
    freq === 'weekly'
      ? dt.plus({ weeks: interval })
      : dt.plus({ months: interval })

  return next.toJSDate()
}

/**
 * Compute sparkline data: last 5 scores per scored module for a user.
 */
export const computeSparklines = async (
  userId: Types.ObjectId
): Promise<Record<string, number[]>> => {
  const pipeline = [
    {
      $match: {
        user: userId,
        status: 'submitted',
        moduleType: 'questionnaire',
        totalScore: { $ne: null },
      },
    },
    { $sort: { completedAt: -1 as const } },
    {
      $group: {
        _id: '$module',
        scores: { $push: '$totalScore' },
      },
    },
    {
      $project: {
        scores: { $slice: ['$scores', 5] },
      },
    },
  ]

  const results = await ModuleAttempt.aggregate(pipeline)
  const sparklines: Record<string, number[]> = {}
  for (const row of results) {
    // Reverse so oldest is first (for sparkline left-to-right)
    sparklines[row._id.toString()] = (row.scores as number[]).reverse()
  }
  return sparklines
}

/**
 * Build a PracticeItem from a populated assignment document.
 * Expects assignment to have been populated with module, program, therapist, latestAttempt.
 */
export const assignmentToPracticeItem = (
  asg: any // populated lean document
): PracticeItem => {
  const la = asg.latestAttempt as any | undefined
  const percentComplete =
    asg.status === 'completed'
      ? 100
      : la
        ? computePercentCompleteForAttempt(la)
        : 0

  return {
    assignmentId: asg._id.toString(),
    moduleId: asg.module?._id?.toString() ?? '',
    moduleTitle: asg.module?.title ?? '',
    moduleType: asg.moduleType,
    programTitle: asg.program?.title ?? '',
    source: asg.source ?? 'therapist',
    therapistName: asg.therapist?.name ?? undefined,
    status: toPracticeStatus(asg.status),
    dueAt: asg.dueAt?.toISOString(),
    recurrence: asg.recurrence,
    notes: asg.notes,
    percentComplete,
    attemptCount: asg.attemptCount ?? 0,
    latestAttempt: la
      ? {
          attemptId: la._id.toString(),
          status: la.status,
          totalScore: la.totalScore ?? undefined,
          scoreBandLabel: la.scoreBandLabel ?? undefined,
          completedAt: la.completedAt?.toISOString(),
          iteration: la.iteration ?? 1,
        }
      : undefined,
  }
}
```

- [ ] **Step 2: Verify the BE compiles**

Run: `cd ../cbt && npx tsc --noEmit`

- [ ] **Step 3: Commit**

```bash
cd ../cbt && git add src/utils/practiceUtils.ts && git commit -m "feat(utils): add practiceUtils for bucketing, status mapping, sparklines, recurrence"
```

---

### Task 4: Create Practice Controller

**Files:**
- Create: `../cbt/src/controllers/practiceController.ts`

- [ ] **Step 1: Create the practice controller**

Write `../cbt/src/controllers/practiceController.ts`:

```typescript
import type { Request, Response } from 'express'
import { Types } from 'mongoose'
import ModuleAssignment from '../models/moduleAssignmentModel'
import ModuleAttempt from '../models/moduleAttemptModel'
import { errorHandler } from '../utils/errorHandler'
import { therapistCanSeePatient } from '../utils/attemptUtils'
import {
  assignmentToPracticeItem,
  bucketPracticeItems,
  computeSparklines,
} from '../utils/practiceUtils'

const POPULATE_FIELDS = [
  { path: 'module', select: '_id title type accessPolicy' },
  { path: 'program', select: '_id title' },
  { path: 'therapist', select: 'name' },
  {
    path: 'latestAttempt',
    select: [
      '_id',
      'status',
      'completedAt',
      'totalScore',
      'scoreBandLabel',
      'answers',
      'moduleSnapshot.questions',
      'diaryEntries.at',
      'diaryEntries.activity',
      'diaryEntries.mood',
      'diaryEntries.achievement',
      'diaryEntries.closeness',
      'diaryEntries.enjoyment',
      'moduleType',
      'startedAt',
      'lastInteractionAt',
      'iteration',
    ].join(' '),
  },
]

/**
 * GET /api/user/practice
 * Patient's unified practice view bucketed by time.
 */
export const getMyPractice = async (req: Request, res: Response) => {
  try {
    const userId = req.user?._id as Types.ObjectId
    if (!userId) {
      res.status(401).json({ success: false, message: 'Unauthorized' })
      return
    }

    // Active items
    const activeItems = await ModuleAssignment.find({
      user: userId,
      status: { $in: ['assigned', 'in_progress'] },
    })
      .sort({ dueAt: 1, createdAt: -1 })
      .populate(POPULATE_FIELDS)
      .lean()

    // Recently completed (last 5)
    const completedItems = await ModuleAssignment.find({
      user: userId,
      status: 'completed',
    })
      .sort({ updatedAt: -1 })
      .limit(5)
      .populate(POPULATE_FIELDS)
      .lean()

    // Count attempts per module for this user
    const allModuleIds = [...activeItems, ...completedItems].map((a) =>
      typeof a.module === 'object' ? (a.module as any)._id : a.module
    )
    const attemptCounts = await ModuleAttempt.aggregate([
      {
        $match: {
          user: userId,
          module: { $in: allModuleIds },
          status: 'submitted',
        },
      },
      { $group: { _id: '$module', count: { $sum: 1 } } },
    ])
    const countMap = new Map(
      attemptCounts.map((r) => [r._id.toString(), r.count as number])
    )

    const allItems = [...activeItems, ...completedItems].map((asg) => {
      const moduleId =
        typeof asg.module === 'object' && asg.module !== null
          ? (asg.module as any)._id?.toString()
          : asg.module?.toString()
      return assignmentToPracticeItem({
        ...asg,
        attemptCount: countMap.get(moduleId) ?? 0,
      })
    })

    const bucketed = bucketPracticeItems(allItems)

    res.status(200).json({ success: true, ...bucketed })
  } catch (error) {
    errorHandler(res, error)
  }
}

/**
 * GET /api/user/practice/history
 * Patient's completed practice history with cursor pagination.
 */
export const getMyPracticeHistory = async (req: Request, res: Response) => {
  try {
    const userId = req.user?._id as Types.ObjectId
    if (!userId) {
      res.status(401).json({ success: false, message: 'Unauthorized' })
      return
    }

    const {
      moduleId,
      moduleType,
      cursor,
      limit: limitStr,
    } = req.query as {
      moduleId?: string
      moduleType?: string
      cursor?: string
      limit?: string
    }
    const limit = Math.min(Number(limitStr) || 20, 50)

    const match: Record<string, any> = {
      user: userId,
      status: 'completed',
    }
    if (moduleId) match['module'] = new Types.ObjectId(moduleId)
    if (moduleType) match['moduleType'] = moduleType
    if (cursor) match['updatedAt'] = { $lt: new Date(cursor) }

    const items = await ModuleAssignment.find(match)
      .sort({ updatedAt: -1 })
      .limit(limit + 1)
      .populate(POPULATE_FIELDS)
      .lean()

    const hasNext = items.length > limit
    const page = hasNext ? items.slice(0, limit) : items

    // Attempt counts
    const moduleIds = page.map((a) =>
      typeof a.module === 'object' ? (a.module as any)._id : a.module
    )
    const attemptCounts = await ModuleAttempt.aggregate([
      {
        $match: {
          user: userId,
          module: { $in: moduleIds },
          status: 'submitted',
        },
      },
      { $group: { _id: '$module', count: { $sum: 1 } } },
    ])
    const countMap = new Map(
      attemptCounts.map((r) => [r._id.toString(), r.count as number])
    )

    const practiceItems = page.map((asg) => {
      const modId =
        typeof asg.module === 'object'
          ? (asg.module as any)._id?.toString()
          : asg.module?.toString()
      return assignmentToPracticeItem({
        ...asg,
        attemptCount: countMap.get(modId) ?? 0,
      })
    })

    const nextCursor = hasNext
      ? page[page.length - 1].updatedAt.toISOString()
      : null

    res.status(200).json({
      success: true,
      items: practiceItems,
      nextCursor,
    })
  } catch (error) {
    errorHandler(res, error)
  }
}

/**
 * GET /api/user/therapist/patients/:patientId/practice
 * Therapist's view of a patient's practice with sparklines.
 */
export const getPatientPractice = async (req: Request, res: Response) => {
  try {
    const therapistId = req.user?._id as Types.ObjectId
    const { patientId } = req.params

    if (!therapistId) {
      res.status(401).json({ success: false, message: 'Unauthorized' })
      return
    }

    const canSee = await therapistCanSeePatient(
      therapistId,
      new Types.ObjectId(patientId)
    )
    if (!canSee) {
      res.status(403).json({ success: false, message: 'Forbidden' })
      return
    }

    const patientObjId = new Types.ObjectId(patientId)

    // Active items
    const activeItems = await ModuleAssignment.find({
      user: patientObjId,
      status: { $in: ['assigned', 'in_progress'] },
    })
      .sort({ dueAt: 1, createdAt: -1 })
      .populate(POPULATE_FIELDS)
      .lean()

    // Recently completed (last 5)
    const completedItems = await ModuleAssignment.find({
      user: patientObjId,
      status: 'completed',
    })
      .sort({ updatedAt: -1 })
      .limit(5)
      .populate(POPULATE_FIELDS)
      .lean()

    // Attempt counts
    const allModuleIds = [...activeItems, ...completedItems].map((a) =>
      typeof a.module === 'object' ? (a.module as any)._id : a.module
    )
    const attemptCounts = await ModuleAttempt.aggregate([
      {
        $match: {
          user: patientObjId,
          module: { $in: allModuleIds },
          status: 'submitted',
        },
      },
      { $group: { _id: '$module', count: { $sum: 1 } } },
    ])
    const countMap = new Map(
      attemptCounts.map((r) => [r._id.toString(), r.count as number])
    )

    const allItems = [...activeItems, ...completedItems].map((asg) => {
      const modId =
        typeof asg.module === 'object'
          ? (asg.module as any)._id?.toString()
          : asg.module?.toString()
      return assignmentToPracticeItem({
        ...asg,
        attemptCount: countMap.get(modId) ?? 0,
      })
    })

    const bucketed = bucketPracticeItems(allItems)
    const sparklines = await computeSparklines(patientObjId)

    res.status(200).json({ success: true, ...bucketed, sparklines })
  } catch (error) {
    errorHandler(res, error)
  }
}
```

- [ ] **Step 2: Verify the BE compiles**

Run: `cd ../cbt && npx tsc --noEmit`

- [ ] **Step 3: Commit**

```bash
cd ../cbt && git add src/controllers/practiceController.ts && git commit -m "feat(controller): add practiceController with getMyPractice, history, patient practice"
```

---

### Task 5: Create Review Controller

**Files:**
- Create: `../cbt/src/controllers/reviewController.ts`

- [ ] **Step 1: Create the review controller with needs-attention logic**

Write `../cbt/src/controllers/reviewController.ts`:

```typescript
import type { Request, Response } from 'express'
import { Types } from 'mongoose'
import ModuleAssignment from '../models/moduleAssignmentModel'
import ModuleAttempt from '../models/moduleAttemptModel'
import User from '../models/userModel'
import { errorHandler } from '../utils/errorHandler'
import { assignmentToPracticeItem } from '../utils/practiceUtils'
import type {
  AttentionPriority,
  AttentionReason,
  ReviewItem,
} from '../shared-types/types'

const SEVERE_LABELS = ['Severe', 'Moderately Severe']
const ATTENTION_CAP = 20

const POPULATE_FIELDS = [
  { path: 'module', select: '_id title type accessPolicy' },
  { path: 'program', select: '_id title' },
  { path: 'therapist', select: 'name' },
  {
    path: 'latestAttempt',
    select: [
      '_id',
      'status',
      'completedAt',
      'totalScore',
      'scoreBandLabel',
      'answers',
      'moduleSnapshot.questions',
      'diaryEntries.at',
      'diaryEntries.activity',
      'diaryEntries.mood',
      'diaryEntries.achievement',
      'diaryEntries.closeness',
      'diaryEntries.enjoyment',
      'moduleType',
      'startedAt',
      'lastInteractionAt',
      'iteration',
    ].join(' '),
  },
]

/**
 * GET /api/user/therapist/review
 * Therapist review feed with needs attention and paginated submissions.
 */
export const getTherapistReview = async (req: Request, res: Response) => {
  try {
    const therapistId = req.user?._id as Types.ObjectId
    if (!therapistId) {
      res.status(401).json({ success: false, message: 'Unauthorized' })
      return
    }

    const {
      sort = 'newest',
      patientId,
      moduleId,
      severity,
      dateFrom,
      dateTo,
      cursor,
      limit: limitStr,
    } = req.query as Record<string, string | undefined>
    const limit = Math.min(Number(limitStr) || 20, 50)

    // Get therapist's patients
    const therapist = await User.findById(therapistId, 'patients').lean()
    const patientIds: Types.ObjectId[] = (therapist?.patients ?? []).map(
      (p: any) => new Types.ObjectId(p.toString())
    )

    if (patientIds.length === 0) {
      res.status(200).json({
        success: true,
        needsAttention: [],
        submissions: { items: [], nextCursor: null, total: 0 },
      })
      return
    }

    // Needs Attention
    const needsAttention = await computeNeedsAttention(
      therapistId,
      patientIds
    )

    // All Submissions (paginated)
    const submissionMatch: Record<string, any> = {
      user: { $in: patientId ? [new Types.ObjectId(patientId)] : patientIds },
      status: 'completed',
    }
    if (moduleId) submissionMatch['module'] = new Types.ObjectId(moduleId)
    if (dateFrom || dateTo) {
      submissionMatch['updatedAt'] = {}
      if (dateFrom) submissionMatch['updatedAt']['$gte'] = new Date(dateFrom)
      if (dateTo) submissionMatch['updatedAt']['$lte'] = new Date(dateTo)
    }
    if (cursor) {
      submissionMatch['updatedAt'] = {
        ...(submissionMatch['updatedAt'] ?? {}),
        ...(sort === 'oldest'
          ? { $gt: new Date(cursor) }
          : { $lt: new Date(cursor) }),
      }
    }

    const sortDir = sort === 'oldest' ? 1 : -1
    const sortField =
      sort === 'severity'
        ? { totalScore: -1, updatedAt: -1 }
        : { updatedAt: sortDir }

    const submissions = await ModuleAssignment.find(submissionMatch)
      .sort(sortField as any)
      .limit(limit + 1)
      .populate(POPULATE_FIELDS)
      .populate('user', '_id name username email')
      .lean()

    const hasNext = submissions.length > limit
    const page = hasNext ? submissions.slice(0, limit) : submissions

    const submissionItems: ReviewItem[] = page.map((asg) => {
      const base = assignmentToPracticeItem({ ...asg, attemptCount: 0 })
      const userObj = asg.user as any
      return {
        ...base,
        patientId: userObj?._id?.toString() ?? '',
        patientName: userObj?.name ?? userObj?.username ?? '',
      }
    })

    // Severity filter (post-query for simplicity)
    const filteredItems = severity
      ? submissionItems.filter((item) => {
          const band = item.latestAttempt?.scoreBandLabel?.toLowerCase() ?? ''
          if (severity === 'severe')
            return band === 'severe' || band === 'moderately severe'
          if (severity === 'moderate') return band === 'moderate'
          if (severity === 'mild') return band === 'mild'
          return true
        })
      : submissionItems

    const total = await ModuleAssignment.countDocuments({
      user: { $in: patientId ? [new Types.ObjectId(patientId)] : patientIds },
      status: 'completed',
    })

    const nextCursor =
      hasNext && page.length > 0
        ? (page[page.length - 1] as any).updatedAt?.toISOString()
        : null

    res.status(200).json({
      success: true,
      needsAttention,
      submissions: { items: filteredItems, nextCursor, total },
    })
  } catch (error) {
    errorHandler(res, error)
  }
}

/**
 * Compute the "Needs Attention" list for a therapist's patients.
 */
const computeNeedsAttention = async (
  therapistId: Types.ObjectId,
  patientIds: Types.ObjectId[]
): Promise<ReviewItem[]> => {
  const items: (ReviewItem & { _sortPriority: number; _sortDate: Date })[] = []

  // 1. Severe scores
  const severeAttempts = await ModuleAttempt.find({
    user: { $in: patientIds },
    status: 'submitted',
    scoreBandLabel: { $in: SEVERE_LABELS },
  })
    .sort({ completedAt: -1 })
    .limit(ATTENTION_CAP)
    .populate('user', '_id name username')
    .populate('module', '_id title type')
    .lean()

  for (const att of severeAttempts) {
    const userObj = att.user as any
    items.push({
      assignmentId: '',
      moduleId: (att.module as any)?._id?.toString() ?? '',
      moduleTitle: (att.module as any)?.title ?? '',
      moduleType: att.moduleType,
      programTitle: '',
      source: 'therapist',
      status: 'completed',
      percentComplete: 100,
      attemptCount: 0,
      latestAttempt: {
        attemptId: att._id.toString(),
        status: att.status,
        totalScore: att.totalScore ?? undefined,
        scoreBandLabel: att.scoreBandLabel ?? undefined,
        completedAt: att.completedAt?.toISOString(),
        iteration: att.iteration ?? 1,
      },
      patientId: userObj?._id?.toString() ?? '',
      patientName: userObj?.name ?? userObj?.username ?? '',
      attentionReason: 'severe_score',
      attentionPriority: 'high',
      _sortPriority: 0,
      _sortDate: att.completedAt ?? new Date(),
    })
  }

  // 2. Score regression
  const regressions = await ModuleAttempt.aggregate([
    {
      $match: {
        user: { $in: patientIds },
        status: 'submitted',
        moduleType: 'questionnaire',
        totalScore: { $ne: null },
      },
    },
    { $sort: { completedAt: -1 } },
    {
      $group: {
        _id: { user: '$user', module: '$module' },
        scores: {
          $push: {
            score: '$totalScore',
            completedAt: '$completedAt',
            attemptId: '$_id',
          },
        },
      },
    },
    {
      $project: {
        latest: { $arrayElemAt: ['$scores', 0] },
        previous: { $arrayElemAt: ['$scores', 1] },
      },
    },
    {
      $match: {
        previous: { $ne: null },
        $expr: { $gt: ['$latest.score', '$previous.score'] },
      },
    },
  ])

  for (const reg of regressions) {
    const attemptId = reg.latest.attemptId.toString()
    if (items.some((i) => i.latestAttempt?.attemptId === attemptId)) continue

    const att = await ModuleAttempt.findById(reg.latest.attemptId)
      .populate('user', '_id name username')
      .populate('module', '_id title type')
      .lean()
    if (!att) continue

    const userObj = att.user as any
    items.push({
      assignmentId: '',
      moduleId: (att.module as any)?._id?.toString() ?? '',
      moduleTitle: (att.module as any)?.title ?? '',
      moduleType: att.moduleType,
      programTitle: '',
      source: 'therapist',
      status: 'completed',
      percentComplete: 100,
      attemptCount: 0,
      latestAttempt: {
        attemptId: att._id.toString(),
        status: att.status,
        totalScore: att.totalScore ?? undefined,
        scoreBandLabel: att.scoreBandLabel ?? undefined,
        completedAt: att.completedAt?.toISOString(),
        iteration: att.iteration ?? 1,
      },
      patientId: userObj?._id?.toString() ?? '',
      patientName: userObj?.name ?? userObj?.username ?? '',
      attentionReason: 'score_regression',
      attentionPriority: 'high',
      _sortPriority: 0,
      _sortDate: att.completedAt ?? new Date(),
    })
  }

  // 3. Overdue + not started (2+ days past due)
  const twoDaysAgo = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000)
  const overdueAssignments = await ModuleAssignment.find({
    user: { $in: patientIds },
    therapist: therapistId,
    status: 'assigned',
    dueAt: { $lt: twoDaysAgo },
  })
    .limit(ATTENTION_CAP)
    .populate('module', '_id title type')
    .populate('user', '_id name username')
    .populate('program', '_id title')
    .lean()

  for (const asg of overdueAssignments) {
    const userObj = asg.user as any
    items.push({
      assignmentId: asg._id.toString(),
      moduleId: (asg.module as any)?._id?.toString() ?? '',
      moduleTitle: (asg.module as any)?.title ?? '',
      moduleType: asg.moduleType,
      programTitle: (asg.program as any)?.title ?? '',
      source: (asg as any).source ?? 'therapist',
      status: 'not_started',
      dueAt: asg.dueAt?.toISOString(),
      percentComplete: 0,
      attemptCount: 0,
      patientId: userObj?._id?.toString() ?? '',
      patientName: userObj?.name ?? userObj?.username ?? '',
      attentionReason: 'overdue',
      attentionPriority: 'medium',
      _sortPriority: 1,
      _sortDate: asg.dueAt ?? new Date(),
    })
  }

  // 4. First submission
  const firstSubmissions = await ModuleAttempt.aggregate([
    { $match: { user: { $in: patientIds }, status: 'submitted' } },
    {
      $group: {
        _id: '$user',
        count: { $sum: 1 },
        latest: { $first: '$$ROOT' },
      },
    },
    { $match: { count: 1 } },
  ])

  for (const fs of firstSubmissions) {
    const att = fs.latest
    const attemptId = att._id.toString()
    if (items.some((i) => i.latestAttempt?.attemptId === attemptId)) continue

    const userDoc = await User.findById(fs._id, '_id name username').lean()
    if (!userDoc) continue
    const modDoc = await ModuleAttempt.findById(att._id)
      .populate('module', '_id title type')
      .lean()
    if (!modDoc) continue

    items.push({
      assignmentId: '',
      moduleId: (modDoc.module as any)?._id?.toString() ?? '',
      moduleTitle: (modDoc.module as any)?.title ?? '',
      moduleType: att.moduleType,
      programTitle: '',
      source: 'therapist',
      status: 'completed',
      percentComplete: 100,
      attemptCount: 1,
      latestAttempt: {
        attemptId: att._id.toString(),
        status: att.status,
        totalScore: att.totalScore ?? undefined,
        scoreBandLabel: att.scoreBandLabel ?? undefined,
        completedAt: att.completedAt?.toISOString(),
        iteration: att.iteration ?? 1,
      },
      patientId: userDoc._id.toString(),
      patientName: (userDoc as any).name ?? (userDoc as any).username ?? '',
      attentionReason: 'first_submission',
      attentionPriority: 'low',
      _sortPriority: 2,
      _sortDate: att.completedAt ?? new Date(),
    })
  }

  // Sort: priority asc, then date desc. Cap at ATTENTION_CAP.
  items.sort((a, b) => {
    if (a._sortPriority !== b._sortPriority)
      return a._sortPriority - b._sortPriority
    return b._sortDate.getTime() - a._sortDate.getTime()
  })

  // Strip internal sort fields and cap
  return items
    .slice(0, ATTENTION_CAP)
    .map(({ _sortPriority, _sortDate, ...rest }) => rest)
}
```

- [ ] **Step 2: Verify the BE compiles**

Run: `cd ../cbt && npx tsc --noEmit`

- [ ] **Step 3: Commit**

```bash
cd ../cbt && git add src/controllers/reviewController.ts && git commit -m "feat(controller): add reviewController with needs-attention logic"
```

---

### Task 6: Register New Routes

**Files:**
- Modify: `../cbt/src/routes/userRoute.ts`

- [ ] **Step 1: Add practice and review route imports and registrations**

In `../cbt/src/routes/userRoute.ts`, add imports after line 20:

```typescript
import {
  getMyPractice,
  getMyPracticeHistory,
  getPatientPractice,
} from '../controllers/practiceController'
import { getTherapistReview } from '../controllers/reviewController'
```

Add routes before `export default router` (after line 50):

```typescript
// Patient: unified practice view
router.get('/practice', getMyPractice)
router.get('/practice/history', getMyPracticeHistory)

// Therapist: patient practice view
router.get('/therapist/patients/:patientId/practice', getPatientPractice)

// Therapist: review feed
router.get('/therapist/review', getTherapistReview)
```

- [ ] **Step 2: Verify the BE compiles**

Run: `cd ../cbt && npx tsc --noEmit`

- [ ] **Step 3: Commit**

```bash
cd ../cbt && git add src/routes/userRoute.ts && git commit -m "feat(routes): register practice and review endpoints"
```

---

### Task 7: Enhance `startAttempt` with Auto-Create Assignment

**Files:**
- Modify: `../cbt/src/controllers/attemptsController.ts`

- [ ] **Step 1: Add auto-assignment creation logic**

In `../cbt/src/controllers/attemptsController.ts`, replace lines 67-76 (the `else if (mod.accessPolicy === 'assigned')` block):

```typescript
    } else if (mod.accessPolicy === 'assigned') {
      assignment = await findActiveAssignment(userId, mod._id as Types.ObjectId)
      if (!assignment) {
        res.status(403).json({
          success: false,
          message: 'An active assignment is required to start this module',
        })
        return
      }
    } else {
      // Open module with no assignment provided: auto-discover or auto-create
      assignment = await findActiveAssignment(userId, mod._id as Types.ObjectId)
      if (!assignment) {
        const created = await ModuleAssignment.create({
          user: userId,
          therapist: null,
          program: mod.program,
          module: mod._id,
          moduleType: mod.type,
          status: 'in_progress',
          source: 'self',
        })
        assignment = created.toObject()
      }
    }
```

Ensure `ModuleAssignment` is imported at the top of the file (it already should be).

- [ ] **Step 2: Verify the BE compiles**

Run: `cd ../cbt && npx tsc --noEmit`

- [ ] **Step 3: Commit**

```bash
cd ../cbt && git add src/controllers/attemptsController.ts && git commit -m "feat(attempts): auto-create self-initiated assignment for open modules"
```

---

### Task 8: Enhance `submitAttempt` with Recurring Auto-Generation

**Files:**
- Modify: `../cbt/src/controllers/attemptsController.ts`

- [ ] **Step 1: Add recurring auto-generation after assignment completion**

Add the import at the top of `../cbt/src/controllers/attemptsController.ts`:

```typescript
import { computeNextDueDate } from '../utils/practiceUtils'
```

In the `submitAttempt` function, the pattern that completes an assignment appears three times (for activity_diary at ~line 309, reading at ~line 344, and questionnaire at ~line 414). After **each** of these blocks:

```typescript
      if (assignmentId) {
        await ModuleAssignment.findByIdAndUpdate(assignmentId, {
          latestAttempt: attempt._id,
          status: 'completed',
        }).exec()
      }
```

Add immediately after:

```typescript
      // Auto-generate next recurring assignment
      if (assignmentId) {
        const completedAssignment = await ModuleAssignment.findById(
          assignmentId
        ).lean()
        if (
          completedAssignment?.recurrence?.freq &&
          completedAssignment.recurrence.freq !== 'none'
        ) {
          const nextDueAt = computeNextDueDate(
            completedAssignment.dueAt,
            now,
            completedAssignment.recurrence.freq,
            completedAssignment.recurrence.interval
          )
          await ModuleAssignment.create({
            user: completedAssignment.user,
            therapist: completedAssignment.therapist,
            program: completedAssignment.program,
            module: completedAssignment.module,
            moduleType: completedAssignment.moduleType,
            status: 'assigned',
            source: (completedAssignment as any).source ?? 'therapist',
            dueAt: nextDueAt,
            recurrence: completedAssignment.recurrence,
            recurrenceGroupId:
              (completedAssignment as any).recurrenceGroupId ??
              completedAssignment._id,
            notes: completedAssignment.notes,
          })
        }
      }
```

- [ ] **Step 2: Verify the BE compiles**

Run: `cd ../cbt && npx tsc --noEmit`

- [ ] **Step 3: Commit**

```bash
cd ../cbt && git add src/controllers/attemptsController.ts && git commit -m "feat(attempts): auto-generate next recurring assignment on submit"
```

---

### Task 9: Update Seed Data

**Files:**
- Modify: `../cbt/src/seeds/seedAll.ts`

This is a large file (1,489 lines). The seed needs to be updated to exercise all new model features.

- [ ] **Step 1: Read the full seed file to understand the data generation patterns**

Read `../cbt/src/seeds/seedAll.ts` in full. Identify all `ModuleAssignment.create` and `ModuleAssignment.insertMany` calls.

- [ ] **Step 2: Add `source: 'therapist'` to all existing assignment creation calls**

Search for all assignment document objects and add `source: 'therapist' as const` to each.

- [ ] **Step 3: Add recurring assignment chain section**

After existing assignment creation, add a section that creates:
- A `recurrenceGroupId` (new ObjectId)
- 3 completed weekly assignments for one patient+PHQ-9 module with the same `recurrenceGroupId`
- Matching submitted attempts with incrementing iterations and varying scores (e.g., 14, 12, 10 showing improvement)
- 1 active assignment as the current occurrence

- [ ] **Step 4: Add self-initiated assignment scenarios**

Create 2-3 assignments with `source: 'self' as const`, `therapist: null`:
- One completed with a submitted attempt
- One in-progress with a started attempt

- [ ] **Step 5: Add needs-attention scenarios**

Ensure seed includes:
- At least one patient with PHQ-9 score 20+ (Severe band)
- At least one patient with two PHQ-9 attempts where second score > first (regression: e.g., 8 then 14)
- At least one assignment 4+ days overdue, status `assigned`
- At least one patient with exactly one submitted attempt (first submission)
- At least one patient with all practice up to date, no alerts

- [ ] **Step 6: Run the seed and verify**

```bash
cd ../cbt && npm run seed-all
```

- [ ] **Step 7: Commit**

```bash
cd ../cbt && git add src/seeds/seedAll.ts && git commit -m "feat(seed): update seed data for unified practice model scenarios"
```

---

### Task 10: Publish Shared Types

- [ ] **Step 1: Bump version and publish**

```bash
cd ../cbt && npm version patch && npm publish
```

- [ ] **Step 2: Update FE types**

```bash
cd /Users/milobedini/Documents/git/bwell && npm run update-types
```

- [ ] **Step 3: Verify FE can see new types**

Run: `npx tsc --noEmit`

- [ ] **Step 4: Commit FE package update**

```bash
git add package.json package-lock.json && git commit -m "chore: update shared-types to latest"
```

---

## Phase 3: FE New Hooks

### Task 11: Create Practice Hooks

**Files:**
- Create: `hooks/usePractice.ts`

- [ ] **Step 1: Create the practice hooks file**

Write `hooks/usePractice.ts`:

```typescript
import { useInfiniteQuery, useQuery } from '@tanstack/react-query'
import { api } from '@/api/api'
import type {
  PracticeResponse,
  PracticeHistoryResponse,
  PracticeHistoryQuery,
  PatientPracticeResponse,
  ReviewResponse,
  ReviewFilters,
} from '@milobedini/shared-types'

// Patient: unified practice view
export const useMyPractice = () =>
  useQuery({
    queryKey: ['practice'],
    queryFn: async () => {
      const { data } = await api.get<PracticeResponse>('/user/practice')
      return data
    },
  })

// Patient: completed history (cursor-paginated)
export const useMyPracticeHistory = (
  filters: Omit<PracticeHistoryQuery, 'cursor'> = {}
) =>
  useInfiniteQuery({
    queryKey: ['practice', 'history', filters],
    queryFn: async ({ pageParam }) => {
      const params: Record<string, string> = {}
      if (filters.moduleId) params.moduleId = filters.moduleId
      if (filters.moduleType) params.moduleType = filters.moduleType
      if (filters.limit) params.limit = String(filters.limit)
      if (pageParam) params.cursor = pageParam

      const { data } = await api.get<PracticeHistoryResponse>(
        '/user/practice/history',
        { params }
      )
      return data
    },
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
    select: (data) => ({
      pages: data.pages,
      items: data.pages.flatMap((p) => p.items),
      nextCursor: data.pages[data.pages.length - 1]?.nextCursor,
    }),
  })

// Therapist: patient practice view
export const usePatientPractice = (patientId: string | undefined) =>
  useQuery({
    queryKey: ['practice', 'patient', patientId],
    queryFn: async () => {
      const { data } = await api.get<PatientPracticeResponse>(
        `/user/therapist/patients/${patientId}/practice`
      )
      return data
    },
    enabled: !!patientId,
  })

// Therapist: review feed
export const useTherapistReview = (
  filters: Omit<ReviewFilters, 'cursor'> = {}
) =>
  useInfiniteQuery({
    queryKey: ['review', filters],
    queryFn: async ({ pageParam }) => {
      const params: Record<string, string> = {}
      if (filters.sort) params.sort = filters.sort
      if (filters.patientId) params.patientId = filters.patientId
      if (filters.moduleId) params.moduleId = filters.moduleId
      if (filters.severity) params.severity = filters.severity
      if (filters.dateFrom) params.dateFrom = filters.dateFrom
      if (filters.dateTo) params.dateTo = filters.dateTo
      if (filters.limit) params.limit = String(filters.limit)
      if (pageParam) params.cursor = pageParam

      const { data } = await api.get<ReviewResponse>(
        '/user/therapist/review',
        { params }
      )
      return data
    },
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) =>
      lastPage.submissions.nextCursor ?? undefined,
    select: (data) => {
      const lastPage = data.pages[data.pages.length - 1]
      return {
        pages: data.pages,
        needsAttention: data.pages[0]?.needsAttention ?? [],
        submissions: data.pages.flatMap((p) => p.submissions.items),
        nextCursor: lastPage?.submissions.nextCursor,
        total: lastPage?.submissions.total ?? 0,
      }
    },
  })
```

- [ ] **Step 2: Verify the FE compiles**

Run: `npx tsc --noEmit`

- [ ] **Step 3: Commit**

```bash
git add hooks/usePractice.ts && git commit -m "feat(hooks): add useMyPractice, useMyPracticeHistory, usePatientPractice, useTherapistReview"
```

---

## Phase 4: FE Patient Experience

### Task 12: Create Practice Tab Routes and Components

**Files:**
- Create: `app/(main)/(tabs)/practice/_layout.tsx`
- Create: `app/(main)/(tabs)/practice/index.tsx`
- Create: `app/(main)/(tabs)/practice/[id].tsx`
- Create: `components/practice/PracticeItem.tsx`
- Create: `components/practice/PracticeScreen.tsx`
- Create: `components/practice/PracticeItemDetail.tsx`

- [ ] **Step 1: Create practice tab layout**

Write `app/(main)/(tabs)/practice/_layout.tsx`:

```typescript
import { Stack } from 'expo-router'
import { stackScreenOptions } from '@/constants/ScreenOptions'

export default function PracticeLayout() {
  return <Stack screenOptions={stackScreenOptions} />
}
```

- [ ] **Step 2: Create practice index screen**

Write `app/(main)/(tabs)/practice/index.tsx`:

```typescript
import PracticeScreen from '@/components/practice/PracticeScreen'

export default function PracticeTab() {
  return <PracticeScreen />
}
```

- [ ] **Step 3: Create practice item detail route**

Write `app/(main)/(tabs)/practice/[id].tsx`:

```typescript
import PracticeItemDetail from '@/components/practice/PracticeItemDetail'
import { useLocalSearchParams } from 'expo-router'

export default function PracticeDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  return <PracticeItemDetail assignmentId={id} />
}
```

- [ ] **Step 4: Create PracticeItem card component**

Write `components/practice/PracticeItem.tsx`. This is a card component that displays a single practice item. It should show: module icon (from `getModuleIcon`), module title, therapist name (if present), due date, progress bar (if in progress), score (if completed), and a "Start" label (if not started). Tap navigates to `/practice/[assignmentId]`. Follow the existing `AssignmentCard` pattern for styling (teal-tinted background for active items, `chip-darkCard` for completed). Use `ThemedText`, `Colors`, `Pressable`, NativeWind classes. Memoize with `memo()`.

- [ ] **Step 5: Create PracticeScreen component**

Write `components/practice/PracticeScreen.tsx`. This is a `SectionList` with sections: Today, This Week, Upcoming, Recently Completed. Uses `useMyPractice()` hook. Each section renders `PracticeItemCard` items. Section headers use `ThemedText` with uppercase styling (teal for "Today", darkGrey for others). Includes `RefreshControl`, `EmptyState` when no items ("All caught up"), and `LoadingIndicator` for loading state. Wrapped in `ContentContainer`.

- [ ] **Step 6: Create PracticeItemDetail component**

Write `components/practice/PracticeItemDetail.tsx`. This screen resolves an `assignmentId` to the correct attempt and renders the existing `PatientAttemptDetail` component. It finds the practice item from `useMyPractice()` data, auto-starts an attempt via `useStartModuleAttempt` if status is `not_started`, then passes the `attemptId` to `PatientAttemptDetail`. Shows `LoadingIndicator` while resolving.

- [ ] **Step 7: Verify the FE compiles**

Run: `npx tsc --noEmit`

- [ ] **Step 8: Commit**

```bash
git add app/\(main\)/\(tabs\)/practice/ components/practice/ && git commit -m "feat(ui): add Practice tab with PracticeScreen, PracticeItem, PracticeItemDetail"
```

---

### Task 13: Create Journey Tab Routes and Components

**Files:**
- Create: `app/(main)/(tabs)/journey/_layout.tsx`
- Create: `app/(main)/(tabs)/journey/index.tsx`
- Create: `components/journey/JourneyScreen.tsx`

- [ ] **Step 1: Create journey tab layout**

Write `app/(main)/(tabs)/journey/_layout.tsx`:

```typescript
import { Stack } from 'expo-router'
import { stackScreenOptions } from '@/constants/ScreenOptions'

export default function JourneyLayout() {
  return <Stack screenOptions={stackScreenOptions} />
}
```

- [ ] **Step 2: Create journey index screen**

Write `app/(main)/(tabs)/journey/index.tsx`:

```typescript
import JourneyScreen from '@/components/journey/JourneyScreen'

export default function JourneyTab() {
  return <JourneyScreen />
}
```

- [ ] **Step 3: Create JourneyScreen component**

Write `components/journey/JourneyScreen.tsx`. This screen has two parts:

1. **Score Trends** header section: Uses `useScoreTrends()` hook. For each trend item, show module title, latest score, delta from previous (green if improving, red if worsening), and a mini sparkline (row of small vertical bars scaled to max score). Use `Colors.primary.success` for improving, `Colors.primary.error` for worsening.

2. **History** list: Uses `useMyPracticeHistory()` infinite query. `FlatList` of `PracticeItemCard` components. Infinite scroll with `onEndReached`, `RefreshControl`, and `EmptyState` for no history.

Wrapped in `ContentContainer`.

- [ ] **Step 4: Verify the FE compiles**

Run: `npx tsc --noEmit`

- [ ] **Step 5: Commit**

```bash
git add app/\(main\)/\(tabs\)/journey/ components/journey/ && git commit -m "feat(ui): add Journey tab with score trends and practice history"
```

---

## Phase 5: FE Therapist Experience

### Task 14: Create Review Tab Routes and Components

**Files:**
- Create: `app/(main)/(tabs)/review/_layout.tsx`
- Create: `app/(main)/(tabs)/review/index.tsx`
- Create: `app/(main)/(tabs)/review/[id].tsx`
- Create: `components/therapist/NeedsAttentionSection.tsx`
- Create: `components/therapist/ReviewScreen.tsx`

- [ ] **Step 1: Create review tab routes**

Write `app/(main)/(tabs)/review/_layout.tsx`:
```typescript
import { Stack } from 'expo-router'
import { stackScreenOptions } from '@/constants/ScreenOptions'

export default function ReviewLayout() {
  return <Stack screenOptions={stackScreenOptions} />
}
```

Write `app/(main)/(tabs)/review/index.tsx`:
```typescript
import ReviewScreen from '@/components/therapist/ReviewScreen'

export default function ReviewTab() {
  return <ReviewScreen />
}
```

Write `app/(main)/(tabs)/review/[id].tsx`:
```typescript
import TherapistAttemptDetail from '@/components/attempts/TherapistAttemptDetail'
import { useLocalSearchParams } from 'expo-router'

export default function ReviewDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  return <TherapistAttemptDetail attemptId={id} />
}
```

- [ ] **Step 2: Create NeedsAttentionSection component**

Write `components/therapist/NeedsAttentionSection.tsx`. This renders a non-sortable list of `ReviewItem` objects with attention indicators. Each item shows: patient name, module title, score (if present), and attention reason label. Items have a left border colored by priority (red for high, amber for medium, yellow/info for low). Uses `REASON_LABELS` map (`severe_score` -> "Severe score", `score_regression` -> "Score worsening", `overdue` -> "Overdue - not started", `first_submission` -> "First submission"). Header: alert icon + "Needs Attention (N)" in error color. Tap navigates to `/review/[attemptId]`. Memoized.

- [ ] **Step 3: Create ReviewScreen component**

Write `components/therapist/ReviewScreen.tsx`. Uses `useTherapistReview(filters)` hook. Layout:
1. `NeedsAttentionSection` at top (from hook data)
2. Sort chips row: Newest / Oldest / Severity (using `Chip` from react-native-paper + `filterChipStyle` from chipStyles)
3. "All Submissions" section header
4. `SectionList` grouped by date (use `groupByDate` helper). Each item shows: module title, patient name, relative time, score + band (for questionnaires). Tap navigates to `/review/[attemptId]`.

Includes `RefreshControl`, infinite pagination with `onEndReached`, `ActivityIndicator` footer. Wrapped in `ContentContainer`.

- [ ] **Step 4: Verify the FE compiles**

Run: `npx tsc --noEmit`

- [ ] **Step 5: Commit**

```bash
git add app/\(main\)/\(tabs\)/review/ components/therapist/ && git commit -m "feat(ui): add Review tab with NeedsAttention and submissions feed"
```

---

### Task 15: Create Patient Practice View for Therapists

**Files:**
- Create: `components/therapist/PatientPracticeView.tsx`
- Create: `components/therapist/PatientPracticeCard.tsx`
- Create: `app/(main)/(tabs)/patients/_layout.tsx`
- Create: `app/(main)/(tabs)/patients/index.tsx`
- Create: `app/(main)/(tabs)/patients/[id].tsx`

- [ ] **Step 1: Create patients tab routes**

Write `app/(main)/(tabs)/patients/_layout.tsx`:
```typescript
import { Stack } from 'expo-router'
import { stackScreenOptions } from '@/constants/ScreenOptions'

export default function PatientsLayout() {
  return <Stack screenOptions={stackScreenOptions} />
}
```

Write `app/(main)/(tabs)/patients/index.tsx` -- this should render the existing clients list component. Read the current clients/home screen to find which component renders the therapist's client list and re-export it here.

Write `app/(main)/(tabs)/patients/[id].tsx`:
```typescript
import { useLocalSearchParams } from 'expo-router'
import PatientPracticeView from '@/components/therapist/PatientPracticeView'

export default function PatientDetailScreen() {
  const { id, name } = useLocalSearchParams<{ id: string; name?: string }>()
  return <PatientPracticeView patientId={id} patientName={name ?? 'Patient'} />
}
```

- [ ] **Step 2: Create PatientPracticeCard component**

Write `components/therapist/PatientPracticeCard.tsx`. Dense card showing: module icon, title, attempt iteration badge (if > 1), status/progress text, due date, recurrence badge, score + band label (for questionnaires), and mini sparkline (row of small bars). Follow the existing `AssignmentCard` styling density. Tap navigates to the attempt detail. Memoized.

- [ ] **Step 3: Create PatientPracticeView component**

Write `components/therapist/PatientPracticeView.tsx`. Uses `usePatientPractice(patientId)` hook. Renders a `SectionList` with the same Today/This Week/Upcoming/Recently Completed sections as the patient Practice tab, but using `PatientPracticeCard` instead of `PracticeItemCard`. Passes sparkline data from the hook response to each card. Shows patient name as header. Includes `RefreshControl` and `EmptyState`. Wrapped in `ContentContainer`.

- [ ] **Step 4: Verify the FE compiles**

Run: `npx tsc --noEmit`

- [ ] **Step 5: Commit**

```bash
git add app/\(main\)/\(tabs\)/patients/ components/therapist/PatientPracticeView.tsx components/therapist/PatientPracticeCard.tsx && git commit -m "feat(ui): add Patients tab with PatientPracticeView and dense cards"
```

---

## Phase 6: FE Navigation Restructure

### Task 16: Update Tab Bar Configuration

**Files:**
- Modify: `app/(main)/(tabs)/_layout.tsx`

- [ ] **Step 1: Replace the tab bar with role-based tabs**

Replace `app/(main)/(tabs)/_layout.tsx` with the new tab bar:
- Home tab: unchanged, title varies by role ("Dashboard" for therapist, "Home" for patient)
- All Users tab: admin only (unchanged)
- Practice tab: patient only (icon: `clipboard-text-clock` from MaterialCommunityIcons)
- Journey tab: patient only (icon: `chart-line` from MaterialCommunityIcons)
- Patients tab: therapist only (icon: `account-group` from MaterialCommunityIcons)
- Review tab: therapist only (icon: `clipboard-check` from MaterialCommunityIcons)
- Programs tab: patient only (hide for therapist)
- Old tabs: `assignments` and `attempts` set to `href: null` (hidden but still exist as routes until cleanup)
- Profile tab: unchanged

Import `MaterialCommunityIcons` from `@react-native-vector-icons/material-design-icons` and add `isTherapist` from `@/utils/userRoles`.

- [ ] **Step 2: Verify the app compiles**

Run: `npm run lint`

- [ ] **Step 3: Commit**

```bash
git add app/\(main\)/\(tabs\)/_layout.tsx && git commit -m "feat(nav): restructure tab bar for patient Practice/Journey, therapist Patients/Review"
```

---

### Task 17: Rewire Dashboard Links

**Files:**
- Modify: patient and therapist dashboard components (read them first to find exact files)

- [ ] **Step 1: Read the dashboard components**

Read the patient and therapist dashboard components to find all navigation links referencing `/assignments` or `/attempts`.

- [ ] **Step 2: Update patient dashboard links**

Replace links to `/assignments` with `/practice` and links to `/attempts` with `/journey`. Replace any `useViewMyAssignments` usage with `useMyPractice`.

- [ ] **Step 3: Update therapist dashboard links**

Replace links to `/assignments` with `/patients` or `/review`. "Needs attention" stat link goes to `/review`. "Completed this week" goes to `/review`.

- [ ] **Step 4: Verify the app compiles**

Run: `npm run lint`

- [ ] **Step 5: Commit**

```bash
git add components/home/ && git commit -m "fix(dashboard): rewire navigation links to new Practice/Journey/Review tabs"
```

---

## Phase 7: Cleanup

### Task 18: Remove Deprecated Hooks

**Files:**
- Modify: `hooks/useAssignments.ts`
- Modify: `hooks/useAttempts.ts`

- [ ] **Step 1: Clean up useAssignments.ts**

Remove: `useViewTherapistOutstandingAssignments`, `useViewMyAssignments`, `useTherapistAssignments`.
Keep: `useCreateAssignment`, `useUpdateAssignmentStatus`, `useRemoveAssignment`, `useUpdateAssignment`.

- [ ] **Step 2: Clean up useAttempts.ts**

Remove: `useGetMyAttempts`, `useTherapistGetLatestAttempts`, `useGetPatientTimeline`, `useTherapistAttemptModules`.
Keep: `useStartModuleAttempt`, `useSaveModuleAttempt`, `useSubmitAttempt`, `useGetMyAttemptDetail`, `useTherapistGetAttemptDetail`, `useScoreTrends`.

- [ ] **Step 3: Add practice/review invalidation to kept mutations**

In `useStartModuleAttempt`, `useSubmitAttempt`, and assignment CRUD mutations, add:
```typescript
queryClient.invalidateQueries({ queryKey: ['practice'] })
queryClient.invalidateQueries({ queryKey: ['review'] })
```

- [ ] **Step 4: Verify the app compiles**

Run: `npm run lint`

- [ ] **Step 5: Commit**

```bash
git add hooks/useAssignments.ts hooks/useAttempts.ts && git commit -m "refactor(hooks): remove deprecated hooks, add practice/review invalidation"
```

---

### Task 19: Delete Old Route Files and Components

**Files:**
- Delete: `app/(main)/(tabs)/assignments/` (entire directory)
- Delete: `app/(main)/(tabs)/attempts/` (entire directory)
- Delete: `components/assignments/` (entire directory)
- Delete: `components/attempts/PatientAttempts.tsx`
- Delete: `components/attempts/TherapistLatestAttempts.tsx`

- [ ] **Step 1: Remove hidden tab entries from _layout.tsx**

In `app/(main)/(tabs)/_layout.tsx`, remove the `<Tabs.Screen name="assignments">` and `<Tabs.Screen name="attempts">` entries that were set to `href: null`.

- [ ] **Step 2: Delete old route directories and components**

Delete the `assignments` and `attempts` route directories and the replaced components. Keep `components/attempts/presenters/`, `components/attempts/PatientAttemptDetail.tsx`, and `components/attempts/TherapistAttemptDetail.tsx` (still used).

- [ ] **Step 3: Fix any broken imports**

Search for imports referencing deleted files and fix them.

- [ ] **Step 4: Verify the app compiles**

Run: `npm run lint`

- [ ] **Step 5: Commit**

```bash
git add -A && git commit -m "refactor: remove old assignments/attempts routes and components"
```

---

### Task 20: Final Validation

- [ ] **Step 1: Run full lint validation**

```bash
npm run lint
```

- [ ] **Step 2: Format all files**

```bash
npx prettier --write .
```

- [ ] **Step 3: Manual verification**

Start both BE and FE. Verify:
- Patient sees Practice tab with Today/This Week/Upcoming/Recently Completed
- Patient can start a practice item and complete it
- Patient sees Journey tab with score trends and history
- Therapist sees Patients tab with client list
- Therapist can tap patient and see unified practice view with dense cards + sparklines
- Therapist sees Review tab with Needs Attention section and submissions
- Old Assignments and Attempts tabs are gone
- Dashboard links navigate correctly

- [ ] **Step 4: Commit any final fixes**

```bash
npx prettier --write . && git add -A && git commit -m "chore: final validation and formatting"
```
