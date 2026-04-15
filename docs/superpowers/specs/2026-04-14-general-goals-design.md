# General Goals — Design Spec

## Overview

General Goals is a CBT tool used from session 1 onwards. The patient and therapist collaboratively set up to 3 overarching therapy goals, each rated on a 0-10 scale. Goals are re-rated at the therapist's discretion (typically at the 6-week mark and at therapy end) to track progress. This tool is used in both CBT and PWP programs.

## Clinical Context

- Based on the NHS Goal-Based Outcomes (GBO) standard
- 0 = "Goal not met at all", 10 = "Goal fully reached"
- A movement of 2.45+ points on the scale is considered clinically meaningful change
- Goals should be expressed as approach goals (what to move toward, not what to avoid)
- The therapist guides SMART goal-setting in session; the app captures the result
- Used across the full course of therapy as the anchor for treatment progress

## Key Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Goal cap | 3 maximum | GBO standard, clinical consensus, keeps focus |
| Re-rating model | Flexible, therapist-triggered | Fits existing assignment flow, therapist controls cadence |
| Reflection | Single section after all goals | Balanced: captures patient thinking without heavy form |
| Goal text on re-rating | Read-only | Goals are set once, rated over time. Revisions = new assignment |
| Architecture | One attempt per rating occasion | Follows existing module pattern, each attempt is a self-contained snapshot |

## Data Model

### GeneralGoalsData (on attempt)

```typescript
type GeneralGoalsData = {
  goals: Array<{
    goalText: string;        // patient's own words
    rating: number | null;   // 0-10 integer, null until patient provides rating
  }>;
  reflection: string;
  isReRating: boolean;
  previousRatings: Array<{
    date: string;        // ISO date of the previous attempt submission
    ratings: number[];   // ratings array, same order as goals
  }>;
};
```

- Max 3 goals enforced on both FE and BE
- `isReRating` is `false` on the first attempt, `true` on all subsequent attempts
- `previousRatings` accumulates the full history chain across all prior attempts

### Shared Types

- Add `'general_goals'` to the `ModuleType` union
- Add `GeneralGoalsData` type definition
- Add `generalGoals?: GeneralGoalsData` to the attempt detail response

## Backend Logic

### Attempt Creation (pre-population)

When the BE creates a new `general_goals` attempt for a patient:

1. Query for the patient's most recently submitted `general_goals` attempt
2. **No prior attempt found:** create a blank attempt with `isReRating: false`, empty `goals`, empty `previousRatings`
3. **Prior attempt found:**
   - Copy `goals` array from the prior attempt (preserving `goalText`, setting `rating` to `null`)
   - Set `isReRating: true`
   - Build `previousRatings` by taking the prior attempt's `previousRatings` array and appending the prior attempt's own ratings + submission date

### Submit Validation

**First attempt (`isReRating: false`):**
- At least 1 goal required
- Each goal must have non-empty `goalText` and a `rating` (0-10 integer)
- `reflection` is required

**Re-rating (`isReRating: true`):**
- All goals must have a `rating` (0-10 integer)
- `goalText` must not be modified (reject if text differs from pre-populated values)
- `reflection` is required

### Save Validation (partial progress)

- No strict validation on save; patient can save at any point
- `goalText` and `rating` can be partially filled

### Module Type Whitelist

- Add `general_goals` to the `createModule` endpoint's type validation whitelist

## Frontend Presenter

### Two states based on `isReRating`

**First attempt (`isReRating: false`):**
- Patient enters up to 3 goals, each with text + rating
- After goals: reflection section with guidance prompts:
  - "Are these goals in line with your values and what is important to you?"
  - "Are your goals achievable or do you need to add some steps to get to the final outcome?"
  - "Are these goals relevant to improving your mood?"
- Single text field for written reflection
- Save-as-you-go with dirty tracking

**Re-rating (`isReRating: true`):**
- Goal text displayed read-only
- Previous ratings shown for context
- New rating input for each goal
- Reflection section with prompt: "How do you feel about your progress towards these goals?"
- Save-as-you-go with dirty tracking

**View mode (therapist review + patient viewing submitted):**
- Goal cards showing text + rating(s)
- Rating history displayed if re-rating (e.g. previous values with dates)
- Reflection text displayed

All visual design, layout, animations, input components, and UX details are at the designer's discretion. The presenter should follow existing patterns (see `FiveAreasPresenter` for reference).

### State Hook

`useGeneralGoalsState` following the `useFiveAreasState` pattern:
- Initialise from `attempt.generalGoals`
- Track dirty state per goal index
- Save-as-you-go via `useSaveModuleAttempt`
- Submit via `useSubmitAttempt` with review step

### Files to Create/Modify

**Shared types (`../cbt/`):**
- Add `general_goals` to `ModuleType`
- Add `GeneralGoalsData` type
- Publish to npm

**Backend (`../cbt/`):**
- Mongoose schema for general goals data
- Pre-population logic in attempt creation
- Submit validation for general goals
- Add `general_goals` to module type whitelist

**Frontend:**
- `utils/types.ts` — add `isGeneralGoalsAttempt()` type guard
- `components/attempts/presenters/AttemptPresenter.tsx` — add case for `general_goals`
- `components/attempts/presenters/general-goals/GeneralGoalsPresenter.tsx` — main presenter
- `components/attempts/presenters/general-goals/useGeneralGoalsState.ts` — state hook
- `utils/moduleIcons.ts` — add icon for general goals
- Update shared types via `npm run update-types`

## Out of Scope

- Automated 6-week reminders or scheduling (therapist assigns manually)
- Progress charts or trend visualisation
- SMART goal templates or suggestions
- Goal categories or tagging
- Linking goals to other modules (e.g. diary entries)
- Gamification, streaks, or achievement badges
