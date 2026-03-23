# Activity Diary Presenter UX Fixes — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix keyboard/input UX and polish the Activity Diary presenter so patients can efficiently fill 45+ fields per day without fighting the interface.

**Architecture:** Split the monolithic sticky header so only the day selector persists on screen. Add an iOS `InputAccessoryView` toolbar for prev/next field navigation. Apply targeted fixes to placeholder colours, haptics, button labels, character count, touch targets, and memoization.

**Tech Stack:** React Native, Expo, react-native-paper, expo-haptics, InputAccessoryView (RN built-in)

**Spec:** `docs/superpowers/specs/2026-03-23-diary-presenter-ux-fixes-design.md`

---

## File Map

| File | Action | Responsibility |
|------|--------|---------------|
| `components/attempts/presenters/diary/NumericField.tsx` | Modify | Add `forwardRef`, increase height, add `onFocus`/`inputAccessoryViewID` props |
| `components/attempts/presenters/diary/DiaryInputToolbar.tsx` | Create | `InputAccessoryView` component with prev/next/done + context label |
| `components/attempts/presenters/diary/ActivityDiaryPresenter.tsx` | Modify | Extract sticky header, wire ref registry, add toolbar, fix haptics/placeholders/buttons/char count |
| `components/attempts/presenters/diary/WeeklySummary.tsx` | Modify | Add `memo` with custom comparator |
| `utils/activityHelpers.ts` | Modify | Export `FIELD_NAMES` constant for toolbar labels |

---

### Task 1: Quick Fixes — Placeholder Colour, Haptics, Button Labels

Small, independent changes applied first to reduce noise in later diffs.

**Files:**
- Modify: `components/attempts/presenters/diary/ActivityDiaryPresenter.tsx`

- [ ] **Step 1: Fix placeholder text colour**

In `ActivityDiaryPresenter.tsx`, change both `placeholderTextColor` values from white to `Colors.sway.darkGrey`.

Line 237 (activity input in `renderSlot`):
```tsx
// before
placeholderTextColor={'white'}
// after
placeholderTextColor={Colors.sway.darkGrey}
```

Line 427 (therapist note input in `ListFooterComponent`):
```tsx
// before
placeholderTextColor="white"
// after
placeholderTextColor={Colors.sway.darkGrey}
```

- [ ] **Step 2: Fix haptic feedback**

In `updateSlot` (line 155–167), remove the haptic call:
```tsx
// DELETE this line (163):
if (canEdit) Haptics.selectionAsync().catch(() => {});
```

Add success haptic to `saveDirty` onSuccess (line 200–203):
```tsx
onSuccess: () => {
  setDirtyKeys(new Set());
  setNoteDirty(false);
  Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
}
```

Add success haptic to the submit `afterSave` callback (line 466–469):
```tsx
const afterSave = () =>
  submitAttempt(assignmentId ? { assignmentId: String(assignmentId) } : {}, {
    onSuccess: () => {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
      router.back();
    }
  });
```

Also add to the explicit save+exit path `onSuccess` (line 454–458):
```tsx
onSuccess: () => {
  setDirtyKeys(new Set());
  setNoteDirty(false);
  Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
  router.back();
}
```

- [ ] **Step 3: Fix button labels**

Line 485, change "Cancel" to "Discard changes":
```tsx
// before
<PrimaryButton title="Cancel" onPress={router.back} variant="error" />
// after
<PrimaryButton title="Discard changes" onPress={router.back} variant="error" />
```

- [ ] **Step 4: Add character count to therapist note**

In the `ListFooterComponent`, after the therapist note `TextInput` (line 442), inside `Card.Content`, add:
```tsx
<ThemedText
  type="small"
  style={{
    textAlign: 'right',
    marginTop: 4,
    color: userNoteText.length >= 450 ? Colors.primary.error : Colors.sway.darkGrey
  }}
>
  {`${userNoteText.length}/500`}
</ThemedText>
```

- [ ] **Step 5: Validate and commit**

Run: `npm run lint`
Expected: All checks pass.

```bash
git add components/attempts/presenters/diary/ActivityDiaryPresenter.tsx
git commit -m "fix(diary): placeholder colour, haptics, button labels, char count"
```

---

### Task 2: Memoization — `buildDaySlots` and `WeeklySummary`

**Files:**
- Modify: `components/attempts/presenters/diary/ActivityDiaryPresenter.tsx`
- Modify: `components/attempts/presenters/diary/WeeklySummary.tsx`

- [ ] **Step 1: Memoize `buildDaySlots` in presenter**

In `ActivityDiaryPresenter.tsx`, add a `weekSlots` memo after the `days` memo (after line 89):
```tsx
const weekSlots = useMemo(() => {
  const result: Record<string, { key: SlotKey; value: SlotValue }[]> = {};
  for (const d of days) {
    const iso = dateISO(d);
    result[iso] = buildDaySlots(iso);
  }
  return result;
}, [days]);
```

Update the `useEffect` seed (lines 99–127) to use `weekSlots`:
```tsx
useEffect(() => {
  const seed: Record<SlotKey, SlotValue> = {};
  for (const daySlots of Object.values(weekSlots)) {
    for (const row of daySlots) {
      seed[row.key] = row.value;
    }
  }

  for (const day of diary.days ?? []) {
    for (const e of day.entries) {
      const at = new Date(e.at);
      const iso = dateISO(at);
      const label = e.label ?? slotLabel(at.getUTCHours());
      const key = `${iso}|${label}`;
      seed[key] = {
        at,
        label,
        activity: e.activity ?? '',
        mood: e.mood,
        achievement: e.achievement,
        closeness: e.closeness,
        enjoyment: e.enjoyment
      };
    }
  }

  setSlots(seed);
}, [attempt._id, weekSlots, diary.days]);
```

Update `dayRows` (lines 140–143):
```tsx
const dayRows = useMemo(
  () => (weekSlots[activeDayISO] ?? []).map((r) => ({ key: r.key, value: slots[r.key] ?? r.value })),
  [activeDayISO, slots, weekSlots]
);
```

Update `slotFillsByDay` (lines 145–153):
```tsx
const slotFillsByDay = useMemo(() => {
  const result: Record<string, boolean[]> = {};
  for (const [iso, daySlots] of Object.entries(weekSlots)) {
    result[iso] = daySlots.map((r) => isSlotFilled(slots[r.key] ?? r.value));
  }
  return result;
}, [weekSlots, slots]);
```

- [ ] **Step 2: Memoize WeeklySummary**

In `WeeklySummary.tsx`, wrap the component in `memo` with a custom comparator. Replace the current export:

```tsx
// before
const WeeklySummary = ({ totals, defaultOpen = false }: WeeklySummaryProps) => {
// after
const WeeklySummary = memo(({ totals, defaultOpen = false }: WeeklySummaryProps) => {
```

Add `memo` to the import from react:
```tsx
import { memo, useState } from 'react';
```

Close with custom comparator:
```tsx
// before
};

export default WeeklySummary;

// after
}, (prev, next) =>
  prev.totals.count === next.totals.count &&
  prev.totals.avgMood === next.totals.avgMood &&
  prev.totals.avgAchievement === next.totals.avgAchievement &&
  prev.totals.avgCloseness === next.totals.avgCloseness &&
  prev.totals.avgEnjoyment === next.totals.avgEnjoyment &&
  prev.defaultOpen === next.defaultOpen
);

WeeklySummary.displayName = 'WeeklySummary';

export default WeeklySummary;
```

- [ ] **Step 3: Validate and commit**

Run: `npm run lint`
Expected: All checks pass.

```bash
git add components/attempts/presenters/diary/ActivityDiaryPresenter.tsx components/attempts/presenters/diary/WeeklySummary.tsx
git commit -m "perf(diary): memoize buildDaySlots and WeeklySummary"
```

---

### Task 3: Extract Sticky Day Selector

Move the day selector out of `ListHeaderComponent` and render it as a persistent sibling above the FlatList.

**Files:**
- Modify: `components/attempts/presenters/diary/ActivityDiaryPresenter.tsx`

- [ ] **Step 1: Move day selector outside FlatList**

In the `return` block, restructure the component tree. The day selector `ScrollView` (currently lines 390–408 inside `ListHeaderComponent`) moves to a sibling `View` above the `FlatList`, inside `KeyboardAvoidingView`:

```tsx
return (
  <KeyboardAvoidingView
    style={{ flex: 1 }}
    behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    keyboardVerticalOffset={Platform.select({ ios: 120, default: 0 })}
  >
    {/* Sticky day selector — always visible */}
    <View className="bg-sway-dark px-4 pb-2 pt-1">
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
    </View>

    <FlatList
      data={dayRows}
      keyExtractor={(row) => row.key}
      renderItem={renderSlot}
      initialNumToRender={8}
      maxToRenderPerBatch={8}
      windowSize={6}
      removeClippedSubviews
      ListHeaderComponent={/* ... scrollable header without day selector ... */}
      ListFooterComponent={/* ... unchanged ... */}
      // REMOVE stickyHeaderIndices={[0]}
    />
  </KeyboardAvoidingView>
);
```

- [ ] **Step 2: Clean up ListHeaderComponent**

Remove the day selector `ScrollView` and trailing `<View className="h-3" />` from `ListHeaderComponent`. Remove the outer `<View>` wrapper that was only needed for `stickyHeaderIndices`. The remaining header content (progress chips, disclaimer, user note, reflection, weekly summary) stays as `ListHeaderComponent`.

- [ ] **Step 3: Remove stickyHeaderIndices**

Delete `stickyHeaderIndices={[0]}` from the FlatList props (line 493).

- [ ] **Step 4: Validate and commit**

Run: `npm run lint`
Expected: All checks pass.

Test on device/simulator: open Activity Diary in edit mode. Verify:
- Day selector with fill dots stays visible when scrolling
- Progress chips, reflection prompt, and weekly summary scroll away
- Keyboard opens and the day selector + current slot are visible
- Switching days still works

```bash
git add components/attempts/presenters/diary/ActivityDiaryPresenter.tsx
git commit -m "fix(diary): only pin day selector, free screen space for keyboard"
```

---

### Task 4: NumericField — `forwardRef`, Touch Targets, Toolbar Props

Prepare `NumericField` to participate in the keyboard navigation system.

**Files:**
- Modify: `components/attempts/presenters/diary/NumericField.tsx`

- [ ] **Step 1: Add forwardRef and new props**

Refactor `NumericField` to use `forwardRef` so the parent can call `.focus()`. Add `onFocus` and `inputAccessoryViewID` passthrough props. Increase height to 44.

```tsx
import { forwardRef, memo, useCallback, useEffect, useImperativeHandle, useMemo, useRef, useState } from 'react';
import { type TextInput as RNTextInput, View } from 'react-native';
import { TextInput } from 'react-native-paper';
import { ThemedText } from '@/components/ThemedText';
import { Colors } from '@/constants/Colors';
import { clamp } from '@/utils/helpers';

type NumericFieldProps = {
  label: string;
  value?: number;
  min: number;
  max: number;
  disabled?: boolean;
  onChange: (n: number) => void;
  maxLength?: number;
  onFocus?: () => void;
  inputAccessoryViewID?: string;
};

const NumericField = memo(
  forwardRef<RNTextInput, NumericFieldProps>(function NumericField(
    { label, value, min, max, disabled, onChange, maxLength = 3, onFocus, inputAccessoryViewID },
    ref
  ) {
    const innerRef = useRef<RNTextInput>(null);

    useImperativeHandle(ref, () => innerRef.current as RNTextInput);

    const [text, setText] = useState<string>(value == null ? '' : String(value));

    useEffect(() => {
      setText(value == null ? '' : String(value));
    }, [value]);

    const handleChange = useCallback(
      (t: string) => {
        const digits = t.replace(/[^\d]/g, '');
        setText(digits);

        if (digits === '') return;
        const parsed = clamp(parseInt(digits, 10) || 0, min, max);
        if (parsed !== value) onChange(parsed);
      },
      [min, max, onChange, value]
    );

    const hasText = useMemo(() => text.length > 0, [text.length]);

    return (
      <View className="flex-row items-center justify-between px-2">
        <ThemedText>{label}</ThemedText>
        <TextInput
          ref={innerRef}
          mode="outlined"
          value={text}
          onChangeText={handleChange}
          onFocus={onFocus}
          disabled={disabled}
          keyboardType="number-pad"
          inputMode="numeric"
          maxLength={maxLength}
          inputAccessoryViewID={inputAccessoryViewID}
          style={{
            backgroundColor: 'transparent',
            height: 44,
            textAlign: 'center'
          }}
          textColor="white"
          theme={{
            colors: {
              onSurfaceVariant: Colors.sway.lightGrey,
              surfaceDisabled: Colors.sway.darkGrey,
              onSurfaceDisabled: Colors.sway.darkGrey
            }
          }}
          placeholder={`${min}–${max}`}
          placeholderTextColor={Colors.sway.darkGrey}
          returnKeyType="done"
          submitBehavior="blurAndSubmit"
          outlineColor={hasText ? Colors.sway.bright : Colors.sway.darkGrey}
          activeOutlineColor={Colors.primary.accent}
        />
      </View>
    );
  })
);

NumericField.displayName = 'NumericField';

export default NumericField;
```

- [ ] **Step 2: Validate and commit**

Run: `npm run lint`
Expected: All checks pass.

```bash
git add components/attempts/presenters/diary/NumericField.tsx
git commit -m "refactor(diary): NumericField forwardRef, 44pt touch targets, toolbar props"
```

---

### Task 5: Add Field Name Constants

Export field name constants from helpers so the toolbar can display context labels.

**Files:**
- Modify: `utils/activityHelpers.ts`

- [ ] **Step 1: Add FIELD_NAMES constant**

Add at the end of `activityHelpers.ts`, before the final export line:

```tsx
export const FIELD_NAMES = ['Activity', 'Mood', 'Achievement', 'Closeness', 'Enjoyment'] as const;
export const FIELDS_PER_SLOT = FIELD_NAMES.length;
```

- [ ] **Step 2: Validate and commit**

Run: `npm run lint`

```bash
git add utils/activityHelpers.ts
git commit -m "feat(diary): export FIELD_NAMES constant for toolbar labels"
```

---

### Task 6: Create DiaryInputToolbar Component

Build the `InputAccessoryView` toolbar with prev/next arrows, context label, and done button.

**Files:**
- Create: `components/attempts/presenters/diary/DiaryInputToolbar.tsx`

- [ ] **Step 1: Create the toolbar component**

```tsx
import { InputAccessoryView, Keyboard, Platform, Pressable, View } from 'react-native';
import { ThemedText } from '@/components/ThemedText';
import { Colors } from '@/constants/Colors';
import { Fonts } from '@/constants/Typography';

type DiaryInputToolbarProps = {
  nativeID: string;
  label: string;
  canGoPrev: boolean;
  canGoNext: boolean;
  onPrev: () => void;
  onNext: () => void;
};

const ARROW_HIT_SLOP = { top: 8, bottom: 8, left: 12, right: 12 };

const DiaryInputToolbar = ({ nativeID, label, canGoPrev, canGoNext, onPrev, onNext }: DiaryInputToolbarProps) => {
  if (Platform.OS !== 'ios') return null;

  return (
    <InputAccessoryView nativeID={nativeID}>
      <View
        style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          backgroundColor: Colors.chip.darkCard,
          paddingHorizontal: 12,
          paddingVertical: 8,
          borderTopWidth: 1,
          borderTopColor: Colors.sway.darkGrey
        }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16 }}>
          <Pressable
            onPress={onPrev}
            disabled={!canGoPrev}
            hitSlop={ARROW_HIT_SLOP}
            accessibilityLabel="Previous field"
            accessibilityRole="button"
          >
            <ThemedText
              style={{
                fontSize: 22,
                fontFamily: Fonts.Bold,
                color: canGoPrev ? Colors.sway.bright : Colors.sway.darkGrey
              }}
            >
              {'‹'}
            </ThemedText>
          </Pressable>
          <Pressable
            onPress={onNext}
            disabled={!canGoNext}
            hitSlop={ARROW_HIT_SLOP}
            accessibilityLabel="Next field"
            accessibilityRole="button"
          >
            <ThemedText
              style={{
                fontSize: 22,
                fontFamily: Fonts.Bold,
                color: canGoNext ? Colors.sway.bright : Colors.sway.darkGrey
              }}
            >
              {'›'}
            </ThemedText>
          </Pressable>
          <ThemedText type="small" style={{ color: Colors.sway.darkGrey }}>
            {label}
          </ThemedText>
        </View>
        <Pressable
          onPress={() => Keyboard.dismiss()}
          hitSlop={ARROW_HIT_SLOP}
          accessibilityLabel="Dismiss keyboard"
          accessibilityRole="button"
        >
          <ThemedText style={{ fontFamily: Fonts.Bold, color: Colors.sway.bright }}>Done</ThemedText>
        </Pressable>
      </View>
    </InputAccessoryView>
  );
};

export default DiaryInputToolbar;
```

- [ ] **Step 2: Validate and commit**

Run: `npm run lint`

```bash
git add components/attempts/presenters/diary/DiaryInputToolbar.tsx
git commit -m "feat(diary): InputAccessoryView toolbar with prev/next/done"
```

---

### Task 7: Wire Ref Registry and Toolbar into Presenter

Connect the toolbar, ref registry, and auto-scroll in the main presenter.

**Files:**
- Modify: `components/attempts/presenters/diary/ActivityDiaryPresenter.tsx`

- [ ] **Step 1: Add imports and constants**

Add to the imports at the top:
```tsx
import { type TextInput as RNTextInput } from 'react-native';
import { FIELD_NAMES, FIELDS_PER_SLOT } from '@/utils/activityHelpers';
import DiaryInputToolbar from './DiaryInputToolbar';
```

Add the toolbar nativeID constant outside the component:
```tsx
const DIARY_NAV_ID = 'diaryNav';
```

- [ ] **Step 2: Add ref registry and focus state**

Inside the component, after the existing state declarations, add:

```tsx
const flatListRef = useRef<FlatList>(null);
const inputRefs = useRef<Map<string, RNTextInput>>(new Map());
const [focusedFieldIdx, setFocusedFieldIdx] = useState<number | null>(null);

// Total fields for the current day
const totalFields = dayRows.length * FIELDS_PER_SLOT;

// Build the ordered ref key for a given slot index + field index
const refKey = useCallback((slotIdx: number, fieldIdx: number) => `${slotIdx}-${fieldIdx}`, []);

// Register a ref
const registerRef = useCallback((key: string, ref: RNTextInput | null) => {
  if (ref) {
    inputRefs.current.set(key, ref);
  } else {
    inputRefs.current.delete(key);
  }
}, []);

// Focus a field by flat index
const focusField = useCallback(
  (flatIdx: number) => {
    const slotIdx = Math.floor(flatIdx / FIELDS_PER_SLOT);
    const fieldIdx = flatIdx % FIELDS_PER_SLOT;
    const key = refKey(slotIdx, fieldIdx);
    const input = inputRefs.current.get(key);
    if (input) {
      input.focus();
      // Auto-scroll to the slot if it changed
      if (flatListRef.current && slotIdx < dayRows.length) {
        flatListRef.current.scrollToIndex({ index: slotIdx, animated: true, viewPosition: 0.3 });
      }
    }
  },
  [refKey, dayRows.length]
);

// Toolbar context label
const toolbarLabel = useMemo(() => {
  if (focusedFieldIdx == null) return '';
  const slotIdx = Math.floor(focusedFieldIdx / FIELDS_PER_SLOT);
  const fieldIdx = focusedFieldIdx % FIELDS_PER_SLOT;
  const slotLabel = dayRows[slotIdx]?.value.label ?? '';
  return `${FIELD_NAMES[fieldIdx]} — ${slotLabel}`;
}, [focusedFieldIdx, dayRows]);
```

Add `useRef` to the react import at the top of the file.

- [ ] **Step 3: Add `getItemLayout` for reliable scrollToIndex**

After the ref registry code, add a fixed-height layout calculator. Each slot card has a consistent height since all cards have the same 5 fields. Estimate the height and fine-tune:

```tsx
// Approximate card height: title(48) + activity(56) + 4×numericField(52 each) + gap(8×4) + cardPadding(16) + marginBottom(10) = ~370
const SLOT_CARD_HEIGHT = 370;

const getItemLayout = useCallback(
  (_data: unknown, index: number) => ({
    length: SLOT_CARD_HEIGHT,
    offset: SLOT_CARD_HEIGHT * index,
    index
  }),
  []
);
```

Add `getItemLayout={getItemLayout}` to the FlatList props. Also add a safety handler for scroll failures:

```tsx
onScrollToIndexFailed={(info) => {
  setTimeout(() => {
    flatListRef.current?.scrollToIndex({ index: info.index, animated: true, viewPosition: 0.3 });
  }, 100);
}}
```

- [ ] **Step 4: Update `renderSlot` to register refs and wire onFocus**

Modify `renderSlot` to pass refs, `onFocus`, and `inputAccessoryViewID` to each input. The slot index comes from `dayRows.findIndex`:

```tsx
const renderSlot = useCallback(
  ({ item, index: slotIdx }: ListRenderItemInfo<{ key: SlotKey; value: SlotValue }>) => {
    const { key, value } = item;
    const disabled = !canEdit;
    const tintColor = moodColor(value.mood);
    const accessoryProps = canEdit ? { inputAccessoryViewID: DIARY_NAV_ID } : {};

    return (
      <Card
        style={{
          backgroundColor: Colors.sway.buttonBackground,
          marginBottom: 10,
          marginHorizontal: 8,
          borderLeftWidth: 3,
          borderLeftColor: tintColor ?? 'transparent'
        }}
      >
        <Card.Title
          title={value.label}
          titleStyle={{ color: 'white', fontFamily: Fonts.Bold }}
          right={() =>
            tintColor && value.mood != null ? (
              <ThemedText style={{ fontSize: 11, color: tintColor, marginRight: 12 }}>mood {value.mood}</ThemedText>
            ) : null
          }
        />
        <Card.Content style={{ gap: 8 }}>
          <TextInput
            ref={(r: RNTextInput | null) => registerRef(refKey(slotIdx, 0), r)}
            mode="flat"
            disabled={disabled}
            label={mode === 'edit' ? 'Activity' : undefined}
            placeholder={mode === 'edit' ? 'What did you do?' : undefined}
            placeholderTextColor={Colors.sway.darkGrey}
            value={value.activity}
            onChangeText={(t) => updateSlot(key, { activity: t })}
            onFocus={() => setFocusedFieldIdx(slotIdx * FIELDS_PER_SLOT + 0)}
            style={{ backgroundColor: 'transparent' }}
            className="overflow-hidden text-ellipsis border border-sway-darkGrey text-white"
            textColor="white"
            underlineColor="transparent"
            activeUnderlineColor={Colors.sway.bright}
            theme={{ colors: { onSurfaceVariant: Colors.sway.lightGrey } }}
            clearButtonMode={mode === 'edit' ? 'always' : 'never'}
            {...accessoryProps}
          />
          <NumericField
            ref={(r: RNTextInput | null) => registerRef(refKey(slotIdx, 1), r)}
            label="Mood"
            value={value.mood}
            min={0}
            max={100}
            maxLength={3}
            disabled={disabled}
            onChange={(n) => updateSlot(key, { mood: n })}
            onFocus={() => setFocusedFieldIdx(slotIdx * FIELDS_PER_SLOT + 1)}
            inputAccessoryViewID={canEdit ? DIARY_NAV_ID : undefined}
          />
          <NumericField
            ref={(r: RNTextInput | null) => registerRef(refKey(slotIdx, 2), r)}
            label="Achievement"
            value={value.achievement}
            min={0}
            max={10}
            maxLength={2}
            disabled={disabled}
            onChange={(n) => updateSlot(key, { achievement: n })}
            onFocus={() => setFocusedFieldIdx(slotIdx * FIELDS_PER_SLOT + 2)}
            inputAccessoryViewID={canEdit ? DIARY_NAV_ID : undefined}
          />
          <NumericField
            ref={(r: RNTextInput | null) => registerRef(refKey(slotIdx, 3), r)}
            label="Closeness"
            value={value.closeness}
            min={0}
            max={10}
            maxLength={2}
            disabled={disabled}
            onChange={(n) => updateSlot(key, { closeness: n })}
            onFocus={() => setFocusedFieldIdx(slotIdx * FIELDS_PER_SLOT + 3)}
            inputAccessoryViewID={canEdit ? DIARY_NAV_ID : undefined}
          />
          <NumericField
            ref={(r: RNTextInput | null) => registerRef(refKey(slotIdx, 4), r)}
            label="Enjoyment"
            value={value.enjoyment}
            min={0}
            max={10}
            maxLength={2}
            disabled={disabled}
            onChange={(n) => updateSlot(key, { enjoyment: n })}
            onFocus={() => setFocusedFieldIdx(slotIdx * FIELDS_PER_SLOT + 4)}
            inputAccessoryViewID={canEdit ? DIARY_NAV_ID : undefined}
          />
        </Card.Content>
      </Card>
    );
  },
  [canEdit, updateSlot, mode, registerRef, refKey]
);
```

- [ ] **Step 5: Render the toolbar**

Add the toolbar rendering just before the closing `</KeyboardAvoidingView>` — but since `InputAccessoryView` renders as a portal (it attaches to the keyboard, not the layout), it can go anywhere inside the component tree. Place it after the FlatList for readability:

```tsx
{canEdit && (
  <DiaryInputToolbar
    nativeID={DIARY_NAV_ID}
    label={toolbarLabel}
    canGoPrev={focusedFieldIdx != null && focusedFieldIdx > 0}
    canGoNext={focusedFieldIdx != null && focusedFieldIdx < totalFields - 1}
    onPrev={() => {
      if (focusedFieldIdx != null && focusedFieldIdx > 0) {
        focusField(focusedFieldIdx - 1);
      }
    }}
    onNext={() => {
      if (focusedFieldIdx != null && focusedFieldIdx < totalFields - 1) {
        focusField(focusedFieldIdx + 1);
      }
    }}
  />
)}
```

Add `ref={flatListRef}` to the FlatList.

- [ ] **Step 6: Validate and commit**

Run: `npm run lint`
Expected: All checks pass.

Test on iOS simulator:
1. Open Activity Diary in edit mode
2. Tap the Activity field for the first slot
3. Verify toolbar appears above keyboard with "Activity — 06:00–08:00"
4. Tap › to advance to Mood — verify label updates and field focuses
5. Continue through all fields, verify it advances to next slot
6. At last field of last slot, verify › is disabled (greyed out)
7. At first field of first slot, verify ‹ is disabled
8. Tap Done — keyboard dismisses

```bash
git add components/attempts/presenters/diary/ActivityDiaryPresenter.tsx
git commit -m "feat(diary): keyboard toolbar with prev/next navigation and context label"
```

---

### Task 8: Final Validation

- [ ] **Step 1: Run full lint**

Run: `npm run lint`
Expected: All checks pass.

- [ ] **Step 2: Visual validation on device**

Test the complete flow on iOS simulator:
1. Day selector stays visible while scrolling — progress chips scroll away
2. Keyboard toolbar shows with prev/next/done and context label
3. Placeholder text is grey, not white
4. No haptic on individual field edits; haptic on save/submit
5. "Discard changes" button (not "Cancel") when dirty
6. Character count shows on therapist note, turns red near limit
7. Numeric fields have comfortable 44pt tap targets
8. Day chip fill dots update as fields are filled

- [ ] **Step 3: Format and final commit if needed**

```bash
npx prettier --write .
npx eslint --fix .
```

If any files changed, commit:
```bash
git add -A
git commit -m "style(diary): format after UX fixes"
```
