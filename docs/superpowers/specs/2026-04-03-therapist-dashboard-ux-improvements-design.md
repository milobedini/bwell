# Therapist Dashboard UX Improvements

## Summary

Three targeted improvements to the therapist dashboard client cards, focused on making triage faster and clearer:

1. **Reason tags** on attention cards — surface why a client needs attention
2. **Chevron tap affordance** — make cards look tappable
3. **Week-scoped assignment framing** — reframe dots, progress bar, and text around the current week plus all overdue

## Context

The therapist dashboard is a triage tool. Therapists open it to quickly identify which clients need action this week. The current card design packs useful data (scores, deltas, assignment dots, progress bar) but has three gaps:

- **No explicit "why"** — the left border color encodes the attention reason (red = severe, orange = overdue/worsening) but therapists must memorise this. The `reasons` array is in the data but not surfaced as text.
- **No tap affordance** — cards navigate to `/patients/[id]` but have no visual cue indicating they're interactive.
- **Misleading scope** — the completion text reads "6/7 completed" which conflates all active assignments (potentially weeks old) with this week's completions. The dots and bar inherit this same mixed scope.

## Design

### 1. BE — Assignment summary scoping

**Shared types change** — replace `DashboardAssignmentSummary`:

```typescript
// Before
export type DashboardAssignmentSummary = {
  total: number;
  completed: number;
  overdue: number;
};

// After
export type DashboardAssignmentSummary = {
  completedThisWeek: number;
  overdueTotal: number;
  pendingThisWeek: number;
};
```

**Field definitions:**

| Field | Scope | Query logic |
|-------|-------|-------------|
| `completedThisWeek` | Week-scoped | Assignments with status `"completed"` and `updatedAt` within `weekStart..weekEnd`. Same as current `completedAssignmentsThisWeek` query — no change needed. |
| `overdueTotal` | All-time | Active assignments (`status: "assigned" | "in_progress"`) where `dueAt < now`. Not week-scoped — old overdue items are more urgent, not less. |
| `pendingThisWeek` | Week-scoped | Active assignments where `dueAt >= now && dueAt < weekEnd`. Due this week but not yet overdue. |

**Controller changes** (`therapistDashboardController.ts`):

- Keep existing `completedAssignmentsThisWeek` query (lines 214–218) — already correct.
- Modify the active assignments query (lines 208–211): still fetch all active assignments, but partition them in the loop:
  - `overdueTotal`: `dueAt < now` (any due date)
  - `pendingThisWeek`: `dueAt >= now && dueAt < weekEnd`
  - Active assignments with `dueAt >= weekEnd` or no `dueAt` are excluded from the card summary (not relevant to this week's triage)
- Build `DashboardAssignmentSummary` from these three counts.

**`DashboardStats.overdueAssignments`** — keep as total overdue across all patients (all-time, not week-scoped), consistent with the per-card `overdueTotal`.

**Triage bucket categorisation** — no change. The `reasons` array `'overdue'` flag still triggers on any overdue assignment (all-time), which determines bucket placement. The assignment summary fields are purely for the card's visual display.

### 2. FE — Reason tags on attention cards

Render small bordered pills on the middle row of `ClientCard`, after the score delta, only when `bucket === 'attention'`.

**Reason → tag mapping:**

| Reason | Label | Background | Border | Text |
|--------|-------|-----------|--------|------|
| `severe_score` | "Severe" | `Colors.tint.error` | `Colors.tint.errorBorder` | `Colors.primary.error` |
| `worsening` | "Worsening" | `Colors.tint.info` | `Colors.tint.infoBorder` | `Colors.primary.warning` |
| `overdue` | "Overdue" | `Colors.tint.info` | `Colors.tint.infoBorder` | `Colors.primary.warning` |

**Styling:** font size 11px, `fontWeight: '600'`, `borderRadius: 10`, `paddingHorizontal: 8`, `paddingVertical: 2`, `borderWidth: 1`.

Render all applicable tags — up to 3 pills. The middle row uses `flex-wrap: wrap` to handle overflow gracefully.

Tags are not shown on completed or inactive bucket cards.

### 3. FE — Chevron tap affordance

Add a `chevron-right` icon from `MaterialCommunityIcons` to every client card.

- **Position:** Absolute, right edge (right: 10), vertically centered (top: 50%, translateY: -50%)
- **Size:** 18
- **Color:** `Colors.chip.dotInactive` — subtle, doesn't compete with card content
- **Layout impact:** Add ~20px `paddingRight` to the top row to prevent "last active" text overlapping the chevron

Applies to all cards in all buckets.

### 4. FE — Week-scoped completion text, dots, and bar

**Bottom row text** — replace `"X/Y completed · Z overdue"` with explicit weekly framing:

- Format: `"3 done · 2 overdue · 1 pending"`
- Each count maps to: `done` = `completedThisWeek`, `overdue` = `overdueTotal`, `pending` = `pendingThisWeek`
- Omit any segment with a zero count
- If everything complete and no overdue: `"3 done ✓"`
- If all counts are zero: `"No assignments this week"`

**Dots** — reorder to match new fields:
1. Teal (`Colors.sway.bright`) — one per `completedThisWeek`
2. Red (`Colors.primary.error`) with shadow — one per `overdueTotal`
3. Grey (`Colors.chip.dotInactive`) — one per `pendingThisWeek`
- Total = `completedThisWeek + overdueTotal + pendingThisWeek`
- Max 6 visible, `+N` overflow label for remainder

**Progress bar** — fill percentage = `completedThisWeek / (completedThisWeek + overdueTotal + pendingThisWeek)`. If denominator is 0, show 0%. Same 80px width, 4px height, teal fill.

## Files changed

### Backend (`../cbt/`)
- `src/shared-types/types.ts` — update `DashboardAssignmentSummary` type
- `src/controllers/therapistDashboardController.ts` — update assignment partitioning logic

### Frontend
- `components/home/dashboard/ClientCard.tsx` — reason tags, chevron, week-scoped text/dots/bar
- `package.json` — update `@milobedini/shared-types` version after publish

## Out of scope

- Therapist review workflow (not yet built)
- Sorting within buckets (current sort logic is fine)
- Progress bar responsive width (80px fixed is acceptable for now)
- "No submissions this week" bucket collapse behaviour
- Days since last session signal on cards
