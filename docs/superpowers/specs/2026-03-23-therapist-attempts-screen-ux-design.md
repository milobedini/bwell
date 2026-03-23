# Therapist Attempts Screen — UX Redesign

**Date:** 2026-03-23
**Status:** Draft
**Scope:** Full UX overhaul of the therapist attempts list — filtering, sorting, date grouping, cursor pagination, and visual polish

---

## Context

The therapist attempts screen (`TherapistLatestAttempts`) currently displays a flat chronological list of patient submissions with no filtering, sorting, or grouping. As caseloads grow, this becomes unusable. A UI/UX review (see `docs/reviews/attempts-screen-ui-review.md`) identified 8 issues ranked by impact.

This spec addresses all 8.

---

## Design Decisions

1. **Filter Drawer + Inline Sort** — reuse and extend the existing `AttemptFilterDrawer` pattern. Sort chips live on the main screen (not inside the drawer) for quick access.
2. **Date grouping only** — section headers group by date ("Today", "Yesterday", "This Week", etc.). No patient-grouped view — the patient filter covers that use case.
3. **Backend filtering with cursor pagination** — all filters (patient, module, severity, status) are backend query params. FE filtering breaks with cursor pagination (incomplete pages). The existing endpoint is extended, not replaced.
4. **Module filter by name, not type** — therapists care about "PHQ-9" not "questionnaire". A single module filter shows specific module names, sourced from a new backend endpoint.
5. **Sort options:** Newest first (default), Oldest first, Severity (high → low).

---

## 1. Screen Layout

### Header
- Title: "Attempts" (`ThemedText type="title"`)
- Subtitle: "{count} submissions" (`ThemedText type="small"`, `Colors.sway.darkGrey`)
- Filter button: top-right, `IconButton` with filter icon, opens the filter drawer
- Total count comes from backend response

### Sort Row
- Horizontal row of tappable chips below the header
- Options: **Newest** | **Oldest** | **Severity**
- Active chip: teal tint background + teal border + teal text
- Inactive chips: transparent + `chip.darkCardAlt` border + `Colors.sway.darkGrey` text
- Always visible, not inside the drawer

### Active Filter Chips
- Shown below sort row only when filters are applied
- Each active filter renders as a dismissible chip (tap ✕ to remove that filter)
- Chip color matches the filter type (teal for patient, severity color for severity, neutral for module/status)
- "Clear all" link at the end when 2+ filters active
- Hidden when no filters applied (no empty space)

### Date Section Headers
- Sticky headers that group the list chronologically
- Progression: "Today" → "Yesterday" → "This Week" → "Last Week" → "This Month" → month names ("February", "January") for older entries
- Style: uppercase, small bold text (`ThemedText type="smallBold"`), `Colors.sway.darkGrey`, subtle background (`rgba(38,46,66,0.5)`), bottom border
- Implemented via `SectionList` (replacing `FlatList`) with sections computed from the data

### List
- `SectionList` with `RefreshControl` for pull-to-refresh
- Cursor-based infinite scroll (load more on end reached)
- Cards identical to current design with the polish fixes below

---

## 2. Filter Drawer

Extends the existing `AttemptFilterDrawer` component with new filter dimensions. The `limit` filter is removed (replaced by cursor pagination with a fixed page size).

### Filter Dimensions

#### Patient (single-select)
- Text input at top for searching by name
- Scrollable list of matching patients below (therapist's assigned clients)
- Shows patient name and email
- Single-select: tapping a patient selects/deselects
- Data source: therapist's existing client list (already fetched via `useTherapistClients`)

#### Module (single-select)
- Chip row if ≤ 6 modules, searchable list if more
- Shows specific module names (PHQ-9, GAD-7, Activity Diary, etc.)
- "Any" chip to clear the filter
- Data source: new `GET /user/therapist/attempts/modules` endpoint — returns distinct modules attempted by the therapist's patients

#### Severity (single-select)
- Chip row: **Any** | **Severe** | **Moderate** | **Mild**
- Chip colors match severity palette (red/amber/green)
- Only relevant for scored modules; if a non-scored module is also filtered, severity is ignored by backend

#### Status (multi-select, existing pattern)
- Chip row: **Submitted** | **Active** | **Started** | **Abandoned** | **All**
- "All" clears other selections (existing mutual-exclusion logic)
- Default: `['submitted']`

### Drawer Footer
- **Reset** (text button, darkGrey) — restores all filters to defaults
- **Cancel** (text button, error/red) — closes drawer without applying
- **Apply** (contained button, teal) — applies filters and closes

---

## 3. Backend Changes

All changes are in the backend repo (`../cbt/`).

### Extended Endpoint: `GET /user/therapist/attempts/latest`

#### New Query Params

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| `patientId` | ObjectId string | — | Filter to a specific patient |
| `moduleId` | ObjectId string | — | Filter to a specific module |
| `severity` | `severe` \| `moderate` \| `mild` | — | Filter by score band label (maps: `severe` → `/severe\|high/i`, `moderate` → `/moderate/i`, `mild` → `/mild\|minimal\|low/i`) |
| `status` | string (CSV or single) | `submitted` | `submitted`, `active`, `started`, `abandoned`, `all` |
| `sort` | `newest` \| `oldest` \| `severity` | `newest` | Sort order |
| `cursor` | ISO date string | — | Pagination cursor (completedAt of last item) |
| `limit` | number | 20 | Page size (clamped 1–100) |

#### Updated Response Shape

```typescript
{
  success: boolean;
  rows: TherapistLatestRow[];
  nextCursor: string | null;  // NEW — completedAt of last row, null if no more pages
  totalCount: number;         // NEW — total matching rows (for header subtitle)
}
```

#### Severity Sort Logic
When `sort=severity`, order by a computed weight:
1. `severe` / `high` → weight 3
2. `moderate` → weight 2
3. `mild` / `minimal` / `low` → weight 1
4. No score band → weight 0

Within the same weight, sort by `completedAt` descending (newest first).

#### Cursor Pagination
- `cursor` is the `completedAt` ISO string of the last item on the current page
- For `sort=newest`: `WHERE completedAt < cursor`
- For `sort=oldest`: `WHERE completedAt > cursor`
- For `sort=severity`: cursor is `{weight}_{completedAt}_{_id}` compound value to maintain stable pagination (uses `_id` as final tiebreaker for guaranteed cursor stability)

### New Endpoint: `GET /user/therapist/attempts/modules`

Returns distinct modules that have been attempted by the therapist's patients.

```typescript
// Response
{
  success: boolean;
  modules: Array<{
    _id: string;      // module ObjectId
    title: string;    // "PHQ-9", "GAD-7", etc.
    moduleType: string; // "questionnaire", "activity_diary", etc.
  }>;
}
```

Query: aggregate attempts for the therapist's patients, group by module, return distinct module info. Cache-friendly (therapist's module list changes infrequently).

---

## 4. Frontend Hook Changes

### `useTherapistGetLatestAttempts` → refactored to `useInfiniteQuery`

```typescript
type TherapistAttemptsFilters = {
  patientId?: string;
  moduleId?: string;
  severity?: 'severe' | 'moderate' | 'mild';
  status?: string;
  sort?: 'newest' | 'oldest' | 'severity';
};

// Switches from useQuery to useInfiniteQuery
// queryKey includes all filter params for automatic refetch on change
// select() flattens pages and exposes totalCount
```

### New `useTherapistAttemptModules` hook

```typescript
// Simple useQuery, returns the module list for the filter drawer
// queryKey: ['attempts', 'therapist', 'modules']
// Long staleTime — module list rarely changes
```

---

## 5. Date Grouping Utility

New utility function `groupByDate(rows: TherapistLatestRow[])` in `utils/dates.ts`:

- Input: flat array of rows with `completedAt` dates
- Output: sections array for `SectionList`: `{ title: string; data: TherapistLatestRow[] }[]`
- Section titles: "Today", "Yesterday", "This Week", "Last Week", "This Month", then month names ("February 2026", "January 2026")
- Handles timezone correctly using local date comparison

---

## 6. Visual Polish (Quick Wins)

All changes within `TherapistLatestAttempts.tsx` / `TherapistAttemptListItem`:

| Issue | Change | Details |
|-------|--------|---------|
| Card internal spacing | `gap-2` → `gap-3` | 8px → 12px breathing room |
| Header subtitle | Add count | "{n} submissions" in `small` grey text below "Attempts" |
| Score pill min-width | Add `minWidth: 40` | Aligns single/double digit scores visually |
| Compact dates | Relative time only | "2 hours ago" on card, absolute date in detail view only |
| Pull-to-refresh | `RefreshControl` on `SectionList` | Wire `onRefresh` to query's `refetch`, `refreshing` to `isRefetching` |
| Top spacing | Audit padding | Remove any double-up between `ContentContainer` and `contentContainerStyle` padding |

---

## 7. Component Changes Summary

| File | Action |
|------|--------|
| `components/attempts/TherapistLatestAttempts.tsx` | Major refactor — add filters, sort, sections, SectionList, pull-to-refresh, visual fixes |
| `components/ui/AttemptFilterDrawer.tsx` | Extend — add patient search, module chips, severity chips; remove limit filter |
| `hooks/useAttempts.ts` | Refactor `useTherapistGetLatestAttempts` to `useInfiniteQuery`; add `useTherapistAttemptModules` |
| `constants/Filters.ts` | Add severity filter type, sort type, update `AttemptFilterDrawerValues` |
| `utils/dates.ts` | Add `groupByDate()` utility for SectionList sections |
| `../cbt/` (backend) | Extend latest attempts controller + route; add modules endpoint |

---

## 8. Out of Scope

- Patient-grouped view (patient filter covers this)
- Module type filter (replaced by specific module name filter)
- Persistent filter state (filters reset on screen remount — acceptable for now)
- Real-time updates / websocket push (pull-to-refresh is sufficient)
