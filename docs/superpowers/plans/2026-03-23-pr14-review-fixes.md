# PR #14 Review Fixes Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Address the 6 code review issues on PR #14 (therapist attempts screen UX redesign).

**Architecture:** Update the BE shared-types package to include pagination fields and filter types the API already supports, then clean up FE code to import from shared-types and fix bugs in date grouping, error handling, and stale data display.

**Tech Stack:** TypeScript, `@milobedini/shared-types` npm package, TanStack React Query, sonner-native toasts, Expo React Native

**Spec:** `docs/superpowers/specs/2026-03-23-pr14-review-fixes-design.md`

---

### Task 1: Update shared-types package (BE)

**Files:**
- Modify: `../cbt/src/shared-types/types.ts:355-358`
- Auto-bumped: `../cbt/src/shared-types/package.json` (via `publish:pkg` script)

- [ ] **Step 1: Update TherapistLatestResponse with pagination fields**

In `../cbt/src/shared-types/types.ts`, replace lines 355-358:

```typescript
// Before:
export type TherapistLatestResponse = {
  success: boolean
  rows: TherapistLatestRow[]
}

// After:
export type TherapistLatestResponse = {
  success: boolean
  rows: TherapistLatestRow[]
  nextCursor: string | null
  totalCount: number
}
```

- [ ] **Step 2: Add new types after TherapistLatestResponse**

Append after the updated `TherapistLatestResponse` (after line ~361):

```typescript
export type SeverityOption = 'severe' | 'moderate' | 'mild'
export type SortOption = 'newest' | 'oldest' | 'severity'

export type TherapistLatestFilters = {
  patientId?: string
  moduleId?: string
  severity?: SeverityOption
  status?: string
  sort?: SortOption
  limit?: number
}

export type TherapistAttemptModule = {
  _id: string
  title: string
  moduleType: ModuleType
}

export type TherapistAttemptModulesResponse = {
  success: boolean
  modules: TherapistAttemptModule[]
}
```

Note: `ModuleType` is already defined at line 106 of the same file and exported via `index.ts`.

Note: `index.ts` uses `export type * from './types'` — the wildcard re-export automatically covers all new types. No changes needed to `index.ts`.

- [ ] **Step 3: Build, version bump, publish, and commit**

The `publish:pkg` script handles version bump + publish atomically. Do not manually edit `package.json` version.

```bash
cd ../cbt/src/shared-types && npm run publish:pkg
```

This bumps from `1.0.78` to `1.0.79` and publishes to npm.

- [ ] **Step 4: Commit (BE repo)**

```bash
cd ../cbt && git add src/shared-types/types.ts src/shared-types/package.json
git commit -m "feat(shared-types): add pagination fields and filter types for therapist attempts"
```

---

### Task 2: Update FE shared-types and remove local types

**Files:**
- Modify: `hooks/useAttempts.ts:5-15,45-66,187-190`
- Modify: `constants/Filters.ts:3,5`

- [ ] **Step 1: Pull new shared-types version**

```bash
npm run update-types
```

Verify: check that `TherapistLatestResponse` in `node_modules/@milobedini/shared-types` now includes `nextCursor` and `totalCount`.

- [ ] **Step 2: Update shared-types import in useAttempts.ts**

In `hooks/useAttempts.ts`, replace the import block at lines 5-15:

```typescript
// Before:
import type {
  AttemptDetailResponse,
  MyAttemptsResponse,
  PatientModuleTimelineResponse,
  SaveProgressInput,
  SaveProgressResponse,
  StartAttemptResponse,
  SubmitAttemptInput,
  SubmitAttemptResponse,
  TherapistLatestRow
} from '@milobedini/shared-types';

// After:
import type {
  AttemptDetailResponse,
  MyAttemptsResponse,
  PatientModuleTimelineResponse,
  SaveProgressInput,
  SaveProgressResponse,
  StartAttemptResponse,
  SubmitAttemptInput,
  SubmitAttemptResponse,
  TherapistAttemptModulesResponse,
  TherapistLatestFilters,
  TherapistLatestResponse,
  TherapistLatestRow
} from '@milobedini/shared-types';
```

- [ ] **Step 3: Remove local TherapistLatestFilters and TherapistLatestPage types**

Delete the local type definitions at lines 45-59 of `hooks/useAttempts.ts`:

```typescript
// DELETE these:
type TherapistLatestFilters = {
  patientId?: string;
  moduleId?: string;
  severity?: string;
  status?: string;
  sort?: SortOption;
  limit?: number;
};

type TherapistLatestPage = {
  success: boolean;
  rows: TherapistLatestRow[];
  nextCursor: string | null;
  totalCount: number;
};
```

- [ ] **Step 4: Update TherapistLatestSelected to use TherapistLatestResponse**

Update the local `TherapistLatestSelected` type (was lines 61-66) to reference `TherapistLatestResponse` instead of the deleted `TherapistLatestPage`:

```typescript
type TherapistLatestSelected = {
  pages: TherapistLatestResponse[];
  rows: TherapistLatestRow[];
  nextCursor: string | null;
  totalCount: number;
};
```

Also update all `TherapistLatestPage` references in the `useInfiniteQuery` generic and body to use `TherapistLatestResponse`:

- Line 72-73: `useInfiniteQuery<TherapistLatestPage,` → `useInfiniteQuery<TherapistLatestResponse,`
- Line 81: `Promise<TherapistLatestPage>` → `Promise<TherapistLatestResponse>`
- Line 82: `api.get<TherapistLatestPage>` → `api.get<TherapistLatestResponse>`
- Line 96: `InfiniteData<TherapistLatestPage,` → `InfiniteData<TherapistLatestResponse,`

All four occurrences of `TherapistLatestPage` in this function must be replaced with `TherapistLatestResponse`.

- [ ] **Step 5: Remove local TherapistModulesResponse type**

Delete the local type at lines 187-190 of `hooks/useAttempts.ts`:

```typescript
// DELETE:
type TherapistModulesResponse = {
  success: boolean;
  modules: { _id: string; title: string; moduleType: string }[];
};
```

Update the `useTherapistAttemptModules` hook to use `TherapistAttemptModulesResponse` from shared-types (the import was already added in step 2).

- [ ] **Step 6: Update constants/Filters.ts to re-export from shared-types**

In `constants/Filters.ts`, replace lines 3 and 5:

```typescript
// Before:
export type SeverityOption = 'severe' | 'moderate' | 'mild';

export type SortOption = 'newest' | 'oldest' | 'severity';

// After:
export type { SeverityOption, SortOption } from '@milobedini/shared-types';
```

Note: `DrawerStatusOption` and `AttemptFilterDrawerValues` are FE-only UI types — they stay local.

- [ ] **Step 7: Remove SortOption import from shared-types in Filters.ts consumers**

The `SortOption` import in `hooks/useAttempts.ts` (line 3) currently comes from `@/constants/Filters`. Since it's now re-exported, this import still works. No change needed — verify it compiles.

- [ ] **Step 8: Validate**

```bash
npm run lint
```

Expected: no type errors related to the changed imports.

- [ ] **Step 9: Commit**

```bash
git add hooks/useAttempts.ts constants/Filters.ts package.json package-lock.json
git commit -m "refactor: move API types to shared-types package, remove local FE definitions"
```

---

### Task 3: Fix double status serialisation

**Files:**
- Modify: `hooks/useAttempts.ts:87`

- [ ] **Step 1: Remove defensive Array.isArray join**

In `hooks/useAttempts.ts` line 87 (line number may have shifted after Task 2 edits), find:

```typescript
status: Array.isArray(status) ? status.join(',') : status,
```

Replace with:

```typescript
status,
```

The component already joins `filters.status?.join(',')` before calling the hook. The hook's type declares `status?: string`, so trust the contract.

- [ ] **Step 2: Validate**

```bash
npm run lint
```

- [ ] **Step 3: Commit**

```bash
git add hooks/useAttempts.ts
git commit -m "fix: remove redundant status serialisation in useTherapistGetLatestAttempts"
```

---

### Task 4: Dim stale totalCount during filter transitions

**Files:**
- Modify: `components/attempts/TherapistLatestAttempts.tsx:325-327`

- [ ] **Step 1: Add opacity to stale count**

In `TherapistLatestAttempts.tsx`, find the totalCount display (line 325-327):

```typescript
<ThemedText type="small" className="text-sway-darkGrey">
  {totalCount} {totalCount === 1 ? 'submission' : 'submissions'}
</ThemedText>
```

Replace with (inline `style` required because NativeWind cannot bind opacity to a JS boolean at runtime):

```typescript
<ThemedText
  type="small"
  className="text-sway-darkGrey"
  style={{ opacity: isFetching && !isPending ? 0.4 : 1 }}
>
  {totalCount} {totalCount === 1 ? 'submission' : 'submissions'}
</ThemedText>
```

- [ ] **Step 2: Validate**

```bash
npm run lint
```

- [ ] **Step 3: Commit**

```bash
git add components/attempts/TherapistLatestAttempts.tsx
git commit -m "fix: dim stale totalCount during filter transitions"
```

---

### Task 5: Fix Monday date-grouping edge case

**Files:**
- Modify: `utils/dates.ts:96`

- [ ] **Step 1: Switch to Monday-based week start**

In `utils/dates.ts` line 96, find:

```typescript
const thisWeekStart = new Date(today.getTime() - today.getDay() * 86_400_000);
```

Replace with:

```typescript
const dow = today.getDay() || 7; // Sunday becomes 7 (ISO convention)
const thisWeekStart = new Date(today.getTime() - (dow - 1) * 86_400_000);
```

`lastWeekStart` on line 97 (`thisWeekStart - 7 days`) remains correct — no change needed.

- [ ] **Step 2: Validate**

```bash
npm run lint
```

- [ ] **Step 3: Commit**

```bash
git add utils/dates.ts
git commit -m "fix: use Monday-based week start in date grouping (ISO convention)"
```

---

### Task 6: Fix isError guard wiping stale data + add error toast

**Files:**
- Modify: `components/attempts/TherapistLatestAttempts.tsx:1,318-319`

- [ ] **Step 1a: Add `useEffect` to the React import**

In `TherapistLatestAttempts.tsx` line 1, add `useEffect` to the existing React import:

```typescript
// Before:
import { type ComponentProps, memo, useCallback, useMemo, useState } from 'react';

// After:
import { type ComponentProps, memo, useCallback, useEffect, useMemo, useState } from 'react';
```

- [ ] **Step 1b: Add toast imports**

Add these two imports after the existing import block (after line ~28):

```typescript
import { toast } from 'sonner-native';
import { TOAST_DURATIONS, TOAST_STYLES } from '@/components/toast/toastOptions';
```

- [ ] **Step 2: Add error toast useEffect before conditional returns**

Place this `useEffect` in the component body, after the `sections` memo (line 281) but before the `isPending` guard (line 318). This must be before ALL conditional returns to comply with React's rules of hooks:

```typescript
useEffect(() => {
  if (isError && sections.length > 0) {
    toast.error('Failed to refresh', {
      duration: TOAST_DURATIONS.error,
      style: TOAST_STYLES.error.toast,
      descriptionStyle: TOAST_STYLES.error.description,
    });
  }
}, [isError, sections]); // sections is memoized — its reference changes only when content changes
```

- [ ] **Step 3: Update isError guard to preserve stale data**

Replace line 319:

```typescript
// Before:
if (isError) return <ErrorComponent errorType={ErrorTypes.GENERAL_ERROR} />;

// After:
if (isError && !sections.length) return <ErrorComponent errorType={ErrorTypes.GENERAL_ERROR} />;
```

- [ ] **Step 4: Validate**

```bash
npm run lint
```

- [ ] **Step 5: Commit**

```bash
git add components/attempts/TherapistLatestAttempts.tsx
git commit -m "fix: preserve stale data on transient errors, show toast instead"
```

---

### Task 7: Format, validate, push, and comment on PR

**Prerequisites:** Ensure you are on the `feat/therapist-attempts-ux` branch. If not:

```bash
git checkout feat/therapist-attempts-ux
```

All Tasks 2-6 should have been executed on this branch.

**Files:**
- All modified files

- [ ] **Step 1: Run prettier**

```bash
npx prettier --write .
```

- [ ] **Step 2: Full validation**

```bash
npm run lint
```

Expected: all checks pass.

- [ ] **Step 3: Commit any formatting changes**

If prettier made changes:

```bash
git add -A
git commit -m "style: format"
```

- [ ] **Step 4: Push to PR branch**

```bash
git push origin feat/therapist-attempts-ux
```

- [ ] **Step 5: Post summary comment on PR #14**

First, get the commit SHAs for linking:

```bash
git log --oneline -6
```

Then post a comment addressing each review finding with links to fixing commits. Replace `<SHA>` placeholders with actual commit SHAs from the log output:

```bash
gh pr comment 14 --body "$(cat <<'EOF'
## Review fixes addressed

1. **Local FE types → shared-types** — Updated `@milobedini/shared-types` to v1.0.79 with `TherapistLatestResponse` pagination fields, `TherapistLatestFilters`, `TherapistAttemptModulesResponse`, `SeverityOption`, `SortOption`. Removed all local FE type definitions and imported from shared package. See <COMMIT_LINK_FOR_TASK_2>

2. **SeverityOption/SortOption** — Moved to shared-types, re-exported from `constants/Filters.ts`. (Same commit as #1)

3. **Double status serialisation** — Removed defensive `Array.isArray` join in hook; component handles the join at the UI→API boundary. See <COMMIT_LINK_FOR_TASK_3>

4. **Stale totalCount** — Count text dims (opacity 0.4) when refetching with stale data. See <COMMIT_LINK_FOR_TASK_4>

5. **Monday date-grouping** — Switched to Monday-based week start (ISO convention), consistent with Activity Diary. See <COMMIT_LINK_FOR_TASK_5>

6. **isError wipes stale data** — Full-screen error only when no cached data exists; transient failures show an error toast while preserving the stale list. See <COMMIT_LINK_FOR_TASK_6>
EOF
)"
```

Format commit links as: `https://github.com/milobedini/bwell/commit/<full-sha>`
