# Chip Migration: paper Chip → Custom Chip Components

## Problem

The recent UI/UX polish introduced `StatusChip` in `components/ui/Chip.tsx`, replacing the bulky `react-native-paper` `<Chip>` for display-only chips. However, 6 files still use the paper `<Chip>` — both for display (info/date chips) and interactive use (selectable filters, answer options, day pickers).

## Goals

1. Eliminate remaining `react-native-paper` `<Chip>` usage across the app
2. Add a `backgroundColor` prop to `StatusChip` for filled-background variants
3. Add a `SelectableChip` component for interactive chip use cases
4. Convert the "Save changes" chip-as-button to a proper `Pressable` button
5. Consistent compact styling across all chip variants

## StatusChip Enhancement

Add an optional `backgroundColor` prop to `StatusChip`. Currently it only renders a border with transparent background. Several existing chips (progress %, date stamps in diary/questionnaire) use a filled dark-card background that needs preserving.

Updated props:

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `backgroundColor` | `string` | no | Optional filled background color |

When `backgroundColor` is set, it applies as an inline style. The border remains (set `borderColor` to match `backgroundColor` for a borderless look, or to a contrasting color for a bordered-fill look).

## New Component: SelectableChip

Added to `components/ui/Chip.tsx` alongside `StatusChip`.

### Props

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `label` | `string \| number` | yes | Coerced to string internally via `String()` |
| `selected` | `boolean` | yes | Visual selected state |
| `onPress` | `() => void` | yes | Press handler |
| `disabled` | `boolean` | no | Disables interaction, reduces opacity |
| `icon` | `MCIName` | no | Optional leading icon |
| `className` | `string` | no | Additional className on outer Pressable |
| `accessibilityLabel` | `string` | no | Custom a11y label |
| `selectedBg` | `string` | no | Override selected background (default: `Colors.sway.bright`) |
| `unselectedBg` | `string` | no | Override unselected background (default: `Colors.sway.buttonBackgroundSolid`) |
| `selectedTextColor` | `string` | no | Override selected text color (default: `Colors.sway.dark`) |
| `unselectedTextColor` | `string` | no | Override unselected text color (default: `white`) |

### Visual states

- **Selected**: `backgroundColor: Colors.sway.bright` (or `selectedBg`), text `Colors.sway.dark` (or `selectedTextColor`), font `Fonts.Bold`
- **Unselected**: `backgroundColor: Colors.sway.buttonBackgroundSolid` (or `unselectedBg`), border `Colors.chip.darkCardAlt`, text white (or `unselectedTextColor`), font `Fonts.Regular`
- **Disabled**: opacity 0.5, press handler suppressed
- **Pressed** (web hover / native press feedback): slight opacity reduction via `Pressable`

Note: Uses `Colors.sway.buttonBackgroundSolid` (not the rgba variant) to avoid transparency stacking on different surface backgrounds.

### Sizing

Matches `StatusChip`: `rounded-2xl border px-3 py-1`, text fontSize 12, lineHeight 16.

### Accessibility

- `accessibilityRole="button"` on the Pressable
- `accessibilityState={{ selected, disabled }}` for screen readers

Uses `Pressable` for press handling (consistent with recent button migration to Pressable).

## File Changes

### 1. `components/ui/Chip.tsx`

- Add `backgroundColor` prop to `StatusChip`
- Add `SelectableChip` component
- Export both alongside existing chips

### 2. `components/ui/FilterDrawer.tsx`

- Replace paper `Chip` imports with `SelectableChip` from `Chip.tsx`
- Status filter chips and module filter chips both become `SelectableChip`
- Remove `react-native-paper` `Chip` from imports (keep other paper imports: `Button`, `Divider`, `IconButton`, `Portal`, `Surface`, `TextInput`)
- Co-located fix: replace `Dimensions.get('window')` with `useWindowDimensions()` per project guidelines

### 3. `components/ui/RecurrenceField.tsx`

- Replace paper `Chip` for interval selector with `SelectableChip`
- Label is the interval number (1, 2, 3...) — coerced to string internally

### 4. `components/attempts/presenters/diary/DayChip.tsx`

- Replace paper `Chip` with `SelectableChip` internally
- Keep the dot indicators below (unchanged)
- Pass `accessibilityLabel` through

### 5. `components/attempts/presenters/diary/ActivityDiaryPresenter.tsx`

**Display chips (dates/status):**
- Progress % chip → `StatusChip` with `backgroundColor: Colors.sway.bright`, `color: Colors.sway.dark`, `borderColor: Colors.sway.bright`
- "Completed {date}" → `StatusChip` with `backgroundColor: Colors.chip.darkCard`, `borderColor: Colors.chip.darkCard`, `color: 'white'`, icon `check-circle-outline`
- "Started {date}" → `StatusChip` with `backgroundColor: Colors.chip.darkCard`, `borderColor: Colors.chip.darkCard`, `color: 'white'`, icon `calendar`
- "Updated {date}" → `StatusChip` with `backgroundColor: Colors.chip.darkCard`, `borderColor: Colors.chip.darkCard`, `color: 'white'`, icon `calendar`
- "Last Update {date}" → same as Updated

**"Save changes" action chip → Pressable button:**
- Convert to a `Pressable` with flex-row layout, save icon + text
- Style: `rounded-2xl border px-3 py-1.5`, border `Colors.chip.greenBorder`, bg `Colors.sway.buttonBackground`
- Text: `Colors.chip.green`, font `Fonts.Black` (preserving current weight), 12px
- Keeps the save icon (`content-save`) and disabled logic

### 6. `components/attempts/presenters/questionnaires/QuestionnairePresenter.tsx`

- Band/score chip → `StatusChip` with `backgroundColor: Colors.primary.accent`, `borderColor: Colors.primary.accent`, `color: Colors.sway.dark`
- "Completed {date}" → `StatusChip` with `backgroundColor: Colors.chip.darkCard`, `borderColor: Colors.chip.darkCard`, `color: 'white'`, icon `check-circle-outline`
- "In progress • {date}" → `StatusChip` with `backgroundColor: Colors.chip.darkCard`, `borderColor: Colors.chip.darkCard`, `color: 'white'`, icon `progress-clock`
- "Duration {text}" → `StatusChip` with `backgroundColor: Colors.chip.darkCard`, `borderColor: Colors.chip.darkCard`, `color: 'white'`, icon `clock-outline`

### 7. `components/attempts/presenters/questionnaires/QuestionSlide.tsx`

- Answer option pills → `SelectableChip`
- Uses `selectedBg` / `unselectedBg` / `selectedTextColor` / `unselectedTextColor` props to pass through the dynamic `colors` theme
- Font size: uses SelectableChip's 12px (down from current 14px) for consistency with the compact chip system — intentional size reduction

## Out of Scope

- Removing `react-native-paper` entirely (still used for `Button`, `Surface`, `TextInput`, `Card`, etc.)
- Changing chip content/logic (labels, date formatting, recurrence logic all stay the same)
