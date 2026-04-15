# General Goals Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add the `general_goals` module type end-to-end: shared types, BE model/controller logic, seed data, and FE presenter with re-rating support.

**Architecture:** Each general_goals attempt stores up to 3 goals (text + 0-10 rating), a reflection, and optional previous rating history. Re-rating attempts pre-populate goal text from the patient's most recent submitted attempt. Follows the same assignment/attempt pattern as all other modules.

**Tech Stack:** TypeScript, Mongoose, Express, React Native (Expo), NativeWind, TanStack Query, Zustand

**Spec:** `docs/superpowers/specs/2026-04-14-general-goals-design.md`

---

## File Map

### Shared Types (`../cbt/src/shared-types/`)

| File | Change | Purpose |
|------|--------|---------|
| `types.ts` | Modify | Add `general_goals` to `ModuleType`, add `GeneralGoalsData` type, update `SaveProgressInput`, `ModuleAttempt`, `AttemptDetailResponseItem` |
| `package.json` | Auto (publish) | Version bump on publish |

### Backend (`../cbt/src/`)

| File | Change | Purpose |
|------|--------|---------|
| `models/moduleModel.ts:23` | Modify | Add `general_goals` to type enum |
| `models/moduleAttemptModel.ts:22-40,107,153` | Modify | Add `IGeneralGoals` interface, add to moduleType enum, add `generalGoals` schema field |
| `models/moduleAssignmentModel.ts:58` | Modify | Add `general_goals` to moduleType enum |
| `controllers/moduleController.ts:150-154` | Modify | Add `general_goals` to allowedTypes whitelist |
| `controllers/attemptsController.ts:112-124` | Modify | Add pre-population logic in `startAttempt` for re-rating |
| `controllers/attemptsController.ts:181-204` | Modify | Add `general_goals` branch in `saveProgress` |
| `controllers/attemptsController.ts:462-522` | Modify | Add `general_goals` branch in `submitAttempt` |
| `seeds/seedAll.ts:364` | Modify | Add General Goals module to Depression program seed |

### Frontend (`bwell/`)

| File | Change | Purpose |
|------|--------|---------|
| `utils/types.ts` | Modify | Add `isGeneralGoalsAttempt()` type guard |
| `utils/moduleIcons.ts` | Modify | Add icon for `general_goals` |
| `components/attempts/presenters/AttemptPresenter.tsx` | Modify | Add routing case for `general_goals` |
| `components/attempts/presenters/general-goals/GeneralGoalsPresenter.tsx` | Create | Main presenter component |
| `components/attempts/presenters/general-goals/useGeneralGoalsState.ts` | Create | State management hook |

---

## Task 1: Shared Types

**Files:**
- Modify: `/Users/milobedini/Documents/git/cbt/src/shared-types/types.ts`

- [ ] **Step 1: Add `general_goals` to `ModuleType` union and create `GeneralGoalsData` type**

In `types.ts`, after line 115, add the new type to the union and define the data shape:

```typescript
// Line 111-115: change ModuleType to:
export type ModuleType =
  | 'questionnaire'
  | 'reading'
  | 'activity_diary'
  | 'five_areas_model'
  | 'general_goals'

// After line 124 (after FiveAreasData), add:
export type GeneralGoalEntry = {
  goalText: string
  rating: number | null
}

export type PreviousRating = {
  date: string
  ratings: number[]
}

export type GeneralGoalsData = {
  goals: GeneralGoalEntry[]
  reflection: string
  isReRating: boolean
  previousRatings: PreviousRating[]
}
```

- [ ] **Step 2: Update `SaveProgressInput` to include `generalGoals`**

In `types.ts` at line 320-332, add the general goals field:

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
  // common
  userNote?: string
}
```

- [ ] **Step 3: Update `ModuleAttempt` type to include `generalGoals`**

In `types.ts` at line 228, after `fiveAreas?: FiveAreasData`, add:

```typescript
  generalGoals?: GeneralGoalsData
```

- [ ] **Step 4: Update `AttemptDetailResponseItem` to include `generalGoals`**

In `types.ts` at line 737, after `fiveAreas?: FiveAreasData`, add:

```typescript
  generalGoals?: GeneralGoalsData
```

- [ ] **Step 5: Build and publish shared types**

```bash
cd /Users/milobedini/Documents/git/cbt
npm run publish
```

Wait for npm publish to complete. This runs `npm --prefix src/shared-types run publish:pkg` which bumps version, builds, and publishes.

- [ ] **Step 6: Update FE shared types**

```bash
cd /Users/milobedini/Documents/git/bwell
npm run update-types
```

- [ ] **Step 7: Commit**

```bash
cd /Users/milobedini/Documents/git/cbt
git add src/shared-types/types.ts src/shared-types/package.json
git commit -m "feat(types): add general_goals module type and GeneralGoalsData"
```

---

## Task 2: BE Mongoose Schemas (all three models)

**Files:**
- Modify: `/Users/milobedini/Documents/git/cbt/src/models/moduleModel.ts:23`
- Modify: `/Users/milobedini/Documents/git/cbt/src/models/moduleAssignmentModel.ts:58`
- Modify: `/Users/milobedini/Documents/git/cbt/src/models/moduleAttemptModel.ts`

- [ ] **Step 1: Add `general_goals` to Module model type enum**

In `moduleModel.ts` at line 23, change:

```typescript
    enum: ['questionnaire', 'reading', 'activity_diary', 'five_areas_model'],
```

to:

```typescript
    enum: ['questionnaire', 'reading', 'activity_diary', 'five_areas_model', 'general_goals'],
```

- [ ] **Step 2: Add `general_goals` to ModuleAssignment model type enum**

In `moduleAssignmentModel.ts` at line 58, change:

```typescript
      enum: ['questionnaire', 'reading', 'activity_diary', 'five_areas_model'],
```

to:

```typescript
      enum: ['questionnaire', 'reading', 'activity_diary', 'five_areas_model', 'general_goals'],
```

- [ ] **Step 3: Add `IGeneralGoals` interface to ModuleAttempt model**

In `moduleAttemptModel.ts`, after line 29 (after `IFiveAreas`), add:

```typescript
interface IGeneralGoalEntry {
  goalText?: string
  rating?: number | null
}

interface IPreviousRating {
  date?: Date
  ratings?: number[]
}

interface IGeneralGoals {
  goals?: IGeneralGoalEntry[]
  reflection?: string
  isReRating?: boolean
  previousRatings?: IPreviousRating[]
}
```

- [ ] **Step 4: Add `general_goals` to `IModuleAttempt` interface and moduleType union**

In `moduleAttemptModel.ts`, update the moduleType union (lines 36-40) to:

```typescript
  moduleType:
    | 'questionnaire'
    | 'reading'
    | 'activity_diary'
    | 'five_areas_model'
    | 'general_goals'
```

Then find where `fiveAreas` is declared in the interface (around line 70-78 area) and add after it:

```typescript
  generalGoals?: IGeneralGoals
```

- [ ] **Step 5: Add `general_goals` to moduleType enum in schema**

In `moduleAttemptModel.ts` at line 107, change:

```typescript
      enum: ['questionnaire', 'reading', 'activity_diary', 'five_areas_model'],
```

to:

```typescript
      enum: ['questionnaire', 'reading', 'activity_diary', 'five_areas_model', 'general_goals'],
```

- [ ] **Step 6: Add `generalGoals` schema field**

In `moduleAttemptModel.ts`, after line 161 (after the `fiveAreas` block), add:

```typescript
    // General Goals
    generalGoals: {
      goals: [
        {
          goalText: { type: String, trim: true, maxlength: 500 },
          rating: { type: Number, min: 0, max: 10, default: null },
        },
      ],
      reflection: { type: String, trim: true, maxlength: 2000 },
      isReRating: { type: Boolean, default: false },
      previousRatings: [
        {
          date: { type: Date },
          ratings: [{ type: Number, min: 0, max: 10 }],
        },
      ],
    },
```

- [ ] **Step 7: Verify the BE compiles**

```bash
cd /Users/milobedini/Documents/git/cbt
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 8: Commit**

```bash
cd /Users/milobedini/Documents/git/cbt
git add src/models/moduleModel.ts src/models/moduleAssignmentModel.ts src/models/moduleAttemptModel.ts
git commit -m "feat(models): add general_goals to all module type enums and attempt schema"
```

---

## Task 3: BE Module Controller (whitelist)

**Files:**
- Modify: `/Users/milobedini/Documents/git/cbt/src/controllers/moduleController.ts:150-154`

- [ ] **Step 1: Add `general_goals` and `five_areas_model` to allowedTypes**

In `moduleController.ts` at line 150-154, change:

```typescript
    const allowedTypes = [
      'questionnaire',
      'reading',
      'activity_diary',
    ]
```

to:

```typescript
    const allowedTypes = [
      'questionnaire',
      'reading',
      'activity_diary',
      'five_areas_model',
      'general_goals',
    ]
```

Note: also adding `five_areas_model` which was missing (pre-existing bug from PM brief).

- [ ] **Step 2: Commit**

```bash
cd /Users/milobedini/Documents/git/cbt
git add src/controllers/moduleController.ts
git commit -m "fix(modules): add five_areas_model and general_goals to createModule whitelist"
```

---

## Task 4: BE Attempt Controller (startAttempt pre-population)

**Files:**
- Modify: `/Users/milobedini/Documents/git/cbt/src/controllers/attemptsController.ts:112-124`

- [ ] **Step 1: Add pre-population logic after attempt creation**

In `attemptsController.ts`, in the `startAttempt` function, after the `ModuleAttempt.create()` call (line 112-124) and before the assignment status update (line 126), add pre-population logic for general_goals:

```typescript
    // Pre-populate general_goals re-rating from most recent submitted attempt
    if (mod.type === 'general_goals') {
      const latestSubmitted = await ModuleAttempt.findOne({
        user: userId,
        module: mod._id,
        moduleType: 'general_goals',
        status: 'submitted',
      })
        .sort({ completedAt: -1 })
        .select('generalGoals completedAt')
        .lean()

      if (latestSubmitted?.generalGoals?.goals?.length) {
        const prevGoals = latestSubmitted.generalGoals
        const previousRatings = [
          ...(prevGoals.previousRatings ?? []),
          {
            date: latestSubmitted.completedAt,
            ratings: prevGoals.goals.map(
              (g: { rating?: number | null }) => g.rating ?? 0
            ),
          },
        ]

        attempt.generalGoals = {
          goals: prevGoals.goals.map(
            (g: { goalText?: string }) => ({
              goalText: g.goalText,
              rating: null,
            })
          ),
          reflection: '',
          isReRating: true,
          previousRatings,
        } as typeof attempt.generalGoals

        await attempt.save()
      }
    }
```

Insert this block right after line 124 (`})`) and before line 126 (`if (assignment && ...)`).

- [ ] **Step 2: Verify the BE compiles**

```bash
cd /Users/milobedini/Documents/git/cbt
npx tsc --noEmit
```

- [ ] **Step 3: Commit**

```bash
cd /Users/milobedini/Documents/git/cbt
git add src/controllers/attemptsController.ts
git commit -m "feat(attempts): pre-populate general_goals re-rating from previous submission"
```

---

## Task 5: BE Attempt Controller (saveProgress)

**Files:**
- Modify: `/Users/milobedini/Documents/git/cbt/src/controllers/attemptsController.ts:181-204`

- [ ] **Step 1: Add `general_goals` branch in `saveProgress`**

In `attemptsController.ts`, after the `five_areas_model` block (line 204), add:

```typescript
    if (attempt.moduleType === 'general_goals') {
      const { generalGoals } = req.body as {
        generalGoals?: Partial<{
          goals: Array<{ goalText: string; rating: number | null }>
          reflection: string
          isReRating: boolean
          previousRatings: Array<{ date: string; ratings: number[] }>
        }>
      }

      if (generalGoals) {
        const existing =
          (
            attempt.generalGoals as unknown as {
              toObject?: () => Record<string, unknown>
            }
          )?.toObject?.() ?? attempt.generalGoals ?? {}
        attempt.generalGoals = {
          ...existing,
          ...generalGoals,
        } as typeof attempt.generalGoals
      }
      if (typeof userNote === 'string') attempt.userNote = userNote
      attempt.lastInteractionAt = new Date()
      await attempt.save()
      res.status(200).json({ success: true, attempt })
      return
    }
```

- [ ] **Step 2: Verify the BE compiles**

```bash
cd /Users/milobedini/Documents/git/cbt
npx tsc --noEmit
```

- [ ] **Step 3: Commit**

```bash
cd /Users/milobedini/Documents/git/cbt
git add src/controllers/attemptsController.ts
git commit -m "feat(attempts): add general_goals save progress handler"
```

---

## Task 6: BE Attempt Controller (submitAttempt)

**Files:**
- Modify: `/Users/milobedini/Documents/git/cbt/src/controllers/attemptsController.ts:462-522`

- [ ] **Step 1: Add `general_goals` branch in `submitAttempt`**

In `attemptsController.ts`, after the `five_areas_model` submit block (line 522), add:

```typescript
    if (attempt.moduleType === 'general_goals') {
      // Validate goals
      const goals = attempt.generalGoals?.goals ?? []
      if (goals.length === 0) {
        res.status(400).json({
          success: false,
          message: 'Please add at least one goal before submitting',
        })
        return
      }
      if (goals.length > 3) {
        res.status(400).json({
          success: false,
          message: 'A maximum of 3 goals is allowed',
        })
        return
      }

      const hasEmptyGoal = goals.some(
        (g: { goalText?: string; rating?: number | null }) =>
          !g.goalText?.trim() ||
          g.rating === null ||
          g.rating === undefined
      )
      if (hasEmptyGoal) {
        res.status(400).json({
          success: false,
          message: 'Each goal must have text and a rating',
        })
        return
      }

      if (!attempt.generalGoals?.reflection?.trim()) {
        res.status(400).json({
          success: false,
          message: 'Please add a reflection before submitting',
        })
        return
      }

      attempt.completedAt = now
      attempt.lastInteractionAt = now
      attempt.status = 'submitted'
      attempt.durationSecs = attempt.startedAt
        ? Math.max(
            0,
            Math.floor(
              (now.getTime() - attempt.startedAt.getTime()) / 1000
            )
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
        }).exec()
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

- [ ] **Step 2: Verify the BE compiles**

```bash
cd /Users/milobedini/Documents/git/cbt
npx tsc --noEmit
```

- [ ] **Step 3: Commit**

```bash
cd /Users/milobedini/Documents/git/cbt
git add src/controllers/attemptsController.ts
git commit -m "feat(attempts): add general_goals submit handler with validation"
```

---

## Task 7: BE Seed Data

**Files:**
- Modify: `/Users/milobedini/Documents/git/cbt/src/seeds/seedAll.ts:364`

- [ ] **Step 1: Add General Goals module to the Depression program seed**

In `seedAll.ts`, after the Five Areas Model entry (line 364, after the closing `},`), add:

```typescript
      {
        title: 'General Goals',
        description:
          'Set up to three overarching therapy goals and rate your progress on a 0-10 scale. Re-rate periodically to track how therapy is helping you move towards what matters most.',
        type: 'general_goals',
        accessPolicy: 'assigned',
        disclaimer:
          'This goal-tracking tool supports your therapy but does not replace professional guidance. Discuss your goals with your therapist.',
        imageUrl: 'https://placehold.co/600x400?text=General+Goals',
      },
```

- [ ] **Step 2: Commit**

```bash
cd /Users/milobedini/Documents/git/cbt
git add src/seeds/seedAll.ts
git commit -m "feat(seeds): add General Goals module to Depression program"
```

---

## Task 8: FE Type Guard, Icon, and Presenter Routing

**Files:**
- Modify: `/Users/milobedini/Documents/git/bwell/utils/types.ts`
- Modify: `/Users/milobedini/Documents/git/bwell/utils/moduleIcons.ts`
- Modify: `/Users/milobedini/Documents/git/bwell/components/attempts/presenters/AttemptPresenter.tsx`

- [ ] **Step 1: Add `isGeneralGoalsAttempt` type guard**

In `utils/types.ts`, update the import on line 1 and add the new guard after line 18:

```typescript
import type {
  AttemptDetail,
  AttemptDetailResponseItem,
  DiaryDetail,
  GeneralGoalsData,
} from '@milobedini/shared-types';

// ... existing guards ...

export function isGeneralGoalsAttempt(
  a: AttemptDetailResponseItem
): a is AttemptDetailResponseItem & {
  generalGoals: GeneralGoalsData;
} {
  return a.moduleType === 'general_goals' && !!a.generalGoals;
}
```

- [ ] **Step 2: Add icon for `general_goals`**

In `utils/moduleIcons.ts`, add to the `MODULE_TYPE_ICONS` record at line 10:

```typescript
  general_goals: 'bullseye-arrow',
```

- [ ] **Step 3: Add routing case in AttemptPresenter**

In `AttemptPresenter.tsx`, update the import on line 4:

```typescript
import {
  isDiaryAttempt,
  isGeneralGoalsAttempt,
  isQuestionnaireAttempt,
  isReadingAttempt,
} from '@/utils/types';
```

Add the import for the presenter after line 8:

```typescript
import GeneralGoalsPresenter from './general-goals/GeneralGoalsPresenter';
```

Add the routing case after line 35 (after the `five_areas_model` block):

```typescript
  if (attempt.moduleType === 'general_goals') {
    return (
      <GeneralGoalsPresenter
        attempt={attempt}
        mode={mode}
        patientName={patientName}
      />
    );
  }
```

- [ ] **Step 4: Commit**

```bash
cd /Users/milobedini/Documents/git/bwell
git add utils/types.ts utils/moduleIcons.ts components/attempts/presenters/AttemptPresenter.tsx
git commit -m "feat(general-goals): add type guard, icon, and presenter routing"
```

---

## Task 9: FE State Hook

**Files:**
- Create: `/Users/milobedini/Documents/git/bwell/components/attempts/presenters/general-goals/useGeneralGoalsState.ts`

- [ ] **Step 1: Create the state management hook**

Create `components/attempts/presenters/general-goals/useGeneralGoalsState.ts`:

```typescript
import { useState, useCallback, useRef } from 'react';
import type {
  AttemptDetailResponseItem,
  GeneralGoalEntry,
  GeneralGoalsData,
} from '@milobedini/shared-types';
import {
  useSaveModuleAttempt,
  useSubmitAttempt,
} from '@/hooks/useAttempts';

type UseGeneralGoalsStateParams = {
  attempt: AttemptDetailResponseItem;
  mode: 'view' | 'edit';
};

export const useGeneralGoalsState = ({
  attempt,
  mode,
}: UseGeneralGoalsStateParams) => {
  const initialData = attempt.generalGoals;
  const isReRating = initialData?.isReRating ?? false;
  const previousRatings = initialData?.previousRatings ?? [];

  const [goals, setGoals] = useState<GeneralGoalEntry[]>(
    initialData?.goals?.length ? initialData.goals : []
  );
  const [reflection, setReflection] = useState(
    initialData?.reflection ?? ''
  );
  const dirtyRef = useRef(false);

  const canEdit =
    mode === 'edit' && attempt.status !== 'submitted';
  const canAddGoal =
    canEdit && !isReRating && goals.length < 3;

  const { mutateSilently: saveAttemptSilently, isPending: isSaving } =
    useSaveModuleAttempt(attempt._id);
  const { mutate: submitAttempt, isPending: isSubmitting } =
    useSubmitAttempt(attempt._id);

  const buildPayload = useCallback(
    (): Partial<GeneralGoalsData> => ({
      goals,
      reflection,
      isReRating,
      previousRatings,
    }),
    [goals, reflection, isReRating, previousRatings]
  );

  const save = useCallback(() => {
    if (!canEdit || !dirtyRef.current) return;
    saveAttemptSilently(
      { generalGoals: buildPayload() },
      {
        onSuccess: () => {
          dirtyRef.current = false;
        },
      }
    );
  }, [canEdit, saveAttemptSilently, buildPayload]);

  const markDirty = useCallback(() => {
    dirtyRef.current = true;
  }, []);

  const addGoal = useCallback(() => {
    if (!canAddGoal) return;
    setGoals((prev) => [
      ...prev,
      { goalText: '', rating: null },
    ]);
    markDirty();
  }, [canAddGoal, markDirty]);

  const updateGoalText = useCallback(
    (index: number, text: string) => {
      if (!canEdit || isReRating) return;
      setGoals((prev) =>
        prev.map((g, i) =>
          i === index ? { ...g, goalText: text } : g
        )
      );
      markDirty();
    },
    [canEdit, isReRating, markDirty]
  );

  const updateGoalRating = useCallback(
    (index: number, rating: number) => {
      if (!canEdit) return;
      setGoals((prev) =>
        prev.map((g, i) =>
          i === index ? { ...g, rating } : g
        )
      );
      markDirty();
    },
    [canEdit, markDirty]
  );

  const removeGoal = useCallback(
    (index: number) => {
      if (!canEdit || isReRating) return;
      setGoals((prev) => prev.filter((_, i) => i !== index));
      markDirty();
    },
    [canEdit, isReRating, markDirty]
  );

  const updateReflection = useCallback(
    (text: string) => {
      if (!canEdit) return;
      setReflection(text);
      markDirty();
    },
    [canEdit, markDirty]
  );

  const canSubmit =
    canEdit &&
    goals.length >= 1 &&
    goals.every(
      (g) =>
        g.goalText?.trim() &&
        g.rating !== null &&
        g.rating !== undefined
    ) &&
    reflection.trim().length > 0;

  const handleSubmit = useCallback(
    (assignmentId?: string) => {
      if (!canSubmit) return;
      saveAttemptSilently(
        { generalGoals: buildPayload() },
        {
          onSuccess: () => {
            dirtyRef.current = false;
            submitAttempt({ assignmentId });
          },
        }
      );
    },
    [canSubmit, saveAttemptSilently, buildPayload, submitAttempt]
  );

  return {
    goals,
    reflection,
    isReRating,
    previousRatings,
    canEdit,
    canAddGoal,
    canSubmit,
    isSaving,
    isSubmitting,
    isDirty: dirtyRef.current,
    addGoal,
    updateGoalText,
    updateGoalRating,
    removeGoal,
    updateReflection,
    save,
    handleSubmit,
  };
};
```

- [ ] **Step 2: Verify the hook compiles**

```bash
cd /Users/milobedini/Documents/git/bwell
npx tsc --noEmit --pretty 2>&1 | head -20
```

- [ ] **Step 3: Commit**

```bash
cd /Users/milobedini/Documents/git/bwell
git add components/attempts/presenters/general-goals/useGeneralGoalsState.ts
git commit -m "feat(general-goals): add useGeneralGoalsState hook"
```

---

## Task 10: FE Presenter Component

**Files:**
- Create: `/Users/milobedini/Documents/git/bwell/components/attempts/presenters/general-goals/GeneralGoalsPresenter.tsx`

This task creates the presenter component. **UI/UX details (layout, styling, animations, input components) are at the designer's discretion.** The presenter must:

1. Accept `AttemptPresenterProps` (`attempt`, `mode`, `patientName`)
2. Use `useGeneralGoalsState` for all state management
3. Render differently based on `isReRating` (first attempt vs re-rating)
4. In edit mode: allow adding/editing/removing goals with text + rating, show reflection section with prompt questions, support save-as-you-go and submit
5. In view mode: show goals as read-only cards with ratings, show rating history if re-rating, show reflection text
6. Show the three reflection prompts as guidance text on first attempt:
   - "Are these goals in line with your values and what is important to you?"
   - "Are your goals achievable or do you need to add some steps to get to the final outcome?"
   - "Are these goals relevant to improving your mood?"
7. Show adjusted prompt on re-rating: "How do you feel about your progress towards these goals?"

- [ ] **Step 1: Create a minimal working presenter**

Create `components/attempts/presenters/general-goals/GeneralGoalsPresenter.tsx` with a basic implementation that wires up the state hook and renders the core UI. Use existing patterns from `FiveAreasPresenter` as reference for structure (Container, save indicator, submit flow).

The designer will refine the visual treatment, but the component must be functionally complete: goal entry, rating input, reflection, save-as-you-go, submit, and view mode.

- [ ] **Step 2: Verify it compiles and renders**

```bash
cd /Users/milobedini/Documents/git/bwell
npx tsc --noEmit --pretty 2>&1 | head -20
```

- [ ] **Step 3: Commit**

```bash
cd /Users/milobedini/Documents/git/bwell
git add components/attempts/presenters/general-goals/GeneralGoalsPresenter.tsx
git commit -m "feat(general-goals): add GeneralGoalsPresenter component"
```

---

## Task 11: Validate Full Stack

- [ ] **Step 1: Start the BE and verify no startup errors**

```bash
cd /Users/milobedini/Documents/git/cbt
npm run dev
```

Expected: server starts without errors.

- [ ] **Step 2: Reseed the database to create the General Goals module**

Use the seed endpoint or run the seed script to create the new module in the Depression program.

- [ ] **Step 3: Run FE lint**

```bash
cd /Users/milobedini/Documents/git/bwell
npm run lint
```

Expected: all checks pass.

- [ ] **Step 4: Run FE tests**

```bash
cd /Users/milobedini/Documents/git/bwell
npm test
```

Expected: all existing tests pass (no regressions).

- [ ] **Step 5: Manual test via the app**

1. Log in as therapist, assign General Goals to a patient
2. Log in as patient, open the assignment, enter 2-3 goals with ratings, write reflection, submit
3. Log in as therapist, review the submitted attempt
4. Assign General Goals again (re-rating), verify patient sees read-only goal text with previous ratings
5. Patient provides new ratings and submits
6. Therapist reviews re-rating attempt with rating history

- [ ] **Step 6: Final commit for any fixes**

If any adjustments were needed during validation, commit them.
