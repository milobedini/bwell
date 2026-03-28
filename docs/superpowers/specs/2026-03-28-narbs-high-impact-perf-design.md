# NARBS High-Impact Performance Optimizations

**Date:** 2026-03-28
**Scope:** 4 high-impact recommendations from NARBS performance audit
**Approach:** Incremental — each item implemented and verified independently

---

## 1. Remove Unused Dependencies

**Goal:** Reduce bundle size by removing packages with zero imports in the codebase.

**Confirmed unused:**
- `@lottiefiles/dotlottie-react` — zero imports
- `react-native-webview` — only referenced in expo internals, not app code

**Process:**
1. Run `npx depcheck` to surface any additional unused packages
2. Remove confirmed unused packages from `package.json`
3. `npm ci` to verify clean install
4. `npm run lint` to confirm nothing breaks

**Not removed** (confirmed active):
- `lottie-react-native` — used in `LoadingScreen.tsx` and `Chip.tsx`
- `@shopify/react-native-skia` — used in `Sparkline.tsx`

---

## 2. React Query Cache Persistence (Selective)

**Goal:** Eliminate loading spinners on cold start for stable, frequently-accessed data by persisting a subset of the React Query cache to AsyncStorage.

### New packages
- `@tanstack/query-persist-client-core`
- `@tanstack/query-async-storage-persister`
- `@tanstack/react-query-persist-client`

### New file: `utils/queryPersister.ts`
- Creates an AsyncStorage-based persister
- Exports persister instance and dehydration config

### Persisted queries (selective)
Only queries whose key starts with one of these prefixes are serialized:

| Query key prefix | Rationale |
|-----------------|-----------|
| `['profile']` | Fetched every launch, rarely changes |
| `['clients']` | Therapist patient roster, infrequent changes |
| `['patients']` | Therapist patient list, infrequent changes |
| `['modules']` | Module catalogue, very stable |
| `['attempts', 'therapist', 'modules']` | Module list for filters, very stable |

All other queries (assignments, attempts, timelines) are excluded — they refetch fresh on launch.

### Dehydration config
- `dehydrate` option on QueryClient filters which queries to serialize based on key prefix
- `maxAge`: 24 hours — cached data older than this is discarded on hydration

### Modified file: `app/_layout.tsx`
- Replace `QueryClientProvider` with `PersistQueryClientProvider`
- Pass persister and dehydrate options
- Hydration completes before splash hides (existing font-loading splash hold covers this)

### Hydration flow
1. App starts, splash held (existing font loading)
2. `PersistQueryClientProvider` restores cached queries from AsyncStorage
3. Fonts finish loading, splash hides
4. Cached data renders immediately; background revalidation fetches fresh data

---

## 3. Prefetch Detail Screens on Press

**Goal:** Eliminate loading states when navigating from list screens to detail screens by prefetching data on press.

### New file: `hooks/usePrefetchOnPress.ts`
- Accepts a query key and query fn
- Returns a `prefetch` callback that calls `queryClient.prefetchQuery`
- Fire-and-forget — does not block navigation
- Respects existing `staleTime` — skips fetch if data is cached and fresh

### Prefetch targets

| List screen | Detail query prefetched | Query key |
|------------|------------------------|-----------|
| `AssignmentsListPatient` (item press) | Patient attempt detail | `['attempts', 'detail', 'mine', attemptId]` |
| `PatientAttempts` (item press) | Patient attempt detail | `['attempts', 'detail', 'mine', attemptId]` |
| `AssignmentsListTherapist` (item press) | Therapist attempt detail | `['attempts', 'detail', 'therapist', attemptId]` |
| `TherapistLatestAttempts` (item press) | Therapist attempt detail | `['attempts', 'detail', 'therapist', attemptId]` |

### Not prefetched (intentional)
- User detail pages — no dedicated detail screen exists
- Paginated list next pages — over-fetching risk outweighs benefit

### Integration pattern
- List item `onPress` / `Link` `onPress` calls `prefetch()` then proceeds with navigation
- Export the raw fetch functions (e.g. `fetchMyAttemptDetail`, `fetchTherapistAttemptDetail`) from `hooks/useAttempts.ts` so the prefetch hook can reuse them without duplicating API call logic
- `usePrefetchOnPress` consumes these exported fetch functions paired with their query keys

---

## 4. Optimistic Updates for Status Toggle and Save

**Goal:** Make assignment status changes and attempt saves feel instant by updating the cache before the server responds.

### Modified hooks

#### `useUpdateAssignmentStatus` (therapist toggles assignment status)

**New callbacks:**
- `onMutate`:
  1. Cancel outgoing refetches for `['assignments']`
  2. Snapshot current cached data for rollback
  3. `setQueryData` to update the assignment's status in all relevant cached queries (`['assignments']`, `['assignments', 'therapist', ...]`)
- `onError`: Restore snapshot, show error toast
- `onSettled`: `invalidateQueries` on `['assignments']`, `['clients']`, `['modules']` (preserves existing pattern as safety net)

**UI effect:** Status chip updates instantly on tap.

#### `useSaveModuleAttempt` (patient saves in-progress work)

**New callbacks:**
- `onMutate`:
  1. Cancel outgoing refetches for `['attempts', 'detail']`
  2. Snapshot current cached data for rollback
  3. `setQueryData` to update attempt detail in `['attempts', 'detail', 'mine', attemptId]` with the submitted payload
- `onError`: Restore snapshot, show error toast
- `onSettled`: `invalidateQueries` on `['attempts', 'detail']`, `['attempts', 'mine']`, `['attempts', 'therapist', 'patient-timeline']`, `['assignments']` (preserves existing pattern)

**UI effect:** Save feels instant — form data persists in cache immediately.

### Not optimistically updated (intentional)
- `useSubmitAttempt` — complex state transition (status + scoring + multi-query side effects)
- `useCreateAssignment` — server generates IDs
- `useRemoveAssignment` — deletion needs confirmation UX, already gated

### Rollback strategy
Both mutations: snapshot → optimistic set → on error restore + toast → on settled invalidate regardless. The `onSettled` invalidation corrects any shape differences between optimistic data and server response.

---

## Implementation Order

1. Remove unused deps (smallest, lowest risk)
2. RQ cache persistence (foundational infra, standalone)
3. Prefetch on press (builds on existing hooks, no deps on other items)
4. Optimistic updates (most complex, touches mutation hooks last)

Each step is independently testable and reversible.
