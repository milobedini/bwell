# PR #14 Review Fixes — Design Spec

Addresses the 6 issues identified in the code review of PR #14 (feat: therapist attempts screen UX redesign).

## Issue 1 & 2: Local FE types → shared-types package

### Problem

`TherapistLatestPage`, `TherapistLatestFilters`, `TherapistModulesResponse` are defined locally in `hooks/useAttempts.ts`. `SeverityOption` and `SortOption` are defined locally in `constants/Filters.ts`. All represent API contracts that should live in `@milobedini/shared-types` per CLAUDE.md.

### Fix

**Backend (`../cbt/src/shared-types/types.ts`):**

Update `TherapistLatestResponse` to include pagination fields the API already returns:

```typescript
export type TherapistLatestResponse = {
  success: boolean;
  rows: TherapistLatestRow[];
  nextCursor: string | null;
  totalCount: number;
};
```

Add new types:

```typescript
export type SeverityOption = 'severe' | 'moderate' | 'mild';
export type SortOption = 'newest' | 'oldest' | 'severity';

export type TherapistLatestFilters = {
  patientId?: string;
  moduleId?: string;
  severity?: SeverityOption;
  status?: string;
  sort?: SortOption;
  limit?: number;
};

export type TherapistAttemptModule = {
  _id: string;
  title: string;
  moduleType: ModuleType;
};

export type TherapistAttemptModulesResponse = {
  success: boolean;
  modules: TherapistAttemptModule[];
};
```

Export all new types from `index.ts`. Bump package version, publish to npm.

Note: `ModuleType` is already exported from `@milobedini/shared-types` — `TherapistAttemptModule` can reference it directly. The local `TherapistModulesResponse` currently types `moduleType` as `string`; the shared type intentionally tightens this to `ModuleType` since the BE controller only returns valid enum members (lookup is from the `modules` collection which enforces `ModuleType`). The shared `TherapistLatestFilters.severity` is typed as `SeverityOption` (narrowed from the hook's current `string`) — this is intentional since the API only accepts these three values. Call sites passing `severity` (the filter drawer) already constrain to these values via the UI, so no breakage is expected — but verify after the type change.

**Frontend:**

- `hooks/useAttempts.ts`: Remove local `TherapistLatestPage`, `TherapistLatestFilters`, `TherapistModulesResponse`. Import `TherapistLatestResponse`, `TherapistLatestFilters`, `TherapistAttemptModulesResponse`, `SortOption` from `@milobedini/shared-types`. Keep `TherapistLatestSelected` local (FE-derived transform, not an API shape). Use `TherapistLatestResponse` where `TherapistLatestPage` was used.
- `constants/Filters.ts`: Remove local `SeverityOption`, `SortOption` definitions. Import and re-export from `@milobedini/shared-types`. Note: `DrawerStatusOption` and `AttemptFilterDrawerValues` are FE-only UI types and must stay local — do not move these to shared-types.
- Run `npm run update-types` to pull the new package version.

## Issue 3: Double status serialisation

### Problem

`TherapistLatestAttempts.tsx` pre-joins `filters.status?.join(',')` before passing to the hook. The hook also defensively joins with `Array.isArray(status) ? status.join(',') : status`. Works by accident but fragile.

### Fix

Keep the join at the component → hook boundary (where the type converts from UI `string[]` to API `string`). Remove the defensive `Array.isArray` join inside the hook — the type signature declares `status?: string`, so trust the contract.

- `hooks/useAttempts.ts` line 87: Change `status: Array.isArray(status) ? status.join(',') : status` to `status`.

## Issue 4: Stale totalCount during filter transitions

### Problem

With `keepPreviousData`, the header shows the old `totalCount` while new results load after a filter change.

### Fix

Dim the count text when data is stale. In `TherapistLatestAttempts.tsx`, apply reduced opacity to the count when `isFetching && !isPending`. Inline `style` is required here because NativeWind cannot bind opacity to a JS boolean at runtime:

```typescript
<ThemedText
  type="small"
  style={{ opacity: isFetching && !isPending ? 0.4 : 1 }}
>
  {totalCount} {totalCount === 1 ? 'submission' : 'submissions'}
</ThemedText>
```

## Issue 5: Monday date-grouping edge case

### Problem

In `utils/dates.ts`, `yesterday` and `thisWeekStart` resolve to the same timestamp on Mondays because `getDay()` treats Sunday as 0. The "This Week" bucket becomes unreachable.

### Fix

Switch to Monday-based week start (ISO convention), consistent with the Activity Diary's Monday-based weeks.

In `utils/dates.ts` line 96:

```typescript
// Before (Sunday-based):
const thisWeekStart = new Date(today.getTime() - today.getDay() * 86_400_000);

// After (Monday-based):
const dow = today.getDay() || 7;
const thisWeekStart = new Date(today.getTime() - (dow - 1) * 86_400_000);
```

Monday's `thisWeekStart` = Monday (today), so "Yesterday" (Sunday) correctly falls into the previous week. Note: `lastWeekStart` (defined as `thisWeekStart - 7 days`) remains correct after this change — no update needed.

## Issue 6: isError guard wipes stale data

### Problem

`if (isError) return <ErrorComponent />` replaces the entire list on transient network failures, even when `keepPreviousData` has stale data available.

### Fix

Only show full-screen error when no data exists. When stale data is available, show the list and fire an error toast using the existing `sonner-native` setup.

Important: the `useEffect` for the toast must be declared before *all* conditional `return` statements — including the existing `if (isPending) return <LoadingIndicator />` — to comply with React's rules of hooks. Place the effect in the hooks section of the component, before any early returns.

```typescript
import { toast } from 'sonner-native';
import { TOAST_STYLES, TOAST_DURATIONS } from '@/components/toast/toastOptions';

// Declared before conditional returns (rules of hooks)
useEffect(() => {
  if (isError && sections.length > 0) {
    toast.error('Failed to refresh', {
      duration: TOAST_DURATIONS.error,
      style: TOAST_STYLES.error.toast,
      descriptionStyle: TOAST_STYLES.error.description,
    });
  }
}, [isError, sections]); // sections is memoized — its reference changes only when content changes, so it is safe as a dependency

// Full-screen error only when no data
if (isError && !sections.length) return <ErrorComponent errorType={ErrorTypes.GENERAL_ERROR} />;
```

## Final step: Update PR

After all fixes, push to the PR branch and post a summary comment on PR #14 addressing each review finding with links to the fixing commits.

## Files modified

### Backend (`../cbt/`)

| File | Change |
| ------ | -------- |
| `src/shared-types/types.ts` | Update `TherapistLatestResponse`, add `SeverityOption`, `SortOption`, `TherapistLatestFilters`, `TherapistAttemptModule`, `TherapistAttemptModulesResponse` |
| `src/shared-types/index.ts` | Export new types |
| `src/shared-types/package.json` | Bump version |

### Frontend (`bwell/`)

| File | Change |
| ------ | -------- |
| `hooks/useAttempts.ts` | Remove local types, import from shared-types, remove defensive status join |
| `constants/Filters.ts` | Remove local types, import/re-export from shared-types |
| `components/attempts/TherapistLatestAttempts.tsx` | Dim stale totalCount, guard isError with data check, add error toast |
| `utils/dates.ts` | Monday-based week start |
