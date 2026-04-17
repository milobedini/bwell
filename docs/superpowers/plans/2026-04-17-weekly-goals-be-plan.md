# Weekly Goals — Backend Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add the `weekly_goals` module type backend end-to-end: shared types, Mongoose models, sanitiser utility, controller branches, Depression-program seed entry, and shared-types publish. Frontend is handled by separate prototype agents after this plan ships.

**Architecture:** Each `weekly_goals` attempt stores up to 7 behavioural goals (goalText, completed boolean, optional mastery + pleasure ratings 0-10, optional planned diary-entry reference, optional per-goal note) and a four-field structured reflection (moodImpact, takeaway, balance, barriers). Mirrors the `general_goals` pattern exactly except: (1) no pre-population at start, (2) 7-goal cap, (3) reflection is structured, not free-text, (4) optional M/P ratings, (5) optional soft link to activity-diary slots.

**Tech Stack:** TypeScript (strict), Node.js, Express 5, Mongoose 8, MongoDB.

**Spec:** `/Users/milobedini/Documents/git/bwell/docs/superpowers/specs/2026-04-17-weekly-goals-be-design.md`

**Scope:** Backend only. No FE work. No tests (BE has no test suite; test-audit happens later in the outer mb-dev workflow).

---

## File Map

### Shared Types (`/Users/milobedini/Documents/git/cbt/src/shared-types/`)

| File | Change | Purpose |
|------|--------|---------|
| `types.ts` | Modify | Add `weekly_goals` to `ModuleType`; new `WeeklyGoalEntry`, `WeeklyGoalsReflection`, `WeeklyGoalsData` types; extend `SaveProgressInput`, `ModuleAttempt`, `AttemptDetailResponseItem` |
| `package.json` | Auto (publish) | Version bump to 1.0.98 on `npm run publish` |

### Backend (`/Users/milobedini/Documents/git/cbt/src/`)

| File | Change | Purpose |
|------|--------|---------|
| `models/moduleModel.ts` | Modify | Add `weekly_goals` to `IModule.type` union and schema enum |
| `models/moduleAttemptModel.ts` | Modify | Add `IWeeklyGoalEntry`, `IWeeklyGoalsReflection`, `IWeeklyGoals` interfaces; add to `moduleType` union + schema enum; add `weeklyGoals` sub-schema |
| `models/moduleAssignmentModel.ts` | Modify | Add `weekly_goals` to `moduleType` union and schema enum |
| `utils/weeklyGoalsUtils.ts` | Create | Sanitiser helpers: `emptyReflection`, `coerceRating`, `coercePlannedRef`, `sanitiseWeeklyGoalItems` |
| `controllers/moduleController.ts` | Modify | Add `weekly_goals` to `createModule` `allowedTypes` whitelist |
| `controllers/attemptsController.ts` | Modify | `startAttempt`: default-init `weeklyGoals`. `saveProgress`: new branch. `submitAttempt`: new branch with 5 validations. |
| `seeds/seedAll.ts` | Modify | Add `weekly_goals` to local `ModuleData['type']` union; add Weekly Goals module entry to Depression program |

---

## Task 1: Shared Types — add `weekly_goals` and new data types

**Files:**
- Modify: `/Users/milobedini/Documents/git/cbt/src/shared-types/types.ts`

- [ ] **Step 1: Extend `ModuleType` union**

Locate the existing `ModuleType` union (currently lines 112-117):

```typescript
export type ModuleType =
  | 'questionnaire'
  | 'reading'
  | 'activity_diary'
  | 'five_areas_model'
  | 'general_goals'
```

Replace with:

```typescript
export type ModuleType =
  | 'questionnaire'
  | 'reading'
  | 'activity_diary'
  | 'five_areas_model'
  | 'general_goals'
  | 'weekly_goals'
```

- [ ] **Step 2: Add new data-shape types after the existing `GeneralGoalsData` block**

Locate the existing `GeneralGoalsData` type (ends around line 143, just before `export type Module`). Insert the following AFTER the `GeneralGoalsData` block and BEFORE `export type Module`:

```typescript
export type WeeklyGoalPlannedDiaryRef = {
  at: string // ISO datetime
  label?: string
}

export type WeeklyGoalEntry = {
  goalText: string
  completed: boolean
  masteryRating: number | null
  pleasureRating: number | null
  plannedDiaryEntryRef: WeeklyGoalPlannedDiaryRef | null
  completionNotes: string | null
}

export type WeeklyGoalsReflection = {
  moodImpact: string
  takeaway: string
  balance: string
  barriers: string
}

export type WeeklyGoalsData = {
  goals: WeeklyGoalEntry[]
  reflection: WeeklyGoalsReflection
}
```

- [ ] **Step 3: Extend `SaveProgressInput`**

Locate the existing `SaveProgressInput` type (around line 340). It currently ends with a `userNote?: string` line. Add a `weeklyGoals` field just before `userNote`:

```typescript
export type SaveProgressInput = {
  // questionnaire
  answers?: AttemptAnswer[]
  // diary
  diaryEntries?: DiaryEntryInput[]
  merge?: boolean
  // reading
  readerNote?: string
  // five areas model
  fiveAreas?: Partial<FiveAreasData>
  // general goals
  generalGoals?: Partial<GeneralGoalsData>
  // weekly goals
  weeklyGoals?: Partial<{
    goals: Array<Partial<WeeklyGoalEntry>>
    reflection: Partial<WeeklyGoalsReflection>
  }>
  // common
  userNote?: string
}
```

- [ ] **Step 4: Add `weeklyGoals` to `ModuleAttempt`**

Locate the `ModuleAttempt` type (around lines 215-251). Find the line `generalGoals?: GeneralGoalsData` and add `weeklyGoals?: WeeklyGoalsData` immediately after it:

```typescript
  fiveAreas?: FiveAreasData
  generalGoals?: GeneralGoalsData
  weeklyGoals?: WeeklyGoalsData
  createdAt: string
  updatedAt: string
```

- [ ] **Step 5: Add `weeklyGoals` to `AttemptDetailResponseItem`**

Locate the `AttemptDetailResponseItem` type (around line 755). Find the line `generalGoals?: GeneralGoalsData` inside that type and add `weeklyGoals?: WeeklyGoalsData` immediately after it:

```typescript
export type AttemptDetailResponseItem = ModuleAttempt & {
  band?: ScoreBandSummary
  detail?: AttemptDetail
  diary?: DiaryDetail
  fiveAreas?: FiveAreasData
  generalGoals?: GeneralGoalsData
  weeklyGoals?: WeeklyGoalsData
  patient?: Pick<AuthUser, '_id' | 'name' | 'username' | 'email'>
  module?: Pick<Module, '_id' | 'title' | 'type'>
}
```

- [ ] **Step 6: Verify shared-types compiles**

Run:

```bash
cd /Users/milobedini/Documents/git/cbt/src/shared-types && npx tsc --noEmit
```

Expected: no output (clean compile).

- [ ] **Step 7: Commit**

```bash
cd /Users/milobedini/Documents/git/cbt
git add src/shared-types/types.ts
git commit -m "feat(shared-types): add weekly_goals module type and data shapes"
```

---

## Task 2: Module model — add `weekly_goals` enum

**Files:**
- Modify: `/Users/milobedini/Documents/git/cbt/src/models/moduleModel.ts`

- [ ] **Step 1: Extend `IModule.type` union (line 7)**

Replace:

```typescript
  type: 'questionnaire' | 'reading' | 'activity_diary' | 'five_areas_model' | 'general_goals'
```

With:

```typescript
  type: 'questionnaire' | 'reading' | 'activity_diary' | 'five_areas_model' | 'general_goals' | 'weekly_goals'
```

- [ ] **Step 2: Extend schema `enum` (line 23)**

Replace:

```typescript
      enum: ['questionnaire', 'reading', 'activity_diary', 'five_areas_model', 'general_goals'],
```

With:

```typescript
      enum: ['questionnaire', 'reading', 'activity_diary', 'five_areas_model', 'general_goals', 'weekly_goals'],
```

- [ ] **Step 3: Commit**

```bash
cd /Users/milobedini/Documents/git/cbt
git add src/models/moduleModel.ts
git commit -m "feat(models): allow weekly_goals in module schema enum"
```

---

## Task 3: ModuleAttempt model — interfaces, enum, and schema block

**Files:**
- Modify: `/Users/milobedini/Documents/git/cbt/src/models/moduleAttemptModel.ts`

- [ ] **Step 1: Add new interfaces after `IGeneralGoals` (around line 46)**

Immediately after the closing `}` of `interface IGeneralGoals` and before `interface IModuleAttempt extends Document` (around line 48), insert:

```typescript
interface IWeeklyGoalPlannedDiaryRef {
  at: Date
  label?: string
}

interface IWeeklyGoalEntry {
  goalText: string
  completed?: boolean
  masteryRating?: number | null
  pleasureRating?: number | null
  plannedDiaryEntryRef?: IWeeklyGoalPlannedDiaryRef | null
  completionNotes?: string | null
}

interface IWeeklyGoalsReflection {
  moodImpact?: string
  takeaway?: string
  balance?: string
  barriers?: string
}

interface IWeeklyGoals {
  goals?: IWeeklyGoalEntry[]
  reflection?: IWeeklyGoalsReflection
}
```

- [ ] **Step 2: Extend `IModuleAttempt.moduleType` union (around lines 53-58)**

Replace:

```typescript
  moduleType:
    | 'questionnaire'
    | 'reading'
    | 'activity_diary'
    | 'five_areas_model'
    | 'general_goals'
```

With:

```typescript
  moduleType:
    | 'questionnaire'
    | 'reading'
    | 'activity_diary'
    | 'five_areas_model'
    | 'general_goals'
    | 'weekly_goals'
```

- [ ] **Step 3: Add `weeklyGoals` field to `IModuleAttempt` interface (after `generalGoals?: IGeneralGoals`, around line 95)**

Add directly after `generalGoals?: IGeneralGoals`:

```typescript
  // Weekly Goals
  weeklyGoals?: IWeeklyGoals
```

Final fragment should look like:

```typescript
  // General Goals
  generalGoals?: IGeneralGoals

  // Weekly Goals
  weeklyGoals?: IWeeklyGoals

  // notes / metadata
  userNote?: string
```

- [ ] **Step 4: Extend schema `moduleType` enum (around line 128)**

Replace:

```typescript
      enum: ['questionnaire', 'reading', 'activity_diary', 'five_areas_model', 'general_goals'],
```

With:

```typescript
      enum: ['questionnaire', 'reading', 'activity_diary', 'five_areas_model', 'general_goals', 'weekly_goals'],
```

- [ ] **Step 5: Add `weeklyGoals` sub-schema block**

Locate the existing `// General Goals` block (around lines 184-200) ending at `]`, `}`, just before the `contentVersion: Number,` line (around line 202). Insert the following AFTER the closing `},` of the `generalGoals` sub-schema and BEFORE `contentVersion: Number,`:

```typescript
    // Weekly Goals
    weeklyGoals: {
      goals: [
        {
          goalText: { type: String, trim: true, maxlength: 500 },
          completed: { type: Boolean, default: false },
          masteryRating: { type: Number, min: 0, max: 10, default: null },
          pleasureRating: { type: Number, min: 0, max: 10, default: null },
          plannedDiaryEntryRef: {
            at: { type: Date },
            label: { type: String, trim: true, maxlength: 100 },
          },
          completionNotes: { type: String, trim: true, maxlength: 500, default: null },
        },
      ],
      reflection: {
        moodImpact: { type: String, trim: true, maxlength: 2000 },
        takeaway: { type: String, trim: true, maxlength: 2000 },
        balance: { type: String, trim: true, maxlength: 2000 },
        barriers: { type: String, trim: true, maxlength: 2000 },
      },
    },
```

- [ ] **Step 6: Commit**

```bash
cd /Users/milobedini/Documents/git/cbt
git add src/models/moduleAttemptModel.ts
git commit -m "feat(models): add weeklyGoals sub-schema to moduleAttempt"
```

---

## Task 4: ModuleAssignment model — add `weekly_goals` enum

**Files:**
- Modify: `/Users/milobedini/Documents/git/cbt/src/models/moduleAssignmentModel.ts`

- [ ] **Step 1: Extend `moduleType` union in the interface (around lines 11-16)**

Replace:

```typescript
  moduleType:
    | 'questionnaire'
    | 'reading'
    | 'activity_diary'
    | 'five_areas_model'
    | 'general_goals'
```

With:

```typescript
  moduleType:
    | 'questionnaire'
    | 'reading'
    | 'activity_diary'
    | 'five_areas_model'
    | 'general_goals'
    | 'weekly_goals'
```

- [ ] **Step 2: Extend schema `moduleType` enum (line 59)**

Replace:

```typescript
      enum: ['questionnaire', 'reading', 'activity_diary', 'five_areas_model', 'general_goals'],
```

With:

```typescript
      enum: ['questionnaire', 'reading', 'activity_diary', 'five_areas_model', 'general_goals', 'weekly_goals'],
```

- [ ] **Step 3: Commit**

```bash
cd /Users/milobedini/Documents/git/cbt
git add src/models/moduleAssignmentModel.ts
git commit -m "feat(models): allow weekly_goals in moduleAssignment schema enum"
```

---

## Task 5: Create sanitiser utility

**Files:**
- Create: `/Users/milobedini/Documents/git/cbt/src/utils/weeklyGoalsUtils.ts`

- [ ] **Step 1: Create the file with sanitiser helpers**

Create `/Users/milobedini/Documents/git/cbt/src/utils/weeklyGoalsUtils.ts` with the following content:

```typescript
export type WeeklyGoalPlannedDiaryRefDb = {
  at: Date
  label?: string
}

export type WeeklyGoalEntryDb = {
  goalText: string
  completed: boolean
  masteryRating: number | null
  pleasureRating: number | null
  plannedDiaryEntryRef: WeeklyGoalPlannedDiaryRefDb | null
  completionNotes: string | null
}

export type WeeklyGoalsReflectionDb = {
  moodImpact: string
  takeaway: string
  balance: string
  barriers: string
}

export const emptyReflection = (): WeeklyGoalsReflectionDb => ({
  moodImpact: '',
  takeaway: '',
  balance: '',
  barriers: '',
})

export const coerceRating = (v: unknown): number | null => {
  if (v === null || v === undefined || v === '') return null
  const n = Number(v)
  return Number.isFinite(n) && n >= 0 && n <= 10 ? n : null
}

export const coercePlannedRef = (
  v: unknown
): WeeklyGoalPlannedDiaryRefDb | null => {
  if (!v || typeof v !== 'object') return null
  const rec = v as Record<string, unknown>
  if (rec.at === null || rec.at === undefined) return null
  const at = new Date(String(rec.at))
  if (isNaN(at.getTime())) return null
  const labelRaw = rec.label
  if (typeof labelRaw === 'string') {
    const label = labelRaw.trim().slice(0, 100)
    return label ? { at, label } : { at }
  }
  return { at }
}

export const sanitiseWeeklyGoalItems = (
  raw: unknown
): WeeklyGoalEntryDb[] => {
  if (!Array.isArray(raw)) return []
  return raw.slice(0, 7).map((item) => {
    const rec = (item ?? {}) as Record<string, unknown>
    const goalText = String(rec.goalText ?? '').trim().slice(0, 500)
    const completionNotesRaw = String(rec.completionNotes ?? '').trim().slice(0, 500)
    return {
      goalText,
      completed: Boolean(rec.completed),
      masteryRating: coerceRating(rec.masteryRating),
      pleasureRating: coerceRating(rec.pleasureRating),
      plannedDiaryEntryRef: coercePlannedRef(rec.plannedDiaryEntryRef),
      completionNotes: completionNotesRaw.length > 0 ? completionNotesRaw : null,
    }
  })
}

export const mergeReflection = (
  existing: Partial<WeeklyGoalsReflectionDb> | undefined,
  incoming: Partial<WeeklyGoalsReflectionDb> | undefined
): WeeklyGoalsReflectionDb => {
  const base = { ...emptyReflection(), ...(existing ?? {}) }
  if (!incoming) return base
  const normString = (v: unknown): string | undefined =>
    typeof v === 'string' ? v.slice(0, 2000) : undefined
  const patch: Partial<WeeklyGoalsReflectionDb> = {}
  const keys: (keyof WeeklyGoalsReflectionDb)[] = [
    'moodImpact',
    'takeaway',
    'balance',
    'barriers',
  ]
  for (const k of keys) {
    const next = normString(incoming[k])
    if (next !== undefined) patch[k] = next
  }
  return { ...base, ...patch }
}
```

- [ ] **Step 2: Verify compile**

Run:

```bash
cd /Users/milobedini/Documents/git/cbt && npx tsc --noEmit
```

Expected: no output (clean compile).

- [ ] **Step 3: Commit**

```bash
cd /Users/milobedini/Documents/git/cbt
git add src/utils/weeklyGoalsUtils.ts
git commit -m "feat(utils): add weekly goals sanitiser helpers"
```

---

## Task 6: Controller — `createModule` whitelist

**Files:**
- Modify: `/Users/milobedini/Documents/git/cbt/src/controllers/moduleController.ts`

- [ ] **Step 1: Extend `allowedTypes` (around lines 150-156)**

Replace:

```typescript
    const allowedTypes = [
      'questionnaire',
      'reading',
      'activity_diary',
      'five_areas_model',
      'general_goals',
    ]
```

With:

```typescript
    const allowedTypes = [
      'questionnaire',
      'reading',
      'activity_diary',
      'five_areas_model',
      'general_goals',
      'weekly_goals',
    ]
```

- [ ] **Step 2: Commit**

```bash
cd /Users/milobedini/Documents/git/cbt
git add src/controllers/moduleController.ts
git commit -m "feat(modules): allow weekly_goals in createModule whitelist"
```

---

## Task 7: Controller — `startAttempt` default init

**Files:**
- Modify: `/Users/milobedini/Documents/git/cbt/src/controllers/attemptsController.ts`

- [ ] **Step 1: Import sanitiser helpers**

At the top of the file, locate the existing import block. After the import of `computePercentCompleteForAttempt` (around line 27) add:

```typescript
import {
  emptyReflection,
  mergeReflection,
  sanitiseWeeklyGoalItems,
} from '../utils/weeklyGoalsUtils'
```

- [ ] **Step 2: Add default-init block in `startAttempt` after the general_goals pre-populate block**

Locate the `startAttempt` handler and the existing `general_goals` pre-population block (lines ~127-167, ending at the closing `}` of `if (mod.type === 'general_goals')`). Immediately AFTER that block and BEFORE the `if (assignment && assignment.status === 'assigned')` block (around line 169), insert:

```typescript
    // Initialise empty weeklyGoals shape so the FE can assume structure exists
    if (mod.type === 'weekly_goals') {
      attempt.weeklyGoals = {
        goals: [],
        reflection: emptyReflection(),
      } as typeof attempt.weeklyGoals
      await attempt.save()
    }
```

- [ ] **Step 3: Verify compile**

Run:

```bash
cd /Users/milobedini/Documents/git/cbt && npx tsc --noEmit
```

Expected: no output.

- [ ] **Step 4: Commit**

```bash
cd /Users/milobedini/Documents/git/cbt
git add src/controllers/attemptsController.ts
git commit -m "feat(attempts): initialise weeklyGoals on startAttempt"
```

---

## Task 8: Controller — `saveProgress` branch

**Files:**
- Modify: `/Users/milobedini/Documents/git/cbt/src/controllers/attemptsController.ts`

- [ ] **Step 1: Add `weekly_goals` branch in `saveProgress`**

Locate the existing `general_goals` branch in `saveProgress` (starts at `if (attempt.moduleType === 'general_goals') {` around line 249 and ends at its closing `}` around line 276). Immediately AFTER that closing brace and BEFORE the `if (attempt.moduleType === 'activity_diary')` block (around line 278), insert:

```typescript
    if (attempt.moduleType === 'weekly_goals') {
      const { weeklyGoals } = req.body as {
        weeklyGoals?: Partial<{
          goals: unknown[]
          reflection: Partial<{
            moodImpact: string
            takeaway: string
            balance: string
            barriers: string
          }>
        }>
      }

      if (weeklyGoals) {
        const existing =
          (
            attempt.weeklyGoals as unknown as {
              toObject?: () => Record<string, unknown>
            }
          )?.toObject?.() ?? attempt.weeklyGoals ?? {}

        const merged: Record<string, unknown> = { ...existing }

        if (Array.isArray(weeklyGoals.goals)) {
          merged.goals = sanitiseWeeklyGoalItems(weeklyGoals.goals)
        }
        if (weeklyGoals.reflection) {
          merged.reflection = mergeReflection(
            existing.reflection as Record<string, string> | undefined,
            weeklyGoals.reflection
          )
        }

        attempt.weeklyGoals = merged as typeof attempt.weeklyGoals
      }

      if (typeof userNote === 'string') attempt.userNote = userNote
      attempt.lastInteractionAt = new Date()
      await attempt.save()
      res.status(200).json({ success: true, attempt })
      return
    }
```

- [ ] **Step 2: Verify compile**

Run:

```bash
cd /Users/milobedini/Documents/git/cbt && npx tsc --noEmit
```

Expected: no output.

- [ ] **Step 3: Commit**

```bash
cd /Users/milobedini/Documents/git/cbt
git add src/controllers/attemptsController.ts
git commit -m "feat(attempts): add weekly_goals saveProgress branch"
```

---

## Task 9: Controller — `submitAttempt` branch with validations

**Files:**
- Modify: `/Users/milobedini/Documents/git/cbt/src/controllers/attemptsController.ts`

- [ ] **Step 1: Add `weekly_goals` submit branch**

Locate the existing `general_goals` branch in `submitAttempt` (starts at `if (attempt.moduleType === 'general_goals') {` around line 596 and ends at its closing `}` / `return` around line 715). Immediately AFTER that closing brace and BEFORE the `if (attempt.moduleType === 'questionnaire')` block (around line 717), insert:

```typescript
    if (attempt.moduleType === 'weekly_goals') {
      const goals = (attempt.weeklyGoals?.goals ?? []) as Array<{
        goalText?: string
        masteryRating?: number | null
        pleasureRating?: number | null
      }>

      if (goals.length === 0) {
        res.status(400).json({
          success: false,
          message: 'Please add at least one goal before submitting',
        })
        return
      }
      if (goals.length > 7) {
        res.status(400).json({
          success: false,
          message: 'A maximum of 7 goals is allowed',
        })
        return
      }

      const hasEmptyText = goals.some((g) => !g.goalText?.trim())
      if (hasEmptyText) {
        res.status(400).json({
          success: false,
          message: 'Each goal must have text',
        })
        return
      }

      const isValidRating = (r: number | null | undefined): boolean =>
        r === null || r === undefined
          ? true
          : typeof r === 'number' && r >= 0 && r <= 10
      const hasInvalidRating = goals.some(
        (g) => !isValidRating(g.masteryRating) || !isValidRating(g.pleasureRating)
      )
      if (hasInvalidRating) {
        res.status(400).json({
          success: false,
          message: 'Ratings must be between 0 and 10',
        })
        return
      }

      const reflection = attempt.weeklyGoals?.reflection ?? {}
      const reflectionKeys: Array<
        'moodImpact' | 'takeaway' | 'balance' | 'barriers'
      > = ['moodImpact', 'takeaway', 'balance', 'barriers']
      const hasAnyReflection = reflectionKeys.some(
        (k) =>
          typeof (reflection as Record<string, unknown>)[k] === 'string' &&
          ((reflection as Record<string, string>)[k] ?? '').trim().length > 0
      )
      if (!hasAnyReflection) {
        res.status(400).json({
          success: false,
          message: 'Please share a reflection before submitting',
        })
        return
      }

      attempt.completedAt = now
      attempt.lastInteractionAt = now
      attempt.status = 'submitted'
      attempt.durationSecs = attempt.startedAt
        ? Math.max(
            0,
            Math.floor((now.getTime() - attempt.startedAt.getTime()) / 1000)
          )
        : undefined

      const me = await User.findById(userId, 'therapist')
      attempt.therapist = me?.therapist
      await attempt.save()

      if (!assignmentId) {
        const possible = await findActiveAssignment(
          attempt.user as Types.ObjectId,
          attempt.module as Types.ObjectId,
          attempt.therapist as Types.ObjectId
        )
        if (possible) assignmentId = String(possible._id)
      }
      if (assignmentId) {
        await ModuleAssignment.findByIdAndUpdate(assignmentId, {
          latestAttempt: attempt._id,
          status: 'completed',
          completedAt: now,
        })
      }

      // Auto-generate next recurring assignment
      if (assignmentId) {
        const completedAssignment =
          await ModuleAssignment.findById(assignmentId).lean()
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
            source:
              (completedAssignment as any).source ?? 'therapist',
            dueAt: nextDueAt,
            recurrence: completedAssignment.recurrence,
            recurrenceGroupId:
              (completedAssignment as any).recurrenceGroupId ??
              completedAssignment._id,
            notes: completedAssignment.notes,
          })
        }
      }

      res.status(200).json({ success: true, attempt })
      return
    }
```

- [ ] **Step 2: Verify compile**

Run:

```bash
cd /Users/milobedini/Documents/git/cbt && npx tsc --noEmit
```

Expected: no output.

- [ ] **Step 3: Commit**

```bash
cd /Users/milobedini/Documents/git/cbt
git add src/controllers/attemptsController.ts
git commit -m "feat(attempts): add weekly_goals submitAttempt branch with validations"
```

---

## Task 10: Seed — add Weekly Goals to Depression program

**Files:**
- Modify: `/Users/milobedini/Documents/git/cbt/src/seeds/seedAll.ts`

- [ ] **Step 1: Extend local `ModuleData['type']` union (line 144)**

Replace:

```typescript
  type: 'questionnaire' | 'reading' | 'activity_diary' | 'five_areas_model' | 'general_goals'
```

With:

```typescript
  type:
    | 'questionnaire'
    | 'reading'
    | 'activity_diary'
    | 'five_areas_model'
    | 'general_goals'
    | 'weekly_goals'
```

- [ ] **Step 2: Append Weekly Goals module entry to Depression program**

Locate the Depression program's `modules` array. Find the General Goals entry (begins around line 366 with `title: 'General Goals'`). After the closing `}` and comma of that entry and BEFORE the next module or the array's closing `]`, insert:

```typescript
      {
        title: 'Weekly Goals',
        description:
          'Plan what you want to do this week — small behavioural goals you can tick off as you complete them. At week-end, reflect on what helped your mood, what got in the way, and what you want to adjust next week.',
        type: 'weekly_goals',
        accessPolicy: 'assigned',
        disclaimer:
          'Weekly Goals are a tool to support your therapy, not a replacement for professional guidance. Discuss each week with your therapist to agree what is realistic.',
        imageUrl: 'https://placehold.co/600x400?text=Weekly+Goals',
      },
```

- [ ] **Step 3: Commit**

```bash
cd /Users/milobedini/Documents/git/cbt
git add src/seeds/seedAll.ts
git commit -m "feat(seeds): add weekly goals module to depression program"
```

---

## Task 11: Full build check

**Files:** none modified.

- [ ] **Step 1: Run full TypeScript build**

```bash
cd /Users/milobedini/Documents/git/cbt && npm run build
```

Expected: compilation succeeds, `dist/` output written, no errors.

If errors appear, they are almost certainly missed `moduleType` union updates. Re-check:
- `src/shared-types/types.ts` — `ModuleType` union
- `src/models/moduleModel.ts` — `type` union + enum
- `src/models/moduleAttemptModel.ts` — `moduleType` union + enum
- `src/models/moduleAssignmentModel.ts` — `moduleType` union + enum
- `src/seeds/seedAll.ts` — local `ModuleData['type']` union
- `src/controllers/moduleController.ts` — `allowedTypes` array

Fix any remaining mismatches and re-run until clean.

---

## Task 12: Re-seed the database

**Files:** none modified.

- [ ] **Step 1: Run the seed to populate Weekly Goals in Depression**

The project's seed resets the database via the `seedAll` script. Run:

```bash
cd /Users/milobedini/Documents/git/cbt && npm run seed-others
```

If `seed-others` does not cover `seedAll`, use the canonical seed command documented in `src/seeds/CLAUDE.md` or `package.json` `scripts` (inspect first):

```bash
cd /Users/milobedini/Documents/git/cbt && cat package.json | grep -A 20 '"scripts"'
```

Expected: no errors; Weekly Goals module now exists in the Depression program.

- [ ] **Step 2: Verify via mongosh**

```bash
mongosh "$(grep MONGO_URI /Users/milobedini/Documents/git/cbt/.env | cut -d= -f2-)" \
  --quiet \
  --eval 'db.modules.find({ type: "weekly_goals" }, { title: 1, type: 1, accessPolicy: 1 }).toArray()'
```

Expected: one document returned with `title: "Weekly Goals"`, `type: "weekly_goals"`, `accessPolicy: "assigned"`.

---

## Task 13: Manual smoke test end-to-end

**Files:** none modified.

Smoke test the full attempt lifecycle against the live dev server.

- [ ] **Step 1: Start the BE dev server**

```bash
cd /Users/milobedini/Documents/git/cbt && npm run dev
```

Keep this running in a separate terminal.

- [ ] **Step 2: Find the seeded Weekly Goals module ID**

```bash
mongosh "$(grep MONGO_URI /Users/milobedini/Documents/git/cbt/.env | cut -d= -f2-)" \
  --quiet \
  --eval 'db.modules.findOne({ type: "weekly_goals" }, { _id: 1 })'
```

Note the `_id` for the next steps (referred to as `$MODULE_ID` below).

- [ ] **Step 3: Create an assignment as a therapist, start an attempt as the assigned patient, save partial progress, then submit**

Use whichever client is easiest (existing mobile app, Postman, curl). Exact requests:

Create assignment (therapist session):
```
POST /api/assignments
body: { userId: <patient_id>, moduleId: <$MODULE_ID>, notes: "Week 2 goals" }
```

Start attempt (patient session):
```
POST /api/modules/<$MODULE_ID>/attempts
body: { assignmentId: <assignment_id_from_previous> }
```

Expected: response contains `attempt.weeklyGoals = { goals: [], reflection: { moodImpact: "", takeaway: "", balance: "", barriers: "" } }`.

Save progress (patient session):
```
PATCH /api/attempts/<attempt_id>
body: {
  weeklyGoals: {
    goals: [
      { goalText: "Walk 20 mins", completed: false, masteryRating: null, pleasureRating: null },
      { goalText: "Call mum", completed: true, masteryRating: 7, pleasureRating: 8 }
    ],
    reflection: { moodImpact: "The walk helped." }
  }
}
```

Expected: 200; attempt has two goals persisted and reflection.moodImpact populated; other three reflection fields remain empty strings.

Submit (patient session):
```
POST /api/attempts/<attempt_id>/submit
body: {}
```

Expected: 200; `attempt.status === "submitted"`, `attempt.completedAt` set, linked assignment moves to `status: "completed"`.

- [ ] **Step 4: Verify the submitted attempt doc**

```bash
mongosh "$(grep MONGO_URI /Users/milobedini/Documents/git/cbt/.env | cut -d= -f2-)" \
  --quiet \
  --eval 'db.moduleAttempts.findOne({ moduleType: "weekly_goals", status: "submitted" }, { weeklyGoals: 1, status: 1, completedAt: 1 })'
```

Expected: document contains both goals with correct fields, reflection with moodImpact populated and other three fields empty strings, status `"submitted"`, `completedAt` set.

- [ ] **Step 5: Verify failure paths (optional, quick check)**

Start a fresh attempt and try submitting with zero goals:

```
POST /api/attempts/<new_attempt_id>/submit
```

Expected: 400, message `"Please add at least one goal before submitting"`.

Save one goal with empty text, then submit:

Expected: 400, message `"Each goal must have text"`.

Save one goal with text but no reflection, then submit:

Expected: 400, message `"Please share a reflection before submitting"`.

Save eight goals and submit (validation backstop):

Expected: either sanitiser truncates to 7 and submit succeeds, OR controller rejects with `"A maximum of 7 goals is allowed"` — either is acceptable.

Save a goal with `masteryRating: 15` and submit:

Expected: 400, message `"Ratings must be between 0 and 10"` (unless sanitiser nulled it, in which case submit passes — also acceptable).

---

## Task 14: Publish shared-types v1.0.98

**Files:**
- Auto-modified: `/Users/milobedini/Documents/git/cbt/src/shared-types/package.json` (version bump)

- [ ] **Step 1: Publish**

```bash
cd /Users/milobedini/Documents/git/cbt && npm run publish
```

Expected: `@milobedini/shared-types` version bumps to `1.0.98` (or next minor, depending on the publish script's increment rule) and package is pushed to npm. Note the exact published version.

- [ ] **Step 2: Verify the published version**

```bash
npm view @milobedini/shared-types version
```

Expected: `1.0.98` (or whatever the publish script produced). Record this number for the Stage 7 FE agents who will consume it via `npm run update-types` in the bwell repo.

- [ ] **Step 3: Commit any auto-generated version bump if the publish script changed files**

```bash
cd /Users/milobedini/Documents/git/cbt
git status
# If there are modified files (e.g. package.json, dist/), stage and commit:
git add src/shared-types/package.json src/shared-types/dist
git commit -m "chore(shared-types): publish v1.0.98"
```

Skip if no files were modified by the publish script.

---

## Done — BE ships

At this point:
- The BE accepts `weekly_goals` as a module type end-to-end.
- Depression program has a Weekly Goals module seeded.
- Shared-types v1.0.98 is published to npm.
- Smoke tests confirm the happy path and validation failures.

**Next (outside this plan):** Return to the mb-development workflow Stage 5 build-complete checkpoint, then proceed to Stage 6 (divergence angles) and Stage 7 (parallel FE prototypes). FE agents will run `npm run update-types` in the bwell repo to consume the new shared-types version.

---

## Self-review

**Spec coverage (against `2026-04-17-weekly-goals-be-design.md`):**

- Schema `weeklyGoals` on `ModuleAttempt` — Task 3. ✅
- Shared-types updates (ModuleType, WeeklyGoalEntry, WeeklyGoalsReflection, WeeklyGoalsData, SaveProgressInput, ModuleAttempt, AttemptDetailResponseItem) — Task 1. ✅
- `startAttempt` default init — Task 7. ✅
- `saveProgress` branch — Task 8. ✅
- `submitAttempt` branch with 5 validation rules — Task 9. ✅
- Utility sanitisers (`emptyReflection`, `coerceRating`, `coercePlannedRef`, `sanitiseWeeklyGoalItems`, plus `mergeReflection`) — Task 5. ✅
- Seed update for Depression program — Task 10. ✅
- All 8 files from the spec's "Places `weekly_goals` must be added" inventory covered — Tasks 1-10. ✅
- Shared-types v1.0.98 publish — Task 14. ✅
- Manual smoke test — Task 13. ✅
- No FE tasks — confirmed. ✅
- No test authoring — confirmed (BE has no test suite; test-audit happens later). ✅

**Placeholder scan:** no TBDs, no "implement later", every code block is concrete.

**Type consistency:**
- Sanitiser types in Task 5 use `WeeklyGoalEntryDb` / `WeeklyGoalsReflectionDb` internally and return concrete `Date` objects; the wire shape (`WeeklyGoalEntry` in shared-types Task 1) uses `string` for `at`. Mongoose handles the conversion on save; reads return Mongoose subdocs where `at` is a `Date`, serialised to ISO by `res.json()`. Consistent. ✅
- `mergeReflection` in Task 5 matches the reflection-field set used in the submit validator in Task 9 (same four keys). ✅
- `sanitiseWeeklyGoalItems` return shape matches the validation expectations in Task 9 (completed boolean, ratings number or null, goalText string). ✅
- Plan import in Task 7 Step 1 lists `emptyReflection`, `mergeReflection`, `sanitiseWeeklyGoalItems` — all three are exported in Task 5 and used in Tasks 7-9. ✅

No inline fixes needed.
