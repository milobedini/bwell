# NARBS High-Impact Performance Optimizations — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Improve perceived performance by removing dead dependencies, persisting stable query cache, prefetching detail screens on press, and adding optimistic updates to frequent mutations.

**Architecture:** Four independent incremental changes — each shipped as its own commit. Cache persistence uses `PersistQueryClientProvider` with selective dehydration. Prefetching uses a shared `usePrefetch` hook consumed by list item components. Optimistic updates add `onMutate`/`onError`/`onSettled` to two existing mutation hooks.

**Tech Stack:** TanStack React Query v5, `@tanstack/react-query-persist-client`, `@tanstack/query-async-storage-persister`, AsyncStorage, Expo Router

---

## File Map

| Action | File | Responsibility |
|--------|------|---------------|
| Modify | `package.json` | Remove unused deps, add persistence packages |
| Create | `utils/queryPersister.ts` | AsyncStorage persister + dehydration filter |
| Modify | `app/_layout.tsx` | Swap `QueryClientProvider` → `PersistQueryClientProvider` |
| Create | `hooks/usePrefetch.ts` | Shared prefetch-on-press utility hook |
| Modify | `hooks/useAttempts.ts` | Export raw fetch functions for prefetch; add optimistic save |
| Modify | `hooks/useAssignments.ts` | Add optimistic status update |
| Modify | `components/assignments/AssignmentsListPatient.tsx` | Wire prefetch on press |
| Modify | `components/attempts/PatientAttempts.tsx` | Wire prefetch on press |
| Modify | `components/assignments/AssignmentCard.tsx` | Wire prefetch on press |
| Modify | `components/attempts/TherapistLatestAttempts.tsx` | Wire prefetch on press |

---

## Task 1: Remove unused dependencies

**Files:**
- Modify: `package.json`

- [ ] **Step 1: Run depcheck to verify unused packages**

Run: `npx depcheck --ignores="@babel/core,@types/react,eslint,eslint-*,husky,prettier-*,tailwindcss,typescript,typescript-eslint,@milobedini/shared-types,@tanstack/eslint-plugin-query"`

Review the output. The following are confirmed unused and safe to remove:
- `@lottiefiles/dotlottie-react` — zero imports in app code
- `react-native-webview` — only referenced in expo internals

Note any additional packages depcheck flags. Use judgement — depcheck can false-positive on Expo peer deps and native modules.

- [ ] **Step 2: Remove confirmed unused packages**

```bash
npm uninstall @lottiefiles/dotlottie-react react-native-webview
```

- [ ] **Step 3: Verify clean install and lint**

```bash
npm ci && npm run lint
```

Expected: Clean install, no lint errors.

- [ ] **Step 4: Commit**

```bash
git add package.json package-lock.json
git commit -m "chore: remove unused dependencies (@lottiefiles/dotlottie-react, react-native-webview)"
```

---

## Task 2: Add React Query cache persistence (selective)

**Files:**
- Modify: `package.json` (new deps)
- Create: `utils/queryPersister.ts`
- Modify: `app/_layout.tsx`

- [ ] **Step 1: Install persistence packages**

```bash
npm install @tanstack/react-query-persist-client @tanstack/query-async-storage-persister
```

- [ ] **Step 2: Create the persister utility**

Create `utils/queryPersister.ts`:

```typescript
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createAsyncStoragePersister } from '@tanstack/query-async-storage-persister';
import type { Query } from '@tanstack/react-query';

const PERSISTED_KEY_PREFIXES: ReadonlyArray<readonly string[]> = [
  ['profile'],
  ['clients'],
  ['patients'],
  ['modules'],
  ['attempts', 'therapist', 'modules']
];

const shouldPersistQuery = (query: Query): boolean =>
  PERSISTED_KEY_PREFIXES.some((prefix) =>
    prefix.every((segment, i) => query.queryKey[i] === segment)
  );

export const asyncStoragePersister = createAsyncStoragePersister({
  storage: AsyncStorage,
  key: 'bwell-query-cache',
  throttleTime: 2000
});

export const persistDehydrateOptions = {
  shouldDehydrateQuery: shouldPersistQuery
};
```

- [ ] **Step 3: Update `app/_layout.tsx` to use PersistQueryClientProvider**

Replace the import and provider in `app/_layout.tsx`.

Change the import from:
```typescript
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
```
to:
```typescript
import { QueryClient } from '@tanstack/react-query';
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client';
import { asyncStoragePersister, persistDehydrateOptions } from '@/utils/queryPersister';
```

Update the QueryClient to set `gcTime` to 24 hours (must be >= persister maxAge):
```typescript
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 60, // 1 hour
      gcTime: 1000 * 60 * 60 * 24, // 24 hours — must be >= persister maxAge
      refetchOnWindowFocus: false,
      refetchOnReconnect: false
    }
  }
});
```

Replace the provider wrapper from:
```tsx
<QueryClientProvider client={queryClient}>
  {/* ...children... */}
</QueryClientProvider>
```
to:
```tsx
<PersistQueryClientProvider
  client={queryClient}
  persistOptions={{
    persister: asyncStoragePersister,
    maxAge: 1000 * 60 * 60 * 24,
    dehydrateOptions: persistDehydrateOptions
  }}
>
  {/* ...children... */}
</PersistQueryClientProvider>
```

- [ ] **Step 4: Verify lint passes**

```bash
npm run lint
```

Expected: No errors.

- [ ] **Step 5: Commit**

```bash
git add utils/queryPersister.ts app/_layout.tsx package.json package-lock.json
git commit -m "feat: add selective React Query cache persistence with AsyncStorage"
```

---

## Task 3: Prefetch detail screens on press

**Files:**
- Create: `hooks/usePrefetch.ts`
- Modify: `hooks/useAttempts.ts` (export raw fetch functions)
- Modify: `components/assignments/AssignmentsListPatient.tsx`
- Modify: `components/attempts/PatientAttempts.tsx`
- Modify: `components/assignments/AssignmentCard.tsx`
- Modify: `components/attempts/TherapistLatestAttempts.tsx`

- [ ] **Step 1: Export raw fetch functions from `hooks/useAttempts.ts`**

Add these exported functions above the existing hooks (after the imports, before `// QUERIES`):

```typescript
// Fetch functions — exported for prefetch use
export const fetchMyAttemptDetail = async (attemptId: string): Promise<AttemptDetailResponse> => {
  const { data } = await api.get<AttemptDetailResponse>(`/attempts/${attemptId}`);
  return data;
};

export const fetchTherapistAttemptDetail = async (attemptId: string): Promise<AttemptDetailResponse> => {
  const { data } = await api.get<AttemptDetailResponse>(`/attempts/therapist/${attemptId}`);
  return data;
};
```

Then update the existing hooks to reuse these functions.

Change `useGetMyAttemptDetail` (currently at line 187) from:
```typescript
export const useGetMyAttemptDetail = (attemptId: string) => {
  const isLoggedIn = useIsLoggedIn();

  return useQuery<AttemptDetailResponse>({
    queryKey: ['attempts', 'detail', 'mine', attemptId],
    queryFn: async (): Promise<AttemptDetailResponse> => {
      const { data } = await api.get<AttemptDetailResponse>(`/attempts/${attemptId}`);
      return data;
    },
    enabled: isLoggedIn
  });
};
```
to:
```typescript
export const useGetMyAttemptDetail = (attemptId: string) => {
  const isLoggedIn = useIsLoggedIn();

  return useQuery<AttemptDetailResponse>({
    queryKey: ['attempts', 'detail', 'mine', attemptId],
    queryFn: () => fetchMyAttemptDetail(attemptId),
    enabled: isLoggedIn
  });
};
```

Change `useTherapistGetAttemptDetail` (currently at line 200) from:
```typescript
export const useTherapistGetAttemptDetail = (attemptId: string) => {
  const isLoggedIn = useIsLoggedIn();

  return useQuery<AttemptDetailResponse>({
    queryKey: ['attempts', 'detail', 'therapist', attemptId],
    queryFn: async (): Promise<AttemptDetailResponse> => {
      const { data } = await api.get<AttemptDetailResponse>(`/attempts/therapist/${attemptId}`);
      return data;
    },
    enabled: isLoggedIn
  });
};
```
to:
```typescript
export const useTherapistGetAttemptDetail = (attemptId: string) => {
  const isLoggedIn = useIsLoggedIn();

  return useQuery<AttemptDetailResponse>({
    queryKey: ['attempts', 'detail', 'therapist', attemptId],
    queryFn: () => fetchTherapistAttemptDetail(attemptId),
    enabled: isLoggedIn
  });
};
```

- [ ] **Step 2: Create the prefetch hook**

Create `hooks/usePrefetch.ts`:

```typescript
import { useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { fetchMyAttemptDetail, fetchTherapistAttemptDetail } from './useAttempts';

export const usePrefetchMyAttemptDetail = () => {
  const queryClient = useQueryClient();

  return useCallback(
    (attemptId: string) => {
      queryClient.prefetchQuery({
        queryKey: ['attempts', 'detail', 'mine', attemptId],
        queryFn: () => fetchMyAttemptDetail(attemptId)
      });
    },
    [queryClient]
  );
};

export const usePrefetchTherapistAttemptDetail = () => {
  const queryClient = useQueryClient();

  return useCallback(
    (attemptId: string) => {
      queryClient.prefetchQuery({
        queryKey: ['attempts', 'detail', 'therapist', attemptId],
        queryFn: () => fetchTherapistAttemptDetail(attemptId)
      });
    },
    [queryClient]
  );
};
```

- [ ] **Step 3: Wire prefetch into `AssignmentsListPatient.tsx`**

Add import at the top:
```typescript
import { usePrefetchMyAttemptDetail } from '@/hooks/usePrefetch';
```

Inside the component (near other hooks), add:
```typescript
const prefetchDetail = usePrefetchMyAttemptDetail();
```

For the "View attempt" Link (completed assignments) and "Continue" Link (in-progress assignments), add an `onPress` handler. Since these use `<Link asChild>`, add the prefetch to the `onPress` of the wrapped button component. For each Link that navigates to an attempt detail:

Change the completed-assignment Link's button from:
```tsx
<ThemedButton title={'View attempt'} compact className="mt-4 self-start" />
```
to:
```tsx
<ThemedButton
  title={'View attempt'}
  compact
  className="mt-4 self-start"
  onPress={() => item.latestAttempt?._id && prefetchDetail(item.latestAttempt._id)}
/>
```

Change the in-progress Link's button from:
```tsx
<ThemedButton title="Continue" compact className="mt-4 w-1/3" />
```
to:
```tsx
<ThemedButton
  title="Continue"
  compact
  className="mt-4 w-1/3"
  onPress={() => item.latestAttempt?._id && prefetchDetail(item.latestAttempt._id)}
/>
```

- [ ] **Step 4: Wire prefetch into `PatientAttempts.tsx`**

Add import at the top:
```typescript
import { usePrefetchMyAttemptDetail } from '@/hooks/usePrefetch';
```

Inside the component (near other hooks), add:
```typescript
const prefetchDetail = usePrefetchMyAttemptDetail();
```

Update the `handleAttemptPress` callback to prefetch before navigating. Change from:
```typescript
const handleAttemptPress = useCallback(
  (id: string, title: string) => {
    pushedChild.current = true;
    router.push({ pathname: '/attempts/[id]', params: { id, headerTitle: title } });
  },
  [router]
);
```
to:
```typescript
const handleAttemptPress = useCallback(
  (id: string, title: string) => {
    prefetchDetail(id);
    pushedChild.current = true;
    router.push({ pathname: '/attempts/[id]', params: { id, headerTitle: title } });
  },
  [router, prefetchDetail]
);
```

- [ ] **Step 5: Wire prefetch into `AssignmentCard.tsx`**

Add import at the top:
```typescript
import { usePrefetchTherapistAttemptDetail } from '@/hooks/usePrefetch';
```

The component is wrapped in `memo`, so add the hook inside `AssignmentCardBase`. Near the top of the function:
```typescript
const prefetchDetail = usePrefetchTherapistAttemptDetail();
```

The card uses `<Link asChild>` wrapping a `<Pressable>`. Add an `onPress` to the Pressable to trigger prefetch. Change the Link block (lines 106-123) from:
```tsx
<Link
  asChild
  href={{
    pathname: '/assignments/[id]',
    params: {
      id: item.latestAttempt._id,
      headerTitle: item.latestAttempt.completedAt
        ? `${item.module.title} (${dateString(item.latestAttempt.completedAt)})`
        : `${item.module.title} (In progress)`
    }
  }}
  push
  withAnchor
>
  <Pressable className="overflow-hidden rounded-lg border border-chip-darkCardAlt bg-chip-pill active:opacity-80">
    {cardContent}
  </Pressable>
</Link>
```
to:
```tsx
<Link
  asChild
  href={{
    pathname: '/assignments/[id]',
    params: {
      id: item.latestAttempt._id,
      headerTitle: item.latestAttempt.completedAt
        ? `${item.module.title} (${dateString(item.latestAttempt.completedAt)})`
        : `${item.module.title} (In progress)`
    }
  }}
  push
  withAnchor
>
  <Pressable
    onPress={() => prefetchDetail(item.latestAttempt!._id)}
    className="overflow-hidden rounded-lg border border-chip-darkCardAlt bg-chip-pill active:opacity-80"
  >
    {cardContent}
  </Pressable>
</Link>
```

**Note:** `AssignmentCard` is used by the therapist assignments list (`AssignmentsListTherapist`), so this covers that prefetch target. The `usePrefetchTherapistAttemptDetail` is correct here since therapists are the ones viewing these cards.

- [ ] **Step 6: Wire prefetch into `TherapistLatestAttempts.tsx`**

Add import at the top:
```typescript
import { usePrefetchTherapistAttemptDetail } from '@/hooks/usePrefetch';
```

Inside the component (near other hooks), add:
```typescript
const prefetchDetail = usePrefetchTherapistAttemptDetail();
```

Find the `<Link>` that wraps each list item (the one navigating to `/attempts/[id]`). Add an `onPress` to the wrapped `<Pressable>` inside the Link:

Change from:
```tsx
<Pressable className="overflow-hidden rounded-xl bg-chip-darkCard active:opacity-80">
```
to:
```tsx
<Pressable
  onPress={() => prefetchDetail(item._id)}
  className="overflow-hidden rounded-xl bg-chip-darkCard active:opacity-80"
>
```

- [ ] **Step 7: Verify lint passes**

```bash
npm run lint
```

Expected: No errors.

- [ ] **Step 8: Commit**

```bash
git add hooks/usePrefetch.ts hooks/useAttempts.ts components/assignments/AssignmentsListPatient.tsx components/attempts/PatientAttempts.tsx components/assignments/AssignmentCard.tsx components/attempts/TherapistLatestAttempts.tsx
git commit -m "feat: prefetch attempt detail on list item press"
```

---

## Task 4: Add optimistic updates for status toggle and save

**Files:**
- Modify: `hooks/useAssignments.ts`
- Modify: `hooks/useAttempts.ts`

- [ ] **Step 1: Add optimistic update to `useUpdateAssignmentStatus`**

In `hooks/useAssignments.ts`, replace the `useUpdateAssignmentStatus` hook (currently lines 66-81).

Change from:
```typescript
export const useUpdateAssignmentStatus = (assignmentId: string) => {
  const queryClient = useQueryClient();

  return useMutationWithToast<UpdateAssignmentStatusResponse, AxiosError, UpdateAssignmentStatusInput>({
    mutationFn: async (status): Promise<UpdateAssignmentStatusResponse> => {
      const { data } = await api.patch<UpdateAssignmentStatusResponse>(`/assignments/${assignmentId}`, status);
      return data;
    },
    toast: { pending: 'Updating assignment...', success: 'Assignment updated', error: 'Update failed' },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assignments'] });
      queryClient.invalidateQueries({ queryKey: ['clients'] });
      queryClient.invalidateQueries({ queryKey: ['modules'] });
    }
  });
};
```
to:
```typescript
export const useUpdateAssignmentStatus = (assignmentId: string) => {
  const queryClient = useQueryClient();

  return useMutationWithToast<
    UpdateAssignmentStatusResponse,
    AxiosError,
    UpdateAssignmentStatusInput,
    { previousAssignments: [readonly unknown[], MyAssignmentView[] | undefined][] }
  >({
    mutationFn: async (status): Promise<UpdateAssignmentStatusResponse> => {
      const { data } = await api.patch<UpdateAssignmentStatusResponse>(`/assignments/${assignmentId}`, status);
      return data;
    },
    toast: { pending: 'Updating assignment...', success: 'Assignment updated', error: 'Update failed' },
    onMutate: async (newStatus) => {
      await queryClient.cancelQueries({ queryKey: ['assignments'] });

      const assignmentQueries = queryClient.getQueriesData<MyAssignmentView[]>({
        queryKey: ['assignments']
      });

      const previousAssignments = assignmentQueries.map(
        ([key, data]) => [key, data] as [readonly unknown[], MyAssignmentView[] | undefined]
      );

      assignmentQueries.forEach(([key, data]) => {
        if (!data) return;
        queryClient.setQueryData<MyAssignmentView[]>(
          key,
          data.map((a) => (a._id === assignmentId ? { ...a, status: newStatus.status } : a))
        );
      });

      return { previousAssignments };
    },
    onError: (_err, _vars, context) => {
      context?.previousAssignments.forEach(([key, data]) => {
        queryClient.setQueryData(key, data);
      });
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['assignments'] });
      queryClient.invalidateQueries({ queryKey: ['clients'] });
      queryClient.invalidateQueries({ queryKey: ['modules'] });
    }
  });
};
```

- [ ] **Step 2: Add optimistic update to `useSaveModuleAttempt`**

In `hooks/useAttempts.ts`, replace the `useSaveModuleAttempt` hook (currently lines 236-252).

Change from:
```typescript
export const useSaveModuleAttempt = (attemptId: string) => {
  const qc = useQueryClient();

  return useMutationWithToast<SaveProgressResponse, AxiosError, SaveProgressInput>({
    mutationFn: async (responses): Promise<SaveProgressResponse> => {
      const { data } = await api.patch<SaveProgressResponse>(`attempts/${attemptId}`, responses);
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['attempts', 'detail'] });
      qc.invalidateQueries({ queryKey: ['attempts', 'mine'] });
      qc.invalidateQueries({ queryKey: ['attempts', 'therapist', 'patient-timeline'] });
      qc.invalidateQueries({ queryKey: ['assignments'] });
    },
    toast: { pending: 'Saving progress...', success: 'Progress saved', error: 'Failed to save' }
  });
};
```
to:
```typescript
export const useSaveModuleAttempt = (attemptId: string) => {
  const qc = useQueryClient();

  return useMutationWithToast<
    SaveProgressResponse,
    AxiosError,
    SaveProgressInput,
    { previousDetail: AttemptDetailResponse | undefined }
  >({
    mutationFn: async (responses): Promise<SaveProgressResponse> => {
      const { data } = await api.patch<SaveProgressResponse>(`attempts/${attemptId}`, responses);
      return data;
    },
    onMutate: async (newResponses) => {
      const detailKey = ['attempts', 'detail', 'mine', attemptId];
      await qc.cancelQueries({ queryKey: detailKey });

      const previousDetail = qc.getQueryData<AttemptDetailResponse>(detailKey);

      if (previousDetail) {
        qc.setQueryData<AttemptDetailResponse>(detailKey, {
          ...previousDetail,
          attempt: {
            ...previousDetail.attempt,
            responses: newResponses.responses
          }
        });
      }

      return { previousDetail };
    },
    onError: (_err, _vars, context) => {
      if (context?.previousDetail) {
        qc.setQueryData(['attempts', 'detail', 'mine', attemptId], context.previousDetail);
      }
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: ['attempts', 'detail'] });
      qc.invalidateQueries({ queryKey: ['attempts', 'mine'] });
      qc.invalidateQueries({ queryKey: ['attempts', 'therapist', 'patient-timeline'] });
      qc.invalidateQueries({ queryKey: ['assignments'] });
    },
    toast: { pending: 'Saving progress...', success: 'Progress saved', error: 'Failed to save' }
  });
};
```

- [ ] **Step 3: Verify lint passes**

```bash
npm run lint
```

Expected: No errors.

- [ ] **Step 4: Commit**

```bash
git add hooks/useAssignments.ts hooks/useAttempts.ts
git commit -m "feat: add optimistic updates for assignment status and attempt save"
```
