# Activity Diary Enhancements Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add 5 frontend-only enhancements to the Activity Diary presenter: reflection prompts, editable user note, day chip fill indicators, collapsible weekly summary, and slot mood tinting.

**Architecture:** All changes are confined to the diary presenter directory and utility helpers. No backend changes. New colour constants go in `Colors.ts`. Three new components are extracted from the presenter. The presenter's state gains two new fields (`userNoteText`, `noteDirty`) and the `saveDirty` function is extended to include the user note. The `WeeklySummary` component manages its own collapse state internally.

**Tech Stack:** React Native, TypeScript, react-native-paper, LayoutAnimation, NativeWind, @milobedini/shared-types

**Spec:** `docs/superpowers/specs/2026-03-18-activity-diary-enhancements-design.md`

---

## File Structure

### Files to create

| File | Responsibility |
| --- | --- |
| `components/attempts/presenters/diary/ReflectionPrompt.tsx` | Stateless prompt card with left-border accent |
| `components/attempts/presenters/diary/WeeklySummary.tsx` | Collapsible 2x2 averages card using LayoutAnimation |
| `components/attempts/presenters/diary/DayChip.tsx` | Day chip with 9 fill-indicator dots |

### Files to modify

| File | Changes |
| --- | --- |
| `constants/Colors.ts` | Add `diary` colour group (mood warm, mood cool, closeness, enjoyment, promptBg, promptBorder) |
| `utils/activityHelpers.ts` | Add `REFLECTION_PROMPTS` array, `moodColor()` helper, `isSlotFilled()` helper |
| `components/attempts/presenters/diary/ActivityDiaryPresenter.tsx` | Integrate all 5 enhancements: import new components, add state for note/summary toggle, extend `saveDirty`, replace inline day chips with `DayChip`, add mood tint to slot cards |

---

## Task 1: Add colour constants and utility helpers

**Files:**
- Modify: `constants/Colors.ts`
- Modify: `utils/activityHelpers.ts`

- [ ] **Step 1: Add diary colour constants to Colors.ts**

Add a `diary` group to the `Colors` object in `constants/Colors.ts` after the `gradient` group:

```typescript
diary: {
  moodWarm: '#f4a261',
  moodCool: '#5b8def',
  closeness: '#e76f9a',
  enjoyment: '#a78bfa',
  promptBg: '#1a3a4a',
  promptBorder: '#1a2a3a'
}
```

- [ ] **Step 2: Add reflection prompts array to activityHelpers.ts**

Add at the top of `utils/activityHelpers.ts`, after the existing imports:

```typescript
export const REFLECTION_PROMPTS = [
  'Try to notice which activities lifted your mood — even small things count.',
  'Rate achievement based on effort, not outcome — doing something difficult counts even if it didn\'t go perfectly.',
  'Closeness includes any feeling of connection — a text, a smile from a stranger, time with a pet.',
  'There are no wrong answers. Just record what you actually did and how it felt.',
  'If you can\'t remember exactly, your best guess is good enough.',
  'Notice if certain times of day tend to feel better or worse — that\'s useful information.',
  'Enjoyment can be subtle — a warm drink, a song you like, a moment of quiet.',
  'It\'s okay to leave slots blank if you were asleep or can\'t recall. Fill in what you can.'
] as const;
```

- [ ] **Step 3: Add moodColor helper to activityHelpers.ts**

Add after the `REFLECTION_PROMPTS` array:

```typescript
export const moodColor = (mood?: number): string | undefined => {
  if (mood == null) return undefined;
  if (mood >= 60) return Colors.diary.moodWarm;
  if (mood <= 40) return Colors.diary.moodCool;
  return undefined;
};
```

This requires importing `Colors`:

```typescript
import { Colors } from '@/constants/Colors';
```

- [ ] **Step 4: Add isSlotFilled helper to activityHelpers.ts**

Add after `moodColor`:

```typescript
export const isSlotFilled = (v: SlotValue): boolean =>
  (v.activity && v.activity.trim().length > 0) ||
  v.mood != null ||
  v.achievement != null ||
  v.closeness != null ||
  v.enjoyment != null;
```

- [ ] **Step 5: Update the export statement in activityHelpers.ts**

Update the existing export statement to include the new exports:

```typescript
export { buildDaySlots, dateISO, dayLabel, isSlotFilled, moodColor, REFLECTION_PROMPTS, type SlotKey, slotLabel, type SlotValue, startOfMonday };
```

- [ ] **Step 6: Verify**

Run: `npm run lint`

Expected: passes (0 errors — the existing console warning in `useOnboarding.ts` is pre-existing)

- [ ] **Step 7: Commit**

```bash
npx prettier --write constants/Colors.ts utils/activityHelpers.ts
git add constants/Colors.ts utils/activityHelpers.ts
git commit -m "feat(diary): add colour constants and utility helpers"
```

---

## Task 2: Create ReflectionPrompt component

**Files:**
- Create: `components/attempts/presenters/diary/ReflectionPrompt.tsx`

- [ ] **Step 1: Create the component**

Create `components/attempts/presenters/diary/ReflectionPrompt.tsx`:

```tsx
import { View } from 'react-native';
import { ThemedText } from '@/components/ThemedText';
import { Colors } from '@/constants/Colors';
import { Fonts } from '@/constants/Typography';

type ReflectionPromptProps = {
  prompt: string;
};

const ReflectionPrompt = ({ prompt }: ReflectionPromptProps) => (
  <View
    style={{
      backgroundColor: Colors.diary.promptBg,
      borderLeftWidth: 3,
      borderLeftColor: Colors.sway.bright,
      borderRadius: 6,
      padding: 12,
      marginBottom: 12
    }}
  >
    <ThemedText
      style={{
        color: Colors.sway.bright,
        fontSize: 10,
        textTransform: 'uppercase',
        letterSpacing: 0.8,
        fontFamily: Fonts.Bold,
        marginBottom: 2
      }}
    >
      Reflection
    </ThemedText>
    <ThemedText style={{ color: Colors.sway.lightGrey, fontSize: 13, lineHeight: 18 }}>{prompt}</ThemedText>
  </View>
);

export default ReflectionPrompt;
```

- [ ] **Step 2: Verify**

Run: `npm run lint`

Expected: passes

- [ ] **Step 3: Commit**

```bash
npx prettier --write components/attempts/presenters/diary/ReflectionPrompt.tsx
git add components/attempts/presenters/diary/ReflectionPrompt.tsx
git commit -m "feat(diary): add ReflectionPrompt component"
```

---

## Task 3: Create WeeklySummary component

**Files:**
- Create: `components/attempts/presenters/diary/WeeklySummary.tsx`

- [ ] **Step 1: Create the component**

Create `components/attempts/presenters/diary/WeeklySummary.tsx`:

```tsx
import { useState } from 'react';
import { LayoutAnimation, Platform, Pressable, UIManager, View } from 'react-native';
import { ThemedText } from '@/components/ThemedText';
import { Colors } from '@/constants/Colors';
import { Fonts } from '@/constants/Typography';
import type { DiaryTotals } from '@milobedini/shared-types';
import MaterialCommunityIcons from '@react-native-vector-icons/material-design-icons';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

type MetricConfig = {
  key: keyof Omit<DiaryTotals, 'count'>;
  label: string;
  color: string;
};

const METRICS: MetricConfig[] = [
  { key: 'avgMood', label: 'Avg Mood', color: Colors.diary.moodWarm },
  { key: 'avgAchievement', label: 'Avg Achievement', color: Colors.sway.bright },
  { key: 'avgCloseness', label: 'Avg Closeness', color: Colors.diary.closeness },
  { key: 'avgEnjoyment', label: 'Avg Enjoyment', color: Colors.diary.enjoyment }
];

type WeeklySummaryProps = {
  totals: DiaryTotals;
  defaultOpen?: boolean;
};

const WeeklySummary = ({ totals, defaultOpen = false }: WeeklySummaryProps) => {
  const [open, setOpen] = useState(defaultOpen);

  const visibleMetrics = METRICS.filter((m) => totals[m.key] != null);

  if (visibleMetrics.length === 0) return null;

  const toggle = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setOpen((prev) => !prev);
  };

  return (
    <View
      style={{
        backgroundColor: Colors.sway.buttonBackground,
        borderRadius: 8,
        marginBottom: 12,
        overflow: 'hidden'
      }}
    >
      <Pressable
        onPress={toggle}
        style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: 12
        }}
        accessibilityRole="button"
        accessibilityState={{ expanded: open }}
        accessibilityLabel={`Weekly Summary, ${visibleMetrics.length} metrics`}
      >
        <ThemedText style={{ fontFamily: Fonts.Bold, fontSize: 13 }}>Weekly Summary</ThemedText>
        <MaterialCommunityIcons name={open ? 'chevron-up' : 'chevron-down'} size={20} color={Colors.sway.lightGrey} />
      </Pressable>

      {open && (
        <View
          style={{
            flexDirection: 'row',
            flexWrap: 'wrap',
            gap: 6,
            paddingHorizontal: 12,
            paddingBottom: 12
          }}
        >
          {visibleMetrics.map((m) => (
            <View
              key={m.key}
              style={{
                backgroundColor: Colors.sway.dark,
                borderRadius: 6,
                padding: 8,
                alignItems: 'center',
                flexBasis: '48%',
                flexGrow: 1
              }}
            >
              <ThemedText style={{ fontSize: 20, fontFamily: Fonts.Bold, color: m.color }}>
                {(totals[m.key] as number).toFixed(1)}
              </ThemedText>
              <ThemedText style={{ fontSize: 10, color: Colors.sway.darkGrey }}>{m.label}</ThemedText>
            </View>
          ))}
        </View>
      )}
    </View>
  );
};

export default WeeklySummary;
```

Uses `LayoutAnimation` for smooth expand/collapse transitions — this works reliably in React Native unlike moti's `height: 'auto'`.

- [ ] **Step 2: Verify**

Run: `npm run lint`

Expected: passes

- [ ] **Step 3: Commit**

```bash
npx prettier --write components/attempts/presenters/diary/WeeklySummary.tsx
git add components/attempts/presenters/diary/WeeklySummary.tsx
git commit -m "feat(diary): add collapsible WeeklySummary component"
```

---

## Task 4: Create DayChip component

**Files:**
- Create: `components/attempts/presenters/diary/DayChip.tsx`

- [ ] **Step 1: Create the component**

Create `components/attempts/presenters/diary/DayChip.tsx`:

```tsx
import { memo } from 'react';
import { View } from 'react-native';
import { Chip } from 'react-native-paper';
import { Colors } from '@/constants/Colors';
import { Fonts } from '@/constants/Typography';
import { dayLabel } from '@/utils/activityHelpers';

type DayChipProps = {
  date: Date;
  selected: boolean;
  slotFills: readonly boolean[];
  onPress: () => void;
};

const DOT_SIZE = 4;

const DayChip = memo(({ date, selected, slotFills, onPress }: DayChipProps) => {
  const filledCount = slotFills.filter(Boolean).length;

  return (
    <View style={{ alignItems: 'center' }}>
      <Chip
        mode={selected ? 'flat' : 'outlined'}
        selected={selected}
        onPress={onPress}
        style={{
          backgroundColor: selected ? Colors.sway.bright : Colors.sway.buttonBackground
        }}
        textStyle={{
          color: selected ? Colors.sway.dark : 'white',
          fontFamily: Fonts.Bold
        }}
        accessibilityLabel={`${dayLabel(date)} ${date.getDate()}, ${filledCount} of ${slotFills.length} slots filled`}
      >
        {`${dayLabel(date)} ${date.getDate()}`}
      </Chip>
      <View style={{ flexDirection: 'row', gap: 2, marginTop: 4 }}>
        {slotFills.map((filled, i) => (
          <View
            key={i}
            style={{
              width: DOT_SIZE,
              height: DOT_SIZE,
              borderRadius: DOT_SIZE / 2,
              backgroundColor: filled ? Colors.sway.bright : Colors.sway.darkGrey
            }}
          />
        ))}
      </View>
    </View>
  );
});

DayChip.displayName = 'DayChip';

export default DayChip;
```

- [ ] **Step 2: Verify**

Run: `npm run lint`

Expected: passes

- [ ] **Step 3: Commit**

```bash
npx prettier --write components/attempts/presenters/diary/DayChip.tsx
git add components/attempts/presenters/diary/DayChip.tsx
git commit -m "feat(diary): add DayChip component with fill indicators"
```

---

## Task 5: Integrate all enhancements into ActivityDiaryPresenter

**Files:**
- Modify: `components/attempts/presenters/diary/ActivityDiaryPresenter.tsx`

This is the largest task. It wires everything together. The changes are:

1. New imports
2. New state: `userNoteText`, `noteDirty`
3. New memos: `reflectionPrompt`, `slotFillsByDay`
4. Extend `saveDirty` to include `userNote`
5. Add mood tint to `renderSlot`
6. Replace inline day chips with `DayChip`
7. Add `ReflectionPrompt` and `WeeklySummary` to header
8. Add user note `TextInput` to footer

- [ ] **Step 1: Add new imports**

At the top of `ActivityDiaryPresenter.tsx`, add these imports alongside the existing ones:

```typescript
import ReflectionPrompt from './ReflectionPrompt';
import WeeklySummary from './WeeklySummary';
import DayChip from './DayChip';
```

Update the import from `@/utils/activityHelpers` to include the new exports:

```typescript
import {
  buildDaySlots,
  dateISO,
  dayLabel,
  isSlotFilled,
  moodColor,
  REFLECTION_PROMPTS,
  type SlotKey,
  slotLabel,
  type SlotValue,
  startOfMonday
} from '@/utils/activityHelpers';
```

- [ ] **Step 2: Add new state and memos**

After the existing `const canEdit = mode === 'edit';` line, add:

```typescript
const [userNoteText, setUserNoteText] = useState(attempt.userNote ?? '');
const [noteDirty, setNoteDirty] = useState(false);
```

After the existing `days` memo, add the reflection prompt memo:

```typescript
const reflectionPrompt = useMemo(
  () => REFLECTION_PROMPTS[Math.floor(Math.random() * REFLECTION_PROMPTS.length)],
  // eslint-disable-next-line react-hooks/exhaustive-deps
  []
);
```

After the `dayRows` memo, add the slot fills memo:

```typescript
const slotFillsByDay = useMemo(() => {
  const result: Record<string, boolean[]> = {};
  for (const d of days) {
    const iso = dateISO(d);
    const daySlots = buildDaySlots(iso);
    result[iso] = daySlots.map((r) => isSlotFilled(slots[r.key] ?? r.value));
  }
  return result;
}, [days, slots]);
```

- [ ] **Step 3: Extend saveDirty to include userNote**

Replace the existing `saveDirty` callback with:

```typescript
const saveDirty = useCallback(() => {
  if (!dirtyKeys.size && !noteDirty) return;
  const payload: SaveProgressInput = { merge: true };
  if (dirtyKeys.size) {
    payload.diaryEntries = buildPayload(dirtyKeys);
  }
  if (noteDirty) {
    payload.userNote = userNoteText;
  }
  saveAttempt(payload, {
    onError: (err) => renderErrorToast(err),
    onSuccess: () => {
      setDirtyKeys(new Set());
      setNoteDirty(false);
    }
  });
}, [dirtyKeys, noteDirty, userNoteText, buildPayload, saveAttempt]);
```

Also add `SaveProgressInput` to the imports from `@milobedini/shared-types`:

```typescript
import type { AttemptDetailResponseItem, DiaryDetail, DiaryEntryInput, SaveProgressInput } from '@milobedini/shared-types';
```

- [ ] **Step 4: Add mood tint to renderSlot**

In the `renderSlot` callback, compute the tint colour at the top:

```typescript
const tintColor = moodColor(value.mood);
```

Update the `Card` style to include the left border:

```typescript
<Card style={{
  backgroundColor: Colors.sway.buttonBackground,
  marginBottom: 10,
  marginHorizontal: 8,
  borderLeftWidth: 3,
  borderLeftColor: tintColor ?? 'transparent'
}}>
```

Update the `Card.Title` to include a mood badge on the right. Replace:

```tsx
<Card.Title title={value.label} titleStyle={{ color: 'white', fontFamily: Fonts.Bold }} />
```

With:

```tsx
<Card.Title
  title={value.label}
  titleStyle={{ color: 'white', fontFamily: Fonts.Bold }}
  right={() =>
    tintColor && value.mood != null ? (
      <ThemedText style={{ fontSize: 11, color: tintColor, marginRight: 12 }}>
        mood {value.mood}
      </ThemedText>
    ) : null
  }
/>
```

- [ ] **Step 5: Replace inline day chips with DayChip component**

In the `ListHeaderComponent`, replace the entire `ScrollView` block that renders day chips (the `{days.map((d) => { ... })}` section) with:

```tsx
<ScrollView
  horizontal
  showsHorizontalScrollIndicator={false}
  contentContainerStyle={{ paddingHorizontal: 0, gap: 8 }}
>
  {days.map((d) => {
    const iso = dateISO(d);
    return (
      <DayChip
        key={iso}
        date={d}
        selected={iso === activeDayISO}
        slotFills={slotFillsByDay[iso] ?? []}
        onPress={() => setActiveDayISO(iso)}
      />
    );
  })}
</ScrollView>
```

- [ ] **Step 6: Add ReflectionPrompt and WeeklySummary to header**

In the `ListHeaderComponent`, add these two elements after the `<Divider>` and before the day chips `ScrollView`. The order should be: Divider → ReflectionPrompt (edit mode only) → WeeklySummary → day chips ScrollView:

```tsx
{canEdit && <ReflectionPrompt prompt={reflectionPrompt} />}

<WeeklySummary totals={diary.totals} />
```

- [ ] **Step 7: Add editable user note to footer**

In the `ListFooterComponent`, add the user note input above the existing button section. Place it right at the start of the footer `<View>`:

```tsx
{canEdit && (
  <View style={{ marginBottom: 12, marginHorizontal: 8 }}>
    <TextInput
      mode="outlined"
      label="Note for your therapist"
      placeholder="Anything you'd like your therapist to know this week..."
      placeholderTextColor={Colors.sway.darkGrey}
      value={userNoteText}
      onChangeText={(t) => {
        setUserNoteText(t);
        setNoteDirty(true);
      }}
      multiline
      maxLength={500}
      style={{ backgroundColor: 'transparent', minHeight: 64 }}
      textColor="white"
      outlineColor={Colors.sway.darkGrey}
      activeOutlineColor={Colors.sway.bright}
      theme={{ colors: { onSurfaceVariant: Colors.sway.lightGrey } }}
    />
  </View>
)}
```

- [ ] **Step 8: Update dirty check references**

The existing footer button logic checks `dirtyKeys.size` in several places to decide button labels and behaviour. These need to also account for `noteDirty`. Update the button title ternary:

Replace:
```tsx
title={allAnswered ? 'Submit diary' : !!dirtyKeys.size ? `Save & Exit (${dirtyKeys.size})` : 'Exit'}
```

With:
```tsx
title={allAnswered ? 'Submit diary' : (dirtyKeys.size || noteDirty) ? `Save & Exit` : 'Exit'}
```

And update the condition checks in the `onPress` handler — replace `if (dirtyKeys.size)` checks with `if (dirtyKeys.size || noteDirty)` in both the early-exit path and the pre-submit save path. The cancel button condition should also use `(dirtyKeys.size || noteDirty)`.

**Important:** The footer's inline `saveAttempt(...)` calls (in both the early-exit path and the pre-submit path) currently pass `{ diaryEntries: payload, merge: true }` directly. These must also include `userNote` when `noteDirty` is true. Refactor both inline save calls to use `saveDirty()` instead — this avoids duplicating the payload-building logic and ensures the note is always included. The early-exit path becomes:

```tsx
if (dirtyKeys.size || noteDirty) {
  const payload: SaveProgressInput = { merge: true };
  if (dirtyKeys.size) payload.diaryEntries = buildPayload(dirtyKeys);
  if (noteDirty) payload.userNote = userNoteText;
  saveAttempt(payload, {
    onError: (err) => renderErrorToast(err),
    onSuccess: () => {
      setDirtyKeys(new Set());
      setNoteDirty(false);
      router.back();
    }
  });
} else {
  router.back();
}
```

Apply the same pattern to the pre-submit save path (where it saves before calling `afterSave()`). Do **not** call `saveDirty()` — use the inline `saveAttempt()` call directly so you can pass the `onSuccess` callback.

The save chip in the header (`{!!dirtyKeys.size && (...)}`) should also be updated:

Replace:
```tsx
{!!dirtyKeys.size && (
```

With:
```tsx
{(!!dirtyKeys.size || noteDirty) && (
```

And update its label:

Replace:
```tsx
{dirtyKeys.size ? `Save changes (${dirtyKeys.size})` : 'Saved'}
```

With:
```tsx
{(dirtyKeys.size || noteDirty) ? `Save changes` : 'Saved'}
```

- [ ] **Step 9: Verify**

Run: `npm run lint`

Expected: passes

- [ ] **Step 10: Commit**

```bash
npx prettier --write components/attempts/presenters/diary/ActivityDiaryPresenter.tsx
git add components/attempts/presenters/diary/ActivityDiaryPresenter.tsx
git commit -m "feat(diary): integrate all 5 enhancements into presenter"
```

---

## Task 6: Manual verification

- [ ] **Step 1: Start the dev server**

Run: `npx expo start`

- [ ] **Step 2: Test edit mode**

Open an active diary attempt as a patient. Verify:
- Reflection prompt appears at the top (random, stays fixed while editing)
- Weekly summary card is visible and collapsed — tap to expand, shows averages
- Day chips have 9 dots underneath — dots turn green as you fill slots
- Slot cards show left-border mood tint (fill mood ≥60 → amber, ≤40 → blue)
- Mood badge appears in the card header when mood is set
- User note field appears above the submit button
- Typing in the note field triggers the save chip
- Saving includes the note (check network request or verify on reload)

- [ ] **Step 3: Test view mode**

Open a submitted diary attempt. Verify:
- Reflection prompt does NOT appear
- Weekly summary card appears with totals
- Day chips show correct fill indicators (read-only)
- Mood tinting shows on slot cards
- User note appears read-only (existing behaviour)
- No editable note field

- [ ] **Step 4: Test therapist view**

Open a patient's diary attempt as a therapist. Same expectations as view mode plus patient name displays.

- [ ] **Step 5: Final commit (if any formatting fixes needed)**

```bash
npx prettier --write .
npx eslint --fix .
npm run lint
git add -A
git commit -m "chore(diary): formatting and lint fixes"
```
