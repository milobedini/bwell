# Patient Dashboard Design

## Overview

Replace the current single-button patient home screen with a proper dashboard that surfaces urgent actions, tracks effort, and shows score trends — without displaying clinical severity labels.

## Design Decisions

- **Two states:** Branded empty state (reuses existing `HomeScreen` with Skia animation + logo) for new users with zero data; functional card-based dashboard once the patient has any assignments or scores.
- **Score philosophy:** Show point deltas and trend direction, never severity band labels. "▼ 4 pts" is motivating; "Severe Depression" is not. Full score detail remains accessible in the attempts screen.
- **On-time streak** replaces day streak — counts consecutive assignments submitted before their due date (compare attempt `completedAt` against assignment `dueAt`). Resets on overdue. Honest about expectations (patients don't have daily homework).
- **"This week"** means the same calendar week boundary used by the therapist dashboard (`weekStart` from the dashboard data, typically Monday).

## Empty State

**Condition:** Patient has no active/completed assignments AND no submitted attempts.

**Layout:** Existing `HomeScreen` wrapper (Skia gradient animation + bwell logo) with:
- Welcome message: "Welcome to bwell" / "Your therapy companion. Let's get started."
- Primary CTA: "Take your first questionnaire" (teal button, navigates to programs or questionnaire picker)
- Secondary CTA: "Explore programs" (translucent button, navigates to programs tab)

## Populated Dashboard

**Condition:** Patient has at least one assignment (any status) OR at least one submitted attempt.

**Layout:** `ScrollView` with `RefreshControl`, no animation/logo. Sections in scroll order:

### 1. Greeting Header

- Time-based greeting: "Good morning/afternoon/evening, {firstName}"
- Subtitle: "Week of {weekStartDate}" in `Colors.sway.darkGrey`
- Same pattern as `TherapistDashboard`

### 2. Focus Card

Hero card surfacing the single most urgent action.

**Priority logic (first match wins):**
1. Overdue assignment (oldest first) — error-tinted card
2. Assignment due today — teal-tinted card
3. Assignment due tomorrow — teal-tinted card
4. Next upcoming assignment — subtle teal tint
5. No assignments — "You're all caught up" with CTA to explore programs or review past work

**Card contents:**
- Uppercase label: "OVERDUE" (red) or "YOUR FOCUS THIS WEEK" (teal)
- Assignment title
- Due date context + therapist name
- CTA button: "Continue where you left off →" (if `latestAttempt` exists with status `in_progress`) or "Start →"

**Tapping** navigates to the assignment's attempt flow.

**Visual treatment:**
- Overdue: `Colors.tint.error` background, `Colors.primary.error` accent
- Due today/tomorrow: `Colors.tint.teal` background, `Colors.sway.bright` accent
- Future: lighter teal tint, neutral border

### 3. Effort Strip

Two cards side by side.

**Left — Weekly Completion:**
- Large fraction: "3/4" (numerator in `Colors.sway.bright`)
- Label: "Assignments done"
- Thin progress bar (teal fill on `Colors.chip.darkCardDeep` track)
- Tapping navigates to assignments tab
- Empty: "0/0" with "No assignments yet"

**Right — On-Time Streak:**
- Large number in `Colors.sway.bright`
- Label: "On time"
- Row of dots (last 6-7 assignments): teal = on time, red = was late, grey = pending
- Streak resets to 0 on overdue; dots still show history
- Empty: "0" with "Complete your first on time"

**Card styling:** `Colors.chip.darkCard` background, 14px border-radius.

### 4. Coming Up

Short list of upcoming assignments, sorted by due date (soonest first).

**Each row:**
- Assignment title
- Due date context ("Due tomorrow", "Due 28 Mar")
- Teal "Start →" for actionable items
- Tapping navigates to that assignment's attempt flow

**Rules:**
- Excludes the focus card item (no duplication)
- Max 3 visible; "View all assignments →" link if more exist (navigates to assignments tab)
- Hidden entirely if no upcoming assignments beyond the focus card
- `Colors.chip.darkCard` background, 14px border-radius, no left border accent

### 5. Your Progress

Horizontal row of compact score trend cards.

**Each card (one per questionnaire type the patient has completed):**
- Questionnaire short name (e.g. "PHQ-9")
- Point delta with trend arrow: "▼ 4" in green, "▲ 2" in red
- Mini sparkline SVG (~48px wide) showing last 3-5 scores
- First-ever score (no previous): "✓ completed" in teal, no sparkline

**Delta colours:**
- Score decreased (improving for PHQ-9/GAD-7/PDSS): `Colors.primary.success`
- Score increased (worsening): `Colors.primary.error`
- No change: `Colors.sway.darkGrey` with "— 0"
- All current scales are "lower is better"; inversion logic deferred until needed

**Tapping** navigates to attempts screen.

**Hidden entirely when no scores exist** — no empty state needed.

## Data Requirements

### Existing hooks (reusable)
- `useViewMyAssignments({ status })` — active/completed assignments with due dates
- `useGetMyAttempts({ status })` — attempts with scores and module info

### New data needed

**Option A (preferred): New BE endpoint `GET /api/patients/dashboard`**
Returns an aggregated response:
```ts
{
  focusAssignment: AssignmentWithModule | null;
  upcomingAssignments: AssignmentWithModule[];
  weeklyCompletion: { completed: number; total: number };
  onTimeStreak: { current: number; history: Array<'on_time' | 'late' | 'pending'> };
  scoreTrends: Array<{
    moduleTitle: string;
    moduleType: string;
    latestScore: number;
    previousScore: number | null;
    sparkline: number[]; // last 3-5 scores
  }>;
}
```

**Option B (FE-only): Compose from existing endpoints**
- Fetch active assignments + completed assignments + submitted attempts
- Derive focus card, weekly counts, streak, and score trends client-side
- More API calls, more client-side logic, but no BE changes

Recommendation: Start with Option B to unblock FE work, migrate to Option A when the BE endpoint is built.

## Component Structure

```
components/home/
├── PatientHome.tsx              (updated — switches empty/populated)
├── PatientDashboard.tsx         (new — populated state container)
├── patient-dashboard/
│   ├── FocusCard.tsx            (hero action card)
│   ├── EffortStrip.tsx          (weekly completion + on-time streak)
│   ├── ComingUpList.tsx         (upcoming assignments)
│   ├── ProgressSection.tsx      (score trends with sparklines)
│   └── Sparkline.tsx            (mini SVG sparkline component)
```

## Navigation

All tappable elements navigate to existing screens:
- Focus card / Coming Up rows → assignment attempt flow (existing)
- Effort strip left card / "View all" link → assignments tab
- Progress cards → attempts screen
- Empty state CTAs → programs tab or questionnaire picker

No new screens or routes required.

## Performance Considerations

- Wrap all card components in `React.memo`
- Extract `renderItem` callbacks with `useCallback` for any `FlatList` usage
- Sparklines: use `@shopify/react-native-skia` (already a dependency) rather than adding `react-native-svg`
- `RefreshControl` on the `ScrollView` for pull-to-refresh
- Consider `useMemo` for the focus card priority logic and streak calculation
