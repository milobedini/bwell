# UI/UX Polish Pass — Design Spec

## Overview

A cohesive UI/UX improvement pass across the bwell app targeting chip design, styling consistency, spacing, typography, accessibility, empty states, and interactive feedback. Seven changes that reinforce each other to raise the overall polish and professionalism of the app.

## 1. Chip Redesign

**Goal:** Replace bulky, text-heavy react-native-paper chips with a refined custom component.

**New component:** `StatusChip` in `components/ui/Chip.tsx`

- Built on `<View>` + `<ThemedText>` — drops the `react-native-paper` `<Chip>` dependency from this file
- Uses `className` for static styles (`rounded-2xl px-3 py-1 border`), inline `style` only for dynamic colour props
- Text: `ThemedText` type `small` with a style override to 12px — no new ThemedText variant needed
- Icons: `MaterialCommunityIcons` at 14px (down from 24px)
- Accepts props: `color`, `borderColor`, `icon` (MaterialCommunityIcons name), `label`, `iconElement` (optional `ReactNode` for custom icons like Lottie)
- Background: transparent (consistent with outlined style)

**Label changes:**

| Current                      | New                  |
| ---------------------------- | -------------------- |
| Awaiting BWell verification  | Pending verification |
| Assignment only              | Assigned             |
| Ready to start               | Ready                |
| Awaiting assignment          | Needs assignment     |
| Sign in to start             | Sign in              |
| Repeats every N weeks        | See below            |
| Open-ended                   | No deadline          |

**Recurrence labels:**

- interval 1: "Weekly" / "Monthly"
- interval 2 weekly: "Biweekly"
- interval > 2 or interval 2 monthly: "Every {N}w" / "Every {N}m" (e.g. "Every 3w")

**Dynamic-label chips (DueChip, TimeLeftChip, DateChip):** These are in scope for the paper-to-StatusChip migration. Their label computation logic stays the same — only the rendering wrapper changes from `<Chip>` to `<StatusChip>`.

**PendingChip animation:** Uses the `iconElement` prop to pass the Lottie hourglass animation (resized to match the smaller chip). Falls back to a static `hourglass-top` icon when `animate` is false.

**SaveProgressChip:** Also rebuilt on `StatusChip`. Uses `iconElement` to render the `ActivityIndicator` when saving, and a standard `check-circle-outline` icon when saved.

**Preserved:**

- Colour-coding system (`Colors.chip.*`) — no changes
- `DayChip` (diary) stays separate — it's a selectable interaction, not a status indicator

**Files changed:** `components/ui/Chip.tsx`

## 2. Styling Convention

**Rule:** Use `className` (NativeWind) by default. Inline `style` only for:

- Dynamic/computed values (e.g. conditional opacity)
- Animation-driven values (reanimated, Moti)
- Values not expressible in Tailwind (e.g. `Platform.select()`)

**Actions:**

- Migrate static inline `style={{}}` usages to `className` — priority files: `FilterDrawer`, `QuestionnairePresenter`, `ActivityDiaryPresenter`, `AuthSubmitButton`, `ReflectionPrompt`
- Add `chip.*` and `diary.*` colour tokens to `tailwind.config.js` so chip/diary colours can use `className`. Note: the project uses a fully custom colour palette (no default Tailwind colours) — new tokens go under `theme.colors`, not `extend`
- Document the convention in `CLAUDE.md` after implementation is proven

**Exception:** `ThemedText` keeps its `StyleSheet.create()` approach — foundational component with platform-aware static styles. The `profileButtonText` variant's `marginVertical: 10` is left as-is since ThemedText is exempt from the className migration.

## 3. Spacing Scale

**Scale:** 4, 8, 12, 16, 24, 32, 48px — Tailwind values `1, 2, 3, 4, 6, 8, 12`.

**Actions:**

- Migrate off-scale values during the className conversion (Section 2):
  - `marginBottom: 6` -> `mb-1` (4px) or `mb-2` (8px)
  - `marginTop: 22` -> `mt-6` (24px)
  - `marginVertical: 10` -> `my-2` (8px) or `my-3` (12px)
- No custom Tailwind spacing config needed — default scale already covers these values

**Exception:** Precise animation offsets, icon dimensions, Lottie sizes — these are pixel-specific by design.

## 4. Web Font Sizing

**Problem:** `ThemedText` web sizes are 2-2.2x mobile sizes (70px title on web vs 32px mobile).

**New web sizes** (in `components/ThemedText.tsx`, `Platform.select` default values):

| Variant    | Current web | New web | Mobile (unchanged) |
| ---------- | ----------- | ------- | ------------------ |
| title      | 70px        | 36px    | 32px               |
| subtitle   | 50px        | 28px    | 24px               |
| smallTitle | 30px        | 22px    | 20px               |
| italic     | 20px        | 18px    | 18px               |
| link       | 15px        | 14px    | 13px               |
| button     | 22px        | 22px    | 20px               |

Line heights adjusted proportionally. `default`, `small`, `smallBold`, `error` already match across platforms — no change.

## 5. Accessibility Labels

**Goal:** Add `accessibilityLabel` and `accessibilityRole` to all interactive elements (~90+ missing across 28 files).

**Note:** This is the largest section by file count. It should be implemented as its own branch/PR to reduce blast radius and merge conflict risk.

**Priority order:**

1. **Core UI** — `ThemedButton`, `IconButton`, `SecondaryButton`, `PrimaryButton`: accept `accessibilityLabel` prop, fall back to `title`/`children` text
2. **Navigation** — `HapticTab`, `FabGroup`, `FabTrigger` — for paper FAB components, pass `accessibilityLabel` via the paper component's props rather than wrapping
3. **Lists** — assignment/attempt list items, action buttons, segment controls
4. **Presenters** — diary day chips, questionnaire answer chips, filter drawer controls
5. **Auth** — `AuthSubmitButton`, `AuthLink`, `AuthSheetHandle`

**Also:**

- `accessibilityRole="button"` on all Pressable/TouchableOpacity elements missing it
- `accessibilityState={{ disabled }}` where disabled prop exists

**Out of scope:** Full screen-reader audit, automated a11y testing — separate effort.

## 6. Empty State Component

**New component:** `components/ui/EmptyState.tsx`

**Props:**

- `icon` (MaterialCommunityIcons name) — 40px, muted colour (`Colors.sway.darkGrey`)
- `title` (string) — `ThemedText` type `smallTitle`
- `subtitle` (optional string) — `ThemedText` type `small`
- `action` (optional `{ label: string, onPress: () => void }`) — renders a `ThemedButton`

**Layout:** Centered vertically, consistent gap spacing, uses the spacing scale from Section 3.

**Replacements:**

| File                         | Icon                     | Title                  | Action              |
| ---------------------------- | ------------------------ | ---------------------- | ------------------- |
| `PatientActiveAssignments`   | `clipboard-text-outline` | No active assignments  | -                   |
| `PatientCompletedAssignments`| `check-all`              | No completed assignments | -                 |
| `TherapistActiveAssignments` | `clipboard-text-outline` | No active assignments  | Create assignment   |
| `PatientAttempts`            | `file-document-outline`  | No {view} attempts     | -                   |
| `TherapistLatestAttempts`    | `file-document-outline`  | No submissions         | -                   |
| `SearchPickerDialog`         | `magnify`                | No results             | -                   |
| `clients/index.tsx`          | `account-group-outline`  | No clients yet         | -                   |
| `AttemptPresenter`           | `puzzle-outline`         | Not available yet      | Go back             |

**Not replacing:** `ErrorComponent` — handles error types with redirect logic, different concern.

## 7. Interactive States

**Goal:** Consistent hover (web), pressed, and disabled feedback on all interactive elements.

**Approach:** Use `Pressable` instead of `TouchableOpacity` in `ThemedButton` variants to get reliable web hover support via NativeWind's `hover:` pseudo-class. `Pressable` supports both `pressed` and `hovered` render callbacks which are more reliable across NativeWind versions.

**Changes:**

| Component           | Press                              | Hover (web)                          | Disabled                           |
| ------------------- | ---------------------------------- | ------------------------------------ | ---------------------------------- |
| `ThemedButton`      | `Pressable` with opacity style     | `hover:opacity-80`                   | Already has `bg-sway-darkGrey`     |
| `SecondaryButton`   | `Pressable` with opacity style     | `hover:bg-sway-buttonBackgroundSolid`| N/A                                |
| `PrimaryButton`     | `Pressable` with opacity style     | `hover:border-sway-lightGrey`        | N/A                                |
| `IconButton`        | Add `activeOpacity={0.7}`          | N/A                                  | Add `opacity: 0.4` when disabled   |
| `Collapsible`       | Standardise to `activeOpacity={0.7}` (currently 0.8) | N/A                  | N/A                                |
| List item pressables | Add `activeOpacity={0.7}` where missing | N/A                             | N/A                                |
| `FabGroup`/`FabTrigger` | Paper handles it               | Paper handles it                     | No change                          |
| `StatusChip`        | Not interactive                    | Not interactive                      | N/A                                |

**Not doing:** Custom focus rings — React Native lacks native focus-visible on mobile. Web hover via NativeWind covers the web gap.

## Dependencies Between Sections

- Section 1 (chips) is independent
- Section 2 (styling convention) enables Section 3 (spacing) — they happen together
- Section 4 (web fonts) is independent
- Section 5 (a11y) is independent — recommended as a separate PR
- Section 6 (empty states) is independent
- Section 7 (interactive states) is independent but benefits from Section 2's className migration

Sections 1, 4, 5, 6 can be done in parallel. Section 2+3 should be done together. Section 7 after 2+3.
