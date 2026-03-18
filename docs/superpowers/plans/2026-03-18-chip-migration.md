# Chip Migration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Eliminate all `react-native-paper` `<Chip>` usage by migrating to custom `StatusChip` and a new `SelectableChip` component.

**Architecture:** Extend `StatusChip` with an optional `backgroundColor` prop for filled variants. Add `SelectableChip` as a `Pressable`-based interactive chip with selected/unselected/disabled states and optional color overrides. Convert the diary "Save changes" chip to a `Pressable` button.

**Tech Stack:** React Native, NativeWind, Pressable, MaterialCommunityIcons

**Spec:** `docs/superpowers/specs/2026-03-18-chip-migration-design.md`

---

## File Map

| File | Action | Responsibility |
|------|--------|----------------|
| `components/ui/Chip.tsx` | Modify | Add `backgroundColor` to `StatusChip`, add `SelectableChip` |
| `components/ui/FilterDrawer.tsx` | Modify | Swap paper `Chip` → `SelectableChip`, fix `Dimensions.get` |
| `components/ui/RecurrenceField.tsx` | Modify | Swap paper `Chip` → `SelectableChip` |
| `components/attempts/presenters/diary/DayChip.tsx` | Modify | Swap paper `Chip` → `SelectableChip` |
| `components/attempts/presenters/diary/ActivityDiaryPresenter.tsx` | Modify | Swap display chips → `StatusChip`, save chip → `Pressable` |
| `components/attempts/presenters/questionnaires/QuestionnairePresenter.tsx` | Modify | Swap display chips → `StatusChip` |
| `components/attempts/presenters/questionnaires/QuestionSlide.tsx` | Modify | Swap paper `Chip` → `SelectableChip` |

---

### Task 1: Extend StatusChip with backgroundColor prop

**Files:**

- Modify: `components/ui/Chip.tsx:16-35`

- [ ] **Step 1: Add `backgroundColor` to `StatusChipProps`**

In `components/ui/Chip.tsx`, add `backgroundColor?: string` to the `StatusChipProps` type:

```tsx
type StatusChipProps = {
  label: string;
  color: string;
  borderColor: string;
  icon?: MCIName;
  iconElement?: ReactNode;
  className?: string;
  backgroundColor?: string;
};
```

- [ ] **Step 2: Apply backgroundColor in StatusChip render**

Update the `StatusChip` component to spread `backgroundColor` into the style object:

```tsx
const StatusChip = ({ label, color, borderColor, icon, iconElement, className, backgroundColor }: StatusChipProps) => (
  <View
    className={`flex-row items-center gap-1 rounded-2xl border px-3 py-1 ${className ?? 'self-start'}`}
    style={{ borderColor, backgroundColor }}
  >
    {iconElement ?? (icon ? <MaterialCommunityIcons name={icon} size={14} color={color} /> : null)}
    <ThemedText type="small" style={{ color, fontSize: 12, lineHeight: 16 }}>
      {label}
    </ThemedText>
  </View>
);
```

- [ ] **Step 3: Verify existing chip usages still render correctly**

Run: `npm run lint`
Expected: PASS — no type errors, no regressions (the new prop is optional).

- [ ] **Step 4: Commit**

```bash
git add components/ui/Chip.tsx
git commit -m "feat(ui): add backgroundColor prop to StatusChip"
```

---

### Task 2: Add SelectableChip component

**Files:**

- Modify: `components/ui/Chip.tsx`

- [ ] **Step 1: Add Pressable import and Fonts import**

Add `Pressable` to the `react-native` import and import `Fonts`:

```tsx
import { ActivityIndicator, Pressable, View } from 'react-native';
```

```tsx
import { Fonts } from '@/constants/Typography';
```

- [ ] **Step 2: Add SelectableChip type and component**

Add below the existing `StatusChip` component (before `PendingChip`):

```tsx
type SelectableChipProps = {
  label: string | number;
  selected: boolean;
  onPress: () => void;
  disabled?: boolean;
  icon?: MCIName;
  className?: string;
  accessibilityLabel?: string;
  selectedBg?: string;
  unselectedBg?: string;
  selectedTextColor?: string;
  unselectedTextColor?: string;
};

const SelectableChip = ({
  label,
  selected,
  onPress,
  disabled,
  icon,
  className,
  accessibilityLabel,
  selectedBg = Colors.sway.bright,
  unselectedBg = Colors.sway.buttonBackgroundSolid,
  selectedTextColor = Colors.sway.dark,
  unselectedTextColor = 'white'
}: SelectableChipProps) => {
  const bg = selected ? selectedBg : unselectedBg;
  const textColor = selected ? selectedTextColor : unselectedTextColor;
  const fontFamily = selected ? Fonts.Bold : Fonts.Regular;
  const borderColor = selected ? selectedBg : Colors.chip.darkCardAlt;

  return (
    <Pressable
      onPress={disabled ? undefined : onPress}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? String(label)}
      accessibilityState={{ selected, disabled: !!disabled }}
      className={`flex-row items-center gap-1 rounded-2xl border px-3 py-1 ${className ?? 'self-start'}`}
      style={({ pressed, hovered }) => ({
        backgroundColor: bg,
        borderColor,
        opacity: disabled ? 0.5 : pressed || hovered ? 0.8 : 1
      })}
    >
      {icon ? <MaterialCommunityIcons name={icon} size={14} color={textColor} /> : null}
      <ThemedText type="small" style={{ color: textColor, fontSize: 12, lineHeight: 16, fontFamily }}>
        {String(label)}
      </ThemedText>
    </Pressable>
  );
};
```

- [ ] **Step 3: Add SelectableChip to exports**

Update the export block:

```tsx
export {
  AccessPolicyChip,
  AssignmentStatusChip,
  CanStartChip,
  DateChip,
  DueChip,
  PendingChip,
  RecurrenceChip,
  SaveProgressChip,
  SelectableChip,
  StatusChip,
  TimeLeftChip
};
```

- [ ] **Step 4: Validate**

Run: `npm run lint`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add components/ui/Chip.tsx
git commit -m "feat(ui): add SelectableChip component"
```

---

### Task 3: Migrate FilterDrawer.tsx

**Files:**

- Modify: `components/ui/FilterDrawer.tsx`

- [ ] **Step 1: Update imports**

Replace the paper `Chip` with `SelectableChip`:

```tsx
import { Button, Divider, IconButton, Portal, Surface, TextInput } from 'react-native-paper';
```

```tsx
import { SelectableChip } from './Chip';
```

- [ ] **Step 2: Fix Dimensions.get → useWindowDimensions**

Remove the static `SCREEN_WIDTH` / `DRAWER_WIDTH` constants at module level (lines 25-26). Inside the component, use the hook:

```tsx
const { width: screenWidth } = useWindowDimensions();
const drawerWidth = Math.min(420, Math.floor(screenWidth * 0.9));
```

Add `useWindowDimensions` to the `react-native` import. Remove `Dimensions` from the import if no longer used.

Update the `Animated.Value` initial value to use `drawerWidth`:

```tsx
const translateX = useRef(new Animated.Value(drawerWidth)).current;
```

Update the animation `useEffect` — add `drawerWidth` to the dependency array so orientation changes trigger re-animation:

```tsx
useEffect(() => {
  Animated.timing(translateX, {
    toValue: visible ? 0 : drawerWidth,
    duration: 220,
    useNativeDriver: true
  }).start();
}, [visible, translateX, drawerWidth]);
```

Update the `drawerContainer` style to use `drawerWidth` instead of `DRAWER_WIDTH`:

```tsx
style={[styles.drawerContainer, { width: drawerWidth, transform: [{ translateX }] }]}
```

Remove the `DRAWER_WIDTH` constant from `styles.drawerContainer` if it was referenced there. Also remove `Dimensions` from the import at line 2.

- [ ] **Step 3: Replace status chips**

Replace lines 114-121 (the status options map):

```tsx
{statusOptions.map((opt) => {
  const selected = (local.status ?? []).includes(opt);
  return (
    <SelectableChip
      key={opt}
      label={opt}
      selected={selected}
      onPress={() => setStatus(opt)}
    />
  );
})}
```

- [ ] **Step 4: Replace module chips**

Replace lines 132-148 (the module chips):

```tsx
<SelectableChip
  label="Any"
  selected={!local.moduleId}
  onPress={() => setLocal((prev) => ({ ...prev, moduleId: undefined }))}
/>
{moduleChoices.map((m) => (
  <SelectableChip
    key={m.id}
    label={m.title}
    selected={local.moduleId === m.id}
    onPress={() => setLocal((prev) => ({ ...prev, moduleId: m.id }))}
  />
))}
```

- [ ] **Step 5: Remove unused chip style**

Remove `chip: { marginRight: 4 }` from the `styles` StyleSheet since `SelectableChip` uses className-based spacing (the parent already has `gap: 8`).

- [ ] **Step 6: Validate**

Run: `npm run lint`
Expected: PASS

- [ ] **Step 7: Commit**

```bash
git add components/ui/FilterDrawer.tsx
git commit -m "refactor(ui): migrate FilterDrawer chips to SelectableChip"
```

---

### Task 4: Migrate RecurrenceField.tsx

**Files:**

- Modify: `components/ui/RecurrenceField.tsx`

- [ ] **Step 1: Update imports**

Replace paper `Chip` in the import:

```tsx
import { Button, Dialog, Portal, SegmentedButtons, TextInput } from 'react-native-paper';
```

Add:

```tsx
import { SelectableChip } from './Chip';
```

- [ ] **Step 2: Replace interval chips**

Replace lines 136-151 (the suggested interval chips):

```tsx
{suggested.map((n) => (
  <SelectableChip
    key={n}
    label={n}
    selected={interval === n}
    onPress={() => pickInterval(n)}
  />
))}
```

- [ ] **Step 3: Validate**

Run: `npm run lint`
Expected: PASS

- [ ] **Step 4: Commit**

```bash
git add components/ui/RecurrenceField.tsx
git commit -m "refactor(ui): migrate RecurrenceField chips to SelectableChip"
```

---

### Task 5: Migrate DayChip.tsx

**Files:**

- Modify: `components/attempts/presenters/diary/DayChip.tsx`

- [ ] **Step 1: Update imports**

Remove paper `Chip`:

```tsx
import { View } from 'react-native';
```

Add:

```tsx
import { SelectableChip } from '@/components/ui/Chip';
```

Remove the `Fonts` import (no longer needed — `SelectableChip` handles font internally).

- [ ] **Step 2: Replace chip usage**

Replace the paper `Chip` (lines 22-36) with `SelectableChip`:

```tsx
<SelectableChip
  label={`${dayLabel(date)} ${date.getDate()}`}
  selected={selected}
  onPress={onPress}
  accessibilityLabel={`${dayLabel(date)} ${date.getDate()}, ${filledCount} of ${slotFills.length} slots filled`}
/>
```

- [ ] **Step 3: Validate**

Run: `npm run lint`
Expected: PASS

- [ ] **Step 4: Commit**

```bash
git add components/attempts/presenters/diary/DayChip.tsx
git commit -m "refactor(ui): migrate DayChip to SelectableChip"
```

---

### Task 6: Migrate ActivityDiaryPresenter.tsx display chips + save button

**Files:**

- Modify: `components/attempts/presenters/diary/ActivityDiaryPresenter.tsx`

- [ ] **Step 1: Update imports**

Replace the paper import — remove `Chip`:

```tsx
import { Card, TextInput } from 'react-native-paper';
```

Update the Chip import to include `StatusChip`:

```tsx
import { SaveProgressChip, StatusChip } from '@/components/ui/Chip';
```

Note: `Pressable` is already imported from `react-native` at line 8 — no change needed there.

- [ ] **Step 2: Replace progress % chip (line 311-316)**

Replace:

```tsx
<Chip
  style={{ backgroundColor: Colors.sway.bright }}
  textStyle={{ color: Colors.sway.dark, fontFamily: Fonts.Bold }}
>
  {`${Math.round(progress * 100)}%`}
</Chip>
```

With:

```tsx
<StatusChip
  label={`${Math.round(progress * 100)}%`}
  color={Colors.sway.dark}
  borderColor={Colors.sway.bright}
  backgroundColor={Colors.sway.bright}
/>
```

- [ ] **Step 3: Replace date display chips in view mode (lines 318-322)**

Replace:

```tsx
<Chip style={{ backgroundColor: Colors.chip.darkCard }} textStyle={{ color: 'white' }}>
  {completedAt
    ? `Completed ${new Date(completedAt).toLocaleDateString()}`
    : `Last Update ${new Date(updatedAt).toLocaleDateString()}`}
</Chip>
```

With:

```tsx
<StatusChip
  label={
    completedAt
      ? `Completed ${new Date(completedAt).toLocaleDateString()}`
      : `Last Update ${new Date(updatedAt).toLocaleDateString()}`
  }
  color="white"
  borderColor={Colors.chip.darkCard}
  backgroundColor={Colors.chip.darkCard}
  icon={completedAt ? 'check-circle-outline' : 'calendar'}
/>
```

- [ ] **Step 4: Replace date display chips in edit mode (lines 325-334)**

Replace the "Started" chip — preserve the `!dirtyKeys.size` guard:

```tsx
{startedAt && !dirtyKeys.size && (
  <StatusChip
    label={`Started ${new Date(startedAt).toLocaleDateString()}`}
    color="white"
    borderColor={Colors.chip.darkCard}
    backgroundColor={Colors.chip.darkCard}
    icon="calendar"
  />
)}
```

Replace the "Updated" chip — preserve the `updatedAt` guard:

```tsx
{updatedAt && (
  <StatusChip
    label={`Updated ${new Date(updatedAt).toLocaleDateString()}`}
    color="white"
    borderColor={Colors.chip.darkCard}
    backgroundColor={Colors.chip.darkCard}
    icon="calendar"
  />
)}
```

- [ ] **Step 5: Replace "Save changes" chip with Pressable button (lines 348-362)**

Replace:

```tsx
{(!!dirtyKeys.size || noteDirty) && (
  <Chip
    icon={() => <MaterialCommunityIcons name="content-save" size={24} color={Colors.chip.green} />}
    mode="outlined"
    textStyle={{ fontFamily: Fonts.Black, color: Colors.chip.green }}
    style={{
      backgroundColor: Colors.sway.buttonBackground,
      borderColor: Colors.chip.greenBorder
    }}
    disabled={!dirtyKeys.size && !noteDirty}
    onPress={saveDirty}
  >
    {dirtyKeys.size || noteDirty ? 'Save changes' : 'Saved'}
  </Chip>
)}
```

With:

```tsx
{(!!dirtyKeys.size || noteDirty) && (
  <Pressable
    onPress={saveDirty}
    disabled={!dirtyKeys.size && !noteDirty}
    accessibilityRole="button"
    accessibilityLabel="Save changes"
    className="flex-row items-center gap-1 self-start rounded-2xl border px-3 py-1.5"
    style={({ pressed, hovered }) => ({
      backgroundColor: Colors.sway.buttonBackground,
      borderColor: Colors.chip.greenBorder,
      opacity: !dirtyKeys.size && !noteDirty ? 0.5 : pressed || hovered ? 0.8 : 1
    })}
  >
    <MaterialCommunityIcons name="content-save" size={16} color={Colors.chip.green} />
    <ThemedText
      type="small"
      style={{ color: Colors.chip.green, fontFamily: Fonts.Black, fontSize: 12, lineHeight: 16 }}
    >
      {dirtyKeys.size || noteDirty ? 'Save changes' : 'Saved'}
    </ThemedText>
  </Pressable>
)}
```

- [ ] **Step 6: Clean up unused imports**

Check if `Fonts` is still used elsewhere in the file. If the only usage was the save chip `textStyle`, and the progress chip `textStyle`, remove the `Fonts` import. (Note: keep it if used elsewhere in the file.)

- [ ] **Step 7: Validate**

Run: `npm run lint`
Expected: PASS

- [ ] **Step 8: Commit**

```bash
git add components/attempts/presenters/diary/ActivityDiaryPresenter.tsx
git commit -m "refactor(ui): migrate ActivityDiaryPresenter chips to StatusChip + Pressable"
```

---

### Task 7: Migrate QuestionnairePresenter.tsx

**Files:**

- Modify: `components/attempts/presenters/questionnaires/QuestionnairePresenter.tsx`

- [ ] **Step 1: Update imports**

Replace the paper import — remove `Chip`:

```tsx
import { Card, Divider, ProgressBar } from 'react-native-paper';
```

Add `StatusChip` import:

```tsx
import { SaveProgressChip, StatusChip } from '@/components/ui/Chip';
```

- [ ] **Step 2: Replace bandChip (lines 142-150)**

Replace:

```tsx
const bandChip = useMemo(() => {
  if (mode !== 'view' || totalScore == null) return null;
  return (
    <Chip
      mode="flat"
      elevated
      style={{ backgroundColor: Colors.primary.accent }}
      textStyle={{ color: Colors.sway.dark }}
    >
      {scoreBandLabel ?? band?.label ?? '–'} {typeof totalScore === 'number' ? `• Score: ${totalScore}` : ''}
    </Chip>
  );
}, [band?.label, mode, scoreBandLabel, totalScore]);
```

With:

```tsx
const bandChip = useMemo(() => {
  if (mode !== 'view' || totalScore == null) return null;
  const scoreText = typeof totalScore === 'number' ? ` • Score: ${totalScore}` : '';
  return (
    <StatusChip
      label={`${scoreBandLabel ?? band?.label ?? '–'}${scoreText}`}
      color={Colors.sway.dark}
      borderColor={Colors.primary.accent}
      backgroundColor={Colors.primary.accent}
    />
  );
}, [band?.label, mode, scoreBandLabel, totalScore]);
```

- [ ] **Step 3: Replace "Completed" / "In progress" / "Duration" chips (lines 203-216)**

Replace the entire chip row block:

```tsx
{mode === 'view' ? (
  <StatusChip
    label={`Completed ${new Date(completedAt ?? '').toLocaleDateString()}`}
    color="white"
    borderColor={Colors.chip.darkCard}
    backgroundColor={Colors.chip.darkCard}
    icon="check-circle-outline"
  />
) : (
  <StatusChip
    label={`In progress${startedAt ? ` • ${new Date(startedAt).toLocaleDateString()}` : ''}`}
    color="white"
    borderColor={Colors.chip.darkCard}
    backgroundColor={Colors.chip.darkCard}
    icon="progress-clock"
  />
)}
{durationText ? (
  <StatusChip
    label={`Duration ${durationText}`}
    color="white"
    borderColor={Colors.chip.darkCard}
    backgroundColor={Colors.chip.darkCard}
    icon="clock-outline"
  />
) : null}
```

- [ ] **Step 4: Validate**

Run: `npm run lint`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add components/attempts/presenters/questionnaires/QuestionnairePresenter.tsx
git commit -m "refactor(ui): migrate QuestionnairePresenter chips to StatusChip"
```

---

### Task 8: Migrate QuestionSlide.tsx

**Files:**

- Modify: `components/attempts/presenters/questionnaires/QuestionSlide.tsx`

- [ ] **Step 1: Update imports**

Replace the paper import — remove `Chip`:

```tsx
import { Card } from 'react-native-paper';
```

Add:

```tsx
import { SelectableChip } from '@/components/ui/Chip';
```

Remove the `Fonts` import (handled internally by `SelectableChip`).

- [ ] **Step 2: Replace answer option pills (lines 30-58)**

Replace:

```tsx
const pills = useMemo(
  () =>
    choices.map((c, idx) => {
      const selectedPill = selected === idx;
      return (
        <Chip
          key={`${question.questionId}-${idx}`}
          mode={selectedPill ? 'flat' : 'outlined'}
          selected={!!selectedPill}
          disabled={disabled}
          showSelectedCheck={false}
          compact
          style={{
            backgroundColor: selectedPill ? colors?.accent : colors?.card,
            borderColor: selectedPill ? colors?.accent : Colors.chip.darkCardAlt,
            marginRight: 8,
            marginBottom: 8
          }}
          textStyle={{
            color: selectedPill ? Colors.chip.darkCardDeep : colors?.textOnDark,
            fontFamily: selectedPill ? Fonts.Bold : Fonts.Regular,
            fontSize: 14
          }}
          onPress={() => {
            if (disabled) return;
            onPick?.(question, { score: c.score, index: idx, text: c.text });
          }}
        >
          {c.text}
        </Chip>
      );
    }),
  [choices, colors?.accent, colors?.card, colors?.textOnDark, disabled, onPick, question, selected]
);
```

With:

```tsx
const pills = useMemo(
  () =>
    choices.map((c, idx) => {
      const selectedPill = selected === idx;
      return (
        <SelectableChip
          key={`${question.questionId}-${idx}`}
          label={c.text}
          selected={selectedPill}
          disabled={disabled}
          onPress={() => onPick?.(question, { score: c.score, index: idx, text: c.text })}
          selectedBg={colors?.accent}
          unselectedBg={colors?.card}
          selectedTextColor={Colors.chip.darkCardDeep}
          unselectedTextColor={colors?.textOnDark}
          className="mb-2 mr-2 self-start"
        />
      );
    }),
  [choices, colors?.accent, colors?.card, colors?.textOnDark, disabled, onPick, question, selected]
);
```

- [ ] **Step 3: Validate**

Run: `npm run lint`
Expected: PASS

- [ ] **Step 4: Commit**

```bash
git add components/attempts/presenters/questionnaires/QuestionSlide.tsx
git commit -m "refactor(ui): migrate QuestionSlide answer pills to SelectableChip"
```

---

### Task 9: Final validation and formatting

- [ ] **Step 1: Run eslint fix**

Run: `npx eslint --fix .`

- [ ] **Step 2: Run prettier**

Run: `npx prettier --write .`

- [ ] **Step 3: Run full lint validation**

Run: `npm run lint`
Expected: PASS — zero errors across the whole project

- [ ] **Step 4: Verify no remaining paper Chip imports**

Run: `grep -r "Chip" --include="*.tsx" components/ | grep "react-native-paper" | grep "Chip"`
Expected: No results — all paper `Chip` usage should be gone.

- [ ] **Step 5: Commit any formatting changes**

```bash
git add -A
git commit -m "style: format after chip migration"
```
