# Activity Diary Enhancements — Design Spec

## Overview

Five enhancements to the existing Activity Diary presenter that improve UX polish (reflection prompts, editable user note) and add summary/insight features (day fill indicators, weekly summary card, slot mood tinting). All changes are frontend-only — the backend already supports every data field needed.

## Scope

All changes are confined to the `components/attempts/presenters/diary/` directory and `utils/activityHelpers.ts`. No backend changes, no new API endpoints, no new shared types.

### Files to modify

- `components/attempts/presenters/diary/ActivityDiaryPresenter.tsx` — main presenter (add reflection prompt, weekly summary, day fill dots, user note, mood tinting logic)
- `utils/activityHelpers.ts` — add reflection prompt pool and mood-to-colour helper

### Files to create

- `components/attempts/presenters/diary/ReflectionPrompt.tsx` — standalone prompt card component
- `components/attempts/presenters/diary/WeeklySummary.tsx` — collapsible summary card component
- `components/attempts/presenters/diary/DayChip.tsx` — day chip with fill indicator dots

## Enhancement A1: Reflection Prompts

A single CBT-style guidance prompt displayed in the header, above the day chips.

### Behaviour

- One prompt is randomly selected when the component mounts (per session, not per day)
- The prompt stays fixed for the entire editing session — no rotation while editing
- Prompts are only shown in `edit` mode, not `view` mode
- Selection uses `useMemo` with no deps (stable for component lifetime)

### Prompt pool (initial set)

Stored as a `const` array in `utils/activityHelpers.ts`:

1. "Try to notice which activities lifted your mood — even small things count."
2. "Rate achievement based on effort, not outcome — doing something difficult counts even if it didn't go perfectly."
3. "Closeness includes any feeling of connection — a text, a smile from a stranger, time with a pet."
4. "There are no wrong answers. Just record what you actually did and how it felt."
5. "If you can't remember exactly, your best guess is good enough."
6. "Notice if certain times of day tend to feel better or worse — that's useful information."
7. "Enjoyment can be subtle — a warm drink, a song you like, a moment of quiet."
8. "It's okay to leave slots blank if you were asleep or can't recall. Fill in what you can."

### Component: `ReflectionPrompt`

Props: `{ prompt: string }`

Visual treatment:
- Left-border accent (3px, `Colors.sway.bright`)
- Background: subtle gradient using dark teal tones
- Label: "Reflection" in uppercase, `Colors.sway.bright`, small font
- Body: prompt text in `Colors.sway.lightGrey`, 13px

## Enhancement A2: Editable User Note

A multi-line text field where the patient can write a free-form note for their therapist.

### Behaviour

- Positioned in the `ListFooterComponent`, above the submit/exit buttons
- Only shown in `edit` mode; in `view` mode, show the existing `userNote` read-only (already implemented)
- Auto-saves using the same dirty-tracking pattern as slot fields
- A dedicated dirty flag (`noteDirty: boolean`) is added to state — when true, the note is included in the next `saveDirty()` call
- The save payload already supports `userNote` alongside `diaryEntries` — no API changes needed

### Component integration

Inline in `ActivityDiaryPresenter` (not a separate component — it's just a `TextInput`):
- `react-native-paper` `TextInput` with `mode="outlined"`
- Label: "Note for your therapist"
- Placeholder: "Anything you'd like your therapist to know this week..."
- `multiline`, max 500 characters
- `onChangeText` sets local `userNoteText` state and sets `noteDirty = true`
- `saveDirty()` checks `noteDirty` and includes `userNote` in the payload

## Enhancement B1: Day Chip Fill Indicators

Small dots under each day chip indicating which of the 9 time slots have data.

### Behaviour

- 9 dots per day (one per 2-hour slot from 06:00–24:00)
- A slot "has data" if it has any non-empty field: `activity.trim().length > 0`, or any of `mood`, `achievement`, `closeness`, `enjoyment` is not null/undefined
- Computed from local `slots` state (not from the server response), so dots update in real-time as the user types
- Green dot (`Colors.sway.bright`) = has data, grey dot (`Colors.sway.darkGrey`) = empty

### Component: `DayChip`

Props: `{ date: Date; iso: string; selected: boolean; slotFills: boolean[]; onPress: () => void }`

The parent computes `slotFills` (array of 9 booleans) from the `slots` state for each day.

Visual treatment:
- Existing chip design (unchanged)
- Below the chip: a row of 9 dots, 4px diameter, 2px gap, centered

## Enhancement B2: Weekly Summary Card

A collapsible card in the header showing weekly average mood, achievement, closeness, and enjoyment.

### Behaviour

- Positioned in the header between the reflection prompt and the day chips
- Collapsed by default — tap the card header to expand/collapse
- Toggle state: `const [summaryOpen, setSummaryOpen] = useState(false)`
- Values sourced from `diary.totals` (computed server-side, available on the attempt response)
- Only renders metrics that have values (skips nulls) — e.g. if no mood has been entered, the mood cell is hidden
- Shown in both `edit` and `view` modes

### Visual treatment

- Card background: `Colors.sway.buttonBackground`
- Header: "Weekly Summary" label + chevron (▸ collapsed, ▾ expanded)
- Body: 2×2 grid of metric cells
- Each cell: large number (20px bold) in a distinct colour + small label below
  - Mood: `#f4a261` (warm amber)
  - Achievement: `Colors.sway.bright` (teal)
  - Closeness: `#e76f9a` (pink)
  - Enjoyment: `#a78bfa` (purple)
- Cell background: `Colors.sway.dark`
- Animation: use `moti` `AnimatePresence` for smooth expand/collapse (already a project dependency)

### Component: `WeeklySummary`

Props: `{ totals: DiaryTotals; defaultOpen?: boolean }`

## Enhancement B3: Slot Mood Tinting

A coloured left-border accent on slot cards based on the recorded mood value.

### Behaviour

- Applied to each slot card in the `renderSlot` function
- Only activates when `mood` has a value
- Colour mapping:
  - `mood >= 60` → warm amber (`#f4a261`)
  - `mood <= 40` → cool blue (`#5b8def`)
  - `mood 41–59` or no mood → no tint (transparent border, same as current)
- Additionally, a small mood badge is shown in the card header row (right-aligned): the mood value in its tint colour, font-size 11px
- The badge only appears when mood has a value

### Implementation

A helper function in `utils/activityHelpers.ts`:

```typescript
const moodColor = (mood?: number): string | undefined => {
  if (mood == null) return undefined;
  if (mood >= 60) return '#f4a261';
  if (mood <= 40) return '#5b8def';
  return undefined;
};
```

In `renderSlot`, the `Card` gets `style={{ borderLeftWidth: 3, borderLeftColor: tintColor ?? 'transparent' }}`.

## Data flow

No new API calls. All enhancements use data already present:

| Enhancement | Data source | Already available? |
|---|---|---|
| Reflection prompt | Static array | Yes (new constant) |
| User note | `attempt.userNote` + save payload `userNote` | Yes |
| Day fill dots | Local `slots` state | Yes |
| Weekly summary | `diary.totals` from attempt detail response | Yes |
| Mood tinting | `slot.mood` from local `slots` state | Yes |

## State changes to `ActivityDiaryPresenter`

New state:
- `userNoteText: string` — initialised from `attempt.userNote ?? ''`
- `noteDirty: boolean` — tracks whether note has changed
- `summaryOpen: boolean` — weekly summary collapse toggle

Modified:
- `saveDirty()` — additionally checks `noteDirty` and includes `userNote: userNoteText` in payload when dirty; resets `noteDirty` on success
- `buildPayload()` — unchanged (note is separate from diary entries)

## Accessibility

- Reflection prompt: read by screen readers as normal text content
- Weekly summary: collapsible uses `accessibilityRole="button"` and `accessibilityState={{ expanded }}` on the toggle row
- Day fill dots: `accessibilityLabel` on each `DayChip` includes fill count (e.g. "Monday 17, 3 of 9 slots filled")
- Mood tinting: purely decorative, mood value is already in the numeric field — no additional a11y needed
- User note: standard `TextInput` with label, already accessible

## Out of scope

- Week-over-week trends / historical comparison (category C)
- Therapist notes on diary attempts (category D)
- Context-aware reflection prompts (future upgrade from random selection)
- Changes to the backend or shared types package
