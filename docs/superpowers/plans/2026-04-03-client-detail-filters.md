# Client Detail Filters & Navigation Consolidation — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a filter drawer to the Clients tab detail screen and redirect all client-name taps to the Clients tab, removing the deprecated home-stack Client Timeline.

**Architecture:** The client detail screen (`patients/[id]`) gains two modes — default (bucketed practice view) and filtered (flat attempt list using `useGetPatientTimeline`). A filter drawer slides in from the right with module, status, severity, and limit filters. A new BE endpoint provides patient-scoped module choices. The deprecated `/home/clients/[id]` route is removed.

**Tech Stack:** React Native, Expo Router, TanStack Query, NativeWind, react-native-paper, Zustand, Axios

---

## File Map

| Action | File | Responsibility |
|--------|------|----------------|
| Modify | `hooks/useAttempts.ts` | Add `severity` param to `useGetPatientTimeline` |
| Modify | `hooks/usePractice.ts` | Add `usePatientModules` hook |
| Modify | `components/therapist/PatientPracticeView.tsx` | Two-mode view (practice + filtered), filter drawer, header filter icon |
| Create | `components/therapist/FilteredAttemptList.tsx` | Flat list rendering for filtered mode, reusing practice card styling |
| Modify | `components/home/dashboard/ClientCard.tsx` | Change navigation target to Clients tab |
| Modify | `app/(main)/(tabs)/home/_layout.tsx` | Remove `clients/[id]` route |
| Delete | `app/(main)/(tabs)/home/clients/[id]/index.tsx` | Deprecated Client Timeline screen |

---

### Task 1: Add `severity` param to `useGetPatientTimeline`

The existing timeline hook doesn't pass `severity` to the BE. We need to add it so the filter drawer's severity filter actually works.

**Files:**
- Modify: `hooks/useAttempts.ts:19-89`

- [ ] **Step 1: Add severity to PatientTimelineOptions**

In `hooks/useAttempts.ts`, update the `PatientTimelineOptions` type and the hook to include `severity`:

```ts
export type PatientTimelineOptions = {
  patientId: string;
  moduleId?: string;
  limit?: number;
  status?: AttemptStatusInput | 'all' | string;
  severity?: string;
  enabled?: boolean;
};
```

- [ ] **Step 2: Pass severity through the hook**

Update the `useGetPatientTimeline` function signature to destructure `severity`, add it to the query key, and pass it as a param:

```ts
export const useGetPatientTimeline = ({
  patientId,
  moduleId,
  limit = 20,
  status = 'submitted',
  severity,
  enabled = true
}: PatientTimelineOptions) => {
  const isLoggedIn = useIsLoggedIn();

  const query = useInfiniteQuery<
    PatientModuleTimelineResponse,
    AxiosError,
    PatientTimelineSelected,
    readonly [
      'attempts',
      'therapist',
      'patient-timeline',
      { patientId: string; moduleId?: string; limit: number; status: string; severity?: string }
    ],
    string | null
  >({
    queryKey: ['attempts', 'therapist', 'patient-timeline', { patientId, moduleId, limit, status, severity }],
    initialPageParam: null,
    queryFn: async ({ pageParam }): Promise<PatientModuleTimelineResponse> => {
      const { data } = await api.get<PatientModuleTimelineResponse>(`/user/therapist/patients/${patientId}/timeline`, {
        params: {
          moduleId,
          limit,
          status,
          severity,
          cursor: pageParam ?? undefined
        }
      });
      return data;
    },
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
    select: (infinite: InfiniteData<PatientModuleTimelineResponse, string | null>): PatientTimelineSelected => {
      const pages = infinite.pages;
      const attempts = pages.flatMap((p) => p.attempts);
      const nextCursor = pages.at(-1)?.nextCursor ?? null;
      return { pages, attempts, nextCursor };
    },
    enabled: isLoggedIn && !!patientId && enabled
  });

  const attempts = query.data?.attempts ?? [];
  const nextCursor = query.data?.nextCursor ?? null;

  return {
    ...query,
    attempts,
    nextCursor
  };
};
```

- [ ] **Step 3: Run lint to verify**

Run: `npm run lint`
Expected: All checks pass.

- [ ] **Step 4: Commit**

```bash
git add hooks/useAttempts.ts
git commit -m "feat: add severity param to useGetPatientTimeline hook"
```

---

### Task 2: Add `usePatientModules` hook

New hook to fetch modules that a specific patient has attempts for. This powers the module filter in the drawer.

**Files:**
- Modify: `hooks/usePractice.ts`

- [ ] **Step 1: Add the hook**

Add to the bottom of `hooks/usePractice.ts`:

```ts
// Therapist: available modules for a specific patient (for filter drawers)
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

Note: The BE endpoint (`GET /user/therapist/patients/:id/modules`) needs to exist. If it doesn't exist yet, this hook will 404 until the BE work is done. The FE work can proceed independently — the filter drawer gracefully handles missing module choices by showing a text input fallback.

- [ ] **Step 2: Run lint to verify**

Run: `npm run lint`
Expected: All checks pass.

- [ ] **Step 3: Commit**

```bash
git add hooks/usePractice.ts
git commit -m "feat: add usePatientModules hook for patient-scoped module filter"
```

---

### Task 3: Create `FilteredAttemptList` component

A flat list of timeline attempts styled like the practice view cards. This component renders when filters are active.

**Files:**
- Create: `components/therapist/FilteredAttemptList.tsx`

- [ ] **Step 1: Create the component**

Create `components/therapist/FilteredAttemptList.tsx`:

```tsx
import { memo, useCallback } from 'react';
import { FlatList, Pressable, RefreshControl, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Colors } from '@/constants/Colors';
import { dueLabel, formatShortDate } from '@/utils/dates';
import { getModuleIcon } from '@/utils/moduleIcons';
import type { AttemptListItem, ScoreBandSummary } from '@milobedini/shared-types';
import MaterialCommunityIcons from '@react-native-vector-icons/material-design-icons';

import { LoadingIndicator } from '../LoadingScreen';
import { ThemedText } from '../ThemedText';
import EmptyState from '../ui/EmptyState';

type TimelineAttempt = AttemptListItem & { band?: ScoreBandSummary };

type FilteredAttemptListProps = {
  attempts: TimelineAttempt[];
  patientName: string;
  isFetching: boolean;
  isPending: boolean;
  hasNextPage: boolean;
  isFetchingNextPage: boolean;
  fetchNextPage: () => void;
  refetch: () => void;
};

type AttemptCardProps = {
  item: TimelineAttempt;
  patientName: string;
  onPress: (item: TimelineAttempt) => void;
};

const AttemptCard = memo(({ item, onPress }: AttemptCardProps) => {
  const icon = getModuleIcon(item.moduleType);
  const isCompleted = item.status === 'submitted';

  const statusText = (() => {
    if (isCompleted && item.completedAt) {
      return `Submitted ${formatShortDate(item.completedAt)}`;
    }
    if (item.status === 'started' && item.percentComplete) {
      return `${Math.round(item.percentComplete)}% complete`;
    }
    if (item.status === 'active') return 'Active';
    if (item.status === 'abandoned') return 'Abandoned';
    return 'Not started';
  })();

  return (
    <Pressable
      onPress={() => onPress(item)}
      className="active:opacity-80"
      style={{ backgroundColor: Colors.chip.darkCard, borderRadius: 12, padding: 12 }}
    >
      <View className="flex-row items-center gap-3">
        <View
          className="items-center justify-center rounded-lg"
          style={{ width: 36, height: 36, backgroundColor: Colors.chip.darkCardAlt }}
        >
          <MaterialCommunityIcons
            name={icon}
            size={18}
            color={isCompleted ? Colors.sway.darkGrey : Colors.sway.bright}
          />
        </View>

        <View className="flex-1 gap-0.5">
          <ThemedText type="smallBold" style={{ flexShrink: 1 }}>
            {item.module.title}
          </ThemedText>
          <ThemedText type="small" style={{ color: isCompleted ? Colors.sway.darkGrey : Colors.sway.bright }}>
            {statusText}
          </ThemedText>
          {item.dueAt ? (
            <ThemedText type="small" style={{ color: Colors.sway.darkGrey }}>
              {dueLabel(item.dueAt)}
            </ThemedText>
          ) : null}
        </View>

        <View className="items-end gap-1">
          {isCompleted && item.totalScore !== undefined && item.scoreBandLabel ? (
            <View className="items-end">
              <ThemedText type="smallBold" style={{ color: Colors.sway.bright }}>
                {item.totalScore}
              </ThemedText>
              <ThemedText type="small" style={{ color: Colors.sway.darkGrey }}>
                {item.scoreBandLabel}
              </ThemedText>
            </View>
          ) : (
            <MaterialCommunityIcons name="chevron-right" size={18} color={Colors.sway.darkGrey} />
          )}
        </View>
      </View>
    </Pressable>
  );
});

AttemptCard.displayName = 'AttemptCard';

const FilteredAttemptListBase = ({
  attempts,
  patientName,
  isFetching,
  isPending,
  hasNextPage,
  isFetchingNextPage,
  fetchNextPage,
  refetch
}: FilteredAttemptListProps) => {
  const router = useRouter();

  const handlePress = useCallback(
    (item: TimelineAttempt) => {
      router.push({
        pathname: '/(main)/(tabs)/patients/attempt/[id]',
        params: { id: item._id, headerTitle: patientName }
      });
    },
    [router, patientName]
  );

  const renderItem = useCallback(
    ({ item }: { item: TimelineAttempt }) => (
      <AttemptCard item={item} patientName={patientName} onPress={handlePress} />
    ),
    [patientName, handlePress]
  );

  const keyExtractor = useCallback((item: TimelineAttempt) => item._id, []);

  if (isPending) return <LoadingIndicator marginBottom={0} />;

  return (
    <FlatList
      data={attempts}
      keyExtractor={keyExtractor}
      renderItem={renderItem}
      onEndReachedThreshold={0.6}
      onEndReached={() => {
        if (hasNextPage && !isFetchingNextPage) fetchNextPage();
      }}
      ListFooterComponent={isFetchingNextPage ? <LoadingIndicator marginBottom={16} /> : null}
      ListEmptyComponent={
        !isFetching ? (
          <EmptyState icon="filter-off-outline" title="No results" subtitle="Try adjusting your filters" />
        ) : null
      }
      contentContainerStyle={{ paddingBottom: 80, paddingHorizontal: 16, gap: 8, paddingTop: 8 }}
      refreshControl={
        <RefreshControl refreshing={isFetching && !isPending} onRefresh={refetch} tintColor={Colors.sway.bright} />
      }
    />
  );
};

const FilteredAttemptList = memo(FilteredAttemptListBase);

export default FilteredAttemptList;
```

- [ ] **Step 2: Run lint to verify**

Run: `npm run lint`
Expected: All checks pass.

- [ ] **Step 3: Commit**

```bash
git add components/therapist/FilteredAttemptList.tsx
git commit -m "feat: add FilteredAttemptList component for filtered client detail view"
```

---

### Task 4: Add filter drawer and two-mode view to `PatientPracticeView`

This is the main task. Add filter state, the filter drawer, a header filter icon with badge, and conditional rendering between practice mode and filtered mode.

**Files:**
- Modify: `components/therapist/PatientPracticeView.tsx`

- [ ] **Step 1: Add imports and filter state**

Add these imports at the top of `PatientPracticeView.tsx`:

```ts
import { memo, useCallback, useMemo, useState } from 'react';
import { RefreshControl, SectionList, type SectionListData, type SectionListRenderItemInfo, View } from 'react-native';
import { Badge, IconButton } from 'react-native-paper';
import { useRouter } from 'expo-router';
import { Colors } from '@/constants/Colors';
import type { AttemptFilterDrawerValues } from '@/constants/Filters';
import { useRemoveAssignment } from '@/hooks/useAssignments';
import { useGetPatientTimeline } from '@/hooks/useAttempts';
import { usePatientModules, usePatientPractice } from '@/hooks/usePractice';
import { dueLabel } from '@/utils/dates';
import type { PracticeItem } from '@milobedini/shared-types';

import ContentContainer from '../ContentContainer';
import { LoadingIndicator } from '../LoadingScreen';
import { ThemedText } from '../ThemedText';
import type { ActionMenuItem } from '../ui/ActionMenu';
import ActionMenu from '../ui/ActionMenu';
import { AttemptFilterDrawer } from '../ui/AttemptFilterDrawer';
import EmptyState from '../ui/EmptyState';

import FilteredAttemptList from './FilteredAttemptList';
import PatientPracticeCard from './PatientPracticeCard';
```

- [ ] **Step 2: Add filter state and active-filter detection**

Inside `PatientPracticeViewBase`, after the existing state declarations, add:

```ts
const [drawerOpen, setDrawerOpen] = useState(false);
const [filters, setFilters] = useState<AttemptFilterDrawerValues | null>(null);

const { data: patientModules } = usePatientModules(patientId);

const isFiltered = filters !== null;

const activeFilterCount = useMemo(() => {
  if (!filters) return 0;
  let n = 0;
  if (filters.moduleId) n++;
  if ((filters.status?.length ?? 0) > 0 && !(filters.status?.length === 1 && filters.status?.[0] === 'submitted'))
    n++;
  if (filters.severity) n++;
  if (filters.limit && filters.limit !== 20) n++;
  return n;
}, [filters]);

const statusParam = useMemo(() => {
  if (!filters?.status?.length) return 'submitted';
  if (filters.status.includes('all')) return 'all';
  return filters.status.join(',');
}, [filters?.status]);

const timeline = useGetPatientTimeline({
  patientId,
  moduleId: filters?.moduleId,
  limit: filters?.limit ?? 20,
  status: statusParam,
  severity: filters?.severity,
  enabled: isFiltered
});
```

- [ ] **Step 3: Add filter handlers**

Add these handler functions inside the component:

```ts
const handleApplyFilters = useCallback((v: AttemptFilterDrawerValues) => {
  setFilters(v);
}, []);

const handleResetFilters = useCallback(() => {
  setFilters(null);
}, []);

const moduleChoices = useMemo(
  () => patientModules?.map((m) => ({ id: m._id, title: m.title })) ?? [],
  [patientModules]
);
```

- [ ] **Step 4: Add filter icon to the header area**

Replace the `listHeader` const with:

```ts
const listHeader = (
  <View className="flex-row items-center justify-between pb-2 pt-2">
    <ThemedText type="subtitle">{patientName}</ThemedText>
    <View className="relative flex-row items-center">
      <IconButton
        icon="filter-variant"
        onPress={() => setDrawerOpen(true)}
        accessibilityLabel="Open filters"
        iconColor={isFiltered ? Colors.sway.bright : Colors.sway.lightGrey}
        size={22}
      />
      {activeFilterCount > 0 && (
        <Badge style={{ position: 'absolute', top: 2, right: 2 }}>{activeFilterCount}</Badge>
      )}
    </View>
  </View>
);
```

- [ ] **Step 5: Add conditional rendering for filtered mode**

Update the return block. Replace the existing return statement (from `return ( <>` to the closing `</>`):

```tsx
return (
  <>
    <ContentContainer padded={false}>
      {isFiltered ? (
        <View className="flex-1">
          <View className="px-4">{listHeader}</View>
          <FilteredAttemptList
            attempts={timeline.attempts}
            patientName={patientName}
            isFetching={timeline.isFetching}
            isPending={timeline.isPending}
            hasNextPage={!!timeline.hasNextPage}
            isFetchingNextPage={timeline.isFetchingNextPage}
            fetchNextPage={timeline.fetchNextPage}
            refetch={timeline.refetch}
          />
        </View>
      ) : isEmpty ? (
        <View className="flex-1 px-4">
          {listHeader}
          <EmptyState
            icon="clipboard-text-outline"
            title="No practice items"
            subtitle="This patient has no active or recent practice items."
          />
        </View>
      ) : (
        <SectionList
          sections={sections}
          keyExtractor={keyExtractor}
          renderItem={renderItem}
          renderSectionHeader={renderSectionHeader}
          ItemSeparatorComponent={renderItemSeparator}
          ListHeaderComponent={listHeader}
          stickySectionHeadersEnabled={false}
          contentContainerStyle={{ paddingBottom: 80, paddingHorizontal: 16 }}
          refreshControl={
            <RefreshControl
              refreshing={isFetching && !isPending}
              onRefresh={refetch}
              tintColor={Colors.sway.bright}
            />
          }
        />
      )}
    </ContentContainer>
    <ActionMenu
      visible={!!menuItem}
      onDismiss={() => setMenuItem(null)}
      title={menuItem?.moduleTitle}
      subtitle={menuItem?.dueAt ? dueLabel(menuItem.dueAt) : 'No due date'}
      actions={menuActions}
    />
    <AttemptFilterDrawer
      visible={drawerOpen}
      onDismiss={() => setDrawerOpen(false)}
      values={filters ?? { status: ['submitted'], limit: 20 }}
      onChange={handleApplyFilters}
      onApply={handleApplyFilters}
      onReset={handleResetFilters}
      title="Client filters"
      moduleChoices={moduleChoices}
      showSeverity
    />
  </>
);
```

- [ ] **Step 6: Run lint to verify**

Run: `npm run lint`
Expected: All checks pass.

- [ ] **Step 7: Commit**

```bash
git add components/therapist/PatientPracticeView.tsx
git commit -m "feat: add filter drawer and two-mode view to client detail screen"
```

---

### Task 5: Redirect `ClientCard` navigation to Clients tab

Change the `ClientCard` on the home dashboard to navigate to the Clients tab instead of the deprecated home-stack timeline.

**Files:**
- Modify: `components/home/dashboard/ClientCard.tsx:135`

- [ ] **Step 1: Update navigation target**

In `components/home/dashboard/ClientCard.tsx`, change line 135 from:

```ts
onPress={() => router.push(`/home/clients/${item.patient._id}`)}
```

to:

```ts
onPress={() =>
  router.push({
    pathname: '/(main)/(tabs)/patients/[id]',
    params: { id: item.patient._id, name: item.patient.name || item.patient.username }
  })
}
```

- [ ] **Step 2: Run lint to verify**

Run: `npm run lint`
Expected: All checks pass.

- [ ] **Step 3: Commit**

```bash
git add components/home/dashboard/ClientCard.tsx
git commit -m "feat: redirect client card navigation to clients tab"
```

---

### Task 6: Remove deprecated Client Timeline

Delete the deprecated home-stack Client Timeline screen and clean up its route definition.

**Files:**
- Delete: `app/(main)/(tabs)/home/clients/[id]/index.tsx`
- Modify: `app/(main)/(tabs)/home/_layout.tsx`

- [ ] **Step 1: Delete the deprecated timeline screen**

```bash
rm app/\(main\)/\(tabs\)/home/clients/\[id\]/index.tsx
rmdir app/\(main\)/\(tabs\)/home/clients/\[id\]
rmdir app/\(main\)/\(tabs\)/home/clients
```

- [ ] **Step 2: Remove the route from home layout**

In `app/(main)/(tabs)/home/_layout.tsx`, remove the `clients/[id]` route. The file should become:

```tsx
import { Stack } from 'expo-router';
import { stackScreenOptions, withHeaderFromParams } from '@/utils/defaultScreenOptions';

export default function HomeStack() {
  return (
    <Stack screenOptions={stackScreenOptions}>
      <Stack.Screen name="index" />
      <Stack.Screen name="practice/[id]" options={withHeaderFromParams()} />
    </Stack>
  );
}
```

- [ ] **Step 3: Check for any remaining references to the deleted route**

Search for `/home/clients` across the codebase. After Task 5, the only reference was `ClientCard.tsx` which was already updated. Verify no other references remain.

Run: `grep -r "home/clients" --include="*.tsx" --include="*.ts" app/ components/ hooks/`
Expected: No matches.

- [ ] **Step 4: Run lint to verify**

Run: `npm run lint`
Expected: All checks pass.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "refactor: remove deprecated client timeline from home stack"
```

---

### Task 7: Validation and manual testing

- [ ] **Step 1: Run full lint**

Run: `npm run lint`
Expected: All checks pass (eslint, prettier, type-check).

- [ ] **Step 2: Manual testing checklist**

Start the dev server (`npx expo start`) and verify:

1. **Home dashboard → client card tap:** Navigates to the Clients tab detail screen (not the old home-stack timeline)
2. **Clients tab → client row tap:** Navigates to client detail as before
3. **Client detail default view:** Shows practice items in time-bucketed sections (Today, This Week, Upcoming, Recently Completed) — no regression
4. **Filter icon:** Visible in the client detail header with the filter funnel icon
5. **Filter drawer opens:** Tapping the filter icon opens the drawer sliding from the right
6. **Filter drawer contents:** Shows Status chips, Module chips (from `usePatientModules` — may fallback to text input if BE endpoint not deployed yet), Severity chips, Limit input. No Patient section.
7. **Applying filters:** Switches to flat list view. Results render with the same card style (icon, title, status, scores, chevrons)
8. **Reset filters:** Returns to the bucketed practice view
9. **Filter badge:** Badge appears on filter icon showing count of active filters
10. **Filtered list infinite scroll:** Scroll triggers loading more results
11. **Filtered list pull-to-refresh:** Pull down refreshes the filtered results
12. **Empty filtered results:** Shows "No results — Try adjusting your filters" empty state
13. **Long-press on practice cards still works:** Action menu for edit/remove assignment shows in default mode

---

## Backend Work (separate repo `../cbt/`)

This plan covers only the FE. The following BE work is needed independently:

1. **New endpoint:** `GET /user/therapist/patients/:id/modules` — returns distinct modules the patient has attempts for
2. **Response type:** `{ modules: Array<{ _id: string; title: string }> }` — add to `@milobedini/shared-types`
3. **Severity filter on timeline endpoint:** Ensure `GET /user/therapist/patients/:id/timeline` accepts a `severity` query param and filters accordingly

The FE gracefully degrades: if the modules endpoint 404s, the filter drawer shows a text input fallback. If severity isn't supported on the BE yet, the param is simply ignored.
