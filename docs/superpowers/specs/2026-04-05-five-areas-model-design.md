# Five Areas Model — Design Spec

## Overview

The 5 Areas Model is the foundational CBT framework used in session 1 across every program and tier. The patient maps a real situation where their mood dropped across 5 interconnected areas (Situation, Thoughts, Emotions, Physical Sensations, Behaviours), then reflects on how to break the cycle. This is the single most important unbuilt clinical tool — identified as the top priority in four consecutive PM briefs.

## Core Decisions

- **One attempt = one situation.** Each attempt maps one specific situation. Multiple situations = multiple attempts, handled by the existing repeating assignment system.
- **Stepped flow with guided input.** Patients progress through 6 steps (5 areas + reflection) one at a time, with collapsible helper hints per area.
- **Hot cross bun diagram as progress indicator.** The progress indicator is the classic 5 Areas diagram — nodes light up as areas are completed. Tapping a completed node navigates back to edit it.
- **All free text inputs.** No structured tags or chips — patients use their own words, guided by helper hints.
- **Save-as-you-go.** Auto-saves when navigating between steps. Patients can exit and resume later.
- **Diagram-first review.** Both patient and therapist review uses the completed diagram with text snippets, tappable to expand full text.
- **Linear with free back-navigation.** Must progress forward one step at a time, but can tap any completed step to revisit.

## Data Model

### Shared Types (`@milobedini/shared-types`)

Add `'five_areas_model'` to the `ModuleType` union.

```typescript
type FiveAreasData = {
  situation: string;
  thoughts: string;
  emotions: string;
  behaviours: string;
  physical: string;
  reflection: string;
};
```

- Add `fiveAreas?: FiveAreasData` to `ModuleAttempt`
- Add `fiveAreas?: FiveAreasData` to `SaveProgressInput`
- Add `fiveAreas?: FiveAreasData` to `AttemptDetailResponseItem`

### Backend (`ModuleAttempt` Mongoose schema)

Add `fiveAreas` as an embedded subdocument with 6 string fields. No nested array — one entry per attempt.

Add `'five_areas_model'` to the `moduleType` enum on both `Module` and `ModuleAttempt` models.

### FE Local Enum (`types/types.ts`)

Add `FIVE_AREAS_MODEL = 'five_areas_model'` to `ModuleType`.

## Backend Logic

### `attemptsController.saveProgress`

New branch for `moduleType === 'five_areas_model'`:

- Merge incoming `fiveAreas` fields with existing data (partial updates — only overwrite fields the patient has filled in)
- Update `userNote` if provided
- Set `lastInteractionAt`
- Save

No new endpoints, controllers, or routes. All handled within existing attempt CRUD.

### `attemptsController.startAttempt`

No changes. Creates a `ModuleAttempt` with `moduleType: 'five_areas_model'` and `status: 'started'`. The `fiveAreas` field starts as `undefined`.

### `attemptsController.submit`

No changes. Existing flow sets `status: 'submitted'`, `completedAt`, and calculates `durationSecs`. No scoring for 5 Areas (unlike questionnaires).

### Module Seed

Add a 5 Areas Model module to the Depression program:

```
{ title: '5 Areas Model', type: 'five_areas_model',
  accessPolicy: 'assigned', program: depressionProgramId }
```

## Frontend Architecture

### New Files

| File | Purpose |
|------|---------|
| `components/attempts/presenters/five-areas/FiveAreasPresenter.tsx` | Main presenter — routes between edit and view modes |
| `components/attempts/presenters/five-areas/useFiveAreasState.ts` | State hook: step tracking, save/submit, dirty tracking |
| `components/attempts/presenters/five-areas/FiveAreasDiagram.tsx` | Hot cross bun SVG diagram (Skia), touch handling |
| `components/attempts/presenters/five-areas/AreaStep.tsx` | Single step view: label, helper hint, text input |
| `components/attempts/presenters/five-areas/AreaReviewCard.tsx` | Expanded text card for review mode |

### Modified Files

| File | Change |
|------|--------|
| `components/attempts/presenters/AttemptPresenter.tsx` | Add `is5AreasAttempt` branch |
| `utils/types.ts` | Add `is5AreasAttempt` type guard |
| `types/types.ts` | Add `FIVE_AREAS_MODEL` enum value |
| `utils/moduleIcons.ts` | Add icon for `five_areas_model` |

### Component Behaviour by Mode

| Mode | View |
|------|------|
| `edit` (patient filling in) | Stepped flow. Hot cross bun diagram at top as progress. One area per screen. Back/Next navigation. Auto-save on step change. Submit after all 6 steps. |
| `view` (patient reviewing own) | Diagram-first. Completed hot cross bun with text snippets. Tap node to expand full text. Read-only. |
| `view` (therapist reviewing) | Same diagram-first view. Shows patient name in header. Read-only. |

### `useFiveAreasState` Hook

- `currentStep` (0–5): Situation, Thoughts, Emotions, Physical, Behaviours, Reflection
- `fiveAreas: FiveAreasData` local state, hydrated from server on mount
- `dirtyFields: Set<string>` for change tracking
- `saveProgress()` — calls `useSaveModuleAttempt` with only dirty fields, silent (no toast)
- `handleSubmit()` — saves pending changes then submits
- Auto-save when navigating between steps if current step is dirty
- `canGoForward` / `canGoBack` computed from `currentStep` and completion state
- Completed steps tappable via diagram node touch handler

## Hot Cross Bun Diagram

### Implementation

`@shopify/react-native-skia` for rendering. Provides smooth animations, path drawing, and touch handling across iOS/Android/Web.

### Layout

```
        [Situation]
             |
     [Thoughts] --- [Emotions]
          \       /
           \     /
      [Physical] --- [Behaviours]
             |
         [Reflection]
```

Situation above the four interconnected core areas. Reflection below as the conclusion. The four core areas connected by lines (the "cross") showing interrelationships.

### Node States

| State | Visual |
|-------|--------|
| Locked | Grey outline (`Colors.chip.dotInactive`), no fill, lock icon |
| Current | Teal border with glow/pulse animation, white text, slightly larger |
| Completed | Teal-tinted fill (`Colors.tint.teal`), teal border (`Colors.tint.tealBorder`), checkmark |

### Connection Lines

Dashed lines between the 4 core areas. Lines between completed nodes become solid teal. Lines to/from locked nodes stay grey dashed.

### Touch Handling

- Tap completed node → auto-save current step (if dirty), navigate to that step
- Tap locked node → no-op
- Tap current node → no-op

### Therapist Review Mode

All nodes completed, all lines solid teal. Each node shows a 2–3 word snippet of the patient's text. Tapping any node scrolls to the corresponding `AreaReviewCard` below the diagram.

### Sizing

Scales to screen width via `useWindowDimensions()`, capped at a sensible max. Node text shrinks on smaller screens but stays readable.

## Stepped Flow UX

### Step Order

1. Situation
2. Thoughts
3. Emotions
4. Physical Sensations
5. Behaviours
6. Reflection

Clinical sequence: describe what happened → what went through your mind → how you felt → what you noticed physically → what you did → how to break the cycle.

### Step Screen Layout (Edit Mode)

1. Hot cross bun diagram (~30% screen height)
2. Area label in teal, bold
3. Collapsible helper hint (visible by default, dismissible per-step — not persisted across sessions)
4. Multi-line text input (auto-growing, min 3 lines)
5. Back / Next buttons at bottom

### Helper Hints

| Area | Hint |
|------|------|
| Situation | "Who were you with? What happened? When and where?" |
| Thoughts | "Sentences about what went through your mind. e.g. 'They don't care about me', 'I'm useless'" |
| Emotions | "Usually one word: sad, angry, anxious, guilty, hopeless, frustrated" |
| Physical | "What you noticed in your body: heart racing, tension, low energy, stomach churning" |
| Behaviours | "Actions you took: stayed in bed, snapped at them, withdrew, avoided a situation" |
| Reflection | "Looking at the cycle above — how could you break it to improve your mood?" |

### Auto-Save

When the patient taps Next or taps a completed diagram node, the current step auto-saves silently if dirty. No toast on auto-save.

### Submit Flow

After completing the reflection, the Next button becomes "Review & Submit". This shows the diagram-first review view so the patient can see their complete entry before confirming. A "Submit" button at the bottom finalises it with a success haptic.

### Exiting Mid-Flow

If the patient uses hardware back or a close button, and there are unsaved changes, save silently then navigate back. The attempt stays in `started` status — they can resume later.

### Haptics

- Success haptic on submit
- Selection haptic when tapping diagram nodes

## Therapist Review

The therapist sees the completed hot cross bun diagram with snippets, with `AreaReviewCard` components below for full text. Same view as patient post-submission review, with patient name in the header.

If the therapist opens an in-progress attempt (not yet submitted), the diagram shows completed/locked nodes reflecting the patient's progress with a note: "This entry is still in progress."

## Scope Exclusions

- No scoring or band labels (unlike questionnaires)
- No E2E/Maestro tests (to be handled app-wide separately)
- No therapist notes UI on submissions (data model supports it but no UI this cycle)
- No notification/reminder system
- No self-help tier differentiation
