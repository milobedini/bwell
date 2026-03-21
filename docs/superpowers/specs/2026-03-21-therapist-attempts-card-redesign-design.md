# Therapist Attempts Tab — Card Redesign

## Problem

The therapist Attempts tab displays patient submissions as a flat, undifferentiated list. Every row uses the same visual treatment regardless of severity. Therapists cannot visually triage — a "High risk" AUDIT-C score looks identical to a "Mild" GAD-7. The oversized title (24px Black) wastes vertical space, there is no module type differentiation, and available data fields (iteration, band details) go unused.

## Scope

UI/UX redesign of the `TherapistLatestAttempts` list items only. Filtering, search, and pagination are explicitly out of scope for this iteration.

## Design

### Card Layout

Each list item becomes a rounded card (`chip.darkCard` background, `rounded-xl`, separated by `gap-3`) with a 3px left accent border colour-coded by severity.

```
┌─────────────────────────────────────────────┐
│ ▎ 📋 PHQ-9                          #3     │
│ ▎ Test Patient                              │
│ ▎ ┌──────────┐                              │
│ ▎ │ 11       │  Moderate                    │
│ ▎ └──────────┘                              │
│ ▎ 📅 2 days ago · 19/03/2026                │
└─────────────────────────────────────────────┘
```

**Row 1 — Header**: Module type icon (MaterialCommunityIcons) + module title (`smallTitle` text type), right-aligned iteration badge `#N` as a small teal pill (only shown when `iteration` exists and > 1).

**Row 2 — Patient**: Patient name in `small` type, `sway.darkGrey` colour.

**Row 3 — Score** (questionnaires only): Score value in a bold pill with severity-tinted background + band label text beside it. Hidden when `totalScore` is falsy (activity diaries and other non-scored module types).

**Row 4 — Date**: Uses `timeAgo()` which returns `{ relative: string | null; formatted: string }`. When `relative` is non-null, render as `"{relative} · {formatted}"`. When `relative` is null (>= 30 days old), render only `formatted`.

### Module Type Icons

| Module Type | Icon Name | Source |
|---|---|---|
| `questionnaire` | `clipboard-text-outline` | MaterialCommunityIcons |
| `activity_diary` | `calendar-week` | MaterialCommunityIcons |
| `psychoeducation` | `book-open-outline` | MaterialCommunityIcons |
| `exercise` | `pencil-outline` | MaterialCommunityIcons |
| fallback (undefined/unknown) | `file-document-outline` | MaterialCommunityIcons |

### Severity Colour Mapping

A `getSeverityColors(label?: string | null): { border: string; pillBg: string }` helper in `utils/severity.ts`.

The left accent border and score pill background are determined by case-insensitive matching on the `scoreBandLabel` string:

| Band label contains | Left border colour | Score pill bg |
|---|---|---|
| "severe" / "high" | `Colors.chip.red` (#F87171) | `Colors.tint.error` |
| "moderate" | `Colors.chip.amber` (#FBBF24) | `Colors.tint.info` |
| "mild" / "minimal" / "low" | `Colors.chip.green` (#34D399) | `Colors.tint.teal` |
| No score / no label / activity diary | `Colors.sway.bright` (#18cdba) | n/a (pill not rendered) |

Activity diaries and any non-scored module type always fall into the last row (teal border, no score pill) by design — this is the expected state, not an error.

### Relative Time Utility

A `timeAgo(dateString: string): { relative: string | null; formatted: string }` function in `utils/dates.ts`.

The `formatted` field uses the existing `dateString()` helper (locale-dependent `toLocaleDateString()`).

The `relative` field:
- < 1 minute: `"just now"`
- 1 minute: `"1 minute ago"`, N minutes: `"N minutes ago"`
- 1 hour: `"1 hour ago"`, N hours: `"N hours ago"`
- 1 day: `"1 day ago"`, N days: `"N days ago"`
- 1 week: `"1 week ago"`, N weeks: `"N weeks ago"` (up to 4 weeks)
- >= 30 days: `null` (only `formatted` is shown)

Singular vs plural is handled explicitly (1 → singular, else plural).

### Empty State

Update from generic "No submissions" to:
- Icon: `clipboard-text-outline`
- Title: "No submissions yet"
- Subtitle: "Completed work from your patients will appear here"

## Backend Changes

### 1. Add `moduleType` to projection

In `getTherapistLatest` (`cbt/src/controllers/attemptsController.ts`), add `moduleType: 1` to the `$project` stage (line ~604).

The `iteration` field is already projected in the existing `$project` stage.

### 2. Update shared type

In `TherapistLatestRow` (`cbt/src/shared-types/types.ts`), add:
```typescript
moduleType?: 'questionnaire' | 'psychoeducation' | 'exercise' | 'activity_diary'
```

Keep `moduleType` at the row level (it comes from the attempt document, not the module lookup).

### 3. Publish shared types

Run `npm run update-types` on the frontend after publishing the new shared-types version.

## Files to Modify

| File | Change |
|---|---|
| `cbt/src/controllers/attemptsController.ts` | Add `moduleType: 1` to `$project` in `getTherapistLatest` |
| `cbt/src/shared-types/types.ts` | Add `moduleType` to `TherapistLatestRow` |
| `bwell/utils/dates.ts` | Add `timeAgo()` utility |
| `bwell/utils/severity.ts` (new) | `getSeverityColors(label?)` returning `{ border, pillBg }` |
| `bwell/components/attempts/TherapistLatestAttempts.tsx` | Full card redesign, replace `TouchableOpacity` with `Pressable` |

## Performance

- Maintain existing `React.memo` on list items and `useCallback` on `renderItem`
- No new API calls — all data comes from existing endpoint (with `moduleType` added to projection)
- Severity colour lookup is a trivial string match inside the memo'd component — no performance concern

## Out of Scope

- Filtering by patient, module, or date range
- Infinite scroll / pagination
- Sorting controls
- Therapist notes on attempts
- Score trend indicators
- Updating local `ModuleType` enum in `types/types.ts` (only needed when used in FE logic; the icon mapping uses raw string matching against the API response)
