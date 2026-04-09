# Activity Diary Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the current scrollable card-list activity diary with an accordion layout, progress ring day navigation, custom mood slider, and metric steppers — all touch-only, no keyboard for numeric inputs.

**Architecture:** The diary presenter is restructured around an accordion pattern (one expanded slot at a time) with auto-advance. New atomic input components (`MoodSlider`, `MetricStepper`, `ProgressRing`) replace the old `NumericField` and `DayChip`. State management (`useDiaryState`) gets a small addition for auto-advance detection; navigation hook (`useDiaryNavigation`) is rewritten to manage accordion state instead of FlatList refs.

**Tech Stack:** React Native, Expo SDK 54, NativeWind, react-native-reanimated 4.x, react-native-gesture-handler 2.x, react-native-svg 15.x, expo-haptics

**Spec:** `docs/superpowers/specs/2026-04-08-activity-diary-redesign.md`

---

## File Map

| File | Action | Responsibility |
|------|--------|---------------|
| `components/attempts/presenters/diary/ProgressRing.tsx` | Create | SVG ring with animated fill stroke |
| `components/attempts/presenters/diary/ProgressRing.test.tsx` | Create | Tests for ProgressRing |
| `components/attempts/presenters/diary/DayRingBar.tsx` | Create | Row of 7 ProgressRings, replaces DayNavBar |
| `components/attempts/presenters/diary/DayRingBar.test.tsx` | Create | Tests for DayRingBar |
| `components/attempts/presenters/diary/MoodSlider.tsx` | Create | Custom gesture-driven mood slider (0-100) |
| `components/attempts/presenters/diary/MoodSlider.test.tsx` | Create | Tests for MoodSlider |
| `components/attempts/presenters/diary/MetricStepper.tsx` | Create | +/− stepper with long-press, haptics |
| `components/attempts/presenters/diary/MetricStepper.test.tsx` | Create | Tests for MetricStepper |
| `components/attempts/presenters/diary/SlotAccordionRow.tsx` | Create | Collapsed slot row |
| `components/attempts/presenters/diary/SlotAccordionPanel.tsx` | Create | Expanded slot content |
| `components/attempts/presenters/diary/SlotAccordion.test.tsx` | Create | Tests for accordion row + panel |
| `components/attempts/presenters/diary/useDiaryNavigation.ts` | Rewrite | Accordion expand/collapse state (replaces FlatList nav) |
| `components/attempts/presenters/diary/useDiaryNavigation.test.ts` | Create | Tests for new accordion navigation hook |
| `utils/activityHelpers.ts` | Modify | Add `isSlotComplete()` helper for auto-advance |
| `utils/activityHelpers.test.ts` | Modify | Tests for `isSlotComplete()` |
| `components/attempts/presenters/diary/ActivityDiaryPresenter.tsx` | Rewrite | Accordion layout, new components |
| `components/attempts/presenters/diary/DiaryHeader.tsx` | Rewrite | Simplified — no progress chip, no reflection prompt |
| `components/attempts/presenters/diary/DiaryFooter.tsx` | Rewrite | Restyled with new button hierarchy |
| `components/attempts/presenters/diary/WeeklySummary.tsx` | Modify | Restyle, add conditional rendering, 4-column grid |
| `components/attempts/presenters/diary/ReflectionPrompt.tsx` | Modify | Restyle for accordion context |
| `components/attempts/presenters/diary/useDiaryState.ts` | Modify | Expose `slotFillCounts` for rings |
| `components/attempts/presenters/diary/useDiaryState.test.ts` | Modify | Add tests for `slotFillCounts` |

**Files to delete after all tasks complete:**
- `components/attempts/presenters/diary/SlotCard.tsx`
- `components/attempts/presenters/diary/NumericField.tsx`
- `components/attempts/presenters/diary/DayNavBar.tsx`
- `components/attempts/presenters/diary/DayChip.tsx`
- `components/attempts/presenters/diary/DiaryInputToolbar.tsx`

---

### Task 1: Add `isSlotComplete` helper

**Files:**
- Modify: `utils/activityHelpers.ts:70-71`
- Modify: `utils/activityHelpers.test.ts`

- [ ] **Step 1: Write the failing test**

Add to `utils/activityHelpers.test.ts`:

```typescript
import {
  buildDaySlots,
  dateISO,
  isSlotComplete,
  isSlotFilled,
  moodColor,
  slotLabel,
  startOfMonday,
  type SlotValue
} from './activityHelpers';

// ... existing tests ...

describe('isSlotComplete', () => {
  const emptySlot: SlotValue = { at: new Date('2025-01-06T06:00:00Z'), label: '06:00–08:00', activity: '' };

  it('returns false for empty slot', () => {
    expect(isSlotComplete(emptySlot)).toBe(false);
  });

  it('returns false when only activity is filled', () => {
    expect(isSlotComplete({ ...emptySlot, activity: 'Walking' })).toBe(false);
  });

  it('returns false when mood is missing', () => {
    expect(isSlotComplete({ ...emptySlot, activity: 'Walking', achievement: 5, closeness: 5, enjoyment: 5 })).toBe(false);
  });

  it('returns false when one stepper is missing', () => {
    expect(isSlotComplete({ ...emptySlot, activity: 'Walking', mood: 50, achievement: 5, closeness: 5 })).toBe(false);
  });

  it('returns true when all fields are filled', () => {
    expect(isSlotComplete({ ...emptySlot, activity: 'Walking', mood: 50, achievement: 5, closeness: 5, enjoyment: 5 })).toBe(true);
  });

  it('returns false when activity is only whitespace', () => {
    expect(isSlotComplete({ ...emptySlot, activity: '   ', mood: 50, achievement: 5, closeness: 5, enjoyment: 5 })).toBe(false);
  });

  it('returns true when mood is 0 (explicitly set)', () => {
    expect(isSlotComplete({ ...emptySlot, activity: 'Resting', mood: 0, achievement: 0, closeness: 0, enjoyment: 0 })).toBe(true);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx jest utils/activityHelpers.test.ts --no-coverage -t "isSlotComplete"`
Expected: FAIL with "isSlotComplete is not exported"

- [ ] **Step 3: Write minimal implementation**

Add to `utils/activityHelpers.ts` after the `isSlotFilled` export:

```typescript
export const isSlotComplete = (v: SlotValue): boolean =>
  v.activity.trim().length > 0 &&
  v.mood != null &&
  v.achievement != null &&
  v.closeness != null &&
  v.enjoyment != null;
```

Update the export line at the bottom to include `isSlotComplete`.

- [ ] **Step 4: Run test to verify it passes**

Run: `npx jest utils/activityHelpers.test.ts --no-coverage -t "isSlotComplete"`
Expected: PASS

- [ ] **Step 5: Commit**

```
feat(diary): add isSlotComplete helper for auto-advance detection
```

---

### Task 2: Add `slotFillCounts` to `useDiaryState`

**Files:**
- Modify: `components/attempts/presenters/diary/useDiaryState.ts:117-126`
- Modify: `components/attempts/presenters/diary/useDiaryState.test.ts`

The progress rings need a count of filled slots per day (not just booleans). Add a `slotFillCounts` computed value.

- [ ] **Step 1: Write the failing test**

Add to `useDiaryState.test.ts`:

```typescript
it('computes slotFillCounts for each day', () => {
  const attempt = makeAttempt();
  const { result } = renderHook(() => useDiaryState({ attempt, mode: 'edit' }));

  // All days start at 0
  const firstDayISO = result.current.activeDayISO;
  expect(result.current.slotFillCounts[firstDayISO]).toBe(0);

  // Fill one slot
  const firstSlotKey = result.current.dayRows[0]?.key;
  act(() => {
    result.current.updateSlot(firstSlotKey, { activity: 'Walk' });
  });

  expect(result.current.slotFillCounts[firstDayISO]).toBe(1);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx jest components/attempts/presenters/diary/useDiaryState.test.ts --no-coverage -t "slotFillCounts"`
Expected: FAIL — `slotFillCounts` is undefined

- [ ] **Step 3: Write minimal implementation**

In `useDiaryState.ts`, add after the `slotFillsByDay` memo (around line 126):

```typescript
const slotFillCounts = useMemo(
  () =>
    Object.fromEntries(
      Object.entries(slotFillsByDay).map(([iso, fills]) => [iso, fills.filter(Boolean).length])
    ) as Record<string, number>,
  [slotFillsByDay]
);
```

Add `slotFillCounts` to the return object.

- [ ] **Step 4: Run test to verify it passes**

Run: `npx jest components/attempts/presenters/diary/useDiaryState.test.ts --no-coverage -t "slotFillCounts"`
Expected: PASS

- [ ] **Step 5: Run all diary state tests**

Run: `npx jest components/attempts/presenters/diary/useDiaryState.test.ts --no-coverage`
Expected: All existing tests still pass

- [ ] **Step 6: Commit**

```
feat(diary): add slotFillCounts to useDiaryState for progress rings
```

---

### Task 3: Build `ProgressRing` component

**Files:**
- Create: `components/attempts/presenters/diary/ProgressRing.tsx`
- Create: `components/attempts/presenters/diary/ProgressRing.test.tsx`

- [ ] **Step 1: Write the failing test**

Create `components/attempts/presenters/diary/ProgressRing.test.tsx`:

```typescript
import { render } from '@testing-library/react-native';

import ProgressRing from './ProgressRing';

describe('ProgressRing', () => {
  it('renders with 0 fill', () => {
    const { getByLabelText } = render(
      <ProgressRing dateNumber={7} dayLabel="Mon" filledCount={0} totalCount={9} isActive={false} onPress={jest.fn()} />
    );
    expect(getByLabelText('Mon 7, 0 of 9 slots filled')).toBeTruthy();
  });

  it('renders with partial fill', () => {
    const { getByLabelText } = render(
      <ProgressRing dateNumber={8} dayLabel="Tue" filledCount={4} totalCount={9} isActive={false} onPress={jest.fn()} />
    );
    expect(getByLabelText('Tue 8, 4 of 9 slots filled')).toBeTruthy();
  });

  it('renders active state', () => {
    const { getByLabelText } = render(
      <ProgressRing dateNumber={9} dayLabel="Wed" filledCount={2} totalCount={9} isActive={true} onPress={jest.fn()} />
    );
    expect(getByLabelText('Wed 9, 2 of 9 slots filled')).toBeTruthy();
  });

  it('calls onPress when tapped', () => {
    const onPress = jest.fn();
    const { getByLabelText } = render(
      <ProgressRing dateNumber={7} dayLabel="Mon" filledCount={0} totalCount={9} isActive={false} onPress={onPress} />
    );
    const ring = getByLabelText('Mon 7, 0 of 9 slots filled');
    ring.props.onPress();
    expect(onPress).toHaveBeenCalledTimes(1);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx jest components/attempts/presenters/diary/ProgressRing.test.tsx --no-coverage`
Expected: FAIL — module not found

- [ ] **Step 3: Write the component**

Create `components/attempts/presenters/diary/ProgressRing.tsx`:

```typescript
import { memo } from 'react';
import { Pressable, View } from 'react-native';
import Animated, { useAnimatedProps, useDerivedValue, withSpring } from 'react-native-reanimated';
import Svg, { Circle } from 'react-native-svg';
import { ThemedText } from '@/components/ThemedText';
import { Colors } from '@/constants/Colors';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

const RING_SIZE = 38;
const ACTIVE_RING_SIZE = 42;
const STROKE_WIDTH = 2.5;

type ProgressRingProps = {
  dateNumber: number;
  dayLabel: string;
  filledCount: number;
  totalCount: number;
  isActive: boolean;
  onPress: () => void;
};

const ProgressRing = memo(
  ({ dateNumber, dayLabel, filledCount, totalCount, isActive, onPress }: ProgressRingProps) => {
    const size = isActive ? ACTIVE_RING_SIZE : RING_SIZE;
    const radius = size / 2 - STROKE_WIDTH;
    const circumference = 2 * Math.PI * radius;

    const progress = useDerivedValue(() => (totalCount > 0 ? filledCount / totalCount : 0));

    const animatedProps = useAnimatedProps(() => ({
      strokeDashoffset: circumference * (1 - withSpring(progress.value, { damping: 15 }))
    }));

    const isComplete = filledCount === totalCount;

    return (
      <Pressable
        onPress={onPress}
        accessibilityRole="button"
        accessibilityLabel={`${dayLabel} ${dateNumber}, ${filledCount} of ${totalCount} slots filled`}
        style={{ alignItems: 'center' }}
      >
        <ThemedText
          style={{
            fontSize: 10,
            marginBottom: 5,
            color: isActive ? Colors.sway.bright : Colors.sway.darkGrey,
            fontWeight: isActive ? '700' : '400'
          }}
        >
          {dayLabel}
        </ThemedText>
        <View style={{ width: size, height: size }}>
          <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
            {/* Background fill for active day */}
            {isActive && (
              <Circle
                cx={size / 2}
                cy={size / 2}
                r={radius}
                fill="rgba(24,205,186,0.08)"
                stroke="rgba(24,205,186,0.25)"
                strokeWidth={1.5}
              />
            )}
            {/* Track */}
            <Circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              fill="none"
              stroke={Colors.chip.pill}
              strokeWidth={STROKE_WIDTH}
            />
            {/* Progress arc */}
            {filledCount > 0 && (
              <AnimatedCircle
                cx={size / 2}
                cy={size / 2}
                r={radius}
                fill="none"
                stroke={Colors.sway.bright}
                strokeWidth={STROKE_WIDTH}
                strokeDasharray={circumference}
                animatedProps={animatedProps}
                strokeLinecap="round"
                rotation={-90}
                origin={`${size / 2}, ${size / 2}`}
              />
            )}
          </Svg>
          {/* Date number overlay */}
          <View
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <ThemedText
              style={{
                fontSize: isActive ? 13 : 12,
                fontWeight: isActive || isComplete ? '700' : '600',
                color: isActive || isComplete ? Colors.sway.bright : filledCount > 0 ? Colors.sway.darkGrey : Colors.chip.dotInactive
              }}
            >
              {dateNumber}
            </ThemedText>
          </View>
        </View>
      </Pressable>
    );
  }
);

ProgressRing.displayName = 'ProgressRing';

export default ProgressRing;
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx jest components/attempts/presenters/diary/ProgressRing.test.tsx --no-coverage`
Expected: PASS

- [ ] **Step 5: Commit**

```
feat(diary): add ProgressRing component with animated SVG fill
```

---

### Task 4: Build `DayRingBar` component

**Files:**
- Create: `components/attempts/presenters/diary/DayRingBar.tsx`
- Create: `components/attempts/presenters/diary/DayRingBar.test.tsx`

- [ ] **Step 1: Write the failing test**

Create `components/attempts/presenters/diary/DayRingBar.test.tsx`:

```typescript
import { render, fireEvent } from '@testing-library/react-native';
import { dateISO, dayLabel } from '@/utils/activityHelpers';

import DayRingBar from './DayRingBar';

const makeDays = (): Date[] => {
  const mon = new Date('2025-01-06T00:00:00.000Z');
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(mon);
    d.setDate(mon.getDate() + i);
    return d;
  });
};

const TOTAL_SLOTS = 9;

describe('DayRingBar', () => {
  const days = makeDays();
  const activeDayISO = dateISO(days[0]);
  const slotFillCounts: Record<string, number> = {};
  days.forEach((d) => {
    slotFillCounts[dateISO(d)] = 0;
  });

  it('renders 7 day rings', () => {
    const { getAllByRole } = render(
      <DayRingBar
        days={days}
        activeDayISO={activeDayISO}
        slotFillCounts={slotFillCounts}
        totalSlots={TOTAL_SLOTS}
        onSelectDay={jest.fn()}
      />
    );
    expect(getAllByRole('button')).toHaveLength(7);
  });

  it('calls onSelectDay when a ring is tapped', () => {
    const onSelectDay = jest.fn();
    const { getByLabelText } = render(
      <DayRingBar
        days={days}
        activeDayISO={activeDayISO}
        slotFillCounts={slotFillCounts}
        totalSlots={TOTAL_SLOTS}
        onSelectDay={onSelectDay}
      />
    );
    const tuesdayLabel = `${dayLabel(days[1])} ${days[1].getDate()}, 0 of 9 slots filled`;
    fireEvent.press(getByLabelText(tuesdayLabel));
    expect(onSelectDay).toHaveBeenCalledWith(dateISO(days[1]));
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx jest components/attempts/presenters/diary/DayRingBar.test.tsx --no-coverage`
Expected: FAIL — module not found

- [ ] **Step 3: Write the component**

Create `components/attempts/presenters/diary/DayRingBar.tsx`:

```typescript
import { memo, useCallback } from 'react';
import { View } from 'react-native';
import { Colors } from '@/constants/Colors';
import { dateISO, dayLabel } from '@/utils/activityHelpers';

import ProgressRing from './ProgressRing';

type DayRingBarProps = {
  days: Date[];
  activeDayISO: string;
  slotFillCounts: Record<string, number>;
  totalSlots: number;
  onSelectDay: (iso: string) => void;
};

const DayRingBar = memo(({ days, activeDayISO, slotFillCounts, totalSlots, onSelectDay }: DayRingBarProps) => {
  const handlePress = useCallback(
    (iso: string) => () => onSelectDay(iso),
    [onSelectDay]
  );

  return (
    <View
      style={{ borderBottomWidth: 1, borderBottomColor: 'rgba(30,42,69,0.6)' }}
      className="flex-row items-center justify-between bg-sway-dark px-4 pb-4 pt-3"
    >
      {days.map((d) => {
        const iso = dateISO(d);
        return (
          <ProgressRing
            key={iso}
            dateNumber={d.getDate()}
            dayLabel={dayLabel(d)}
            filledCount={slotFillCounts[iso] ?? 0}
            totalCount={totalSlots}
            isActive={iso === activeDayISO}
            onPress={handlePress(iso)}
          />
        );
      })}
    </View>
  );
});

DayRingBar.displayName = 'DayRingBar';

export default DayRingBar;
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx jest components/attempts/presenters/diary/DayRingBar.test.tsx --no-coverage`
Expected: PASS

- [ ] **Step 5: Commit**

```
feat(diary): add DayRingBar with progress rings replacing DayNavBar
```

---

### Task 5: Build `MetricStepper` component

**Files:**
- Create: `components/attempts/presenters/diary/MetricStepper.tsx`
- Create: `components/attempts/presenters/diary/MetricStepper.test.tsx`

- [ ] **Step 1: Write the failing test**

Create `components/attempts/presenters/diary/MetricStepper.test.tsx`:

```typescript
import { render, fireEvent, act } from '@testing-library/react-native';

import MetricStepper from './MetricStepper';

jest.mock('expo-haptics', () => ({
  impactAsync: jest.fn(() => Promise.resolve()),
  ImpactFeedbackStyle: { Light: 'light' }
}));

describe('MetricStepper', () => {
  it('renders null value as dash', () => {
    const { getByText } = render(
      <MetricStepper label="Achievement" value={undefined} color="#a78bfa" onChange={jest.fn()} disabled={false} />
    );
    expect(getByText('—')).toBeTruthy();
  });

  it('renders numeric value', () => {
    const { getByText } = render(
      <MetricStepper label="Achievement" value={7} color="#a78bfa" onChange={jest.fn()} disabled={false} />
    );
    expect(getByText('7')).toBeTruthy();
  });

  it('sets value to 5 on first tap when null', () => {
    const onChange = jest.fn();
    const { getByLabelText } = render(
      <MetricStepper label="Achievement" value={undefined} color="#a78bfa" onChange={onChange} disabled={false} />
    );
    fireEvent.press(getByLabelText('Increase Achievement'));
    expect(onChange).toHaveBeenCalledWith(5);
  });

  it('increments value by 1', () => {
    const onChange = jest.fn();
    const { getByLabelText } = render(
      <MetricStepper label="Achievement" value={7} color="#a78bfa" onChange={onChange} disabled={false} />
    );
    fireEvent.press(getByLabelText('Increase Achievement'));
    expect(onChange).toHaveBeenCalledWith(8);
  });

  it('decrements value by 1', () => {
    const onChange = jest.fn();
    const { getByLabelText } = render(
      <MetricStepper label="Achievement" value={7} color="#a78bfa" onChange={onChange} disabled={false} />
    );
    fireEvent.press(getByLabelText('Decrease Achievement'));
    expect(onChange).toHaveBeenCalledWith(6);
  });

  it('clamps at max 10', () => {
    const onChange = jest.fn();
    const { getByLabelText } = render(
      <MetricStepper label="Achievement" value={10} color="#a78bfa" onChange={onChange} disabled={false} />
    );
    fireEvent.press(getByLabelText('Increase Achievement'));
    expect(onChange).not.toHaveBeenCalled();
  });

  it('clamps at min 0', () => {
    const onChange = jest.fn();
    const { getByLabelText } = render(
      <MetricStepper label="Achievement" value={0} color="#a78bfa" onChange={onChange} disabled={false} />
    );
    fireEvent.press(getByLabelText('Decrease Achievement'));
    expect(onChange).not.toHaveBeenCalled();
  });

  it('does not respond when disabled', () => {
    const onChange = jest.fn();
    const { getByLabelText } = render(
      <MetricStepper label="Achievement" value={5} color="#a78bfa" onChange={onChange} disabled={true} />
    );
    fireEvent.press(getByLabelText('Increase Achievement'));
    expect(onChange).not.toHaveBeenCalled();
  });

  it('renders read-only value without buttons when disabled', () => {
    const { queryByLabelText, getByText } = render(
      <MetricStepper label="Achievement" value={7} color="#a78bfa" onChange={jest.fn()} disabled={true} />
    );
    expect(getByText('7')).toBeTruthy();
    expect(queryByLabelText('Increase Achievement')).toBeNull();
    expect(queryByLabelText('Decrease Achievement')).toBeNull();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx jest components/attempts/presenters/diary/MetricStepper.test.tsx --no-coverage`
Expected: FAIL — module not found

- [ ] **Step 3: Write the component**

Create `components/attempts/presenters/diary/MetricStepper.tsx`:

```typescript
import { memo, useCallback, useRef } from 'react';
import { Pressable, View } from 'react-native';
import * as Haptics from 'expo-haptics';
import Animated, { useAnimatedStyle, useSharedValue, withSequence, withTiming } from 'react-native-reanimated';
import { ThemedText } from '@/components/ThemedText';
import { Colors } from '@/constants/Colors';

const MIN = 0;
const MAX = 10;
const MIDPOINT = 5;
const LONG_PRESS_DELAY = 400;
const REPEAT_INTERVAL = 150;

type MetricStepperProps = {
  label: string;
  value: number | undefined;
  color: string;
  onChange: (value: number) => void;
  disabled: boolean;
};

const MetricStepper = memo(({ label, value, color, onChange, disabled }: MetricStepperProps) => {
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const scale = useSharedValue(1);

  const animatedValueStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }]
  }));

  const pulse = useCallback(() => {
    scale.value = withSequence(withTiming(1.15, { duration: 75 }), withTiming(1, { duration: 75 }));
  }, [scale]);

  const haptic = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
  }, []);

  const clearRepeat = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  const step = useCallback(
    (direction: 1 | -1) => {
      if (value == null) {
        onChange(MIDPOINT);
        pulse();
        haptic();
        return;
      }
      const next = value + direction;
      if (next < MIN || next > MAX) return;
      onChange(next);
      pulse();
      haptic();
    },
    [value, onChange, pulse, haptic]
  );

  const startRepeat = useCallback(
    (direction: 1 | -1) => {
      clearRepeat();
      intervalRef.current = setInterval(() => step(direction), REPEAT_INTERVAL);
    },
    [step, clearRepeat]
  );

  if (disabled) {
    return (
      <View
        style={{ backgroundColor: Colors.sway.dark, borderRadius: 10, padding: 10 }}
        accessibilityRole="text"
        accessibilityLabel={`${label}: ${value ?? 'not set'}`}
      >
        <ThemedText style={{ color: Colors.sway.darkGrey, fontSize: 10, textAlign: 'center', marginBottom: 8 }}>
          {label}
        </ThemedText>
        <ThemedText style={{ color: value != null ? color : Colors.chip.dotInactive, fontSize: 20, fontWeight: '700', textAlign: 'center' }}>
          {value != null ? value : '—'}
        </ThemedText>
      </View>
    );
  }

  return (
    <View style={{ backgroundColor: Colors.sway.dark, borderRadius: 10, padding: 10 }}>
      <ThemedText style={{ color: Colors.sway.darkGrey, fontSize: 10, textAlign: 'center', marginBottom: 8 }}>
        {label}
      </ThemedText>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
        <Pressable
          onPress={() => step(-1)}
          onLongPress={() => startRepeat(-1)}
          onPressOut={clearRepeat}
          delayLongPress={LONG_PRESS_DELAY}
          accessibilityLabel={`Decrease ${label}`}
          accessibilityRole="button"
          style={{
            width: 28,
            height: 28,
            borderRadius: 8,
            backgroundColor: Colors.chip.pill,
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          <ThemedText style={{ color: Colors.sway.darkGrey, fontSize: 16 }}>−</ThemedText>
        </Pressable>

        <Animated.View style={animatedValueStyle}>
          <ThemedText
            style={{
              color: value != null ? color : Colors.chip.dotInactive,
              fontSize: 20,
              fontWeight: '700',
              minWidth: 18,
              textAlign: 'center'
            }}
          >
            {value != null ? value : '—'}
          </ThemedText>
        </Animated.View>

        <Pressable
          onPress={() => step(1)}
          onLongPress={() => startRepeat(1)}
          onPressOut={clearRepeat}
          delayLongPress={LONG_PRESS_DELAY}
          accessibilityLabel={`Increase ${label}`}
          accessibilityRole="button"
          style={{
            width: 28,
            height: 28,
            borderRadius: 8,
            backgroundColor: Colors.chip.pill,
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          <ThemedText style={{ color: Colors.sway.darkGrey, fontSize: 16 }}>+</ThemedText>
        </Pressable>
      </View>
    </View>
  );
});

MetricStepper.displayName = 'MetricStepper';

export default MetricStepper;
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx jest components/attempts/presenters/diary/MetricStepper.test.tsx --no-coverage`
Expected: PASS

- [ ] **Step 5: Commit**

```
feat(diary): add MetricStepper with long-press, haptics, and pulse animation
```

---

### Task 6: Build `MoodSlider` component

**Files:**
- Create: `components/attempts/presenters/diary/MoodSlider.tsx`
- Create: `components/attempts/presenters/diary/MoodSlider.test.tsx`

- [ ] **Step 1: Write the failing test**

Create `components/attempts/presenters/diary/MoodSlider.test.tsx`:

```typescript
import { render } from '@testing-library/react-native';

import MoodSlider from './MoodSlider';

jest.mock('react-native-gesture-handler', () => {
  const { View } = require('react-native');
  return {
    GestureDetector: ({ children }: { children: React.ReactNode }) => children,
    Gesture: {
      Pan: () => ({
        onStart: () => ({ onUpdate: () => ({ onEnd: () => ({}) }) }),
        onUpdate: () => ({ onEnd: () => ({}) }),
        onEnd: () => ({})
      })
    }
  };
});

describe('MoodSlider', () => {
  it('renders with null value showing no thumb', () => {
    const { getByLabelText } = render(
      <MoodSlider value={undefined} onChange={jest.fn()} disabled={false} />
    );
    expect(getByLabelText('Mood slider, not set')).toBeTruthy();
  });

  it('renders with a value', () => {
    const { getByLabelText, getByText } = render(
      <MoodSlider value={65} onChange={jest.fn()} disabled={false} />
    );
    expect(getByLabelText('Mood slider, value 65')).toBeTruthy();
    expect(getByText('65')).toBeTruthy();
  });

  it('renders Low and High labels', () => {
    const { getByText } = render(
      <MoodSlider value={50} onChange={jest.fn()} disabled={false} />
    );
    expect(getByText('Low')).toBeTruthy();
    expect(getByText('High')).toBeTruthy();
  });

  it('renders read-only bar when disabled', () => {
    const { getByLabelText } = render(
      <MoodSlider value={72} onChange={jest.fn()} disabled={true} />
    );
    expect(getByLabelText('Mood: 72')).toBeTruthy();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx jest components/attempts/presenters/diary/MoodSlider.test.tsx --no-coverage`
Expected: FAIL — module not found

- [ ] **Step 3: Write the component**

Create `components/attempts/presenters/diary/MoodSlider.tsx`:

```typescript
import { memo, useCallback } from 'react';
import { View, useWindowDimensions } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  interpolateColor,
  runOnJS,
  useAnimatedStyle,
  useSharedValue
} from 'react-native-reanimated';
import { Defs, LinearGradient, Rect, Stop, Svg } from 'react-native-svg';
import { ThemedText } from '@/components/ThemedText';
import { Colors } from '@/constants/Colors';

const TRACK_HEIGHT = 8;
const THUMB_SIZE = 24;
const HORIZONTAL_PADDING = 32; // px-4 on each side of the parent

type MoodSliderProps = {
  value: number | undefined;
  onChange: (value: number) => void;
  disabled: boolean;
};

const MoodSlider = memo(({ value, onChange, disabled }: MoodSliderProps) => {
  const { width: screenWidth } = useWindowDimensions();
  // Approximate usable track width (screen width - parent padding - own padding)
  const trackWidth = screenWidth - HORIZONTAL_PADDING * 2 - 32;

  const thumbX = useSharedValue(value != null ? (value / 100) * trackWidth : 0);
  const isActive = useSharedValue(false);

  const commitValue = useCallback(
    (x: number) => {
      const clamped = Math.max(0, Math.min(trackWidth, x));
      const val = Math.round((clamped / trackWidth) * 100);
      onChange(val);
    },
    [trackWidth, onChange]
  );

  const panGesture = Gesture.Pan()
    .onStart((e) => {
      isActive.value = true;
      thumbX.value = Math.max(0, Math.min(trackWidth, e.x));
    })
    .onUpdate((e) => {
      thumbX.value = Math.max(0, Math.min(trackWidth, e.x));
    })
    .onEnd(() => {
      isActive.value = false;
      runOnJS(commitValue)(thumbX.value);
    });

  const thumbStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: thumbX.value - THUMB_SIZE / 2 }]
  }));

  const fillStyle = useAnimatedStyle(() => ({
    width: thumbX.value
  }));

  // Disabled / view mode — just show a static bar
  if (disabled) {
    const fillPercent = value != null ? value : 0;
    return (
      <View accessibilityLabel={`Mood: ${value ?? 'not set'}`}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
          <ThemedText style={{ color: Colors.sway.lightGrey, fontSize: 13, fontWeight: '600' }}>Mood</ThemedText>
          <ThemedText style={{ color: value != null ? Colors.sway.bright : Colors.chip.dotInactive, fontSize: 15, fontWeight: '700' }}>
            {value != null ? value : '—'}
          </ThemedText>
        </View>
        <View style={{ height: TRACK_HEIGHT, backgroundColor: Colors.chip.pill, borderRadius: TRACK_HEIGHT / 2, overflow: 'hidden' }}>
          {value != null && (
            <View style={{ width: `${fillPercent}%`, height: '100%', borderRadius: TRACK_HEIGHT / 2, overflow: 'hidden' }}>
              <Svg width="100%" height={TRACK_HEIGHT}>
                <Defs>
                  <LinearGradient id="moodGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                    <Stop offset="0%" stopColor={Colors.diary.moodCool} />
                    <Stop offset="100%" stopColor={Colors.diary.moodWarm} />
                  </LinearGradient>
                </Defs>
                <Rect width="100%" height={TRACK_HEIGHT} fill="url(#moodGrad)" />
              </Svg>
            </View>
          )}
        </View>
      </View>
    );
  }

  return (
    <View
      accessibilityRole="adjustable"
      accessibilityLabel={value != null ? `Mood slider, value ${value}` : 'Mood slider, not set'}
      accessibilityValue={{ min: 0, max: 100, now: value ?? undefined }}
    >
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
        <ThemedText style={{ color: Colors.sway.lightGrey, fontSize: 13, fontWeight: '600' }}>Mood</ThemedText>
        <ThemedText style={{ color: value != null ? Colors.sway.bright : Colors.chip.dotInactive, fontSize: 15, fontWeight: '700' }}>
          {value != null ? value : '—'}
        </ThemedText>
      </View>

      <GestureDetector gesture={panGesture}>
        <View style={{ height: THUMB_SIZE + 8, justifyContent: 'center' }}>
          {/* Track background */}
          <View style={{ height: TRACK_HEIGHT, backgroundColor: Colors.chip.pill, borderRadius: TRACK_HEIGHT / 2, overflow: 'hidden' }}>
            {/* Gradient fill */}
            <Animated.View style={[{ height: '100%', borderRadius: TRACK_HEIGHT / 2, overflow: 'hidden' }, fillStyle]}>
              <Svg width={trackWidth} height={TRACK_HEIGHT}>
                <Defs>
                  <LinearGradient id="moodGradEdit" x1="0%" y1="0%" x2="100%" y2="0%">
                    <Stop offset="0%" stopColor={Colors.diary.moodCool} />
                    <Stop offset="100%" stopColor={Colors.diary.moodWarm} />
                  </LinearGradient>
                </Defs>
                <Rect width={trackWidth} height={TRACK_HEIGHT} fill="url(#moodGradEdit)" />
              </Svg>
            </Animated.View>
          </View>

          {/* Thumb */}
          {value != null && (
            <Animated.View
              style={[
                {
                  position: 'absolute',
                  width: THUMB_SIZE,
                  height: THUMB_SIZE,
                  borderRadius: THUMB_SIZE / 2,
                  backgroundColor: Colors.sway.bright,
                  top: (THUMB_SIZE + 8 - THUMB_SIZE) / 2,
                  shadowColor: Colors.sway.bright,
                  shadowOffset: { width: 0, height: 0 },
                  shadowOpacity: 0.4,
                  shadowRadius: 8,
                  elevation: 4
                },
                thumbStyle
              ]}
            />
          )}
        </View>
      </GestureDetector>

      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 4 }}>
        <ThemedText style={{ color: Colors.chip.dotInactive, fontSize: 9 }}>Low</ThemedText>
        <ThemedText style={{ color: Colors.chip.dotInactive, fontSize: 9 }}>High</ThemedText>
      </View>
    </View>
  );
});

MoodSlider.displayName = 'MoodSlider';

export default MoodSlider;
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx jest components/attempts/presenters/diary/MoodSlider.test.tsx --no-coverage`
Expected: PASS

- [ ] **Step 5: Commit**

```
feat(diary): add MoodSlider with gesture-driven gradient slider
```

---

### Task 7: Build `SlotAccordionRow` and `SlotAccordionPanel`

**Files:**
- Create: `components/attempts/presenters/diary/SlotAccordionRow.tsx`
- Create: `components/attempts/presenters/diary/SlotAccordionPanel.tsx`
- Create: `components/attempts/presenters/diary/SlotAccordion.test.tsx`

- [ ] **Step 1: Write the failing tests**

Create `components/attempts/presenters/diary/SlotAccordion.test.tsx`:

```typescript
import { render, fireEvent } from '@testing-library/react-native';

import SlotAccordionRow from './SlotAccordionRow';
import SlotAccordionPanel from './SlotAccordionPanel';

jest.mock('expo-haptics', () => ({
  impactAsync: jest.fn(() => Promise.resolve()),
  ImpactFeedbackStyle: { Light: 'light' }
}));

jest.mock('react-native-gesture-handler', () => {
  const { View } = require('react-native');
  return {
    GestureDetector: ({ children }: { children: React.ReactNode }) => children,
    Gesture: {
      Pan: () => ({
        onStart: () => ({ onUpdate: () => ({ onEnd: () => ({}) }) }),
        onUpdate: () => ({ onEnd: () => ({}) }),
        onEnd: () => ({})
      })
    }
  };
});

describe('SlotAccordionRow', () => {
  it('renders time label', () => {
    const { getByText } = render(
      <SlotAccordionRow label="06:00–08:00" activityPreview="" isFilled={false} onPress={jest.fn()} />
    );
    expect(getByText('06:00–08:00')).toBeTruthy();
  });

  it('shows activity preview when filled', () => {
    const { getByText } = render(
      <SlotAccordionRow label="06:00–08:00" activityPreview="Morning walk" isFilled={true} onPress={jest.fn()} />
    );
    expect(getByText('Morning walk')).toBeTruthy();
  });

  it('calls onPress when tapped', () => {
    const onPress = jest.fn();
    const { getByLabelText } = render(
      <SlotAccordionRow label="06:00–08:00" activityPreview="" isFilled={false} onPress={onPress} />
    );
    fireEvent.press(getByLabelText('06:00–08:00, empty. Double tap to expand'));
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('renders at reduced opacity when empty', () => {
    const { getByLabelText } = render(
      <SlotAccordionRow label="06:00–08:00" activityPreview="" isFilled={false} onPress={jest.fn()} />
    );
    const row = getByLabelText('06:00–08:00, empty. Double tap to expand');
    expect(row.props.style).toEqual(expect.objectContaining({ opacity: 0.6 }));
  });
});

describe('SlotAccordionPanel', () => {
  const defaultProps = {
    label: '06:00–08:00',
    activity: '',
    mood: undefined as number | undefined,
    achievement: undefined as number | undefined,
    closeness: undefined as number | undefined,
    enjoyment: undefined as number | undefined,
    isFilled: false,
    isComplete: false,
    canEdit: true,
    showReflectionPrompt: false,
    reflectionPrompt: 'Test prompt',
    onActivityChange: jest.fn(),
    onMoodChange: jest.fn(),
    onStepperChange: jest.fn(),
    onCollapse: jest.fn(),
  };

  it('renders activity text input in edit mode', () => {
    const { getByPlaceholderText } = render(<SlotAccordionPanel {...defaultProps} />);
    expect(getByPlaceholderText('What did you do?')).toBeTruthy();
  });

  it('renders mood slider', () => {
    const { getByLabelText } = render(<SlotAccordionPanel {...defaultProps} />);
    expect(getByLabelText('Mood slider, not set')).toBeTruthy();
  });

  it('renders 3 metric steppers', () => {
    const { getByText } = render(<SlotAccordionPanel {...defaultProps} />);
    expect(getByText('Achievement')).toBeTruthy();
    expect(getByText('Closeness')).toBeTruthy();
    expect(getByText('Enjoyment')).toBeTruthy();
  });

  it('shows reflection prompt when showReflectionPrompt is true', () => {
    const { getByText } = render(<SlotAccordionPanel {...defaultProps} showReflectionPrompt={true} />);
    expect(getByText('Test prompt')).toBeTruthy();
  });

  it('hides reflection prompt when showReflectionPrompt is false', () => {
    const { queryByText } = render(<SlotAccordionPanel {...defaultProps} showReflectionPrompt={false} />);
    expect(queryByText('Test prompt')).toBeNull();
  });

  it('renders read-only in view mode', () => {
    const { queryByPlaceholderText, getByText } = render(
      <SlotAccordionPanel {...defaultProps} canEdit={false} activity="Morning walk" mood={65} achievement={7} closeness={5} enjoyment={6} />
    );
    expect(queryByPlaceholderText('What did you do?')).toBeNull();
    expect(getByText('Morning walk')).toBeTruthy();
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx jest components/attempts/presenters/diary/SlotAccordion.test.tsx --no-coverage`
Expected: FAIL — modules not found

- [ ] **Step 3: Write SlotAccordionRow**

Create `components/attempts/presenters/diary/SlotAccordionRow.tsx`:

```typescript
import { memo } from 'react';
import { Pressable, View } from 'react-native';
import { ThemedText } from '@/components/ThemedText';
import { Colors } from '@/constants/Colors';
import MaterialCommunityIcons from '@react-native-vector-icons/material-design-icons';

type SlotAccordionRowProps = {
  label: string;
  activityPreview: string;
  isFilled: boolean;
  onPress: () => void;
};

const SlotAccordionRow = memo(({ label, activityPreview, isFilled, onPress }: SlotAccordionRowProps) => (
  <Pressable
    onPress={onPress}
    accessibilityRole="button"
    accessibilityLabel={`${label}, ${isFilled ? 'filled' : 'empty'}. Double tap to expand`}
    accessibilityHint="Double tap to expand"
    style={{
      backgroundColor: Colors.chip.darkCard,
      borderRadius: 10,
      padding: 13,
      paddingHorizontal: 14,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      minHeight: 48,
      opacity: isFilled ? 1 : 0.6
    }}
    className="active:opacity-70"
  >
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
      <View
        style={{
          width: 8,
          height: 8,
          borderRadius: 4,
          backgroundColor: isFilled ? Colors.sway.bright : Colors.chip.dotInactive
        }}
      />
      <ThemedText style={{ fontSize: 13, fontWeight: isFilled ? '600' : '400', color: Colors.sway.lightGrey }}>
        {label}
      </ThemedText>
    </View>
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
      {activityPreview.length > 0 && (
        <ThemedText
          numberOfLines={1}
          style={{ fontSize: 11, color: Colors.sway.darkGrey, maxWidth: 110 }}
        >
          {activityPreview}
        </ThemedText>
      )}
      <MaterialCommunityIcons name="chevron-right" size={16} color={isFilled ? Colors.sway.darkGrey : Colors.chip.dotInactive} />
    </View>
  </Pressable>
));

SlotAccordionRow.displayName = 'SlotAccordionRow';

export default SlotAccordionRow;
```

- [ ] **Step 4: Write SlotAccordionPanel**

Create `components/attempts/presenters/diary/SlotAccordionPanel.tsx`:

```typescript
import { memo } from 'react';
import { TextInput, View } from 'react-native';
import { Pressable } from 'react-native';
import { ThemedText } from '@/components/ThemedText';
import { Colors } from '@/constants/Colors';
import MaterialCommunityIcons from '@react-native-vector-icons/material-design-icons';

import MetricStepper from './MetricStepper';
import MoodSlider from './MoodSlider';
import ReflectionPrompt from './ReflectionPrompt';

type SlotAccordionPanelProps = {
  label: string;
  activity: string;
  mood: number | undefined;
  achievement: number | undefined;
  closeness: number | undefined;
  enjoyment: number | undefined;
  isFilled: boolean;
  isComplete: boolean;
  canEdit: boolean;
  showReflectionPrompt: boolean;
  reflectionPrompt: string;
  onActivityChange: (text: string) => void;
  onMoodChange: (value: number) => void;
  onStepperChange: (field: 'achievement' | 'closeness' | 'enjoyment', value: number) => void;
  onCollapse: () => void;
};

const SlotAccordionPanel = memo(
  ({
    label,
    activity,
    mood,
    achievement,
    closeness,
    enjoyment,
    isFilled,
    isComplete,
    canEdit,
    showReflectionPrompt,
    reflectionPrompt,
    onActivityChange,
    onMoodChange,
    onStepperChange,
    onCollapse
  }: SlotAccordionPanelProps) => {
    const dotColor = isComplete ? Colors.sway.bright : isFilled ? Colors.diary.moodWarm : Colors.chip.dotInactive;

    return (
      <View
        style={{
          backgroundColor: '#1a2540',
          borderWidth: 1,
          borderColor: 'rgba(24,205,186,0.2)',
          borderRadius: 12,
          padding: 16
        }}
        accessibilityRole="group"
        accessibilityLabel={`Time slot ${label}`}
      >
        {/* Header */}
        <Pressable
          onPress={onCollapse}
          style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}
          accessibilityRole="button"
          accessibilityLabel={`Collapse ${label}`}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
            <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: dotColor }} />
            <ThemedText style={{ color: Colors.sway.bright, fontSize: 14, fontWeight: '700' }}>{label}</ThemedText>
          </View>
          <MaterialCommunityIcons name="chevron-down" size={16} color={Colors.sway.bright} />
        </Pressable>

        {/* Reflection prompt */}
        {showReflectionPrompt && canEdit && <ReflectionPrompt prompt={reflectionPrompt} />}
        {showReflectionPrompt && canEdit && <View style={{ height: 14 }} />}

        {/* Activity input */}
        {canEdit ? (
          <View
            style={{
              backgroundColor: Colors.sway.dark,
              borderRadius: 10,
              padding: 12,
              marginBottom: 16,
              borderWidth: 1,
              borderColor: 'rgba(24,205,186,0.15)'
            }}
          >
            <ThemedText
              style={{ color: Colors.sway.darkGrey, fontSize: 10, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6 }}
            >
              Activity
            </ThemedText>
            <TextInput
              value={activity}
              onChangeText={onActivityChange}
              placeholder="What did you do?"
              placeholderTextColor={Colors.chip.dotInactive}
              style={{ color: Colors.sway.lightGrey, fontSize: 14, padding: 0 }}
              multiline
            />
          </View>
        ) : (
          <View style={{ backgroundColor: Colors.sway.dark, borderRadius: 10, padding: 12, marginBottom: 16 }}>
            <ThemedText
              style={{ color: Colors.sway.darkGrey, fontSize: 10, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6 }}
            >
              Activity
            </ThemedText>
            <ThemedText style={{ color: Colors.sway.lightGrey, fontSize: 14 }}>{activity || '—'}</ThemedText>
          </View>
        )}

        {/* Mood slider */}
        <View style={{ marginBottom: 16 }}>
          <MoodSlider value={mood} onChange={onMoodChange} disabled={!canEdit} />
        </View>

        {/* Stepper grid */}
        <View style={{ flexDirection: 'row', gap: 8 }}>
          <View style={{ flex: 1 }}>
            <MetricStepper
              label="Achievement"
              value={achievement}
              color={Colors.diary.enjoyment}
              onChange={(v) => onStepperChange('achievement', v)}
              disabled={!canEdit}
            />
          </View>
          <View style={{ flex: 1 }}>
            <MetricStepper
              label="Closeness"
              value={closeness}
              color={Colors.diary.closeness}
              onChange={(v) => onStepperChange('closeness', v)}
              disabled={!canEdit}
            />
          </View>
          <View style={{ flex: 1 }}>
            <MetricStepper
              label="Enjoyment"
              value={enjoyment}
              color={Colors.diary.enjoyment}
              onChange={(v) => onStepperChange('enjoyment', v)}
              disabled={!canEdit}
            />
          </View>
        </View>
      </View>
    );
  }
);

SlotAccordionPanel.displayName = 'SlotAccordionPanel';

export default SlotAccordionPanel;
```

- [ ] **Step 5: Run tests to verify they pass**

Run: `npx jest components/attempts/presenters/diary/SlotAccordion.test.tsx --no-coverage`
Expected: PASS

- [ ] **Step 6: Commit**

```
feat(diary): add SlotAccordionRow and SlotAccordionPanel components
```

---

### Task 8: Rewrite `useDiaryNavigation` for accordion state

**Files:**
- Rewrite: `components/attempts/presenters/diary/useDiaryNavigation.ts`
- Create: `components/attempts/presenters/diary/useDiaryNavigation.test.ts`

- [ ] **Step 1: Write the failing tests**

Create `components/attempts/presenters/diary/useDiaryNavigation.test.ts`:

```typescript
import { act, renderHook } from '@testing-library/react-native';

import { useDiaryNavigation } from './useDiaryNavigation';

describe('useDiaryNavigation', () => {
  const dayRows = Array.from({ length: 9 }, (_, i) => ({
    key: `2025-01-06|${String(6 + i * 2).padStart(2, '0')}:00–${String(8 + i * 2).padStart(2, '0')}:00`,
    value: { label: `${String(6 + i * 2).padStart(2, '0')}:00–${String(8 + i * 2).padStart(2, '0')}:00`, activity: '', at: new Date() }
  }));

  it('initialises with no slot expanded', () => {
    const { result } = renderHook(() => useDiaryNavigation('2025-01-06'));
    expect(result.current.expandedSlotIdx).toBeNull();
  });

  it('expands a slot', () => {
    const { result } = renderHook(() => useDiaryNavigation('2025-01-06'));
    act(() => result.current.expandSlot(3));
    expect(result.current.expandedSlotIdx).toBe(3);
  });

  it('collapses the expanded slot', () => {
    const { result } = renderHook(() => useDiaryNavigation('2025-01-06'));
    act(() => result.current.expandSlot(3));
    act(() => result.current.collapseSlot());
    expect(result.current.expandedSlotIdx).toBeNull();
  });

  it('switching to a different slot collapses the current one', () => {
    const { result } = renderHook(() => useDiaryNavigation('2025-01-06'));
    act(() => result.current.expandSlot(3));
    act(() => result.current.expandSlot(5));
    expect(result.current.expandedSlotIdx).toBe(5);
  });

  it('resets expanded slot when activeDayISO changes', () => {
    const { result, rerender } = renderHook(
      ({ iso }: { iso: string }) => useDiaryNavigation(iso),
      { initialProps: { iso: '2025-01-06' } }
    );
    act(() => result.current.expandSlot(3));
    expect(result.current.expandedSlotIdx).toBe(3);

    rerender({ iso: '2025-01-07' });
    expect(result.current.expandedSlotIdx).toBeNull();
  });

  it('tracks whether prompt has been shown', () => {
    const { result } = renderHook(() => useDiaryNavigation('2025-01-06'));
    expect(result.current.hasShownPrompt).toBe(false);

    act(() => result.current.markPromptShown());
    expect(result.current.hasShownPrompt).toBe(true);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx jest components/attempts/presenters/diary/useDiaryNavigation.test.ts --no-coverage`
Expected: FAIL — exported members don't match

- [ ] **Step 3: Rewrite the hook**

Replace the contents of `components/attempts/presenters/diary/useDiaryNavigation.ts`:

```typescript
import { useCallback, useEffect, useRef, useState } from 'react';

export const useDiaryNavigation = (activeDayISO: string) => {
  const [expandedSlotIdx, setExpandedSlotIdx] = useState<number | null>(null);
  const promptShownRef = useRef(false);

  // Reset expanded slot when switching days
  useEffect(() => {
    setExpandedSlotIdx(null);
  }, [activeDayISO]);

  const expandSlot = useCallback((idx: number) => {
    setExpandedSlotIdx(idx);

    // Mark prompt as shown on the first expand
    if (!promptShownRef.current) {
      promptShownRef.current = true;
    }
  }, []);

  const collapseSlot = useCallback(() => {
    setExpandedSlotIdx(null);
  }, []);

  const markPromptShown = useCallback(() => {
    promptShownRef.current = true;
  }, []);

  return {
    expandedSlotIdx,
    expandSlot,
    collapseSlot,
    hasShownPrompt: promptShownRef.current,
    markPromptShown
  };
};
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx jest components/attempts/presenters/diary/useDiaryNavigation.test.ts --no-coverage`
Expected: PASS

- [ ] **Step 5: Commit**

```
refactor(diary): rewrite useDiaryNavigation for accordion state management
```

---

### Task 9: Restyle `ReflectionPrompt`

**Files:**
- Modify: `components/attempts/presenters/diary/ReflectionPrompt.tsx`

- [ ] **Step 1: Update the component**

Replace the contents of `ReflectionPrompt.tsx`:

```typescript
import { View } from 'react-native';
import { ThemedText } from '@/components/ThemedText';
import { Colors } from '@/constants/Colors';
import MaterialCommunityIcons from '@react-native-vector-icons/material-design-icons';

type ReflectionPromptProps = {
  prompt: string;
};

const ReflectionPrompt = ({ prompt }: ReflectionPromptProps) => (
  <View
    style={{
      backgroundColor: 'rgba(24,205,186,0.06)',
      borderWidth: 1,
      borderColor: 'rgba(24,205,186,0.12)',
      borderRadius: 8,
      padding: 10,
      paddingHorizontal: 12,
      flexDirection: 'row',
      gap: 8,
      alignItems: 'flex-start'
    }}
  >
    <MaterialCommunityIcons name="lightbulb-outline" size={16} color={Colors.sway.bright} style={{ marginTop: 1 }} />
    <ThemedText style={{ color: Colors.sway.darkGrey, fontSize: 12, lineHeight: 18, fontStyle: 'italic', flex: 1 }}>
      {prompt}
    </ThemedText>
  </View>
);

export default ReflectionPrompt;
```

- [ ] **Step 2: Run full test suite to check nothing broke**

Run: `npx jest --no-coverage --testPathPattern="diary" --passWithNoTests`
Expected: All existing passing tests still pass

- [ ] **Step 3: Commit**

```
style(diary): restyle ReflectionPrompt for accordion context
```

---

### Task 10: Restyle `WeeklySummary`

**Files:**
- Modify: `components/attempts/presenters/diary/WeeklySummary.tsx`

- [ ] **Step 1: Update the component**

Replace the contents of `WeeklySummary.tsx`:

```typescript
import { memo, useState } from 'react';
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
  { key: 'avgMood', label: 'Mood', color: Colors.diary.moodWarm },
  { key: 'avgAchievement', label: 'Achieve', color: Colors.diary.enjoyment },
  { key: 'avgCloseness', label: 'Close', color: Colors.diary.closeness },
  { key: 'avgEnjoyment', label: 'Enjoy', color: Colors.diary.enjoyment }
];

type WeeklySummaryProps = {
  totals: DiaryTotals;
  defaultOpen?: boolean;
};

const WeeklySummary = memo(
  ({ totals, defaultOpen = false }: WeeklySummaryProps) => {
    const [open, setOpen] = useState(defaultOpen);
    const visibleMetrics = METRICS.filter((m) => totals[m.key] != null);

    if (visibleMetrics.length === 0) return null;

    const toggle = () => {
      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
      setOpen((prev) => !prev);
    };

    return (
      <View style={{ backgroundColor: Colors.chip.darkCard, borderRadius: 12, padding: 14, marginTop: 8 }}>
        <Pressable
          onPress={toggle}
          style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}
          accessibilityRole="button"
          accessibilityState={{ expanded: open }}
          accessibilityLabel={`Weekly Summary, ${visibleMetrics.length} metrics`}
        >
          <ThemedText style={{ fontFamily: Fonts.Bold, fontSize: 13 }}>Weekly Summary</ThemedText>
          <MaterialCommunityIcons name={open ? 'chevron-up' : 'chevron-down'} size={16} color={Colors.sway.darkGrey} />
        </Pressable>

        {open && (
          <View style={{ flexDirection: 'row', gap: 8, marginTop: 12 }}>
            {visibleMetrics.map((m) => (
              <View
                key={m.key}
                style={{
                  flex: 1,
                  backgroundColor: Colors.sway.dark,
                  borderRadius: 8,
                  paddingVertical: 10,
                  paddingHorizontal: 6,
                  alignItems: 'center'
                }}
              >
                <ThemedText style={{ color: Colors.sway.darkGrey, fontSize: 9, marginBottom: 4 }}>{m.label}</ThemedText>
                <ThemedText style={{ fontSize: 18, fontFamily: Fonts.Bold, color: m.color }}>
                  {(totals[m.key] as number).toFixed(1)}
                </ThemedText>
              </View>
            ))}
          </View>
        )}
      </View>
    );
  },
  (prev, next) =>
    prev.defaultOpen === next.defaultOpen &&
    prev.totals.count === next.totals.count &&
    METRICS.every((m) => prev.totals[m.key] === next.totals[m.key])
);

WeeklySummary.displayName = 'WeeklySummary';

export default WeeklySummary;
```

- [ ] **Step 2: Run tests**

Run: `npx jest --no-coverage --testPathPattern="diary" --passWithNoTests`
Expected: PASS

- [ ] **Step 3: Commit**

```
style(diary): restyle WeeklySummary with 4-column grid layout
```

---

### Task 11: Rewrite `DiaryHeader`

**Files:**
- Rewrite: `components/attempts/presenters/diary/DiaryHeader.tsx`

Simplified — no progress chip, no reflection prompt (moved to accordion), no save changes chip.

- [ ] **Step 1: Rewrite the component**

Replace `DiaryHeader.tsx`:

```typescript
import { memo } from 'react';
import { Pressable, View } from 'react-native';
import { ThemedText } from '@/components/ThemedText';
import { SaveProgressChip } from '@/components/ui/Chip';
import { Colors } from '@/constants/Colors';
import type { ModuleSnapshot } from '@milobedini/shared-types';
import MaterialCommunityIcons from '@react-native-vector-icons/material-design-icons';

type DiaryHeaderProps = {
  patientName?: string;
  mode: 'view' | 'edit';
  startedAt?: string;
  completedAt?: string;
  updatedAt: string;
  hasDirtyChanges: boolean;
  isSaving: boolean;
  saved: boolean;
  moduleSnapshot?: ModuleSnapshot;
  disclaimerOpen: boolean;
  setDisclaimerOpen: (open: boolean) => void;
};

const DiaryHeader = ({
  patientName,
  mode,
  startedAt,
  completedAt,
  updatedAt,
  hasDirtyChanges,
  isSaving,
  saved,
  moduleSnapshot,
  disclaimerOpen,
  setDisclaimerOpen
}: DiaryHeaderProps) => (
  <View className="gap-2 px-4 pb-2 pt-3">
    {patientName && <ThemedText type="subtitle">{`by ${patientName}`}</ThemedText>}

    <View className="flex-row flex-wrap items-center gap-2">
      {mode === 'view' ? (
        <ThemedText type="small" style={{ color: Colors.sway.darkGrey }}>
          {completedAt
            ? `Completed ${new Date(completedAt).toLocaleDateString()}`
            : `Updated ${new Date(updatedAt).toLocaleDateString()}`}
        </ThemedText>
      ) : (
        <ThemedText type="small" style={{ color: Colors.sway.darkGrey }}>
          {[
            startedAt && !hasDirtyChanges && `Started ${new Date(startedAt).toLocaleDateString()}`,
            updatedAt && `Updated ${new Date(updatedAt).toLocaleDateString()}`
          ]
            .filter(Boolean)
            .join(' · ')}
        </ThemedText>
      )}
      <SaveProgressChip saved={saved} isSaving={isSaving} />
      {moduleSnapshot?.disclaimer ? (
        <Pressable
          onPress={() => setDisclaimerOpen(!disclaimerOpen)}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel="Safety information"
        >
          <MaterialCommunityIcons name="information-outline" size={20} color={Colors.sway.lightGrey} />
        </Pressable>
      ) : null}
    </View>

    {disclaimerOpen && moduleSnapshot?.disclaimer ? (
      <ThemedText style={{ fontSize: 12, color: Colors.sway.darkGrey, marginTop: 4 }}>
        {moduleSnapshot.disclaimer}
      </ThemedText>
    ) : null}
  </View>
);

export default memo(DiaryHeader);
```

- [ ] **Step 2: Commit**

```
refactor(diary): simplify DiaryHeader — remove progress chip and reflection prompt
```

---

### Task 12: Rewrite `DiaryFooter`

**Files:**
- Rewrite: `components/attempts/presenters/diary/DiaryFooter.tsx`

Restyled with the new card aesthetic and two-button layout.

- [ ] **Step 1: Rewrite the component**

Replace `DiaryFooter.tsx`:

```typescript
import { memo } from 'react';
import { View } from 'react-native';
import { TextInput } from 'react-native';
import ThemedButton from '@/components/ThemedButton';
import { ThemedText } from '@/components/ThemedText';
import { Colors } from '@/constants/Colors';

type DiaryFooterProps = {
  mode: 'view' | 'edit';
  canEdit: boolean;
  userNoteText: string;
  setUserNoteText: (text: string) => void;
  setNoteDirty: (dirty: boolean) => void;
  userNote?: string;
  allAnswered: boolean;
  hasDirtyChanges: boolean;
  onSubmitOrExit: () => void;
  onDiscard: () => void;
};

const DiaryFooter = ({
  mode,
  canEdit,
  userNoteText,
  setUserNoteText,
  setNoteDirty,
  userNote,
  allAnswered,
  hasDirtyChanges,
  onSubmitOrExit,
  onDiscard
}: DiaryFooterProps) => (
  <View className="px-4 pb-6">
    {/* Therapist note */}
    {canEdit ? (
      <View style={{ backgroundColor: Colors.chip.darkCard, borderRadius: 12, padding: 14, marginBottom: 12 }}>
        <ThemedText style={{ color: Colors.sway.lightGrey, fontSize: 13, fontWeight: '700', marginBottom: 10 }}>
          Note to Therapist
        </ThemedText>
        <View
          style={{
            backgroundColor: Colors.sway.dark,
            borderRadius: 8,
            padding: 12,
            minHeight: 60,
            borderWidth: 1,
            borderColor: Colors.chip.pill
          }}
        >
          <TextInput
            value={userNoteText}
            onChangeText={(t) => {
              setUserNoteText(t);
              setNoteDirty(true);
            }}
            placeholder="Anything you'd like your therapist to know this week..."
            placeholderTextColor={Colors.chip.dotInactive}
            style={{ color: Colors.sway.lightGrey, fontSize: 13, padding: 0 }}
            multiline
            maxLength={500}
          />
        </View>
        <ThemedText
          type="small"
          style={{
            textAlign: 'right',
            marginTop: 6,
            color: userNoteText.length >= 450 ? Colors.primary.error : Colors.chip.dotInactive,
            fontSize: 10
          }}
        >
          {`${userNoteText.length} / 500`}
        </ThemedText>
      </View>
    ) : userNote ? (
      <View style={{ backgroundColor: Colors.chip.darkCard, borderRadius: 12, padding: 14, marginBottom: 12 }}>
        <ThemedText style={{ color: Colors.sway.lightGrey, fontSize: 13, fontWeight: '700', marginBottom: 10 }}>
          Patient Note
        </ThemedText>
        <ThemedText style={{ color: Colors.sway.lightGrey, fontSize: 13 }}>{userNote}</ThemedText>
      </View>
    ) : null}

    {/* Action buttons */}
    {mode === 'edit' ? (
      <View style={{ flexDirection: 'row', gap: 10 }}>
        <View style={{ flex: 1 }}>
          <ThemedButton
            title={hasDirtyChanges ? 'Save Draft' : 'Exit'}
            onPress={hasDirtyChanges ? onSubmitOrExit : onDiscard}
            variant="outline"
          />
        </View>
        <View style={{ flex: 1 }}>
          <ThemedButton
            title="Submit"
            onPress={onSubmitOrExit}
            disabled={!allAnswered}
          />
        </View>
      </View>
    ) : (
      <ThemedButton title="Exit" onPress={onDiscard} variant="outline" />
    )}
  </View>
);

export default memo(DiaryFooter);
```

- [ ] **Step 2: Commit**

```
style(diary): restyle DiaryFooter with new card aesthetic and two-button layout
```

---

### Task 13: Rewrite `ActivityDiaryPresenter` with accordion layout

**Files:**
- Rewrite: `components/attempts/presenters/diary/ActivityDiaryPresenter.tsx`

This is the main integration task that wires everything together.

- [ ] **Step 1: Rewrite the presenter**

Replace `ActivityDiaryPresenter.tsx`:

```typescript
import { useCallback, useRef } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, View } from 'react-native';
import { isSlotComplete, isSlotFilled, type SlotKey, type SlotValue } from '@/utils/activityHelpers';
import type { AttemptDetailResponseItem, DiaryDetail } from '@milobedini/shared-types';

import DayRingBar from './DayRingBar';
import DiaryFooter from './DiaryFooter';
import DiaryHeader from './DiaryHeader';
import SlotAccordionPanel from './SlotAccordionPanel';
import SlotAccordionRow from './SlotAccordionRow';
import WeeklySummary from './WeeklySummary';
import { useDiaryNavigation } from './useDiaryNavigation';
import { useDiaryState } from './useDiaryState';

const TOTAL_SLOTS = 9;
const AUTO_ADVANCE_DELAY = 500;

type ActivityDiaryPresenterProps = {
  attempt: AttemptDetailResponseItem & { diary: DiaryDetail };
  mode: 'view' | 'edit';
  patientName?: string;
};

const ActivityDiaryPresenter = ({ attempt, mode, patientName }: ActivityDiaryPresenterProps) => {
  const state = useDiaryState({ attempt, mode });
  const nav = useDiaryNavigation(state.activeDayISO);

  const autoAdvanceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const promptShownForFirstSlot = useRef(false);

  const handleSelectDay = useCallback(
    (iso: string) => {
      if (state.hasDirtyChanges) state.saveDirty();
      state.setActiveDayISO(iso);
    },
    [state]
  );

  const handleExpandSlot = useCallback(
    (slotIdx: number) => {
      nav.expandSlot(slotIdx);
    },
    [nav]
  );

  const handleCollapseSlot = useCallback(() => {
    nav.collapseSlot();
  }, [nav]);

  const scheduleAutoAdvance = useCallback(
    (currentSlotIdx: number) => {
      if (autoAdvanceTimer.current) clearTimeout(autoAdvanceTimer.current);
      autoAdvanceTimer.current = setTimeout(() => {
        // Find next unfilled slot
        const nextIdx = state.dayRows.findIndex(
          (row, idx) => idx > currentSlotIdx && !isSlotComplete(row.value)
        );
        if (nextIdx >= 0) {
          nav.expandSlot(nextIdx);
        } else {
          nav.collapseSlot();
        }
      }, AUTO_ADVANCE_DELAY);
    },
    [state.dayRows, nav]
  );

  const handleSlotUpdate = useCallback(
    (key: SlotKey, patch: Partial<SlotValue>, slotIdx: number) => {
      state.updateSlot(key, patch);

      // Check auto-advance after update
      if (mode === 'edit') {
        const currentValue = state.dayRows[slotIdx]?.value;
        if (currentValue) {
          const merged = { ...currentValue, ...patch };
          if (isSlotComplete(merged)) {
            scheduleAutoAdvance(slotIdx);
          }
        }
      }
    },
    [state, mode, scheduleAutoAdvance]
  );

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.select({ ios: 120, default: 0 })}
    >
      <DayRingBar
        days={state.days}
        activeDayISO={state.activeDayISO}
        slotFillCounts={state.slotFillCounts}
        totalSlots={TOTAL_SLOTS}
        onSelectDay={handleSelectDay}
      />

      <ScrollView className="flex-1 bg-sway-dark" contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 4 }}>
        <DiaryHeader
          patientName={patientName}
          mode={mode}
          startedAt={state.startedAt}
          completedAt={state.completedAt}
          updatedAt={state.updatedAt}
          hasDirtyChanges={state.hasDirtyChanges}
          isSaving={state.isSaving}
          saved={state.saved}
          moduleSnapshot={state.moduleSnapshot}
          disclaimerOpen={state.disclaimerOpen}
          setDisclaimerOpen={state.setDisclaimerOpen}
        />

        {/* Accordion slots */}
        <View style={{ gap: 6, paddingBottom: 8 }}>
          {state.dayRows.map((row, slotIdx) => {
            const isExpanded = nav.expandedSlotIdx === slotIdx;
            const filled = isSlotFilled(row.value);
            const complete = isSlotComplete(row.value);

            // Show reflection prompt only in the first slot opened this session
            const showPrompt = isExpanded && !promptShownForFirstSlot.current && mode === 'edit';
            if (isExpanded && !promptShownForFirstSlot.current) {
              promptShownForFirstSlot.current = true;
            }

            if (isExpanded) {
              return (
                <SlotAccordionPanel
                  key={row.key}
                  label={row.value.label}
                  activity={row.value.activity}
                  mood={row.value.mood}
                  achievement={row.value.achievement}
                  closeness={row.value.closeness}
                  enjoyment={row.value.enjoyment}
                  isFilled={filled}
                  isComplete={complete}
                  canEdit={state.canEdit}
                  showReflectionPrompt={showPrompt}
                  reflectionPrompt={state.reflectionPrompt}
                  onActivityChange={(text) => handleSlotUpdate(row.key, { activity: text }, slotIdx)}
                  onMoodChange={(value) => handleSlotUpdate(row.key, { mood: value }, slotIdx)}
                  onStepperChange={(field, value) => handleSlotUpdate(row.key, { [field]: value }, slotIdx)}
                  onCollapse={handleCollapseSlot}
                />
              );
            }

            return (
              <SlotAccordionRow
                key={row.key}
                label={row.value.label}
                activityPreview={row.value.activity}
                isFilled={filled}
                onPress={() => handleExpandSlot(slotIdx)}
              />
            );
          })}
        </View>

        {/* Weekly summary */}
        <WeeklySummary totals={state.diary.totals} defaultOpen={mode === 'view'} />

        {/* Footer */}
        <DiaryFooter
          mode={mode}
          canEdit={state.canEdit}
          userNoteText={state.userNoteText}
          setUserNoteText={state.setUserNoteText}
          setNoteDirty={state.setNoteDirty}
          userNote={state.userNote}
          allAnswered={state.allAnswered}
          hasDirtyChanges={state.hasDirtyChanges}
          onSubmitOrExit={state.handleSubmitOrExit}
          onDiscard={state.router.back}
        />
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

export default ActivityDiaryPresenter;
```

- [ ] **Step 2: Run all diary tests**

Run: `npx jest --no-coverage --testPathPattern="diary"`
Expected: All tests pass (state tests unchanged, new component tests pass)

- [ ] **Step 3: Commit**

```
feat(diary): rewrite ActivityDiaryPresenter with accordion layout
```

---

### Task 14: Delete old components

**Files:**
- Delete: `components/attempts/presenters/diary/SlotCard.tsx`
- Delete: `components/attempts/presenters/diary/NumericField.tsx`
- Delete: `components/attempts/presenters/diary/DayNavBar.tsx`
- Delete: `components/attempts/presenters/diary/DayChip.tsx`
- Delete: `components/attempts/presenters/diary/DiaryInputToolbar.tsx`

- [ ] **Step 1: Verify no remaining imports**

Run: `grep -r "SlotCard\|NumericField\|DayNavBar\|DayChip\|DiaryInputToolbar" components/ hooks/ app/ --include="*.ts" --include="*.tsx" -l`
Expected: No files found (all imports were in the rewritten presenter)

- [ ] **Step 2: Delete the files**

```bash
rm components/attempts/presenters/diary/SlotCard.tsx
rm components/attempts/presenters/diary/NumericField.tsx
rm components/attempts/presenters/diary/DayNavBar.tsx
rm components/attempts/presenters/diary/DayChip.tsx
rm components/attempts/presenters/diary/DiaryInputToolbar.tsx
```

- [ ] **Step 3: Run full test suite**

Run: `npx jest --no-coverage --testPathPattern="diary"`
Expected: All tests pass

- [ ] **Step 4: Run type check**

Run: `npx tsc --noEmit`
Expected: No errors

- [ ] **Step 5: Run lint**

Run: `npm run lint`
Expected: Pass

- [ ] **Step 6: Commit**

```
refactor(diary): remove old SlotCard, NumericField, DayNavBar, DayChip, DiaryInputToolbar
```

---

### Task 15: Final validation and format

- [ ] **Step 1: Run prettier**

Run: `npx prettier --write "components/attempts/presenters/diary/**" "utils/activityHelpers.ts"`

- [ ] **Step 2: Run full lint**

Run: `npm run lint`
Expected: Pass

- [ ] **Step 3: Run full test suite**

Run: `npm test`
Expected: All tests pass

- [ ] **Step 4: Commit any formatting fixes**

```
style(diary): format diary redesign files
```
