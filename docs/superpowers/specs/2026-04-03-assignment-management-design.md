# Assignment Management — Edit & Remove

## Overview

Add the ability for therapists to edit and remove assignments from the patient detail screen. Accessed via long-press on a `PatientPracticeCard`, which opens an `ActionMenu` with "Edit assignment" and "Remove assignment" actions.

## Interaction Flow

1. **Long-press** on any `PatientPracticeCard` in the patient detail view → haptic feedback (`expo-haptics`) → opens `ActionMenu`
2. **ActionMenu** displays two actions:
   - "Edit assignment" — navigates to edit screen
   - "Remove assignment" — destructive, with built-in confirmation step
3. **Edit screen** (`patients/edit.tsx`) mirrors the create assignment screen (`patients/add.tsx`) with client and module fields locked (read-only) and due date, recurrence, and notes pre-populated and editable
4. **Remove** hard-deletes the assignment via `DELETE /assignments/:id`

## Components

### Modified: `PatientPracticeCard`

- Add `onLongPress` callback prop that passes the `PracticeItem` to the parent
- Trigger `Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)` on long-press
- No visual changes to the card itself

### Modified: `PatientPracticeView`

- Manage `ActionMenu` visibility state and the selected `PracticeItem`
- Wire `onLongPress` from each `PatientPracticeCard` to open the ActionMenu
- ActionMenu config:
  - Title: module title from the selected item
  - Subtitle: due date + recurrence summary
  - Actions:
    - `{ icon: 'pencil-outline', label: 'Edit assignment', onPress: navigateToEdit }`
    - `{ icon: 'delete-outline', label: 'Remove assignment', variant: 'destructive', confirmTitle: 'Remove assignment?', confirmDescription: 'This will permanently remove the [moduleTitle] assignment. Any in-progress work will be lost.', confirmLabel: 'Remove', onPress: handleRemove }`
- `navigateToEdit`: push to `/patients/edit` with assignment data as route params (assignmentId, moduleTitle, programTitle, dueAt, recurrence, notes, patientName)
- `handleRemove`: call `useRemoveAssignment().mutate({ assignmentId })`, toast on success/error

### New: `app/(main)/(tabs)/patients/edit.tsx`

Full-screen form mirroring `patients/add.tsx` layout:

- **Header**: "Edit Assignment" (via `headerTitle` route param or stack header)
- **Client field**: `SelectField`, read-only, shows patient name — disabled, check-circle icon
- **Module field**: `SelectField`, read-only, shows module title + program/type subtitle — disabled, check-circle icon
- **Due date**: `DueDateField` — pre-populated from route params, editable. Supports clearing (set to `null`)
- **Recurrence**: `RecurrenceField` — shown only when due date is set, pre-populated, editable
- **Notes**: `TextInput` — pre-populated, editable, same styling as create screen
- **Buttons**:
  - "Save Changes" — `ThemedButton` variant="default", calls `useUpdateAssignment()` with `{ assignmentId, updates: { dueAt, recurrence, notes } }`. Disabled when no changes detected or mutation pending
  - "Cancel" — `ThemedButton` variant="error", navigates back

State is local (`useState` for each field). Dirty detection compares current values against initial values from route params to enable/disable the save button.

## Hooks Used (existing, no changes)

- `useUpdateAssignment()` — `PATCH /assignments/:assignmentId` with `{ dueAt?, recurrence?, notes? }`
- `useRemoveAssignment()` — `DELETE /assignments/:assignmentId`
- Both already invalidate the correct query keys (assignments, clients, practice, review)

## Reused Components (no changes)

- `ActionMenu` — with destructive confirmation
- `DueDateField` — date/time picker
- `RecurrenceField` — recurrence config (weekly/monthly with interval)
- `SelectField` — form row display
- `ContentContainer` — screen wrapper
- `ThemedButton` — action buttons

## BE Changes

None. The existing endpoints handle everything:
- `PATCH /assignments/:assignmentId` accepts `{ status?, dueAt?, notes?, recurrence? }`
- `DELETE /assignments/:assignmentId` hard-deletes the assignment

## Route Params for Edit Screen

Passed via `router.push` params from `PatientPracticeView`:

| Param | Type | Description |
|-------|------|-------------|
| `assignmentId` | string | Assignment ID for the update mutation |
| `patientName` | string | Display only (locked field) |
| `moduleTitle` | string | Display only (locked field) |
| `programTitle` | string | Display only (locked field subtitle) |
| `moduleType` | string | Display only (locked field subtitle) |
| `dueAt` | string? | ISO string, initial value for DueDateField |
| `recurrence` | string? | JSON-stringified `{ freq, interval }`, initial value |
| `notes` | string? | Initial value for notes input |
| `headerTitle` | string | "Edit Assignment" |

## Edge Cases

- **Assignment with no due date**: DueDateField shows "No due date", RecurrenceField hidden. Therapist can add a due date.
- **Assignment with due date but no recurrence**: RecurrenceField appears with "None" selected.
- **Completed assignments**: Long-press still works for completed items in "Recently Completed" section — edit allows changing notes (for record-keeping). Due date and recurrence changes on completed assignments are allowed (the BE accepts them).
- **Mutation failure**: Toast error shown, form state preserved so therapist can retry.
- **No changes made**: Save button stays disabled until at least one field differs from the initial values.
