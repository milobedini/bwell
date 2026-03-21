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

**Row 1 — Header**: Module type icon (MaterialCommunityIcons) + module title (`smallTitle` text type), right-aligned iteration badge `#N` as a small teal pill (only shown when iteration > 1).

**Row 2 — Patient**: Patient name in `small` type, `sway.darkGrey` colour.

**Row 3 — Score** (questionnaires only): Score value in a bold pill with severity-tinted background + band label text beside it. Hidden for activity diaries and other non-scored module types.

**Row 4 — Date**: Relative time string ("2 days ago") + separator dot + formatted date in `small` type, `sway.darkGrey` colour.

### Module Type Icons

| Module Type | Icon Name | Source |
|---|---|---|
| `questionnaire` | `clipboard-text-outline` | MaterialCommunityIcons |
| `activity_diary` | `calendar-week` | MaterialCommunityIcons |
| `psychoeducation` | `book-open-outline` | MaterialCommunityIcons |
| `exercise` | `pencil-outline` | MaterialCommunityIcons |
| fallback | `file-document-outline` | MaterialCommunityIcons |

### Severity Colour Mapping

The left accent border and score pill background are determined by matching the `scoreBandLabel` string:

| Band label contains | Left border colour | Score pill bg |
|---|---|---|
| "severe" / "high" (case-insensitive) | `Colors.chip.red` (#F87171) | `Colors.tint.error` (rgba(255,109,94,0.15)) |
| "moderate" | `Colors.chip.amber` (#FBBF24) | `Colors.tint.info` (rgba(255,209,93,0.15)) |
| "mild" / "minimal" / "low" | `Colors.chip.green` (#34D399) | `Colors.tint.teal` (rgba(24,205,186,0.15)) |
| No score / no label | `Colors.sway.bright` (#18cdba) | n/a |

### Relative Time Utility

A `timeAgo(dateString: string): string` function in `utils/dates.ts`:

- < 1 minute: "just now"
- < 1 hour: "X minutes ago"
- < 24 hours: "X hours ago"
- < 7 days: "X days ago"
- < 30 days: "X weeks ago"
- >= 30 days: returns formatted date string (no relative label)

### Empty State

Update from generic "No submissions" to:
- Icon: `clipboard-text-outline`
- Title: "No submissions yet"
- Subtitle: "Completed work from your patients will appear here"

## Backend Changes

### 1. Add `moduleType` to projection

In `getTherapistLatest` (`cbt/src/controllers/attemptsController.ts`), add `moduleType: 1` to the `$project` stage (line ~604).

### 2. Update shared type

In `TherapistLatestRow` (`cbt/src/shared-types/types.ts`), add:
```typescript
moduleType?: 'questionnaire' | 'psychoeducation' | 'exercise' | 'activity_diary'
```

And update `TherapistModulePreview` to include `type` if useful, or keep `moduleType` at the row level since it's on the attempt document, not the module.

### 3. Publish shared types

Run `npm run update-types` on the frontend after publishing the new shared-types version.

## Files to Modify

| File | Change |
|---|---|
| `cbt/src/controllers/attemptsController.ts` | Add `moduleType: 1` to `$project` in `getTherapistLatest` |
| `cbt/src/shared-types/types.ts` | Add `moduleType` to `TherapistLatestRow` |
| `bwell/utils/dates.ts` | Add `timeAgo()` utility |
| `bwell/components/attempts/TherapistLatestAttempts.tsx` | Full card redesign |
| `bwell/utils/severity.ts` (new) | Severity colour mapping helper |

## Performance

- Maintain existing `React.memo` on list items and `useCallback` on `renderItem`
- No new API calls — all data comes from existing endpoint (with `moduleType` added to projection)
- Card styling is pure NativeWind classNames — no runtime style computation beyond the severity colour lookup

## Out of Scope

- Filtering by patient, module, or date range
- Infinite scroll / pagination
- Sorting controls
- Therapist notes on attempts
- Score trend indicators
