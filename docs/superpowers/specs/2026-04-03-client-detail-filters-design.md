# Client Detail Filters & Navigation Consolidation

## Summary

Consolidate client navigation so tapping a client name anywhere navigates to the Clients tab detail screen. Add a filter drawer to the client detail screen so therapists can filter a client's attempt history by module, status, and severity. Remove the deprecated Client Timeline from the home stack.

## Goals

- Single entry point for viewing a client: the Clients tab detail screen (`patients/[id]`)
- Therapists can filter a client's full attempt history without leaving the detail screen
- Reuse the existing `AttemptFilterDrawer` component with minor adaptation
- Clean up deprecated routes

## Navigation Change

### Current behaviour

- `ClientCard` (home dashboard) pushes to `/home/clients/[id]` (deprecated Client Timeline)
- Clients tab detail (`patients/[id]`) shows practice view only, no filters

### New behaviour

- `ClientCard` navigates to `/(main)/(tabs)/patients/[id]` — crosses into the Clients tab
- `/home/clients/` directory is removed entirely
- All references to the deprecated timeline route are cleaned up

## Client Detail Screen: Two-Mode View

### Default mode (no filters active)

The current `PatientPracticeView` — a `SectionList` with time-bucketed sections:

- Today
- This Week
- Upcoming
- Recently Completed

No changes to this view.

### Filtered mode (any filter applied)

When the therapist applies filters via the drawer, the screen switches to a flat `FlatList` of matching attempts using `useGetPatientTimeline` with infinite scroll.

- Uses the **same card styling and layout** as the practice view (not the old alternating-row timeline look)
- Each result renders with the same card components, chips (due dates, completion dates, scores), and spacing as practice items
- Hitting "Reset" in the filter drawer returns to the default bucketed practice view

### Header

- Filter icon (funnel) with badge showing active filter count
- Refresh button
- Same pattern as existing screens with filter drawers

## Filter Drawer

Reuse `AttemptFilterDrawer` with props configured for this context:

| Filter | Included | Source |
|--------|----------|--------|
| Module | Yes | `usePatientModules(patientId)` — specific modules, not types |
| Status | Yes | submitted / active / started / abandoned / all |
| Severity | Yes | Same as existing |
| Patient | No | Already scoped to one client |
| Limit | Yes | Default 20 |

**Title:** "Client filters"

**Default filters:** status `['submitted']`, limit `20`, no module or severity selected.

## Backend: Patient-Scoped Modules Endpoint

### New endpoint

`GET /user/therapist/patients/:id/modules`

Returns a distinct list of modules that this patient has attempts for (any status).

### Response shape

```ts
{
  modules: Array<{ _id: string; title: string }>
}
```

### Implementation

Distinct query on the attempts collection, filtered by patient ID, returning unique module references with their titles.

## Frontend: New Hook

### `usePatientModules(patientId: string)`

In `hooks/usePractice.ts`, following the same pattern as `useTherapistReviewModules`:

```ts
export const usePatientModules = (patientId: string | undefined) => {
  const isLoggedIn = useIsLoggedIn();
  return useQuery({
    queryKey: ['practice', 'patient', patientId, 'modules'],
    queryFn: async () => {
      const { data } = await api.get<{ modules: Array<{ _id: string; title: string }> }>(
        `/user/therapist/patients/${patientId}/modules`
      );
      return data.modules;
    },
    enabled: !!patientId && isLoggedIn
  });
};
```

## Files Changed

### Modified

- `components/home/dashboard/ClientCard.tsx` — change navigation target to Clients tab
- `app/(main)/(tabs)/patients/[id].tsx` — add filter drawer, two-mode view logic, header with filter icon
- `hooks/usePractice.ts` — add `usePatientModules` hook
- `components/ui/AttemptFilterDrawer.tsx` — may need minor prop adjustments if module choices shape differs

### Removed

- `app/(main)/(tabs)/home/clients/` — entire directory (deprecated Client Timeline route + layout)

### Backend (separate repo `../cbt/`)

- New route + controller for `GET /user/therapist/patients/:id/modules`
- New shared type for the response in `@milobedini/shared-types`

## Out of Scope

- Changes to the Review tab (already serves its purpose)
- Changes to the practice view's section bucketing logic
- New module types or assignment features
