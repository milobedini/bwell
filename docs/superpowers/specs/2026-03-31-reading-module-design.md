# Reading Module Type — Design Spec

**Date:** 2026-03-31
**Status:** Approved

## Summary

Consolidate the unused `psychoeducation` and `exercise` module types into a single `reading` type. Build a presenter that renders rich markdown content with an optional reader note, a scroll progress indicator, and a mark-as-complete flow.

## Motivation

- `psychoeducation` and `exercise` exist in the enum and can be assigned by therapists, but patients hit a "Not available yet" dead end
- Both types share an identical data model — no structured input, no scoring
- The proposal uses psychoeducation for educational handouts (e.g., fight-or-flight for panic disorder) and exercise for practical worksheets (e.g., values clarification) — both are fundamentally "read this content" experiences
- A single `reading` type is clearer, simpler, and avoids maintaining two types for the same thing

## Data Model Changes

### Shared Types

**`ModuleType`** changes from:
```
'questionnaire' | 'psychoeducation' | 'exercise' | 'activity_diary'
```
to:
```
'questionnaire' | 'reading' | 'activity_diary'
```

### Module Model (BE)

Add one new field:
- `content: String` (optional, no maxlength) — markdown string containing the full article body. Only used by `reading` type modules.

The existing `description` field (500 char max) remains as a short summary for cards and lists. `content` is the long-form article body.

### ModuleAttempt Model (BE)

Add one new field:
- `readerNote: String` (optional) — the patient's personal reflection or note, submitted alongside completion. Stored on the attempt so therapists can review it.

### ModuleSnapshot

The existing `moduleSnapshot` on ModuleAttempt captures module state at attempt start. Since `content` is now part of the Module, the snapshot will automatically include it (it snapshots the full module document). No explicit changes needed.

### No Changes To

- ModuleAssignment model
- Module accessPolicy
- Attempt lifecycle (start → submit)

## BE Changes

### Module Controller

- `createModule` — accept `content` in the request body; validate it's only provided when `type === 'reading'`
- `getDetailedModuleById` — return `content` in the response for reading modules
- Update type enum validation to `['questionnaire', 'reading', 'activity_diary']`

### Attempts Controller

- `submitAttempt` — accept optional `readerNote` in the body for reading-type attempts; save it on the attempt record
- No progress/scoring logic needed — `computePercentCompleteForAttempt` already returns 0 for non-questionnaire/non-diary types

### Seed Data

- Update "Sleep Hygiene Basics" from `psychoeducation` → `reading`
- Update "Values Clarification" from `exercise` → `reading`
- Add sample markdown `content` to at least one seed module for testing

### Shared Types Package

- Update `ModuleType` union
- Add `content?: string` to `Module` type
- Add `readerNote?: string` to `ModuleAttempt` and relevant response types

## FE Presenter

### New Component: `components/attempts/presenters/reading/ReadingPresenter.tsx`

**Layout (top to bottom):**

1. **Reading progress bar** — thin sticky bar at the top of the screen. Fills left-to-right as the user scrolls through the content. Uses `Colors.sway.bright` (teal). Purely visual, no state persistence.

2. **Article body** — rendered markdown inside a `ScrollView`. A markdown renderer maps to the app's design system:
   - H1 → `ThemedText type="subtitle"`
   - H2 → `ThemedText type="smallTitle"`
   - Body text → `ThemedText type="default"`
   - Images → full-width with optional caption (italic text below image)
   - Dark theme background, consistent spacing

3. **Reader note input** — text input at the bottom of the article content (inside the scroll, not fixed). Placeholder: "Add a personal note or reflection..." Only shown in `edit` mode.

4. **Complete button** — `ThemedButton` at the bottom. Submits the attempt with the optional `readerNote`.

### View Mode (therapist reviewing / patient viewing completed attempt)

- Progress bar hidden
- Reader note displayed as read-only text if one exists
- No complete button

### AttemptPresenter Routing

Add a case for `attempt.moduleType === 'reading'` that routes to `ReadingPresenter`.

### Markdown Library

Add `react-native-markdown-display` — lightweight, customisable, well-maintained.

### Icon Mapping

Update `MODULE_TYPE_ICONS` in `TherapistLatestAttempts.tsx` and `AssignmentCard.tsx`:
- `reading: 'book-open-outline'`

## Cleanup

### Remove

- `psychoeducation` and `exercise` from `ModuleType` in shared-types
- `PSYCHO_EDUCATION` and `EXERCISE` from the local FE enum in `types/types.ts`
- Their entries in `MODULE_TYPE_ICONS` in both `TherapistLatestAttempts.tsx` and `AssignmentCard.tsx`
- The TODO comment in `AttemptPresenter.tsx`

### Update

- All BE controller type enum validation arrays
- All BE model enum arrays
- Any FE or BE code that checks for or filters by `psychoeducation` or `exercise`
- `computePercentCompleteForAttempt` if it references these types explicitly

### Migration

No migration script needed. Only seed data uses `psychoeducation`/`exercise`. Re-running the seed script with updated types is sufficient. For existing dev/staging data, a one-liner mongo update query in the seed file handles it.

## Out of Scope

- Admin UI for authoring reading content (seed scripts for now)
- Scroll position persistence between sessions
- Reading time estimates
- Content versioning
