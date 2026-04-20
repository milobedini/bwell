# Weekly Goals — Backend Design

**Date:** 2026-04-17
**Scope:** Backend only. Frontend is handled separately by parallel prototype agents after this spec is delivered and built.
**Repos:** BE `../cbt` · FE `./` (bwell)
**Status:** Approved; ready for planning

## Purpose

Add the Weekly Goals CBT tool — the sole remaining MVP blocker for a therapist-led Depression sessions 1-3 toolkit. Therapists assign the tool at the end of a CBT session; patients list 1-7 behavioural goals for the week, optionally pre-plan them against the Activity Diary, record completion and mastery/pleasure ratings during the week, then reflect at week-end against four structured prompts.

## Clinical framing

Weekly Goals is a behavioural-activation (BA) tool. It sits between General Goals (long-horizon therapy goals rated 0-10) and the Activity Diary (granular mood/activity logging). The four reflection prompts come directly from the proposal (`docs/proposal.pdf`, p.7). Ratings use the NICE-CG90-endorsed mastery-and-pleasure (M/P) construct from Beckian CBT, both nullable to avoid overloading patients with mandatory self-assessment.

## Architecture summary

- New `ModuleType` value: `'weekly_goals'`.
- New embedded `weeklyGoals` object on `ModuleAttempt`, alongside `generalGoals`, `fiveAreas`, `diaryEntries`.
- No new collections. No new routes. No new state machine.
- Reuses the existing attempt lifecycle (`started → submitted | abandoned`) and assignment lifecycle (`assigned → in_progress → completed | cancelled`).
- Reuses `ModuleAssignment.recurrence` for optional weekly auto-recurrence via `computeNextDueDate`.

## Data model

### Mongoose types on `IModuleAttempt`

```ts
interface IWeeklyGoalEntry {
  goalText: string                         // required at submit; trimmed; max 500
  completed?: boolean                      // default false; optional until submit
  masteryRating?: number | null            // 0-10; nullable
  pleasureRating?: number | null           // 0-10; nullable
  plannedDiaryEntryRef?: {
    at: Date                               // planned day/time slot; stored UTC
    label?: string                         // optional, max 100 (e.g. "Tues 4pm")
  } | null
  completionNotes?: string                 // optional per-goal note; trimmed; max 500
}

interface IWeeklyGoalsReflection {
  moodImpact?: string      // "What activities improved / impacted your mood?"
  takeaway?: string        // "What can you take away from this?"
  balance?: string         // "Did you get enough balance across activities?"
  barriers?: string        // "Did anything get in the way?"
}

interface IWeeklyGoals {
  goals?: IWeeklyGoalEntry[]
  reflection?: IWeeklyGoalsReflection
}
```

All reflection fields `trim: true`, `maxlength: 2000` (same convention as `fiveAreas.*` and `generalGoals.reflection`).

### Mongoose schema block (to add to `moduleAttemptModel.ts`)

```ts
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
      completionNotes: { type: String, trim: true, maxlength: 500 },
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

### Shared-types (`@milobedini/shared-types`, bump to v1.0.98)

```ts
export type ModuleType =
  | 'questionnaire'
  | 'reading'
  | 'activity_diary'
  | 'five_areas_model'
  | 'general_goals'
  | 'weekly_goals'            // NEW

export type WeeklyGoalEntry = {
  goalText: string
  completed: boolean
  masteryRating: number | null
  pleasureRating: number | null
  plannedDiaryEntryRef: { at: string; label?: string } | null   // ISO over the wire
  completionNotes: string | null
}

export type WeeklyGoalsReflection = {
  moodImpact: string     // empty string when unfilled; keeps shape stable
  takeaway: string
  balance: string
  barriers: string
}

export type WeeklyGoalsData = {
  goals: WeeklyGoalEntry[]
  reflection: WeeklyGoalsReflection
}

// Extend:
export type SaveProgressInput = {
  // ...existing fields
  weeklyGoals?: Partial<{
    goals: Array<Partial<WeeklyGoalEntry>>
    reflection: Partial<WeeklyGoalsReflection>
  }>
}

export type ModuleAttempt = {
  // ...existing fields
  weeklyGoals?: WeeklyGoalsData
}

export type AttemptDetailResponseItem = ModuleAttempt & {
  // ...existing
  weeklyGoals?: WeeklyGoalsData
}
```

**Wire-shape conventions** (matching existing shared-types):

- `Date` → ISO `string` on the wire.
- Nullable DB fields expose `T | null`, not `T | undefined`, so the FE can pattern-match on `null` without collapsing two distinct "missing" states.
- `Partial<>` on the save-input lets the FE send deltas.

## Controller changes (`attemptsController.ts`)

### `startAttempt`

No pre-population from previous attempts (unlike General Goals re-rating). Each assigned week is independent. Initialise with empty normalised shape so the FE can assume structure exists:

```ts
if (mod.type === 'weekly_goals') {
  attempt.weeklyGoals = {
    goals: [],
    reflection: { moodImpact: '', takeaway: '', balance: '', barriers: '' },
  }
  await attempt.save()
}
```

### `saveProgress` — new branch before the generic `answers` handler

```ts
if (attempt.moduleType === 'weekly_goals') {
  const { weeklyGoals } = req.body as {
    weeklyGoals?: Partial<{
      goals: Array<Partial<WeeklyGoalEntry>>
      reflection: Partial<WeeklyGoalsReflection>
    }>
  }

  if (weeklyGoals) {
    const existing = attempt.weeklyGoals?.toObject?.() ?? attempt.weeklyGoals ?? {}
    const merged = { ...existing }

    if (Array.isArray(weeklyGoals.goals)) {
      merged.goals = sanitiseWeeklyGoalItems(weeklyGoals.goals)
    }
    if (weeklyGoals.reflection) {
      merged.reflection = {
        ...(existing.reflection ?? emptyReflection),
        ...weeklyGoals.reflection,
      }
    }
    attempt.weeklyGoals = merged
  }

  if (typeof userNote === 'string') attempt.userNote = userNote
  attempt.lastInteractionAt = new Date()
  await attempt.save()
  res.status(200).json({ success: true, attempt })
  return
}
```

**Array strategy:** whole-array replace for `goals` (matches `general_goals`). FE debounces and sends its full current list. Keeps merge semantics simple and predictable.

### `submitAttempt` — new branch before the generic questionnaire handler

Validations (first failure returns 400):

| # | Rule | Message |
|---|------|---------|
| 1 | `goals.length >= 1` | "Please add at least one goal before submitting" |
| 2 | `goals.length <= 7` | "A maximum of 7 goals is allowed" |
| 3 | Every goal has non-empty `goalText.trim()` | "Each goal must have text" |
| 4 | Non-null ratings are within `[0, 10]` | "Ratings must be between 0 and 10" |
| 5 | At least one reflection field has non-empty trimmed value | "Please share a reflection before submitting" |

On pass: set `completedAt`, `lastInteractionAt`, `status = 'submitted'`, `durationSecs`, denormalise `therapist`, run the existing assignment-completion + auto-recurrence block (identical to `general_goals` branch).

**Not validated at submit** (deliberate): per-goal `completed` flags — partial completion is valid clinical data, not a user failure.

### New utility file: `src/utils/weeklyGoalsUtils.ts`

```ts
export const emptyReflection: IWeeklyGoalsReflection = {
  moodImpact: '', takeaway: '', balance: '', barriers: '',
}

export const coerceRating = (v: unknown): number | null => {
  const n = Number(v)
  return Number.isFinite(n) && n >= 0 && n <= 10 ? n : null
}

export const coercePlannedRef = (v: unknown):
  | { at: Date; label?: string }
  | null => {
  if (!v || typeof v !== 'object') return null
  const rec = v as Record<string, unknown>
  const at = new Date(String(rec.at))
  if (isNaN(at.getTime())) return null
  const label = typeof rec.label === 'string' ? rec.label.trim().slice(0, 100) : undefined
  return label ? { at, label } : { at }
}

export const sanitiseWeeklyGoalItems = (raw: unknown[]): IWeeklyGoalEntry[] =>
  raw.slice(0, 7).map(item => {
    const rec = (item ?? {}) as Record<string, unknown>
    const notes = String(rec.completionNotes ?? '').trim().slice(0, 500)
    return {
      goalText: String(rec.goalText ?? '').trim().slice(0, 500),
      completed: Boolean(rec.completed),
      masteryRating: coerceRating(rec.masteryRating),
      pleasureRating: coerceRating(rec.pleasureRating),
      plannedDiaryEntryRef: coercePlannedRef(rec.plannedDiaryEntryRef),
      completionNotes: notes || null,
    }
  })
```

## Assignment pattern

Therapist creates a `ModuleAssignment` per week via the existing `POST /assignments` flow. No changes to assignment creation. MVP scope: therapist assigns manually each week (no auto-recurrence at creation time). Auto-recurrence through `computeNextDueDate` on submit is supported server-side and can be opted in from the FE when ready.

## Seeds (`seeds/seedAll.ts`)

1. Extend the local `ModuleData['type']` union at line ~144 to include `'weekly_goals'`.
2. Append a new module entry to the Depression program's `modules` array after General Goals:

   ```ts
   {
     title: 'Weekly Goals',
     description:
       'Plan what you want to do this week — small behavioural goals you can tick off as you complete them. At week-end, reflect on what helped your mood, what got in the way, and what you want to adjust next week.',
     type: 'weekly_goals',
     accessPolicy: 'assigned',
     disclaimer:
       'Weekly Goals are a tool to support your therapy, not a replacement for professional guidance. Discuss each week with your therapist to agree what is realistic.',
     imageUrl: 'https://placehold.co/600x400?text=Weekly+Goals',
   }
   ```

3. No seeded completed attempts — the list would be arbitrary and risks brittle test expectations. Seeded assignments for demo patients follow the existing pattern for General Goals.

Scope: Depression only. GAD / Panic / others are post-MVP.

## State model and invariants

### Lifecycles (unchanged)

```
Attempt:    started ──► submitted
                    └─► abandoned

Assignment: assigned ──► in_progress ──► completed
                                     └─► cancelled
```

### Item-level state

Each `IWeeklyGoalEntry` carries `completed: boolean` and optional ratings. "State" is derivable from field presence; no enum.

### Controller-enforced invariants

1. `attempt.status === 'started'` for `saveProgress` writes.
2. `attempt.status !== 'submitted'` before any mutation.
3. `weeklyGoals.goals.length ∈ [1, 7]` at submit time.
4. Every submitted goal has non-empty `goalText` after trim.
5. Non-null ratings are in `[0, 10]`.
6. At least one reflection field is non-empty at submit time.
7. `weeklyGoals.goals` is always an array; `weeklyGoals.reflection` is always the full 4-field object after `startAttempt`.

### Not invariant (deliberately)

- Number of completed goals (zero is valid at submit).
- Presence of ratings (all optional).
- Presence of `plannedDiaryEntryRef` (always optional).
- Temporal relationship between `plannedDiaryEntryRef.at` and the attempt's week (no BE validation).

### Mutation endpoints

| Endpoint | Status before | Status after | Writes |
|----------|---------------|--------------|--------|
| `POST /modules/:moduleId/attempts` | n/a | `started` | Creates attempt with empty `weeklyGoals` |
| `PATCH /attempts/:attemptId` | `started` | `started` | `weeklyGoals.goals` (full replace) and/or `weeklyGoals.reflection` (merge); `userNote` |
| `POST /attempts/:attemptId/submit` | `started` | `submitted` | Validates invariants 3-6; sets `completedAt`, `durationSecs`; assignment cleanup; auto-recurrence |

## Edge cases

| Scenario | Behaviour |
|----------|-----------|
| Save empty `goals: []` mid-week | Accepted. Submit will fail invariant 3. |
| Save 8+ goals | Sanitiser truncates to first 7. Submit also enforces the cap. |
| Whitespace-only goal text | Trimmed to empty on save. Submit validator rejects. |
| Rating out of range or non-numeric | Coerced to null on save. Submit rejects if still out of range. |
| All four reflection fields empty at submit | Rejected. |
| Any single reflection field populated at submit | Accepted. |
| Invalid `plannedDiaryEntryRef.at` | Sanitiser drops the ref. No user-facing error — optional metadata. |
| Mutating a submitted attempt | 400 via existing `status === 'submitted'` guard. |
| Therapist cancels mid-week | Existing `abandoned` path works. |
| Assignment with `recurrence.freq === 'weekly'` | Auto-generates next week's assignment via `computeNextDueDate`. |
| Therapist read of in-progress attempt | Existing therapist read paths return `weeklyGoals` once the projection includes it. |
| Time zones on `plannedDiaryEntryRef.at` | Stored UTC per existing convention (same as `diaryEntries.at`). |

## Places `weekly_goals` must be added

| # | File | Change |
|---|------|--------|
| 1 | `src/shared-types/types.ts` | `ModuleType` union; new `WeeklyGoalEntry`, `WeeklyGoalsReflection`, `WeeklyGoalsData`; extend `SaveProgressInput`, `ModuleAttempt`, `AttemptDetailResponseItem` |
| 2 | `src/models/moduleModel.ts` | `IModule.type` union; schema `enum` |
| 3 | `src/models/moduleAttemptModel.ts` | `IModuleAttempt.moduleType` union; schema `enum`; new `weeklyGoals` sub-schema |
| 4 | `src/models/moduleAssignmentModel.ts` | `moduleType` union; schema `enum` |
| 5 | `src/controllers/moduleController.ts` | `createModule` `allowedTypes` array |
| 6 | `src/controllers/attemptsController.ts` | `startAttempt` default init; `saveProgress` branch; `submitAttempt` branch + validations |
| 7 | `src/seeds/seedAll.ts` | Local `ModuleData['type']` union; Depression program module entry |
| 8 | `src/utils/weeklyGoalsUtils.ts` | **New file** — sanitiser helpers |

Post-BE publish: `cd ../cbt && npm run publish` (shared-types v1.0.98).

## Future extensions (out of scope for this build)

Explicit upgrade paths so future decisions aren't lost:

1. **Hard FK to diary entry** — upgrade `plannedDiaryEntryRef` to include `diaryAttemptId: ObjectId` + `entryIndex` once the diary attempt is guaranteed. Cross-link both directions for "did I follow through" read queries.
2. **Values-domain tagging per goal** — add optional `valuesDomain?: enum` (family, work, health, growth, etc.) per Moodivate / ACT. Enables values-aligned review and charting.
3. **Mastery / pleasure aggregation** — cross-week M/P trend for therapist review and patient insight (analogue of current score-trends endpoint).
4. **Auto-recurrence at assignment creation** — FE-side opt-in to `ModuleAssignment.recurrence.freq === 'weekly'`. Already supported BE-side.
5. **Two-phase submit** — split into "save week" (mid-week) and "submit reflection" (end of week) as two discrete status transitions, if user testing surfaces the need.
6. **Goal templates / carry-forward** — "copy last week's goals" at `startAttempt`, similar to General Goals' re-rating pre-population, opt-in from the FE.
7. **Therapist preset library** — therapist-authored goal templates attachable to an assignment.
8. **Per-goal completion streak** — behavioural-activation insight across ≥4 weekly-goals attempts for a patient.
9. **PWP tier reuse** — per proposal p.12, PWP-guided patients use a subset including Weekly Goals. Same schema, same module, reused under a PWP program.
10. **Other programs (GAD, Panic, OCD, Health Anxiety…)** — seed Weekly Goals into additional programs as they come online. Schema unchanged.

## Out of scope (MVP)

- Frontend implementation (separate prototype agents).
- New collections or new endpoints.
- Any change to questionnaire / reading / diary / five-areas / general-goals flows.
- Other programs beyond Depression.
- Auto-creation of recurring assignments at the assignment-creation endpoint.
- Admin content-authoring UI for the module (seed suffices for MVP).
