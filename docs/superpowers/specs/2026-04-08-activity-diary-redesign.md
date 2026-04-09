# Activity Diary Redesign

## Overview

Complete visual and interaction redesign of the activity diary feature. The diary tracks daily activities across 9 two-hour time slots (06:00–midnight), each with an activity description and 4 numeric metrics (mood 0-100, achievement/closeness/enjoyment 0-10). The redesign replaces the current scrollable card list with an accordion layout, introduces touch-only numeric inputs (slider + steppers), and upgrades the day navigation from chips with dots to progress rings.

**Constraints:**
- Data model and API integration are unchanged — same 9 slots, same fields, same `DiaryDetail`/`DiaryEntry`/`DiaryEntryInput` types from `@milobedini/shared-types`
- Same state management approach (`useDiaryState`) — internal refactoring allowed but the hook's public API stays compatible
- Same save/submit flow — auto-save on day switch, explicit save/submit buttons

## Design Decisions

### 1. Day Navigation — Progress Rings

Replace the current horizontal day chips with fill-indicator dots with circular progress rings.

**Structure:** 7 rings in a horizontal row (Mon–Sun), each showing:
- Day-of-week label above (e.g. "Mon")
- Date number centred inside the ring (e.g. "7")
- Ring stroke fills clockwise proportional to slots filled (0/9 = empty track, 9/9 = full ring)
- Track colour: `Colors.chip.pill` (`#1E2A45`)
- Fill colour: `Colors.sway.bright` (`#18cdba`)

**Active day:** Slightly larger ring (42px vs 38px), teal tint background fill (`Colors.tint.teal`), teal border (`Colors.tint.tealBorder`), teal label and date text. Completed days show date in teal.

**Implementation:** Use `react-native-svg` `<Circle>` with `strokeDasharray` and `strokeDashoffset` to render the progress arc. Animate fill changes with Reanimated shared values for smooth transitions when a slot is completed.

**Tap behaviour:** Tapping a ring switches the active day (same as current chip behaviour), triggering auto-save if there are dirty changes.

### 2. Slot Layout — Accordion

Replace the scrollable FlatList of slot cards with an accordion. Only one slot is expanded at a time; the rest show as compact collapsed rows.

**Collapsed row:**
- Background: `Colors.chip.darkCard` (`#262E42`), rounded corners (10px)
- Left: fill indicator dot (8px circle — teal if filled, `Colors.chip.dotInactive` if empty) + time label (e.g. "06:00 – 08:00")
- Right: activity text preview (truncated, max ~110px) + chevron-right icon
- Empty slots render at reduced opacity (0.6)
- Minimum height: 48px (touch target compliance)

**Expanded slot:**
- Background: slightly darker (`#1a2540`), teal border (1px, `Colors.tint.tealBorder`), rounded corners (12px)
- Header: fill dot (orange `Colors.diary.moodWarm` if partial, teal if complete) + time label in teal + chevron-down icon
- Content (top to bottom):
  1. Reflection prompt (conditional — see section 4)
  2. Activity text input
  3. Mood slider
  4. 3-column stepper grid (achievement, closeness, enjoyment)

**Expand/collapse animation:** Use Reanimated `useAnimatedStyle` with `withTiming` for height interpolation (duration ~250ms, ease-out). Content fades in with a slight delay (50ms) for a polished sequence.

**Auto-advance:** When all 5 fields in the active slot have values (activity is non-empty, mood has been explicitly set via slider drag — not just defaulting to 0, and all 3 steppers have non-null values), the slot auto-collapses after a 500ms delay and the next unfilled slot auto-expands. If no unfilled slots remain on that day, no auto-advance occurs. The delay prevents jarring transitions while the user is still reviewing their input.

**Manual control:** Tapping any collapsed row expands it (collapsing the currently active one). Tapping the expanded slot's header collapses it with nothing else expanding — the user can close everything if they want.

### 3. Input Mechanisms — Hybrid Slider + Steppers

**Mood (0-100) — Continuous Slider:**
- Full-width horizontal slider
- Track: `Colors.chip.pill` (`#1E2A45`), height 8px, rounded
- Fill gradient: `Colors.diary.moodCool` (`#5b8def`) on the left to `Colors.diary.moodWarm` (`#f4a261`) on the right — blue for low mood, warm orange for high mood
- Thumb: 24px circle, `Colors.sway.bright` (`#18cdba`), with a subtle glow (`box-shadow` equivalent via Skia or elevation)
- Labels: "Low" / "High" at the ends in `Colors.chip.dotInactive`
- Value display: current number shown right-aligned next to the "Mood" label, in teal
- Implementation: Custom slider using `react-native-gesture-handler` PanGesture + Reanimated for 60fps tracking on the UI thread. Map gesture x-position to 0-100 value. Use `runOnJS` to update state only on gesture end to avoid excessive re-renders during drag.
- Accessibility: `accessibilityRole="adjustable"`, `accessibilityValue` with min/max/now, increment/decrement actions for VoiceOver

**Achievement / Closeness / Enjoyment (0-10) — Steppers:**
- 3-column grid layout
- Each stepper: label on top, minus button / value / plus button in a row
- Buttons: 28x28px, rounded (8px), `Colors.chip.pill` background, `Colors.sway.darkGrey` text
- Value: colour-coded — achievement in `Colors.diary.enjoyment` (`#a78bfa`), closeness in `Colors.diary.closeness` (`#e76f9a`), enjoyment in `Colors.diary.enjoyment` (`#a78bfa`)
- Container: `Colors.sway.dark` (`#0c1527`) background, rounded (10px)
- Tap: single tap increments/decrements by 1, clamped to 0-10
- Long-press: after 400ms hold, starts auto-incrementing/decrementing at ~150ms intervals
- Haptics: light impact on each step change (`expo-haptics` `ImpactFeedbackStyle.Light`)
- Null state: display "—" in `Colors.chip.dotInactive` when no value is set. First tap on either + or − sets the value to 5 (midpoint), since there's no previous value to increment/decrement from. This avoids forcing users to tap + 7 times from 0.
- Accessibility: `accessibilityRole="adjustable"`, increment/decrement actions

### 4. Reflection Prompt

A contextual CBT guidance prompt shown inside the first slot the user opens in a session.

**Appearance:** Subtle card with teal-tinted background (`rgba(24,205,186,0.06)`), teal border (`rgba(24,205,186,0.12)`), rounded (8px). Contains an icon and italic text in `Colors.sway.darkGrey`.

**Behaviour:**
- Shown only inside the first slot that opens after the component mounts
- Once that slot collapses (either via auto-advance or manual close), the prompt does not appear in subsequent slots
- Track "has shown prompt" in a `useRef<boolean>` — no state needed, no re-renders
- Not shown in view mode

**Prompt pool:** Same 8 prompts from `REFLECTION_PROMPTS` in `activityHelpers.ts`, randomly selected at mount.

### 5. Weekly Summary

Collapsible card below the accordion showing weekly averages.

**Structure:**
- Header: "Weekly Summary" label + chevron toggle
- Body: 4-column grid of metric tiles — Mood, Achievement, Closeness, Enjoyment
- Each tile: dark background (`Colors.sway.dark`), rounded, label + large colour-coded value
- Colour coding matches the stepper/slider colours

**Conditional rendering:** Only shown when `totals` exist and at least one average is non-null.

**Edit mode:** Collapsed by default, user can expand.
**View mode:** Auto-expanded on mount.

### 6. Therapist Note

Footer card below the weekly summary.

**Structure:**
- Card background: `Colors.chip.darkCard`
- Title: "Note to Therapist"
- Text input: multi-line, `Colors.sway.dark` background, 1px border, min-height 60px
- Character count: right-aligned below input, `Colors.chip.dotInactive`, "X / 500"

**Edit mode:** Editable, same dirty-tracking as current implementation.
**View mode:** Read-only, no character count. Hidden entirely if empty.

### 7. Action Buttons

Two buttons at the bottom of the screen.

**Save Draft:** `Colors.sway.buttonBackgroundSolid` background, light text. Saves dirty changes without submitting. Only enabled when `hasDirtyChanges` is true.
**Submit:** `Colors.sway.bright` background, dark text. Saves + submits. Only enabled when all slots on all days have activity filled.

Disabled state: reduced opacity (0.5), non-interactive.

### 8. View Mode

Same visual structure as edit mode with these differences:
- All slots collapsed by default — tap to expand and see read-only values
- Mood shows the gradient bar (non-interactive) with value label
- Steppers replaced with static value display (just the number, no +/- buttons)
- Activity text shown as plain text (no input styling)
- Weekly summary auto-expanded
- No reflection prompt
- No input toolbar
- Single "Exit" button instead of Save/Submit

### 9. Removed Elements

- **Progress chip** ("X% complete"): Redundant — progress rings and accordion fill dots communicate this
- **DiaryInputToolbar** (keyboard navigation toolbar): No longer needed — the only keyboard input is the activity text field, and there's no multi-field keyboard navigation. The activity field uses the standard keyboard dismiss gesture.

## Component Architecture

### New Components
- `ProgressRing` — SVG ring with animated fill, reusable (could be used elsewhere)
- `DayRingBar` — Row of 7 `ProgressRing` components with active state (replaces `DayNavBar` + `DayChip`)
- `MoodSlider` — Custom gesture-driven slider with gradient fill
- `MetricStepper` — +/− stepper with long-press, haptics, colour prop
- `SlotAccordionRow` — Collapsed slot row
- `SlotAccordionPanel` — Expanded slot content (activity input + mood slider + stepper grid)

### Modified Components
- `ActivityDiaryPresenter` — Restructured to use accordion layout instead of FlatList
- `DiaryHeader` — Simplified (no progress chip, no reflection prompt — prompt moves into accordion)
- `DiaryFooter` — Restyled, same structure
- `WeeklySummary` — Restyled, conditional rendering logic added

### Removed Components
- `SlotCard` — Replaced by `SlotAccordionRow` + `SlotAccordionPanel`
- `NumericField` — Replaced by `MoodSlider` + `MetricStepper`
- `DayNavBar` — Replaced by `DayRingBar`
- `DayChip` — Replaced by `ProgressRing`
- `DiaryInputToolbar` — No longer needed

### Modified Hooks
- `useDiaryState` — Add auto-advance logic (detect when all fields in active slot are filled, trigger collapse + next expand after delay). Public API otherwise unchanged.
- `useDiaryNavigation` — Simplify significantly. Remove FlatList ref management and field-index tracking. Replace with accordion expand/collapse state management (which slot index is expanded, animation drivers).

## Animations

| Interaction | Animation | Duration | Easing |
|---|---|---|---|
| Accordion expand | Height interpolation + content fade-in | 250ms + 50ms delay | ease-out |
| Accordion collapse | Height interpolation + content fade-out | 200ms | ease-in |
| Auto-advance | Collapse current (200ms) → pause (300ms) → expand next (250ms) | 750ms total | ease-out |
| Ring fill update | Stroke dash offset interpolation | 400ms | spring (damping: 15) |
| Slider drag | Real-time tracking (gesture handler) | 0ms (60fps) | — |
| Stepper value change | Scale pulse on value text (1.0 → 1.15 → 1.0) | 150ms | ease-out |
| Day switch | Ring active state crossfade + accordion reset | 200ms | ease-in-out |

All animations respect `reduceMotion` — when enabled, transitions are instant (duration: 0).

## Accessibility

- Mood slider: `accessibilityRole="adjustable"` with VoiceOver increment/decrement
- Steppers: `accessibilityRole="adjustable"` with min/max/current announced
- Collapsed rows: `accessibilityRole="button"`, `accessibilityHint="Double tap to expand"`
- Expanded slot: `accessibilityRole="group"` with `accessibilityLabel` including time range
- Progress rings: `accessibilityLabel="Wednesday, 2 of 9 slots filled"`
- Fill dots: colour is not the only indicator — collapsed rows also show activity text preview
- All touch targets ≥ 44pt
- Keyboard: activity text field is the only keyboard input; standard dismiss via scroll/tap-outside

## Data Flow

No changes to the save/submit API contract. The data flow remains:
1. User edits → `updateSlot()` marks slot dirty
2. Day switch or explicit save → `saveDirty()` sends `PATCH /attempts/:id` with dirty entries
3. Submit → `saveDirty()` then `POST /attempts/:id/submit`

The only state addition is accordion expand/collapse tracking (which slot index is open), managed in `useDiaryNavigation` as a simple `expandedSlotIdx: number | null` shared value.
