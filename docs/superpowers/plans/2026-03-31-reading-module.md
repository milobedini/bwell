# Reading Module Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace `psychoeducation` and `exercise` module types with a single `reading` type that renders markdown content with an optional reader note and scroll progress indicator.

**Architecture:** BE changes first (shared types, models, controllers, seeds), then FE (cleanup old types, build ReadingPresenter, wire into AttemptPresenter). The reading module stores markdown in a `content` field on the Module model, and `readerNote` on the ModuleAttempt. The FE renders markdown with a scroll progress bar and a note input.

**Tech Stack:** Node/Express + Mongoose (BE), React Native + Expo (FE), `react-native-markdown-display` (FE markdown renderer), NativeWind/Tailwind (styling)

---

## File Structure

### BE (`../cbt/`)

| Action | File | Responsibility |
|--------|------|---------------|
| Modify | `src/shared-types/types.ts` | Update `ModuleType` union, add `content` to `Module`, `readerNote` to `ModuleAttempt`/`SubmitAttemptInput`/`SaveProgressInput`, update `TherapistLatestRow`, update `ModuleSnapshot` |
| Modify | `src/models/moduleModel.ts` | Add `content` field, update type enum |
| Modify | `src/models/moduleAttemptModel.ts` | Add `readerNote` field, update moduleType enum |
| Modify | `src/controllers/moduleController.ts` | Update type enum in `createModule` validation |
| Modify | `src/controllers/attemptsController.ts` | Handle `reading` type in `submitAttempt` and `saveProgress` |
| Modify | `src/utils/attemptUtils.ts` | Include `content` in `makeModuleSnapshot` |
| Modify | `src/seeds/seedAll.ts` | Update seed data types and add sample markdown content |

### FE (`./`)

| Action | File | Responsibility |
|--------|------|---------------|
| Modify | `types/types.ts` | Replace enum members with `READING` |
| Modify | `utils/types.ts` | Add `isReadingAttempt` type guard |
| Create | `components/attempts/presenters/reading/ReadingPresenter.tsx` | Main reading presenter component |
| Create | `components/attempts/presenters/reading/ReadingProgressBar.tsx` | Scroll progress indicator |
| Modify | `components/attempts/presenters/AttemptPresenter.tsx` | Route `reading` type to ReadingPresenter |
| Modify | `components/attempts/TherapistLatestAttempts.tsx` | Update `MODULE_TYPE_ICONS` |
| Modify | `components/assignments/AssignmentCard.tsx` | Update `MODULE_TYPE_ICONS` |
| Modify | `hooks/useAttempts.ts` | Update `useSubmitAttempt` to pass `readerNote` |

---

### Task 1: Update Shared Types

**Files:**

- Modify: `../cbt/src/shared-types/types.ts`

- [ ] **Step 1: Update `ModuleType` union**

In `../cbt/src/shared-types/types.ts`, replace lines 106-110:

```typescript
export type ModuleType =
  | 'questionnaire'
  | 'reading'
  | 'activity_diary'
```

- [ ] **Step 2: Add `content` to `Module` type**

In `../cbt/src/shared-types/types.ts`, replace lines 112-123:

```typescript
export type Module = {
  _id: string
  title: string
  description: string
  program: ProgramRef // populated in detail route
  type: ModuleType
  disclaimer?: string
  imageUrl?: string
  content?: string // markdown body for reading modules
  createdAt: string
  updatedAt: string
  accessPolicy: 'open' | 'assigned'
}
```

- [ ] **Step 3: Add `content` to `ModuleSnapshot` type**

In `../cbt/src/shared-types/types.ts`, replace lines 174-178:

```typescript
export type ModuleSnapshot = {
  title: string
  disclaimer?: string
  content?: string // preserved for reading modules
  questions?: ModuleSnapshotQuestion[]
}
```

- [ ] **Step 4: Add `readerNote` to `ModuleAttempt` type**

In `../cbt/src/shared-types/types.ts`, add `readerNote?: string` after the `therapistNote?: string` field (around line 210):

```typescript
  userNote?: string
  therapistNote?: string
  readerNote?: string
```

- [ ] **Step 5: Add `readerNote` to `SubmitAttemptInput`**

In `../cbt/src/shared-types/types.ts`, replace line 309:

```typescript
export type SubmitAttemptInput = { assignmentId?: string; readerNote?: string }
```

- [ ] **Step 6: Add `readerNote` to `SaveProgressInput`**

In `../cbt/src/shared-types/types.ts`, replace lines 298-306:

```typescript
export type SaveProgressInput = {
  // questionnaire
  answers?: AttemptAnswer[]
  // diary
  diaryEntries?: DiaryEntryInput[]
  merge?: boolean
  // reading
  readerNote?: string
  // common
  userNote?: string
}
```

- [ ] **Step 7: Update `TherapistLatestRow` moduleType**

In `../cbt/src/shared-types/types.ts`, replace line 344:

```typescript
  moduleType?: ModuleType
```

- [ ] **Step 8: Publish shared types**

Run: `cd ../cbt && npm run publish`

- [ ] **Step 9: Commit**

Run: `cd ../cbt && git add src/shared-types/types.ts && git commit -m "feat(types): replace psychoeducation/exercise with reading module type"`

---

### Task 2: Update BE Module Model

**Files:**

- Modify: `../cbt/src/models/moduleModel.ts`

- [ ] **Step 1: Update the IModule interface**

In `../cbt/src/models/moduleModel.ts`, replace lines 3-13:

```typescript
type IModule = Document & {
  title: string
  description: string
  program: Types.ObjectId
  type: 'questionnaire' | 'reading' | 'activity_diary'
  createdAt: Date
  updatedAt: Date
  disclaimer?: string
  imageUrl?: string
  content?: string
  accessPolicy: 'open' | 'assigned'
}
```

- [ ] **Step 2: Update the schema**

In `../cbt/src/models/moduleModel.ts`, replace lines 15-34:

```typescript
const moduleSchema = new mongoose.Schema<IModule>(
  {
    title: { type: String, required: true, trim: true, maxlength: 100 },
    description: { type: String, required: true, trim: true, maxlength: 500 },
    program: { type: Schema.Types.ObjectId, ref: 'Program', required: true },
    type: {
      type: String,
      enum: ['questionnaire', 'reading', 'activity_diary'],
      required: true,
    },
    disclaimer: String,
    imageUrl: String,
    content: String,
    accessPolicy: {
      type: String,
      enum: ['open', 'assigned'],
      default: 'assigned',
    },
  },
  { timestamps: true, collection: 'modules' }
)
```

- [ ] **Step 3: Commit**

Run: `cd ../cbt && git add src/models/moduleModel.ts && git commit -m "feat(module): add content field and replace type enum with reading"`

---

### Task 3: Update BE ModuleAttempt Model

**Files:**

- Modify: `../cbt/src/models/moduleAttemptModel.ts`

- [ ] **Step 1: Add `readerNote` to the IModuleAttempt interface**

In `../cbt/src/models/moduleAttemptModel.ts`, find the line with `therapistNote?: string` in the interface and add after it:

```typescript
  readerNote?: string
```

- [ ] **Step 2: Update the moduleType enum in the interface**

In `../cbt/src/models/moduleAttemptModel.ts`, replace the `moduleType` line in the interface:

```typescript
  moduleType: 'questionnaire' | 'reading' | 'activity_diary'
```

- [ ] **Step 3: Update the moduleType enum in the schema**

Find the `moduleType` field in the schema definition and replace its enum:

```typescript
    moduleType: {
      type: String,
      enum: ['questionnaire', 'reading', 'activity_diary'],
      required: true,
    },
```

- [ ] **Step 4: Add `readerNote` to the schema**

Add after the `therapistNote` field in the schema:

```typescript
    readerNote: String,
```

- [ ] **Step 5: Commit**

Run: `cd ../cbt && git add src/models/moduleAttemptModel.ts && git commit -m "feat(attempt): add readerNote field and update moduleType enum"`

---

### Task 4: Update BE Snapshot Utility

**Files:**

- Modify: `../cbt/src/utils/attemptUtils.ts`

- [ ] **Step 1: Include `content` in `makeModuleSnapshot`**

In `../cbt/src/utils/attemptUtils.ts`, update line 46 to include `content` in the select:

```typescript
  const mod = await Module.findById(moduleId, 'title disclaimer type program content')
```

Then update the return object (lines 52-62) to include `content`:

```typescript
  return {
    title: mod.title,
    disclaimer: mod.disclaimer,
    content: mod.content,
    questions:
      questions?.map((q) => ({
        _id: q._id,
        text: q.text,
        choices:
          q.choices?.map((c) => ({ text: c.text, score: c.score })) || [],
      })) || [],
  }
```

- [ ] **Step 2: Commit**

Run: `cd ../cbt && git add src/utils/attemptUtils.ts && git commit -m "feat(snapshot): include content field in module snapshot"`

---

### Task 5: Update BE Controllers

**Files:**

- Modify: `../cbt/src/controllers/moduleController.ts`
- Modify: `../cbt/src/controllers/attemptsController.ts`

- [ ] **Step 1: Update `createModule` type validation**

In `../cbt/src/controllers/moduleController.ts`, find the allowed types array in `createModule` (around line 150) and replace:

```typescript
const ALLOWED_TYPES = ['questionnaire', 'reading', 'activity_diary']
```

Also update the field destructuring to include `content`:

```typescript
    const { title, description, program, type, disclaimer, imageUrl, accessPolicy, content } = req.body
```

When creating the module, include `content`:

```typescript
    const mod = await Module.create({
      title: title.trim(),
      description: description.trim(),
      program,
      type,
      disclaimer,
      imageUrl,
      content,
      accessPolicy: accessPolicy || 'assigned',
    })
```

- [ ] **Step 2: Add `reading` branch to `submitAttempt`**

In `../cbt/src/controllers/attemptsController.ts`, add a reading branch after the `activity_diary` branch (after line 309, before the questionnaire check at line 311):

```typescript
    if (attempt.moduleType === 'reading') {
      const { readerNote } = (req.body as { readerNote?: string; assignmentId?: string }) || {}
      if (readerNote) attempt.readerNote = readerNote

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
        }).exec()
      }

      res.status(200).json({ success: true, attempt })
      return
    }
```

- [ ] **Step 3: Add `readerNote` handling to `saveProgress`**

In `../cbt/src/controllers/attemptsController.ts`, in the `saveProgress` function, add a branch for reading type before the existing type-specific branches:

```typescript
    if (attempt.moduleType === 'reading') {
      const { readerNote } = req.body as { readerNote?: string }
      if (readerNote !== undefined) attempt.readerNote = readerNote
      attempt.lastInteractionAt = new Date()
      await attempt.save()
      res.status(200).json({ success: true, attempt })
      return
    }
```

- [ ] **Step 4: Commit**

Run: `cd ../cbt && git add src/controllers/moduleController.ts src/controllers/attemptsController.ts && git commit -m "feat(controllers): handle reading module type in create, submit, and save"`

---

### Task 6: Update Seed Data

**Files:**

- Modify: `../cbt/src/seeds/seedAll.ts`

- [ ] **Step 1: Update the ModuleData interface**

In `../cbt/src/seeds/seedAll.ts`, update the type field in the `ModuleData` interface (around line 144):

```typescript
  type: 'questionnaire' | 'reading' | 'activity_diary'
```

Add `content` to the interface:

```typescript
  content?: string
```

- [ ] **Step 2: Update the Values Clarification module**

Replace the Values Clarification seed (around lines 391-400):

```typescript
{
  title: 'Values Clarification',
  description:
    'Identify your core values across life domains and define small next actions.',
  type: 'reading',
  accessPolicy: 'assigned',
  disclaimer:
    'Coaching-style exercise. Not a substitute for therapy or crisis care.',
  imageUrl: 'https://placehold.co/600x400?text=Values+Clarification',
  content: `## What Are Values?

Values are the things that matter most to you — the principles and qualities you want to guide your life. They are different from goals: goals can be achieved, but values are ongoing directions.

### Why Values Matter in Therapy

When we feel low or anxious, we often lose touch with what matters to us. Reconnecting with your values can help you make choices that improve your wellbeing.

### Life Domains to Consider

Think about what matters to you in each of these areas:

- **Relationships** — What kind of partner, friend, or family member do you want to be?
- **Work & Education** — What matters to you about how you spend your working time?
- **Leisure & Fun** — What activities bring you genuine enjoyment?
- **Health & Wellbeing** — How do you want to care for your body and mind?
- **Community** — How do you want to contribute to the world around you?

### Next Steps

For each domain, write down one small action you could take this week that moves you closer to living by your values. It does not need to be big — small steps count.`,
},
```

- [ ] **Step 3: Update the Sleep Hygiene Basics module**

Replace the Sleep Hygiene Basics seed (around lines 407-414):

```typescript
{
  title: 'Sleep Hygiene Basics',
  description:
    'Learn practical sleep hygiene tips and when to seek further support.',
  type: 'reading',
  accessPolicy: 'open',
  imageUrl: 'https://placehold.co/600x400?text=Sleep+Hygiene+Basics',
  content: `## Why Sleep Matters

Sleep has a powerful effect on mood, concentration, and physical health. When we are not sleeping well, everything feels harder.

### Common Sleep Disruptors

- **Screens before bed** — Blue light from phones and laptops suppresses melatonin production
- **Caffeine after midday** — Caffeine has a half-life of 5-6 hours and can disrupt sleep even if you feel tired
- **Irregular schedule** — Going to bed and waking at different times confuses your body clock
- **Worrying in bed** — The bed becomes associated with stress rather than rest

### Practical Tips

1. **Set a consistent wake time** — even on weekends. This is more important than bedtime.
2. **Create a wind-down routine** — 30-60 minutes before bed, do something calm (reading, stretching, a warm drink).
3. **Keep the bedroom cool and dark** — your body temperature needs to drop to fall asleep.
4. **If you cannot sleep after 20 minutes, get up** — go to another room, do something boring, and return when sleepy.
5. **Limit naps** — if you must nap, keep it under 20 minutes before 3pm.

### When to Seek Help

If sleep problems persist for more than a few weeks and affect your daily life, speak to your therapist or GP. There are effective treatments for insomnia that do not involve medication.`,
},
```

- [ ] **Step 4: Include `content` in the upsert**

In the `seedContent` function, find where modules are upserted with `findOneAndUpdate` (around line 443) and ensure `content` is included in the update object:

```typescript
      const mod = await Module.findOneAndUpdate(
        { title: m.title, program: prog._id },
        {
          title: m.title,
          description: m.description,
          program: prog._id,
          type: m.type,
          accessPolicy: m.accessPolicy ?? 'assigned',
          disclaimer: m.disclaimer,
          imageUrl: m.imageUrl,
          content: m.content,
        },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      )
```

- [ ] **Step 5: Commit**

Run: `cd ../cbt && git add src/seeds/seedAll.ts && git commit -m "feat(seeds): update module seeds with reading type and markdown content"`

---

### Task 7: Install Markdown Renderer on FE

**Files:**

- Modify: `package.json`

- [ ] **Step 1: Install react-native-markdown-display**

Run: `npm install react-native-markdown-display`

- [ ] **Step 2: Update shared types**

Run: `npm run update-types`

- [ ] **Step 3: Commit**

Run: `git add package.json package-lock.json && git commit -m "chore: add react-native-markdown-display and update shared types"`

---

### Task 8: Update FE Types and Type Guards

**Files:**

- Modify: `types/types.ts`
- Modify: `utils/types.ts`

- [ ] **Step 1: Update the ModuleType enum**

In `types/types.ts`, replace the ModuleType enum (lines 7-11):

```typescript
enum ModuleType {
  QUESTIONNAIRE = 'questionnaire',
  READING = 'reading',
}
```

Note: `activity_diary` is not in this enum (it's only in the shared types union). Only values actively used in FE logic belong here.

- [ ] **Step 2: Add `isReadingAttempt` type guard**

In `utils/types.ts`, add after the existing type guards:

```typescript
export const isReadingAttempt = (
  a: AttemptDetailResponseItem
): boolean => {
  return a.moduleType === 'reading';
};
```

- [ ] **Step 3: Commit**

Run: `git add types/types.ts utils/types.ts && git commit -m "feat(types): replace psychoeducation/exercise with reading in FE types"`

---

### Task 9: Update FE Icon Mappings and AttemptPresenter Routing

**Files:**

- Modify: `components/attempts/TherapistLatestAttempts.tsx`
- Modify: `components/assignments/AssignmentCard.tsx`
- Modify: `components/attempts/presenters/AttemptPresenter.tsx`

- [ ] **Step 1: Update `MODULE_TYPE_ICONS` in TherapistLatestAttempts**

In `components/attempts/TherapistLatestAttempts.tsx`, replace the MODULE_TYPE_ICONS record (lines 35-40):

```typescript
const MODULE_TYPE_ICONS: Record<string, MCIName> = {
  questionnaire: 'clipboard-text-outline',
  activity_diary: 'calendar-week',
  reading: 'book-open-outline',
};
```

- [ ] **Step 2: Update `MODULE_TYPE_ICONS` in AssignmentCard**

In `components/assignments/AssignmentCard.tsx`, replace the MODULE_TYPE_ICONS record (lines 14-19):

```typescript
const MODULE_TYPE_ICONS: Record<string, MCIName> = {
  questionnaire: 'clipboard-text-outline',
  activity_diary: 'calendar-week',
  reading: 'book-open-outline',
};
```

- [ ] **Step 3: Update AttemptPresenter to route reading type**

In `components/attempts/presenters/AttemptPresenter.tsx`, replace the entire file:

```typescript
import { useRouter } from 'expo-router';
import Container from '@/components/Container';
import EmptyState from '@/components/ui/EmptyState';
import { isDiaryAttempt, isQuestionnaireAttempt, isReadingAttempt } from '@/utils/types';
import { AttemptDetailResponseItem } from '@milobedini/shared-types';

import ActivityDiaryPresenter from './diary/ActivityDiaryPresenter';
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

- [ ] **Step 4: Commit**

Run: `git add components/attempts/TherapistLatestAttempts.tsx components/assignments/AssignmentCard.tsx components/attempts/presenters/AttemptPresenter.tsx && git commit -m "feat(presenter): route reading module type to ReadingPresenter"`

---

### Task 10: Build ReadingProgressBar Component

**Files:**

- Create: `components/attempts/presenters/reading/ReadingProgressBar.tsx`

- [ ] **Step 1: Create the progress bar component**

Create `components/attempts/presenters/reading/ReadingProgressBar.tsx`:

```typescript
import { View } from 'react-native';
import Animated, { useAnimatedStyle, SharedValue } from 'react-native-reanimated';
import { Colors } from '@/constants/Colors';

type ReadingProgressBarProps = {
  progress: SharedValue<number>; // 0 to 1
};

const ReadingProgressBar = ({ progress }: ReadingProgressBarProps) => {
  const animatedStyle = useAnimatedStyle(() => ({
    width: `${Math.min(progress.value * 100, 100)}%`,
  }));

  return (
    <View className="h-[3px] w-full" style={{ backgroundColor: Colors.chip.darkCard }}>
      <Animated.View
        className="h-full rounded-r-full"
        style={[{ backgroundColor: Colors.sway.bright }, animatedStyle]}
      />
    </View>
  );
};

export default ReadingProgressBar;
```

- [ ] **Step 2: Commit**

Run: `git add components/attempts/presenters/reading/ReadingProgressBar.tsx && git commit -m "feat(reading): add scroll progress bar component"`

---

### Task 11: Build ReadingPresenter Component

**Files:**

- Create: `components/attempts/presenters/reading/ReadingPresenter.tsx`

- [ ] **Step 1: Verify shared types flow through**

The `useSubmitAttempt` hook in `hooks/useAttempts.ts` uses `SubmitAttemptInput` from shared types, which now includes `readerNote`. No code change needed in the hook — the type update flows through automatically. Verify by reading the hook and confirming it imports `SubmitAttemptInput` from `@milobedini/shared-types`.

- [ ] **Step 2: Create ReadingPresenter**

Create `components/attempts/presenters/reading/ReadingPresenter.tsx`:

```typescript
import { useCallback, useRef, useState } from 'react';
import { NativeScrollEvent, NativeSyntheticEvent, ScrollView, TextInput, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useSharedValue } from 'react-native-reanimated';
import Markdown from 'react-native-markdown-display';
import { AttemptDetailResponseItem } from '@milobedini/shared-types';

import Container from '@/components/Container';
import { ThemedText } from '@/components/ThemedText';
import { ThemedButton } from '@/components/ThemedButton';
import { useSubmitAttempt } from '@/hooks/useAttempts';
import { Colors } from '@/constants/Colors';
import ReadingProgressBar from './ReadingProgressBar';

type ReadingPresenterProps = {
  attempt: AttemptDetailResponseItem;
  mode: 'view' | 'edit';
  patientName?: string;
};

const markdownStyles = {
  body: {
    color: Colors.sway.lightGrey,
    fontFamily: 'Lato-Regular',
    fontSize: 18,
    lineHeight: 28,
  },
  heading2: {
    color: Colors.sway.lightGrey,
    fontFamily: 'Lato-Black',
    fontSize: 24,
    marginTop: 24,
    marginBottom: 8,
  },
  heading3: {
    color: Colors.sway.lightGrey,
    fontFamily: 'Lato-Black',
    fontSize: 20,
    marginTop: 20,
    marginBottom: 6,
  },
  paragraph: {
    marginBottom: 12,
  },
  bullet_list: {
    marginBottom: 12,
  },
  ordered_list: {
    marginBottom: 12,
  },
  list_item: {
    marginBottom: 4,
  },
  strong: {
    fontFamily: 'Lato-Bold',
  },
  em: {
    fontFamily: 'Lato-Italic',
  },
  image: {
    borderRadius: 8,
  },
  link: {
    color: Colors.sway.bright,
  },
  blockquote: {
    backgroundColor: Colors.chip.darkCard,
    borderLeftColor: Colors.sway.bright,
    borderLeftWidth: 3,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 4,
    marginBottom: 12,
  },
  hr: {
    backgroundColor: Colors.chip.darkCardAlt,
    height: 1,
    marginVertical: 16,
  },
};

const ReadingPresenter = ({ attempt, mode, patientName }: ReadingPresenterProps) => {
  const router = useRouter();
  const scrollRef = useRef<ScrollView>(null);
  const progress = useSharedValue(0);
  const [readerNote, setReaderNote] = useState(attempt.readerNote ?? '');
  const submitMutation = useSubmitAttempt(attempt._id);

  const content = attempt.moduleSnapshot?.content ?? '';

  const handleScroll = useCallback(
    (e: NativeSyntheticEvent<NativeScrollEvent>) => {
      const { contentOffset, contentSize, layoutMeasurement } = e.nativeEvent;
      const scrollableHeight = contentSize.height - layoutMeasurement.height;
      progress.value = scrollableHeight > 0 ? contentOffset.y / scrollableHeight : 1;
    },
    [progress]
  );

  const handleSubmit = () => {
    submitMutation.mutate(
      { readerNote: readerNote.trim() || undefined },
      { onSuccess: () => router.back() }
    );
  };

  const isEdit = mode === 'edit';

  return (
    <Container>
      {isEdit && <ReadingProgressBar progress={progress} />}

      <ScrollView
        ref={scrollRef}
        className="flex-1 px-4"
        onScroll={handleScroll}
        scrollEventThrottle={16}
        contentContainerStyle={{ paddingBottom: 40 }}
      >
        {patientName && (
          <ThemedText type="small" style={{ color: Colors.sway.darkGrey, marginBottom: 4 }}>
            {patientName}
          </ThemedText>
        )}

        <ThemedText type="title" style={{ marginBottom: 16 }}>
          {attempt.moduleSnapshot?.title ?? attempt.module?.title ?? 'Reading'}
        </ThemedText>

        {attempt.moduleSnapshot?.disclaimer && (
          <View
            className="rounded-lg p-3 mb-4"
            style={{ backgroundColor: Colors.tint.info, borderColor: Colors.primary.info, borderWidth: 1 }}
          >
            <ThemedText type="small" style={{ color: Colors.primary.info }}>
              {attempt.moduleSnapshot.disclaimer}
            </ThemedText>
          </View>
        )}

        {content ? (
          <Markdown style={markdownStyles}>{content}</Markdown>
        ) : (
          <ThemedText style={{ color: Colors.sway.darkGrey }}>No content available.</ThemedText>
        )}

        {/* Reader note section */}
        {isEdit && (
          <View className="mt-6">
            <ThemedText type="smallBold" style={{ marginBottom: 8 }}>
              Personal Note
            </ThemedText>
            <TextInput
              className="rounded-lg p-4"
              style={{
                backgroundColor: Colors.chip.darkCard,
                color: Colors.sway.lightGrey,
                fontFamily: 'Lato-Regular',
                fontSize: 16,
                minHeight: 100,
                textAlignVertical: 'top',
              }}
              value={readerNote}
              onChangeText={setReaderNote}
              placeholder="Add a personal note or reflection..."
              placeholderTextColor={Colors.sway.darkGrey}
              multiline
            />
          </View>
        )}

        {!isEdit && attempt.readerNote && (
          <View className="mt-6">
            <ThemedText type="smallBold" style={{ marginBottom: 8 }}>
              {patientName ? `${patientName}'s Note` : 'Personal Note'}
            </ThemedText>
            <View className="rounded-lg p-4" style={{ backgroundColor: Colors.chip.darkCard }}>
              <ThemedText>{attempt.readerNote}</ThemedText>
            </View>
          </View>
        )}

        {isEdit && (
          <View className="mt-6">
            <ThemedButton
              title="Mark as Complete"
              onPress={handleSubmit}
              loading={submitMutation.isPending}
              disabled={submitMutation.isPending}
            />
          </View>
        )}
      </ScrollView>
    </Container>
  );
};

export default ReadingPresenter;
```

- [ ] **Step 3: Commit**

Run: `git add components/attempts/presenters/reading/ReadingPresenter.tsx && git commit -m "feat(reading): build ReadingPresenter with markdown rendering and reader note"`

---

### Task 12: Update Module Detail View

**Files:**

- Modify: `app/(main)/(tabs)/programs/[id]/modules/[moduleId]/index.tsx`

- [ ] **Step 1: Check and update module type references**

Read `app/(main)/(tabs)/programs/[id]/modules/[moduleId]/index.tsx` and update any references to `ModuleType.PSYCHO_EDUCATION` or `ModuleType.EXERCISE` to `ModuleType.READING`. If the view only uses `ModuleType.QUESTIONNAIRE` currently, no changes may be needed beyond verifying the import still works with the updated enum.

- [ ] **Step 2: Commit if changes were made**

Run: `git add app/(main)/(tabs)/programs/[id]/modules/[moduleId]/index.tsx && git commit -m "refactor(module-detail): update module type references to reading"`

---

### Task 13: Validate and Format

- [ ] **Step 1: Run eslint fix**

Run: `npx eslint --fix .`

- [ ] **Step 2: Run prettier**

Run: `npx prettier --write .`

- [ ] **Step 3: Run full lint validation**

Run: `npm run lint`

Fix any errors that come up. Common issues:

- Unused imports from removed types
- TypeScript errors from the enum changes

- [ ] **Step 4: Commit any fixes**

Run: `git add -A && git commit -m "chore: fix lint and formatting after reading module changes"`

---

### Task 14: Manual Testing

- [ ] **Step 1: Re-seed the database**

Run: `cd ../cbt && npm run seed-all`

Verify the seed output shows the updated module types:

```
Module: Values Clarification (reading, assigned) — 0q, 0b
Module: Sleep Hygiene Basics (reading, open) — 0q, 0b
```

- [ ] **Step 2: Start the BE dev server**

Run: `cd ../cbt && npm run dev`

- [ ] **Step 3: Start the FE dev server**

Run: `npx expo start`

- [ ] **Step 4: Test the reading flow**

1. Log in as a therapist, assign a reading module to a patient
2. Log in as the patient, open the assigned reading
3. Verify: scroll progress bar appears and fills as you scroll
4. Verify: markdown renders with correct fonts, colours, spacing
5. Add a personal note, tap "Mark as Complete"
6. Verify: redirects back, attempt shows as completed
7. Log in as therapist, view the completed attempt
8. Verify: content displays in read-only mode, reader note is visible, no progress bar
