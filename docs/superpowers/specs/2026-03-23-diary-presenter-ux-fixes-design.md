# Activity Diary Presenter — UX Fixes Design

**Date:** 2026-03-23
**Scope:** Keyboard experience, input navigation, and misc UI polish for the Activity Diary presenter (patient edit mode)

## Context

The Activity Diary is a weekly CBT tool where patients log activities, mood (0–100), achievement (0–10), closeness (0–10), and enjoyment (0–10) across 9 two-hour time slots per day, 7 days per week. The current implementation has keyboard/scrolling issues that make data entry tedious, plus several smaller UI inconsistencies identified in a design review.

## Key Files

- `components/attempts/presenters/diary/ActivityDiaryPresenter.tsx` — main presenter (FlatList with header/footer)
- `components/attempts/presenters/diary/NumericField.tsx` — numeric input component
- `components/attempts/presenters/diary/DayChip.tsx` — day selector with fill dots
- `components/attempts/presenters/diary/WeeklySummary.tsx` — collapsible weekly averages
- `components/attempts/presenters/diary/ReflectionPrompt.tsx` — reflection card

## Changes

### 1. Sticky Header — Only Day Selector (High Priority)

**Problem:** The entire `ListHeaderComponent` is sticky via `stickyHeaderIndices={[0]}`. This includes progress chips, reflection prompt, weekly summary, AND the day selector. With the keyboard open, ~40% of the screen is consumed by the sticky header, leaving barely one field visible.

**Solution:** Remove `stickyHeaderIndices={[0]}`. Split the current `ListHeaderComponent` into two parts:

- **Scrollable section** (scrolls with content): progress chips, save indicator, reflection prompt, weekly summary
- **Sticky section**: day selector row with `DayChip` components (including fill-indicator dots)

Implementation approach: Use a separate sticky `View` positioned above the `FlatList` (outside of `ListHeaderComponent`). The scrollable metadata (progress, reflection, weekly summary) moves into `ListHeaderComponent` which is no longer sticky. The day selector row renders as a sibling `View` above the FlatList, always visible.

Component tree layout:
```
<KeyboardAvoidingView style={{ flex: 1 }}>
  <View>{/* Sticky day selector + fill dots — inside KAV so it shifts with keyboard */}</View>
  <FlatList
    ListHeaderComponent={/* scrollable: progress, reflection, weekly summary */}
    // no stickyHeaderIndices
  />
</KeyboardAvoidingView>
```

### 2. Keyboard Input Navigation Toolbar (High Priority)

**Problem:** No way to navigate between fields without dismissing the keyboard, scrolling, and tapping the next field. With 5 fields per slot × 9 slots = 45 fields per day, this is a major friction point.

**Solution:** Add an `InputAccessoryView` (iOS) with:
- **Prev/Next arrows** (‹ ›) to step through fields in order: Activity → Mood → Achievement → Closeness → Enjoyment → next slot's Activity → ...
- **Context label** showing the current field and time slot (e.g. "Mood — 16:00–18:00") so the patient knows where they are when rapidly stepping through fields
- **Done button** to dismiss the keyboard

Implementation:
- **Ref registry:** Create a ref registry for all input fields across all visible slots. `NumericField` must be refactored to use `forwardRef` so the parent can capture `.focus()` refs. The activity `TextInput` (Paper) supports `.focus()` on its ref — capture these in `renderSlot` via callback refs.
- **Field ordering:** Use a flat array of refs ordered by slot index × field index (5 fields per slot: activity, mood, achievement, closeness, enjoyment). Prev/next simply increment/decrement the index and call `.focus()` on the target ref. Disable Prev on the first field of the first slot; disable Next on the last field of the last slot.
- **Auto-scroll:** Use `scrollToItem` (not `scrollToIndex`) when the focused field is in a different slot than the previously focused one. `scrollToItem` does not require `getItemLayout` and works for already-rendered items, which is sufficient given `windowSize={6}` renders most slots.
- **Paper TextInput compatibility:** React Native Paper's `TextInput` supports `inputAccessoryViewID` passthrough to the underlying native `TextInput`. Verified in Paper v5 source — the prop is spread onto the inner `TextInput`. If a future Paper update breaks this, fallback is to use `render` prop to inject a raw `TextInput` with the `inputAccessoryViewID`.
- **Single shared InputAccessoryView:** Share one `InputAccessoryView` via `nativeID="diaryNav"` across all inputs. Render it once at the presenter level, outside the FlatList. All inputs reference it via `inputAccessoryViewID="diaryNav"`.
- **Android strategy:** Android's numeric keyboard (`keyboardType="number-pad"`) often ignores `returnKeyType`, so the Next key may not appear for numeric fields. Accept this as a known limitation for v1 — Android patients can still tap fields directly. Wire `onSubmitEditing` where `returnKeyType` is honoured (activity text field uses default keyboard). A custom Android toolbar could be added later if user feedback warrants it.
- **Context label state:** Track the currently focused field index in component state. Derive the label ("Mood — 16:00–18:00") from the index using the slot's `label` and the field name constant. Update on each `onFocus` callback.

### 3. Placeholder Text Colour (High Priority)

**Problem:** `placeholderTextColor={'white'}` on the activity TextInput (line 237) and therapist note TextInput (line 428) makes placeholder text indistinguishable from actual input.

**Solution:** Change both to `placeholderTextColor={Colors.sway.darkGrey}`.

### 4. Haptic Feedback (Medium Priority)

**Problem:** `Haptics.selectionAsync()` fires on every `updateSlot` call (line 163), which triggers on every keystroke across all fields. Too aggressive for a form with 45+ fields.

**Solution:**
- Remove `Haptics.selectionAsync()` from `updateSlot`
- Add `Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)` in:
  - `saveDirty` onSuccess callback
  - Submit onSuccess callback
- This gives meaningful haptic feedback at the moments that matter (save confirmed, diary submitted).

### 5. Button Label Clarity (Medium Priority)

**Problem:** The primary button shows "Exit" (clean), "Save & Exit" (dirty), or "Submit diary" (all answered). When dirty, a red "Cancel" button also appears. "Cancel" is ambiguous — cancel what? The edit? The diary?

**Solution:**
- Rename "Cancel" to "Discard changes"
- Keep "Exit" (clean state), "Save & Exit" (dirty, incomplete), "Submit diary" (all answered)

### 6. Character Count on Therapist Note (Medium Priority)

**Problem:** `maxLength={500}` on the therapist note input but no visual indicator. Patient hits the limit with no feedback.

**Solution:** Add a small right-aligned character counter below the TextInput, styled as `ThemedText type="small"` with `Colors.sway.darkGrey`. Format: `{length}/500`. Tint the counter `Colors.primary.error` when at ~90% of limit (450+ characters).

### 7. Numeric Field Touch Targets (Low Priority)

**Problem:** NumericField TextInput has `height: 32`, below the 44pt HIG minimum for touch targets.

**Solution:** Increase to `height: 44`. This adds 12px per field × 4 fields × 9 slots = 432px extra scroll distance per day. Validate visually on a smaller device (iPhone SE size) after implementation to ensure the day still feels navigable.

### 8. Memoize `buildDaySlots` (Low Priority)

**Problem:** `buildDaySlots` is called three separate times: in the `useEffect` seed (line 103), in `slotFillsByDay` memo (line 149), and in `dayRows` memo (line 141).

**Solution:** Create a single `weekSlots` memo that computes all 7 days' slots once:
```typescript
const weekSlots = useMemo(() => {
  const result: Record<string, ReturnType<typeof buildDaySlots>> = {};
  for (const d of days) {
    result[dateISO(d)] = buildDaySlots(dateISO(d));
  }
  return result;
}, [days]);
```
Then derive `slotFillsByDay` and `dayRows` from `weekSlots` instead of calling `buildDaySlots` again.

### 9. Memoize WeeklySummary (Low Priority)

**Problem:** `WeeklySummary` receives `totals` as a prop. Since `diary.totals` is a new object reference on each query refetch, the component re-renders unnecessarily.

**Solution:** Wrap `WeeklySummary` in `memo` with a custom `areEqual` function that compares each totals field individually (`totals.avgMood`, `totals.avgAchievement`, `totals.avgCloseness`, `totals.avgEnjoyment`, `totals.count`) using strict equality. This prevents re-renders when the parent passes a new object reference with the same values.

## Out of Scope

- Rethinking the overall progress metric (% vs per-day) — flagged in review but deferred
- View mode changes (these fixes target edit mode only)
- Weekly summary content or layout changes
- New CBT tools or module types
