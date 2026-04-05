# Five Areas Model Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the 5 Areas Model clinical tool — the foundational CBT framework used in session 1 — across BE, shared types, and FE.

**Architecture:** One attempt = one situation mapped across 5 areas. Stepped flow with hot cross bun diagram as interactive progress indicator (Skia). Extends existing attempt CRUD — no new endpoints or models. BE gets a new `fiveAreas` embedded subdocument on `ModuleAttempt`, FE gets a new presenter with 6-step guided flow.

**Tech Stack:** Node/Express + Mongoose (BE), `@milobedini/shared-types` (types), Expo + React Native + NativeWind + `@shopify/react-native-skia` (FE)

---

## File Map

### Backend (`../cbt/`)

| File | Action | Responsibility |
|------|--------|---------------|
| `src/shared-types/types.ts` | Modify | Add `FiveAreasData` type, update `ModuleType`, `ModuleAttempt`, `SaveProgressInput`, `AttemptDetailResponseItem` |
| `src/models/moduleModel.ts` | Modify | Add `'five_areas_model'` to type enum |
| `src/models/moduleAttemptModel.ts` | Modify | Add `IFiveAreas` interface, `fiveAreas` subdocument to schema, update `moduleType` enum |
| `src/controllers/attemptsController.ts` | Modify | Add `five_areas_model` branch in `saveProgress` and `submitAttempt` |
| `src/seeds/seedAll.ts` | Modify | Add 5 Areas Model module to Depression program, update `ModuleData` type |

### Frontend (`bwell/`)

| File | Action | Responsibility |
|------|--------|---------------|
| `types/types.ts` | Modify | Add `FIVE_AREAS_MODEL` to `ModuleType` enum |
| `utils/types.ts` | Modify | Add `isFiveAreasAttempt` type guard |
| `utils/moduleIcons.ts` | Modify | Add icon mapping for `five_areas_model` |
| `components/attempts/presenters/AttemptPresenter.tsx` | Modify | Add `isFiveAreasAttempt` branch |
| `components/attempts/presenters/five-areas/FiveAreasDiagram.tsx` | Create | Hot cross bun SVG diagram (Skia) with touch handling |
| `components/attempts/presenters/five-areas/AreaStep.tsx` | Create | Single step view: label, helper hint, text input |
| `components/attempts/presenters/five-areas/AreaReviewCard.tsx` | Create | Expanded text card for therapist/patient review |
| `components/attempts/presenters/five-areas/useFiveAreasState.ts` | Create | State hook: step tracking, dirty fields, save/submit |
| `components/attempts/presenters/five-areas/FiveAreasPresenter.tsx` | Create | Main presenter: edit (stepped) and view (diagram-first) modes |

---

### Task 1: Shared Types — Add FiveAreasData and update ModuleType

**Files:**
- Modify: `../cbt/src/shared-types/types.ts:111-114` (ModuleType)
- Modify: `../cbt/src/shared-types/types.ts:186-220` (ModuleAttempt)
- Modify: `../cbt/src/shared-types/types.ts:309-319` (SaveProgressInput)
- Modify: `../cbt/src/shared-types/types.ts:720-726` (AttemptDetailResponseItem)

- [ ] **Step 1: Add `five_areas_model` to `ModuleType` union**

In `../cbt/src/shared-types/types.ts`, change:

```typescript
export type ModuleType =
  | 'questionnaire'
  | 'reading'
  | 'activity_diary'
```

to:

```typescript
export type ModuleType =
  | 'questionnaire'
  | 'reading'
  | 'activity_diary'
  | 'five_areas_model'
```

- [ ] **Step 2: Add `FiveAreasData` type**

Add after the `ModuleType` definition (around line 115):

```typescript
export type FiveAreasData = {
  situation: string
  thoughts: string
  emotions: string
  behaviours: string
  physical: string
  reflection: string
}
```

- [ ] **Step 3: Add `fiveAreas` to `ModuleAttempt`**

In the `ModuleAttempt` type (around line 217, after `readerNote?: string`), add:

```typescript
  fiveAreas?: FiveAreasData
```

- [ ] **Step 4: Add `fiveAreas` to `SaveProgressInput`**

In the `SaveProgressInput` type (around line 318, after `userNote?: string`), add:

```typescript
  // five areas model
  fiveAreas?: Partial<FiveAreasData>
```

- [ ] **Step 5: Add `fiveAreas` to `AttemptDetailResponseItem`**

In the `AttemptDetailResponseItem` type (around line 723, after `diary?: DiaryDetail`), add:

```typescript
  fiveAreas?: FiveAreasData
```

- [ ] **Step 6: Publish shared types**

Run `npm run publish` in the `../cbt` directory to publish the updated shared-types package. Then run `npm run update-types` in the bwell directory to pick up the new version.

- [ ] **Step 7: Commit**

```
cd ../cbt
git add src/shared-types/types.ts
git commit -m "feat: add FiveAreasData type and five_areas_model module type"
```

---

### Task 2: Backend — Update Mongoose Models

**Files:**
- Modify: `../cbt/src/models/moduleModel.ts:7,21-25`
- Modify: `../cbt/src/models/moduleAttemptModel.ts:22-69,71-158`

- [ ] **Step 1: Add `five_areas_model` to Module model type**

In `../cbt/src/models/moduleModel.ts`, change line 7:

```typescript
  type: 'questionnaire' | 'reading' | 'activity_diary'
```

to:

```typescript
  type: 'questionnaire' | 'reading' | 'activity_diary' | 'five_areas_model'
```

And change lines 21-25 (the schema enum):

```typescript
    type: {
      type: String,
      enum: ['questionnaire', 'reading', 'activity_diary'],
      required: true,
    },
```

to:

```typescript
    type: {
      type: String,
      enum: ['questionnaire', 'reading', 'activity_diary', 'five_areas_model'],
      required: true,
    },
```

- [ ] **Step 2: Add `IFiveAreas` interface to ModuleAttempt model**

In `../cbt/src/models/moduleAttemptModel.ts`, add after the `IDiaryEntry` interface (after line 20):

```typescript
interface IFiveAreas {
  situation?: string
  thoughts?: string
  emotions?: string
  behaviours?: string
  physical?: string
  reflection?: string
}
```

- [ ] **Step 3: Update `IModuleAttempt` interface**

Change the `moduleType` union (lines 27-30):

```typescript
  moduleType:
    | 'questionnaire'
    | 'reading'
    | 'activity_diary'
    | 'five_areas_model'
```

Add after `diaryEntries?: IDiaryEntry[]` (after line 61):

```typescript
  // Five Areas Model
  fiveAreas?: IFiveAreas
```

- [ ] **Step 4: Update `ModuleAttemptSchema`**

Change the schema `moduleType` enum (line 94):

```typescript
      enum: ['questionnaire', 'reading', 'activity_diary', 'five_areas_model'],
```

Add after the `diaryEntries` schema block (after line 138):

```typescript
    // Five Areas Model
    fiveAreas: {
      situation: { type: String, trim: true, maxlength: 2000 },
      thoughts: { type: String, trim: true, maxlength: 2000 },
      emotions: { type: String, trim: true, maxlength: 2000 },
      behaviours: { type: String, trim: true, maxlength: 2000 },
      physical: { type: String, trim: true, maxlength: 2000 },
      reflection: { type: String, trim: true, maxlength: 2000 },
    },
```

- [ ] **Step 5: Commit**

```
cd ../cbt
git add src/models/moduleModel.ts src/models/moduleAttemptModel.ts
git commit -m "feat: add five_areas_model to Module and ModuleAttempt schemas"
```

---

### Task 3: Backend — Add saveProgress and submitAttempt branches

**Files:**
- Modify: `../cbt/src/controllers/attemptsController.ts:140-274` (saveProgress)
- Modify: `../cbt/src/controllers/attemptsController.ts:277+` (submitAttempt)

- [ ] **Step 1: Add `five_areas_model` branch in `saveProgress`**

In `../cbt/src/controllers/attemptsController.ts`, add a new branch after the reading branch (after line 179, before the diary branch):

```typescript
    if (attempt.moduleType === 'five_areas_model') {
      const { fiveAreas } = req.body as {
        fiveAreas?: Partial<{
          situation: string
          thoughts: string
          emotions: string
          behaviours: string
          physical: string
          reflection: string
        }>
      }

      if (fiveAreas) {
        const existing = attempt.fiveAreas?.toObject?.() ?? attempt.fiveAreas ?? {}
        attempt.fiveAreas = { ...existing, ...fiveAreas } as typeof attempt.fiveAreas
      }
      if (typeof userNote === 'string') attempt.userNote = userNote
      attempt.lastInteractionAt = new Date()
      await attempt.save()
      res.status(200).json({ success: true, attempt })
      return
    }
```

- [ ] **Step 2: Add `five_areas_model` branch in `submitAttempt`**

In `submitAttempt`, add a new branch after the reading branch (after line 434, before the questionnaire branch). This follows the same pattern as the diary/reading submit branches:

```typescript
    if (attempt.moduleType === 'five_areas_model') {
      attempt.completedAt = now
      attempt.lastInteractionAt = now
      attempt.status = 'submitted'
      attempt.durationSecs = attempt.startedAt
        ? Math.max(0, Math.floor((now.getTime() - attempt.startedAt.getTime()) / 1000))
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
        const completedAssignment = await ModuleAssignment.findById(assignmentId).lean()
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
              (completedAssignment as any).recurrenceGroupId ?? completedAssignment._id,
            notes: completedAssignment.notes,
          })
        }
      }

      res.status(200).json({ success: true, attempt })
      return
    }
```

- [ ] **Step 3: Verify the BE compiles**

Run `npx tsc --noEmit` in `../cbt`. Expected: no errors.

- [ ] **Step 4: Commit**

```
cd ../cbt
git add src/controllers/attemptsController.ts
git commit -m "feat: add five_areas_model branches in saveProgress and submitAttempt"
```

---

### Task 4: Backend — Seed 5 Areas Model module in Depression program

**Files:**
- Modify: `../cbt/src/seeds/seedAll.ts:141-157,345-355`

- [ ] **Step 1: Update `ModuleData` type**

In `../cbt/src/seeds/seedAll.ts`, change line 144:

```typescript
  type: 'questionnaire' | 'reading' | 'activity_diary'
```

to:

```typescript
  type: 'questionnaire' | 'reading' | 'activity_diary' | 'five_areas_model'
```

- [ ] **Step 2: Add 5 Areas Model module to Depression program**

After the Activity Diary module (after line 354, before the closing `]` of the Depression modules array), add:

```typescript
      {
        title: '5 Areas Model',
        description:
          'Map a situation where your mood dropped across five areas — thoughts, emotions, physical sensations, and behaviours — then reflect on how to break the cycle.',
        type: 'five_areas_model',
        accessPolicy: 'assigned',
        disclaimer:
          'This is a self-reflection tool and does not replace professional assessment. If you feel unsafe, seek immediate help.',
        imageUrl: 'https://placehold.co/600x400?text=5+Areas+Model',
      },
```

- [ ] **Step 3: Commit**

```
cd ../cbt
git add src/seeds/seedAll.ts
git commit -m "feat: seed 5 Areas Model module in Depression program"
```

---

### Task 5: Frontend — Update types, type guard, icon, and AttemptPresenter

**Files:**
- Modify: `types/types.ts:7-11`
- Modify: `utils/types.ts:1-18`
- Modify: `utils/moduleIcons.ts:6-10`
- Modify: `components/attempts/presenters/AttemptPresenter.tsx:1-43`

- [ ] **Step 1: Add `FIVE_AREAS_MODEL` to `ModuleType` enum**

In `types/types.ts`, change:

```typescript
enum ModuleType {
  QUESTIONNAIRE = 'questionnaire',
  READING = 'reading',
  ACTIVITY_DIARY = 'activity_diary'
}
```

to:

```typescript
enum ModuleType {
  QUESTIONNAIRE = 'questionnaire',
  READING = 'reading',
  ACTIVITY_DIARY = 'activity_diary',
  FIVE_AREAS_MODEL = 'five_areas_model'
}
```

- [ ] **Step 2: Add `isFiveAreasAttempt` type guard**

In `utils/types.ts`, add the import for `FiveAreasData` and the new type guard:

```typescript
import type { AttemptDetail, AttemptDetailResponseItem, DiaryDetail, FiveAreasData } from '@milobedini/shared-types';

export function isQuestionnaireAttempt(
  a: AttemptDetailResponseItem
): a is AttemptDetailResponseItem & { detail: AttemptDetail } {
  return a.moduleType === 'questionnaire' && !!a.detail;
}

export function isDiaryAttempt(a: AttemptDetailResponseItem): a is AttemptDetailResponseItem & { diary: DiaryDetail } {
  return a.moduleType === 'activity_diary' && !!a.diary;
}

export function isReadingAttempt(a: AttemptDetailResponseItem): a is AttemptDetailResponseItem & {
  moduleType: 'reading';
  moduleSnapshot: NonNullable<AttemptDetailResponseItem['moduleSnapshot']>;
} {
  return a.moduleType === 'reading' && !!a.moduleSnapshot;
}

export function isFiveAreasAttempt(
  a: AttemptDetailResponseItem
): a is AttemptDetailResponseItem & { fiveAreas?: FiveAreasData } {
  return a.moduleType === 'five_areas_model';
}
```

- [ ] **Step 3: Add icon for `five_areas_model`**

In `utils/moduleIcons.ts`, change:

```typescript
const MODULE_TYPE_ICONS: Record<string, MCIName> = {
  questionnaire: 'clipboard-text-outline',
  activity_diary: 'calendar-week',
  reading: 'book-open-outline'
};
```

to:

```typescript
const MODULE_TYPE_ICONS: Record<string, MCIName> = {
  questionnaire: 'clipboard-text-outline',
  activity_diary: 'calendar-week',
  reading: 'book-open-outline',
  five_areas_model: 'brain'
};
```

- [ ] **Step 4: Add `isFiveAreasAttempt` branch to `AttemptPresenter`**

Replace the full file `components/attempts/presenters/AttemptPresenter.tsx`:

```typescript
import { useRouter } from 'expo-router';
import Container from '@/components/Container';
import EmptyState from '@/components/ui/EmptyState';
import { isDiaryAttempt, isFiveAreasAttempt, isQuestionnaireAttempt, isReadingAttempt } from '@/utils/types';
import type { AttemptDetailResponseItem } from '@milobedini/shared-types';

import ActivityDiaryPresenter from './diary/ActivityDiaryPresenter';
import FiveAreasPresenter from './five-areas/FiveAreasPresenter';
import QuestionnairePresenter from './questionnaires/QuestionnairePresenter';
import ReadingPresenter from './reading/ReadingPresenter';

export type AttemptPresenterProps = {
  attempt: AttemptDetailResponseItem;
  mode: 'view' | 'edit';
  patientName?: string;
};

const AttemptPresenter = ({ attempt, mode, patientName }: AttemptPresenterProps) => {
  const router = useRouter();

  if (attempt.moduleType === 'questionnaire' && isQuestionnaireAttempt(attempt) && attempt.detail) {
    return <QuestionnairePresenter attempt={attempt} mode={mode} patientName={patientName} detail={attempt.detail} />;
  }

  if (attempt.moduleType === 'activity_diary' && isDiaryAttempt(attempt)) {
    return <ActivityDiaryPresenter attempt={attempt} mode={mode} patientName={patientName} />;
  }

  if (isReadingAttempt(attempt)) {
    return <ReadingPresenter attempt={attempt} mode={mode} patientName={patientName} />;
  }

  if (isFiveAreasAttempt(attempt)) {
    return <FiveAreasPresenter attempt={attempt} mode={mode} patientName={patientName} />;
  }

  return (
    <Container>
      <EmptyState
        icon="puzzle-outline"
        title="Not available yet"
        action={{ label: 'Go back', onPress: () => router.back() }}
      />
    </Container>
  );
};

export default AttemptPresenter;
```

- [ ] **Step 5: Commit**

```
git add types/types.ts utils/types.ts utils/moduleIcons.ts components/attempts/presenters/AttemptPresenter.tsx
git commit -m "feat: add five_areas_model type, guard, icon, and presenter routing"
```

---

### Task 6: Frontend — Create `useFiveAreasState` hook

**Files:**
- Create: `components/attempts/presenters/five-areas/useFiveAreasState.ts`

- [ ] **Step 1: Create the state hook**

Create `components/attempts/presenters/five-areas/useFiveAreasState.ts`:

```typescript
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { useSaveModuleAttempt, useSubmitAttempt } from '@/hooks/useAttempts';
import type { AttemptDetailResponseItem, FiveAreasData } from '@milobedini/shared-types';

export const AREA_KEYS = ['situation', 'thoughts', 'emotions', 'physical', 'behaviours', 'reflection'] as const;
export type AreaKey = (typeof AREA_KEYS)[number];

export const AREA_LABELS: Record<AreaKey, string> = {
  situation: 'Situation',
  thoughts: 'Thoughts',
  emotions: 'Emotions',
  physical: 'Physical Sensations',
  behaviours: 'Behaviours',
  reflection: 'Reflection',
};

export const AREA_HINTS: Record<AreaKey, string> = {
  situation: 'Who were you with? What happened? When and where?',
  thoughts: "Sentences about what went through your mind. e.g. 'They don't care about me', 'I'm useless'",
  emotions: 'Usually one word: sad, angry, anxious, guilty, hopeless, frustrated',
  physical: 'What you noticed in your body: heart racing, tension, low energy, stomach churning',
  behaviours: 'Actions you took: stayed in bed, snapped at them, withdrew, avoided a situation',
  reflection: 'Looking at the cycle above — how could you break it to improve your mood?',
};

type UseFiveAreasStateParams = {
  attempt: AttemptDetailResponseItem;
  mode: 'view' | 'edit';
};

export const useFiveAreasState = ({ attempt, mode }: UseFiveAreasStateParams) => {
  const router = useRouter();
  const { assignmentId } = useLocalSearchParams<{ assignmentId?: string }>();

  const canEdit = mode === 'edit' && attempt.status !== 'submitted';

  // API mutations
  const { mutateSilently: saveAttemptSilently, isPending: isSaving } = useSaveModuleAttempt(attempt._id);
  const { mutate: submitAttempt, isPending: isSubmitting } = useSubmitAttempt(attempt._id);

  // Local state
  const [fields, setFields] = useState<Partial<FiveAreasData>>({});
  const [dirtyKeys, setDirtyKeys] = useState<Set<AreaKey>>(new Set());
  const [currentStep, setCurrentStep] = useState(0);
  const [showReview, setShowReview] = useState(false);

  // Hydrate from server data on mount
  useEffect(() => {
    const serverData = attempt.fiveAreas;
    if (serverData) {
      setFields({ ...serverData });

      // Resume from first incomplete step if editing
      if (canEdit) {
        const firstEmpty = AREA_KEYS.findIndex((key) => !serverData[key]?.trim());
        setCurrentStep(firstEmpty === -1 ? AREA_KEYS.length - 1 : firstEmpty);
      }
    }
  }, [attempt._id]); // eslint-disable-line react-hooks/exhaustive-deps

  const hasDirtyChanges = dirtyKeys.size > 0;
  const currentKey = AREA_KEYS[currentStep];

  // Track which steps are completed
  const completedSteps = useMemo(
    () => new Set(AREA_KEYS.filter((key) => !!fields[key]?.trim())),
    [fields]
  );

  const allComplete = AREA_KEYS.every((key) => completedSteps.has(key));

  // Update a field value
  const updateField = useCallback((key: AreaKey, value: string) => {
    setFields((prev) => ({ ...prev, [key]: value }));
    setDirtyKeys((prev) => new Set(prev).add(key));
  }, []);

  // Build save payload from dirty keys only
  const buildPayload = useCallback(() => {
    const fiveAreas: Partial<FiveAreasData> = {};
    for (const key of dirtyKeys) {
      fiveAreas[key] = fields[key] ?? '';
    }
    return { fiveAreas };
  }, [dirtyKeys, fields]);

  // Silent save (no toast)
  const saveProgress = useCallback(() => {
    if (!hasDirtyChanges) return;
    const payload = buildPayload();
    saveAttemptSilently(payload, {
      onSuccess: () => {
        setDirtyKeys(new Set());
      },
    });
  }, [hasDirtyChanges, buildPayload, saveAttemptSilently]);

  // Navigate to next step (auto-save if dirty)
  const goForward = useCallback(() => {
    if (currentStep >= AREA_KEYS.length - 1) {
      // Last step — show review
      if (hasDirtyChanges) {
        const payload = buildPayload();
        saveAttemptSilently(payload, {
          onSuccess: () => {
            setDirtyKeys(new Set());
            setShowReview(true);
          },
        });
      } else {
        setShowReview(true);
      }
      return;
    }

    if (hasDirtyChanges) {
      const payload = buildPayload();
      saveAttemptSilently(payload, {
        onSuccess: () => {
          setDirtyKeys(new Set());
          setCurrentStep((s) => s + 1);
        },
      });
    } else {
      setCurrentStep((s) => s + 1);
    }
  }, [currentStep, hasDirtyChanges, buildPayload, saveAttemptSilently]);

  // Navigate to previous step
  const goBack = useCallback(() => {
    if (currentStep <= 0) return;
    if (hasDirtyChanges) {
      const payload = buildPayload();
      saveAttemptSilently(payload, {
        onSuccess: () => {
          setDirtyKeys(new Set());
          setCurrentStep((s) => s - 1);
        },
      });
    } else {
      setCurrentStep((s) => s - 1);
    }
  }, [currentStep, hasDirtyChanges, buildPayload, saveAttemptSilently]);

  // Jump to a specific step (only completed ones)
  const goToStep = useCallback(
    (step: number) => {
      if (step < 0 || step >= AREA_KEYS.length) return;
      const targetKey = AREA_KEYS[step];
      if (!completedSteps.has(targetKey) && step !== currentStep) return;

      Haptics.selectionAsync().catch(() => {});

      if (hasDirtyChanges) {
        const payload = buildPayload();
        saveAttemptSilently(payload, {
          onSuccess: () => {
            setDirtyKeys(new Set());
            setCurrentStep(step);
            setShowReview(false);
          },
        });
      } else {
        setCurrentStep(step);
        setShowReview(false);
      }
    },
    [completedSteps, currentStep, hasDirtyChanges, buildPayload, saveAttemptSilently]
  );

  // Submit the attempt
  const handleSubmit = useCallback(() => {
    const afterSave = () => {
      submitAttempt(assignmentId ? { assignmentId: String(assignmentId) } : {}, {
        onSuccess: () => {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
          router.back();
        },
      });
    };

    if (hasDirtyChanges) {
      const payload = buildPayload();
      saveAttemptSilently(payload, {
        onSuccess: () => {
          setDirtyKeys(new Set());
          afterSave();
        },
      });
    } else {
      afterSave();
    }
  }, [hasDirtyChanges, buildPayload, saveAttemptSilently, submitAttempt, assignmentId, router]);

  // Exit mid-flow (save and go back)
  const handleExit = useCallback(() => {
    if (hasDirtyChanges) {
      const payload = buildPayload();
      saveAttemptSilently(payload, {
        onSuccess: () => {
          setDirtyKeys(new Set());
          router.back();
        },
      });
    } else {
      router.back();
    }
  }, [hasDirtyChanges, buildPayload, saveAttemptSilently, router]);

  return {
    // State
    fields,
    currentStep,
    currentKey,
    showReview,
    completedSteps,
    allComplete,
    canEdit,
    isSaving,
    isSubmitting,
    hasDirtyChanges,

    // Actions
    updateField,
    saveProgress,
    goForward,
    goBack,
    goToStep,
    handleSubmit,
    handleExit,
  };
};
```

- [ ] **Step 2: Commit**

```
git add components/attempts/presenters/five-areas/useFiveAreasState.ts
git commit -m "feat: add useFiveAreasState hook for 5 Areas Model"
```

---

### Task 7: Frontend — Create `FiveAreasDiagram` (Skia)

**Files:**
- Create: `components/attempts/presenters/five-areas/FiveAreasDiagram.tsx`

- [ ] **Step 1: Create the hot cross bun diagram component**

Create `components/attempts/presenters/five-areas/FiveAreasDiagram.tsx`. This component renders the interactive hot cross bun diagram using `@shopify/react-native-skia`.

**Node layout (300x240 viewbox):**

```
        [Situation] (150, 28)
             |
   [Thoughts](80,90) --- [Emotions](220,90)
        \         /
         \       /
   [Physical](80,170) --- [Behaviours](220,170)
             |
        [Reflection] (150, 215)
```

**Key implementation details:**

- Import from `@shopify/react-native-skia`: `Canvas`, `Circle`, `Line`, `Paint`, `PaintStyle`, `Text as SkiaText`, `useFont`, `vec`
- Load fonts: `require('@/assets/fonts/Lato-Bold.ttf')` at 9px scaled, `require('@/assets/fonts/Lato-Regular.ttf')` at 7px scaled for snippets
- Scale all coordinates by `canvasWidth / 300` using `useWindowDimensions()`
- Cap canvas width at `Math.min(screenWidth - 32, 400)`

**Node states:**

| State | Fill | Stroke | Text color |
|-------|------|--------|-----------|
| `locked` | transparent | `Colors.chip.dotInactive` 2px | `Colors.chip.dotInactive` |
| `current` | `rgba(24,205,186,0.3)` | `Colors.sway.bright` 3px | `Colors.sway.lightGrey` |
| `completed` | `rgba(24,205,186,0.15)` | `Colors.sway.bright` 2px | `Colors.sway.bright` |

**Connection lines between core areas (indices 1-4):**
- `[1,2]` Thoughts-Emotions, `[1,3]` Thoughts-Physical, `[2,4]` Emotions-Behaviours, `[3,4]` Physical-Behaviours
- Diagonals: `[1,4]` Thoughts-Behaviours, `[2,3]` Emotions-Physical
- Both completed = solid teal, otherwise grey

**Arrow lines (vertical flow):**
- `[0, center of bun]` Situation down, `[center of bun, 5]` to Reflection

**Touch handling:**
- Wrap canvas in a `Pressable` or use Skia's `onTouch` — check which API the installed version supports
- On touch, find the nearest node within `radius + 12px` touch target
- Call `onNodePress(nodeIndex)` if the node is completed (the state hook handles the rest)

**Review mode (snippets):**
- When `snippets` prop is provided, show truncated text (max 12 chars + ellipsis) below the label in each node
- All nodes show as completed, all lines solid teal

**Important:** The exact Skia touch API may vary by version. The implementer should check the installed `@shopify/react-native-skia` version and use the appropriate touch handling approach (`onTouch`, `useTouchHandler`, or wrapping in `GestureDetector`). The core SVG drawing logic (circles, lines, text positioning) will work regardless.

Wrap the component in `memo` and set `displayName = 'FiveAreasDiagram'`.

- [ ] **Step 2: Commit**

```
git add components/attempts/presenters/five-areas/FiveAreasDiagram.tsx
git commit -m "feat: add FiveAreasDiagram hot cross bun component (Skia)"
```

---

### Task 8: Frontend — Create `AreaStep` component

**Files:**
- Create: `components/attempts/presenters/five-areas/AreaStep.tsx`

- [ ] **Step 1: Create the step view component**

Create `components/attempts/presenters/five-areas/AreaStep.tsx`:

```typescript
import { useCallback, useState } from 'react';
import { Pressable, TextInput, View } from 'react-native';
import MaterialCommunityIcons from '@react-native-vector-icons/material-design-icons';
import { ThemedText } from '@/components/ThemedText';
import { Colors } from '@/constants/Colors';
import { type AreaKey, AREA_HINTS, AREA_LABELS } from './useFiveAreasState';

type AreaStepProps = {
  areaKey: AreaKey;
  value: string;
  onChangeText: (value: string) => void;
  editable: boolean;
};

const AreaStep = ({ areaKey, value, onChangeText, editable }: AreaStepProps) => {
  const [hintVisible, setHintVisible] = useState(true);
  const label = AREA_LABELS[areaKey];
  const hint = AREA_HINTS[areaKey];
  const isReflection = areaKey === 'reflection';

  const toggleHint = useCallback(() => {
    setHintVisible((prev) => !prev);
  }, []);

  return (
    <View className="flex-1 px-4">
      {/* Label */}
      <View className="mb-2 flex-row items-center justify-between">
        <ThemedText
          type="subtitle"
          style={{ color: isReflection ? Colors.primary.info : Colors.sway.bright }}
        >
          {label}
        </ThemedText>

        {editable && (
          <Pressable onPress={toggleHint} hitSlop={12}>
            <MaterialCommunityIcons
              name={hintVisible ? 'lightbulb-on-outline' : 'lightbulb-outline'}
              size={20}
              color={Colors.sway.darkGrey}
            />
          </Pressable>
        )}
      </View>

      {/* Hint */}
      {hintVisible && editable && (
        <View
          className="mb-3 rounded-lg px-3 py-2"
          style={{ backgroundColor: Colors.chip.pill }}
        >
          <ThemedText type="small" style={{ color: Colors.sway.darkGrey }}>
            {hint}
          </ThemedText>
        </View>
      )}

      {/* Text input */}
      <TextInput
        className="flex-1 rounded-xl p-4"
        style={{
          backgroundColor: Colors.chip.darkCard,
          color: Colors.sway.lightGrey,
          fontFamily: 'Lato-Regular',
          fontSize: 16,
          textAlignVertical: 'top',
          minHeight: 120,
          borderWidth: 1,
          borderColor: Colors.chip.darkCardAlt,
        }}
        value={value}
        onChangeText={onChangeText}
        placeholder={AREA_HINTS[areaKey]}
        placeholderTextColor={Colors.sway.darkGrey}
        multiline
        editable={editable}
        scrollEnabled
      />
    </View>
  );
};

export default AreaStep;
```

- [ ] **Step 2: Commit**

```
git add components/attempts/presenters/five-areas/AreaStep.tsx
git commit -m "feat: add AreaStep component for 5 Areas Model input"
```

---

### Task 9: Frontend — Create `AreaReviewCard` component

**Files:**
- Create: `components/attempts/presenters/five-areas/AreaReviewCard.tsx`

- [ ] **Step 1: Create the review card component**

Create `components/attempts/presenters/five-areas/AreaReviewCard.tsx`:

```typescript
import { View } from 'react-native';
import { ThemedText } from '@/components/ThemedText';
import { Colors } from '@/constants/Colors';
import { type AreaKey, AREA_LABELS } from './useFiveAreasState';

type AreaReviewCardProps = {
  areaKey: AreaKey;
  value: string;
};

const AreaReviewCard = ({ areaKey, value }: AreaReviewCardProps) => {
  const isReflection = areaKey === 'reflection';

  return (
    <View
      className="mb-3 rounded-xl p-4"
      style={{
        backgroundColor: Colors.chip.darkCard,
        borderLeftWidth: 3,
        borderLeftColor: isReflection ? Colors.primary.info : Colors.sway.bright,
      }}
    >
      <ThemedText
        type="smallBold"
        style={{
          color: isReflection ? Colors.primary.info : Colors.sway.bright,
          marginBottom: 6,
        }}
      >
        {AREA_LABELS[areaKey]}
      </ThemedText>
      <ThemedText style={{ color: Colors.sway.lightGrey }}>
        {value || '—'}
      </ThemedText>
    </View>
  );
};

export default AreaReviewCard;
```

- [ ] **Step 2: Commit**

```
git add components/attempts/presenters/five-areas/AreaReviewCard.tsx
git commit -m "feat: add AreaReviewCard for 5 Areas Model review mode"
```

---

### Task 10: Frontend — Create `FiveAreasPresenter` (main component)

**Files:**
- Create: `components/attempts/presenters/five-areas/FiveAreasPresenter.tsx`

- [ ] **Step 1: Create the main presenter component**

Create `components/attempts/presenters/five-areas/FiveAreasPresenter.tsx`:

```typescript
import { ScrollView, View } from 'react-native';
import ContentContainer from '@/components/ContentContainer';
import ThemedButton from '@/components/ThemedButton';
import { ThemedText } from '@/components/ThemedText';
import { Colors } from '@/constants/Colors';
import type { AttemptDetailResponseItem } from '@milobedini/shared-types';

import AreaReviewCard from './AreaReviewCard';
import AreaStep from './AreaStep';
import FiveAreasDiagram from './FiveAreasDiagram';
import { AREA_KEYS, useFiveAreasState } from './useFiveAreasState';

type FiveAreasPresenterProps = {
  attempt: AttemptDetailResponseItem;
  mode: 'view' | 'edit';
  patientName?: string;
};

const FiveAreasPresenter = ({ attempt, mode, patientName }: FiveAreasPresenterProps) => {
  const state = useFiveAreasState({ attempt, mode });

  // ── Review mode (patient post-submit or therapist reviewing) ──
  if (!state.canEdit || state.showReview) {
    return (
      <ContentContainer>
        {/* Header */}
        {patientName && (
          <ThemedText type="small" style={{ color: Colors.sway.darkGrey, marginBottom: 4 }}>
            {patientName}'s entry
          </ThemedText>
        )}
        <ThemedText type="subtitle" style={{ marginBottom: 12 }}>
          5 Areas Model
        </ThemedText>

        {/* In-progress indicator for therapist */}
        {mode === 'view' && attempt.status !== 'submitted' && (
          <View
            className="mb-4 rounded-lg p-3"
            style={{ backgroundColor: Colors.tint.info, borderColor: Colors.primary.info, borderWidth: 1 }}
          >
            <ThemedText type="small" style={{ color: Colors.primary.info }}>
              This entry is still in progress.
            </ThemedText>
          </View>
        )}

        {/* Diagram with snippets */}
        <FiveAreasDiagram
          currentStep={state.currentStep}
          completedSteps={state.completedSteps}
          snippets={state.fields}
          mode="view"
          onNodePress={state.canEdit ? state.goToStep : undefined}
        />

        {/* Full text cards */}
        <ScrollView className="mt-4" contentContainerStyle={{ paddingBottom: 40 }}>
          {AREA_KEYS.map((key) => (
            <AreaReviewCard key={key} areaKey={key} value={state.fields[key] ?? ''} />
          ))}

          {/* User note */}
          {attempt.userNote && (
            <View className="mt-2">
              <ThemedText type="smallBold" style={{ marginBottom: 6 }}>
                Personal Note
              </ThemedText>
              <View className="rounded-xl p-4" style={{ backgroundColor: Colors.chip.darkCard }}>
                <ThemedText>{attempt.userNote}</ThemedText>
              </View>
            </View>
          )}

          {/* Submit button (only in review-before-submit) */}
          {state.canEdit && state.showReview && (
            <View className="mt-6">
              <ThemedButton
                title={state.isSubmitting ? 'Submitting...' : 'Submit'}
                onPress={state.handleSubmit}
                disabled={state.isSubmitting}
              />
            </View>
          )}
        </ScrollView>
      </ContentContainer>
    );
  }

  // ── Edit mode (stepped flow) ──
  return (
    <ContentContainer padded={false}>
      <View className="flex-1">
        {/* Diagram */}
        <View className="px-4 pt-2">
          <FiveAreasDiagram
            currentStep={state.currentStep}
            completedSteps={state.completedSteps}
            onNodePress={state.goToStep}
            mode="edit"
          />
        </View>

        {/* Step indicator */}
        <View className="px-4 pb-2 pt-1">
          <ThemedText type="small" style={{ color: Colors.sway.darkGrey, textAlign: 'center' }}>
            Step {state.currentStep + 1} of {AREA_KEYS.length}
          </ThemedText>
        </View>

        {/* Current area input */}
        <AreaStep
          areaKey={state.currentKey}
          value={state.fields[state.currentKey] ?? ''}
          onChangeText={(text) => state.updateField(state.currentKey, text)}
          editable
        />

        {/* Navigation buttons */}
        <View className="flex-row gap-3 px-4 pb-6 pt-4">
          {state.currentStep > 0 && (
            <View className="flex-1">
              <ThemedButton
                title="Back"
                onPress={state.goBack}
                variant="secondary"
                disabled={state.isSaving}
              />
            </View>
          )}
          <View className="flex-1">
            <ThemedButton
              title={
                state.currentStep === AREA_KEYS.length - 1
                  ? 'Review & Submit'
                  : 'Next'
              }
              onPress={state.goForward}
              disabled={state.isSaving || !state.fields[state.currentKey]?.trim()}
            />
          </View>
        </View>
      </View>
    </ContentContainer>
  );
};

export default FiveAreasPresenter;
```

- [ ] **Step 2: Verify the FE compiles**

Run `npx tsc --noEmit`. Expected: no errors (or only pre-existing ones).

- [ ] **Step 3: Run lint**

Run `npm run lint`. Fix any issues that arise.

- [ ] **Step 4: Commit**

```
git add components/attempts/presenters/five-areas/FiveAreasPresenter.tsx
git commit -m "feat: add FiveAreasPresenter with stepped edit and diagram-first review"
```

---

### Task 11: Integration — Verify end-to-end flow

- [ ] **Step 1: Re-seed the database**

Run `npm run seed` in `../cbt` to ensure the Depression program has the new 5 Areas Model module.

- [ ] **Step 2: Start the BE and FE**

Start the backend dev server in `../cbt` and the Expo dev server in `bwell`.

- [ ] **Step 3: Manual verification checklist**

Verify each of these in the running app:

1. **Therapist can assign** — Log in as therapist, navigate to a patient, assign the "5 Areas Model" module. Verify it appears in the patient's practice tab.
2. **Patient can start** — Log in as patient, find the assignment, start the attempt. Verify the stepped flow appears with the hot cross bun diagram.
3. **Stepped flow works** — Fill in Situation, tap Next. Verify auto-save (no toast), diagram updates (Situation node shows checkmark). Continue through all 6 steps.
4. **Helper hints** — Verify hints are visible by default. Tap the lightbulb icon to toggle. Verify hint text matches the spec.
5. **Back navigation** — Tap a completed node in the diagram. Verify it navigates back to that step with the saved text.
6. **Save and resume** — Fill in 3 steps, exit the app. Re-open the attempt. Verify progress is restored and you resume from step 4.
7. **Review before submit** — Complete all 6 steps, verify "Review & Submit" screen shows the diagram with snippets and all review cards.
8. **Submit** — Tap Submit. Verify success haptic, navigation back, attempt status is "submitted".
9. **Therapist review** — Log in as therapist, open the patient's timeline. Find the submitted 5 Areas attempt. Verify diagram-first view with full text cards. Verify patient name in header.

- [ ] **Step 4: Format and final commit**

Run `npx prettier --write .` then commit any formatting changes.
