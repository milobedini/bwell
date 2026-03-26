# Therapist Assignments Tab — Design Spec

## Overview

Redesign the therapist Assignments tab (the "Assignments" top tab within the Assignments bottom tab) from a basic flat list into a full command centre for monitoring compliance and managing active assignments. Uses the hybrid approach: SectionList architecture from the Submissions tab with patient-grouped collapsible sections.

## Goals

- **Monitor compliance** — quickly see which patients haven't started homework, who's overdue
- **Manage workload** — view, edit, and remove assignments across all clients
- **Consistency** — reuse interaction patterns from the Submissions tab (sort, filter, infinite scroll)
- **Patient-first** — group assignments by patient, reflecting how therapists think about their caseload

## Layout Structure

### Header Row
- Left: `"{n} assignments"` count (secondary text)
- Right: `"Collapse all"` / `"Expand all"` text button + filter icon button (`filter-variant` from MaterialCommunityIcons)

### Sort Chips Row
Horizontal scrollable chips below the header:
- **Urgency** (default) — patients ordered by their most urgent assignment
- **Newest** — patients ordered by most recently created assignment
- **Oldest** — patients ordered by oldest assignment
- **Module** — patients alphabetical, assignments alphabetical by module within

Active chip: teal background (`Colors.sway.bright`), dark text. Inactive: pill background (`Colors.chip.pill`), secondary text.

**Sort behaviour:** Sorting always groups by patient. The sort determines the order of patient groups (by their "representative" assignment — most urgent, newest, oldest) and the order of assignments within each group.

### Active Filter Chips
When filters are applied, show teal-tinted chips below the sort row with `✕` to clear individually, plus a "Clear all" link. Same pattern as Submissions tab.

### SectionList — Patient Groups

Each section represents one patient. Sections are collapsible.

#### Patient Group Header
- **Patient name** — `ThemedText type="smallTitle"` (left)
- **Assignment count pill** — e.g., "3 active" (neutral tint)
- **Urgency badge** — shown only when overdue assignments exist, e.g., "2 overdue" (error tint: `Colors.tint.error` bg, `Colors.tint.errorBorder` border, `Colors.primary.error` text)
- **Chevron** — animated rotation on expand/collapse (Reanimated)
- **Background** — `Colors.chip.darkCard`
- **Tap** — toggles section expand/collapse
- All sections **expanded by default** on first load

#### Collapse All / Expand All
- Text button in header row: shows "Collapse all" when any sections are expanded, "Expand all" when any are collapsed
- Toggles all sections at once

### Assignment Cards

Each card within a patient group:

#### Left Accent Border
Color-coded by urgency:
- Red (`Colors.primary.error`) — overdue
- Amber (`Colors.primary.warning`) — due within 48 hours
- Teal (`Colors.sway.bright`) — on track (has due date, not approaching)
- Grey (`Colors.sway.darkGrey`) — no due date

#### Card Content
- **Module icon + title** — icon from module type mapping (same as Submissions), `ThemedText type="smallTitle"`
- **Iteration badge** — shows `#2`, `#3` etc. when `attemptCount > 1` (neutral chip)
- **Chip row** — horizontal wrap of compact chips:
  - Due date chip (e.g., "Due Mar 28") — color matches accent border
  - Time left chip (e.g., "2 days left" or "3 days overdue") — color matches accent border
  - Recurrence chip (e.g., "Weekly", "Monthly") — neutral styling
  - Attempt status chip:
    - "Not started" — neutral (`Colors.tint.neutral`)
    - "In progress" — teal (`Colors.tint.teal`)
    - "Submitted" — green (`Colors.chip.green`)
- **Notes preview** — if assignment has notes, show first line truncated with ellipsis, italic secondary text
- **Dots menu** (top-right) — `⋮` opens ActionMenu

#### Card Interactions
- **Tap card** — navigate to latest attempt detail (if `latestAttempt` exists). No action if no attempt yet.
- **Dots menu → ActionMenu:**
  - "Edit assignment" — opens edit bottom sheet
  - "Remove assignment" (destructive) — confirmation required before deletion

#### Card Styling
- Background: `Colors.chip.pill` (slightly different from the patient header to create depth)
- Pressed state: `active:opacity-80`
- Border radius: 8px
- Margin: horizontal within patient card, vertical gap between cards

### Edit Assignment Bottom Sheet
Opens via `@gorhom/bottom-sheet` when "Edit assignment" is selected from ActionMenu.

Editable fields:
- **Due date** — date picker (using `DueDateField` component)
- **Notes** — text input
- **Recurrence** — recurrence picker (using `RecurrenceField` component)

Footer: **Cancel** | **Save** buttons. Save triggers `PATCH /assignments/:id` mutation.

Non-editable (shown as read-only context at top of sheet): module title, patient name.

### FAB
- Bottom-right floating action button, navigates to `/assignments/add`
- Same as current implementation — no changes needed

### Pull-to-Refresh
`RefreshControl` wired to query's `refetch`, same as Submissions.

### Infinite Scroll
Load more on `onEndReached` with loading spinner at bottom. Uses `useInfiniteQuery` with `keepPreviousData`.

### Empty State
"No active assignments" message with "Create assignment" button (navigates to `/assignments/add`). Uses `EmptyState` component.

## Filter Drawer

Slides in from right, ~75% screen width, dark overlay. Same architectural pattern as `AttemptFilterDrawer`.

### Filter Sections

1. **Patient** — search picker, single-select (reuse `SearchPickerDialog` pattern)
2. **Module** — chip select, single-select. Shows modules the therapist has assigned. Options: All + dynamic list from assigned modules.
3. **Status** — chip select. Options: All | Assigned | In Progress
4. **Urgency** — chip select. Options: All | Overdue | Due Soon (48h) | On Track | No Due Date

### Footer
- **Reset** — clears all filters
- **Cancel** — closes drawer without applying
- **Apply** — applies filters, closes drawer, triggers refetch

## Backend Changes

### 1. Update `listAssignmentsForTherapist` endpoint

**Current:** `GET /api/assignments/mine` — returns all outstanding assignments, fixed sort.

**Updated:** Add query parameters:
- `patientId` — filter by specific patient
- `moduleId` — filter by module
- `status` — filter by assignment status (`assigned`, `in_progress`)
- `urgency` — filter: `overdue`, `due_soon` (within 48h), `on_track`, `no_due_date`
- `sortBy` — `urgency` (default), `newest`, `oldest`, `module`
- `page` / `limit` — pagination (default: page 1, limit 20)

**Sort logic:**
- **Urgency:** Group all assignments by patient, determine each patient's "most urgent" assignment (overdue > due_soon > on_track > no_due_date), sort patient groups by that urgency. Within each patient group, sort assignments by urgency.
- **Newest:** Sort patient groups by their most recently created assignment. Within each group, newest first.
- **Oldest:** Sort patient groups by their oldest assignment. Within each group, oldest first.
- **Module:** Sort patient groups alphabetically by patient name. Within each group, sort alphabetically by module title.

The BE returns a **flat list** with assignments ordered so that all of a patient's assignments are adjacent. The FE groups into SectionList sections.

**Response shape:**
```typescript
{
  items: MyAssignmentView[];  // flat list, patient-grouped by sort order
  page: number;
  totalPages: number;
  totalItems: number;
}
```

### 2. Populate `latestAttempt` and `attemptCount`

Add to the therapist assignment response:
- `latestAttempt` — same shape as the patient endpoint (`AssignmentLatestAttemptPreview`): `_id`, `status`, `score`, `maxScore`, `completedAt`
- `attemptCount` — total number of attempts for this assignment

This requires a lookup/aggregate on the Attempt collection grouped by assignment ID.

### 3. Update `updateAssignmentStatus` → `updateAssignment`

Rename/extend the existing `PATCH /assignments/:id` endpoint to accept optional fields beyond just `status`:
- `dueAt` — update due date
- `notes` — update therapist notes
- `recurrence` — update recurrence settings

The existing status update logic remains. The endpoint now also handles partial updates to these additional fields.

### 4. Update shared types

Add to `MyAssignmentView` (if not already present):
- `attemptCount?: number`

Ensure `latestAttempt` field is already typed on `MyAssignmentView` (it is — currently used by patient endpoint).

Add `UpdateAssignmentInput` type:
```typescript
type UpdateAssignmentInput = {
  status?: AssignmentStatus;
  dueAt?: string;
  notes?: string;
  recurrence?: AssignmentRecurrence;
};
```

## Frontend Architecture

### New/Modified Files

**New:**
- `components/assignments/AssignmentFilterDrawer.tsx` — filter drawer component
- `components/assignments/AssignmentCard.tsx` — individual assignment card (extracted for `React.memo`)
- `components/assignments/PatientGroupHeader.tsx` — collapsible patient section header
- `components/assignments/EditAssignmentSheet.tsx` — bottom sheet for editing assignments

**Modified:**
- `components/assignments/TherapistActiveAssignments.tsx` — updated to use new hook and pass filter/sort state
- `components/assignments/AssignmentsListTherapist.tsx` — rewritten: SectionList replacing FlatList, sort chips, filter integration, collapsible sections
- `hooks/useAssignments.ts` — new `useTherapistAssignments` hook with `useInfiniteQuery`, filter/sort params

### Hook: `useTherapistAssignments`

```typescript
useTherapistAssignments({
  patientId?: string;
  moduleId?: string;
  status?: 'assigned' | 'in_progress';
  urgency?: 'overdue' | 'due_soon' | 'on_track' | 'no_due_date';
  sortBy?: 'urgency' | 'newest' | 'oldest' | 'module';
})
```

Returns `useInfiniteQuery` result. Uses `keepPreviousData`. FE transforms flat response into `{ title: patientName, data: assignments[] }[]` sections via a `select` function.

### Mutation: `useUpdateAssignment`

New mutation for the edit bottom sheet — `PATCH /assignments/:id` with `{ dueAt?, notes?, recurrence? }`.

The existing `useRemoveAssignment` mutation is reused for deletion.

## Performance Considerations

- `AssignmentCard` wrapped in `React.memo`
- `PatientGroupHeader` wrapped in `React.memo`
- `renderItem` and `renderSectionHeader` extracted to `useCallback`
- `ItemSeparatorComponent` extracted to stable const
- Collapsible animation uses Reanimated (not `LayoutAnimation`) for 60fps
- `keepPreviousData` on query to prevent flash on filter/sort changes
