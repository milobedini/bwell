# Admin All Users — Search, Filter & Sort Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add search, filtering, sorting, and infinite scroll to the admin All Users screen.

**Architecture:** Purpose-built `UserFilterDrawer` component alongside a debounced search bar and inline sort button. The existing `FilterDrawer` is renamed to `AttemptFilterDrawer` for clarity. `useAllUsers` switches from `useQuery` to `useInfiniteQuery` for lazy-loaded infinite scroll.

**Tech Stack:** Expo/React Native, NativeWind, TanStack React Query (`useInfiniteQuery`), react-native-paper (TextInput, Chip, Menu, Badge, IconButton), `@milobedini/shared-types`

**Spec:** `docs/superpowers/specs/2026-03-20-admin-user-search-filter-design.md`

---

### Task 1: Rename FilterDrawer → AttemptFilterDrawer

**Files:**
- Rename: `components/ui/FilterDrawer.tsx` → `components/ui/AttemptFilterDrawer.tsx`
- Modify: `constants/Filters.ts`
- Modify: `app/(main)/(tabs)/home/clients/[id]/index.tsx`

- [ ] **Step 1: Rename the file**

```bash
git mv components/ui/FilterDrawer.tsx components/ui/AttemptFilterDrawer.tsx
```

- [ ] **Step 2: Rename component and exported types in `AttemptFilterDrawer.tsx`**

In `components/ui/AttemptFilterDrawer.tsx`, rename:
- `FilterDrawerProps` → `AttemptFilterDrawerProps`
- `FilterDrawer` → `AttemptFilterDrawer` (the component function and its export)

```tsx
// Before
export type FilterDrawerProps = {
// After
export type AttemptFilterDrawerProps = {

// Before
export const FilterDrawer = ({
// After
export const AttemptFilterDrawer = ({

// Update the destructured props type annotation from FilterDrawerProps to AttemptFilterDrawerProps
```

- [ ] **Step 3: Rename types in `constants/Filters.ts`**

In `constants/Filters.ts`, rename:
- `FilterDrawerValues` → `AttemptFilterDrawerValues`
- Update `DEFAULT_FILTERS` type annotation
- Update `withDefaults` parameter and return type

```tsx
export type AttemptFilterDrawerValues = {
  status?: DrawerStatusOption[];
  moduleId?: string;
  limit?: number;
};

export const DEFAULT_FILTERS: AttemptFilterDrawerValues = {
  status: ['submitted'],
  limit: 20,
  moduleId: undefined
};

export const withDefaults = (v?: AttemptFilterDrawerValues): AttemptFilterDrawerValues => ({
  ...DEFAULT_FILTERS,
  ...(v ?? {})
});
```

- [ ] **Step 4: Update imports in `AttemptFilterDrawer.tsx`**

Update the import of `FilterDrawerValues` to `AttemptFilterDrawerValues`:

```tsx
// Before
import { DEFAULT_FILTERS, type FilterDrawerValues } from '@/constants/Filters';
// After
import { DEFAULT_FILTERS, type AttemptFilterDrawerValues } from '@/constants/Filters';
```

Also update usage within the file: `useState<FilterDrawerValues>` → `useState<AttemptFilterDrawerValues>`, and the `handleApply`/`onChange`/`onApply` types in `AttemptFilterDrawerProps` that reference `FilterDrawerValues` → `AttemptFilterDrawerValues`.

Additionally, remove the duplicate `DrawerStatusOption` type declaration from this file (line 11) — it's already exported from `constants/Filters.ts`. Import it instead:

```tsx
import { DEFAULT_FILTERS, type AttemptFilterDrawerValues, type DrawerStatusOption } from '@/constants/Filters';
```

- [ ] **Step 5: Update imports in client detail screen**

In `app/(main)/(tabs)/home/clients/[id]/index.tsx`:

```tsx
// Before
import { FilterDrawer } from '@/components/ui/FilterDrawer';
import type { FilterDrawerValues } from '@/constants/Filters';
// After
import { AttemptFilterDrawer } from '@/components/ui/AttemptFilterDrawer';
import type { AttemptFilterDrawerValues } from '@/constants/Filters';
```

Update all usages:
- `FilterDrawerValues` → `AttemptFilterDrawerValues` (type annotations on lines 19, 30)
- `<FilterDrawer` → `<AttemptFilterDrawer` (JSX on line 134)

- [ ] **Step 6: Validate**

```bash
npm run lint
```

Expected: all checks pass.

- [ ] **Step 7: Commit**

```bash
git add components/ui/AttemptFilterDrawer.tsx constants/Filters.ts app/\(main\)/\(tabs\)/home/clients/\[id\]/index.tsx
git commit -m "refactor: rename FilterDrawer to AttemptFilterDrawer for clarity"
```

---

### Task 2: Create `useDebounce` hook

**Files:**
- Create: `hooks/useDebounce.ts`

- [ ] **Step 1: Create the hook**

Create `hooks/useDebounce.ts`:

```tsx
import { useEffect, useState } from 'react';

/**
 * Value-debounce hook. Returns a debounced copy of `value` that only
 * updates after `delay` ms of inactivity.
 *
 * Distinct from `useDebouncedCallback` in `utils/debounce.ts`, which
 * debounces a callback function rather than a reactive value.
 */
const useDebounce = <T>(value: T, delay: number): T => {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);

  return debounced;
};

export { useDebounce };
```

- [ ] **Step 2: Validate**

```bash
npm run lint
```

- [ ] **Step 3: Commit**

```bash
git add hooks/useDebounce.ts
git commit -m "feat: add useDebounce value-debounce hook"
```

---

### Task 3: Create `UserListItem` component

**Files:**
- Create: `components/admin/UserListItem.tsx`

- [ ] **Step 1: Create the component**

Create `components/admin/UserListItem.tsx`:

```tsx
import { Pressable, View } from 'react-native';
import type { UsersListItem } from '@milobedini/shared-types';
import { Colors } from '@/constants/Colors';

import { ThemedText } from '../ThemedText';
import { StatusChip } from '../ui/Chip';

type UserListItemProps = {
  user: UsersListItem;
  onPress?: () => void;
};

const ROLE_COLORS: Record<string, { color: string; border: string }> = {
  patient: { color: Colors.chip.green, border: Colors.chip.greenBorder },
  therapist: { color: Colors.chip.infoBlue, border: Colors.chip.infoBlueBorder },
  admin: { color: Colors.chip.red, border: Colors.chip.redBorder }
};

const formatRelativeTime = (dateString?: string): string => {
  if (!dateString) return 'Never';
  const diff = Date.now() - new Date(dateString).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  const months = Math.floor(days / 30);
  return `${months}mo ago`;
};

const UserListItem = ({ user, onPress }: UserListItemProps) => {
  const primaryName = user.name ?? user.username;
  const showUsername = !!user.name;

  return (
    <Pressable
      onPress={onPress}
      className="gap-2 px-4 py-3"
      style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}
    >
      {/* Row 1: Name + last login */}
      <View className="flex-row items-center justify-between">
        <View className="flex-1 flex-row items-baseline gap-2">
          <ThemedText type="smallTitle">{primaryName}</ThemedText>
          {showUsername && (
            <ThemedText type="small" className="text-sway-darkGrey">
              @{user.username}
            </ThemedText>
          )}
        </View>
        <ThemedText type="small" className="text-sway-darkGrey">
          {formatRelativeTime(user.lastLogin)}
        </ThemedText>
      </View>

      {/* Row 2: Email */}
      <ThemedText type="small" className="text-sway-darkGrey">
        {user.email}
      </ThemedText>

      {/* Row 3: Role badges + verification */}
      <View className="flex-row flex-wrap items-center gap-2">
        {user.roles.map((role) => {
          const colors = ROLE_COLORS[role] ?? {
            color: Colors.chip.neutral,
            border: Colors.chip.neutralBorder
          };
          return (
            <StatusChip
              key={role}
              label={role.charAt(0).toUpperCase() + role.slice(1)}
              color={colors.color}
              borderColor={colors.border}
            />
          );
        })}

        {user.isVerified === false && (
          <StatusChip
            label="Email unverified"
            color={Colors.chip.amber}
            borderColor={Colors.chip.amberBorder}
            icon="email-alert-outline"
          />
        )}

        {user.roles.includes('therapist') && (
          <StatusChip
            label={user.isVerifiedTherapist ? 'Verified therapist' : 'Unverified therapist'}
            color={user.isVerifiedTherapist ? Colors.chip.green : Colors.chip.amber}
            borderColor={user.isVerifiedTherapist ? Colors.chip.greenBorder : Colors.chip.amberBorder}
            icon={user.isVerifiedTherapist ? 'check-decagram' : 'clock-outline'}
          />
        )}
      </View>

      {/* Row 4: Therapist info (for patients) */}
      {user.therapistInfo && (
        <ThemedText type="small" className="text-sway-darkGrey">
          Therapist: {user.therapistInfo.name ?? user.therapistInfo.username}
        </ThemedText>
      )}
    </Pressable>
  );
};

export default UserListItem;
```

- [ ] **Step 2: Validate**

```bash
npm run lint
```

- [ ] **Step 3: Commit**

```bash
git add components/admin/UserListItem.tsx
git commit -m "feat: add enriched UserListItem component for admin users list"
```

---

### Task 4: Create `SortButton` component

**Files:**
- Create: `components/admin/SortButton.tsx`

- [ ] **Step 1: Create the component**

Create `components/admin/SortButton.tsx`:

```tsx
import { useState } from 'react';
import { Button, Menu } from 'react-native-paper';
import { Colors } from '@/constants/Colors';

export type SortOption =
  | 'name:asc'
  | 'name:desc'
  | 'createdAt:desc'
  | 'createdAt:asc'
  | 'lastLogin:desc';

type SortLabelMap = { value: SortOption; label: string };

const SORT_OPTIONS: SortLabelMap[] = [
  { value: 'name:asc', label: 'Name A-Z' },
  { value: 'name:desc', label: 'Name Z-A' },
  { value: 'createdAt:desc', label: 'Newest First' },
  { value: 'createdAt:asc', label: 'Oldest First' },
  { value: 'lastLogin:desc', label: 'Last Login' }
];

type SortButtonProps = {
  value: SortOption;
  onChange: (value: SortOption) => void;
};

const SortButton = ({ value, onChange }: SortButtonProps) => {
  const [visible, setVisible] = useState(false);

  const currentLabel =
    SORT_OPTIONS.find((o) => o.value === value)?.label ?? 'Sort';

  return (
    <Menu
      visible={visible}
      onDismiss={() => setVisible(false)}
      anchor={
        <Button
          mode="outlined"
          icon="sort"
          onPress={() => setVisible(true)}
          textColor={Colors.sway.lightGrey}
          style={{ borderColor: Colors.sway.buttonBackgroundSolid }}
          compact
        >
          {currentLabel}
        </Button>
      }
      contentStyle={{ backgroundColor: Colors.sway.dark }}
    >
      {SORT_OPTIONS.map((opt) => (
        <Menu.Item
          key={opt.value}
          onPress={() => {
            onChange(opt.value);
            setVisible(false);
          }}
          title={opt.label}
          titleStyle={{
            color:
              opt.value === value
                ? Colors.sway.bright
                : Colors.sway.lightGrey
          }}
        />
      ))}
    </Menu>
  );
};

export default SortButton;
```

- [ ] **Step 2: Validate**

```bash
npm run lint
```

- [ ] **Step 3: Commit**

```bash
git add components/admin/SortButton.tsx
git commit -m "feat: add SortButton dropdown component for user list sorting"
```

---

### Task 5: Create `UserFilterDrawer` component

**Files:**
- Create: `components/admin/UserFilterDrawer.tsx`

- [ ] **Step 1: Create the filter types**

At the top of the new file, define the `UserFilters` type and default:

```tsx
import { useEffect, useRef, useState } from 'react';
import {
  Animated,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
  useWindowDimensions
} from 'react-native';
import { Button, Chip, Divider, IconButton, Portal, Surface, TextInput } from 'react-native-paper';
import Constants from 'expo-constants';
import type { UserRole, UsersFacets } from '@milobedini/shared-types';
import { Colors } from '@/constants/Colors';

import { ThemedText } from '../ThemedText';

export type UserFilters = {
  roles?: UserRole[];
  isVerified?: boolean;
  isVerifiedTherapist?: boolean;
  hasTherapist?: boolean;
  createdFrom?: string;
  createdTo?: string;
  lastLoginFrom?: string;
  lastLoginTo?: string;
};

export const DEFAULT_USER_FILTERS: UserFilters = {};

export const countActiveFilters = (f: UserFilters): number =>
  [
    f.roles?.length,
    f.isVerified !== undefined,
    f.isVerifiedTherapist !== undefined,
    f.hasTherapist !== undefined,
    f.createdFrom,
    f.createdTo,
    f.lastLoginFrom,
    f.lastLoginTo
  ].filter(Boolean).length;
```

- [ ] **Step 2: Create the drawer component**

Continue in the same file with the drawer component:

```tsx
type UserFilterDrawerProps = {
  visible: boolean;
  onDismiss: () => void;
  values: UserFilters;
  onApply: (values: UserFilters) => void;
  facets?: UsersFacets;
};

const ROLE_OPTIONS: UserRole[] = ['patient', 'therapist', 'admin'];

const getFacetCount = <T,>(
  facets: { _id: T; count: number }[] | undefined,
  id: T
): number | undefined => facets?.find((f) => f._id === id)?.count;

const UserFilterDrawer = ({
  visible,
  onDismiss,
  values,
  onApply,
  facets
}: UserFilterDrawerProps) => {
  const { width: screenWidth } = useWindowDimensions();
  const drawerWidth = Math.min(420, Math.floor(screenWidth * 0.9));
  const translateX = useRef(new Animated.Value(drawerWidth)).current;
  const [local, setLocal] = useState<UserFilters>(values);

  useEffect(() => {
    if (visible) setLocal(values);
  }, [visible, values]);

  useEffect(() => {
    Animated.timing(translateX, {
      toValue: visible ? 0 : drawerWidth,
      duration: 220,
      useNativeDriver: true
    }).start();
  }, [visible, translateX, drawerWidth]);

  const toggleRole = (role: UserRole) => {
    setLocal((prev) => {
      const current = new Set(prev.roles ?? []);
      if (current.has(role)) current.delete(role);
      else current.add(role);
      const next = Array.from(current);
      return { ...prev, roles: next.length ? next : undefined };
    });
  };

  const toggleBoolean = (key: 'isVerified' | 'isVerifiedTherapist' | 'hasTherapist', val: boolean) => {
    setLocal((prev) => ({
      ...prev,
      [key]: prev[key] === val ? undefined : val
    }));
  };

  const handleApply = () => {
    onApply(local);
    onDismiss();
  };

  const handleReset = () => {
    setLocal(DEFAULT_USER_FILTERS);
  };

  const booleanSection = (
    label: string,
    key: 'isVerified' | 'isVerifiedTherapist' | 'hasTherapist',
    facetData?: { _id: boolean; count: number }[]
  ) => (
    <View style={styles.section}>
      <ThemedText type="smallTitle" style={styles.sectionTitle}>
        {label}
      </ThemedText>
      <View style={styles.rowWrap}>
        {[true, false].map((val) => {
          const count = getFacetCount(facetData, val);
          const chipLabel = `${val ? 'Yes' : 'No'}${count !== undefined ? ` (${count})` : ''}`;
          return (
            <Chip
              key={String(val)}
              selected={local[key] === val}
              onPress={() => toggleBoolean(key, val)}
              style={styles.chip}
            >
              {chipLabel}
            </Chip>
          );
        })}
      </View>
    </View>
  );

  return (
    <Portal>
      {visible && <Pressable style={styles.backdrop} onPress={onDismiss} />}
      <KeyboardAvoidingView
        behavior={Platform.select({ ios: 'padding', android: undefined })}
        pointerEvents="box-none"
        style={StyleSheet.absoluteFill}
      >
        <Animated.View
          style={[
            styles.drawerContainer,
            { width: drawerWidth, transform: [{ translateX }] }
          ]}
          pointerEvents={visible ? 'auto' : 'none'}
        >
          <Surface elevation={3} style={styles.surface}>
            <View style={styles.header}>
              <ThemedText type="subtitle">Filters</ThemedText>
              <IconButton icon="close" onPress={onDismiss} />
            </View>

            <Divider />

            <ScrollView showsVerticalScrollIndicator={false}>
              {/* Roles */}
              <View style={styles.section}>
                <ThemedText type="smallTitle" style={styles.sectionTitle}>
                  Roles
                </ThemedText>
                <View style={styles.rowWrap}>
                  {ROLE_OPTIONS.map((role) => {
                    const count = getFacetCount(facets?.roles, role);
                    const chipLabel = `${role.charAt(0).toUpperCase() + role.slice(1)}${count !== undefined ? ` (${count})` : ''}`;
                    return (
                      <Chip
                        key={role}
                        selected={(local.roles ?? []).includes(role)}
                        onPress={() => toggleRole(role)}
                        style={styles.chip}
                      >
                        {chipLabel}
                      </Chip>
                    );
                  })}
                </View>
              </View>

              {/* Boolean filters */}
              {booleanSection('Email Verified', 'isVerified', facets?.isVerified)}
              {booleanSection('Therapist Verified', 'isVerifiedTherapist', facets?.isVerifiedTherapist)}
              {booleanSection('Has Therapist', 'hasTherapist', facets?.hasTherapist)}

              {/* Created Date */}
              <View style={styles.section}>
                <ThemedText type="smallTitle" style={styles.sectionTitle}>
                  Created Date
                </ThemedText>
                <TextInput
                  mode="outlined"
                  label="From (YYYY-MM-DD)"
                  value={local.createdFrom ?? ''}
                  onChangeText={(t) =>
                    setLocal((prev) => ({ ...prev, createdFrom: t || undefined }))
                  }
                  keyboardType="numeric"
                />
                <TextInput
                  mode="outlined"
                  label="To (YYYY-MM-DD)"
                  value={local.createdTo ?? ''}
                  onChangeText={(t) =>
                    setLocal((prev) => ({ ...prev, createdTo: t || undefined }))
                  }
                  keyboardType="numeric"
                  style={{ marginTop: 8 }}
                />
              </View>

              {/* Last Login */}
              <View style={styles.section}>
                <ThemedText type="smallTitle" style={styles.sectionTitle}>
                  Last Login
                </ThemedText>
                <TextInput
                  mode="outlined"
                  label="From (YYYY-MM-DD)"
                  value={local.lastLoginFrom ?? ''}
                  onChangeText={(t) =>
                    setLocal((prev) => ({ ...prev, lastLoginFrom: t || undefined }))
                  }
                  keyboardType="numeric"
                />
                <TextInput
                  mode="outlined"
                  label="To (YYYY-MM-DD)"
                  value={local.lastLoginTo ?? ''}
                  onChangeText={(t) =>
                    setLocal((prev) => ({ ...prev, lastLoginTo: t || undefined }))
                  }
                  keyboardType="numeric"
                  style={{ marginTop: 8 }}
                />
              </View>
            </ScrollView>

            <View style={styles.footer}>
              <Button
                onPress={handleReset}
                mode="text"
                textColor="black"
                buttonColor={Colors.sway.darkGrey}
              >
                Reset
              </Button>
              <View style={{ flex: 1 }} />
              <Button
                onPress={onDismiss}
                mode="text"
                buttonColor={Colors.primary.error}
                textColor="black"
              >
                Cancel
              </Button>
              <Button
                onPress={handleApply}
                mode="contained"
                buttonColor={Colors.sway.bright}
                textColor="black"
              >
                Apply
              </Button>
            </View>
          </Surface>
        </Animated.View>
      </KeyboardAvoidingView>
    </Portal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: Colors.overlay.light
  },
  drawerContainer: {
    position: 'absolute',
    right: 0,
    top: 0,
    bottom: 0
  },
  surface: {
    flex: 1,
    padding: 16,
    backgroundColor: Colors.sway.dark,
    paddingTop: Constants.statusBarHeight
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    justifyContent: 'space-between',
    marginBottom: 8
  },
  section: {
    marginTop: 16,
    gap: 8
  },
  sectionTitle: {
    marginBottom: 4
  },
  rowWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8
  },
  chip: { marginRight: 4 },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 'auto',
    paddingTop: 12
  }
});

export default UserFilterDrawer;
```

- [ ] **Step 3: Validate**

```bash
npm run lint
```

- [ ] **Step 4: Commit**

```bash
git add components/admin/UserFilterDrawer.tsx
git commit -m "feat: add UserFilterDrawer component for admin user filtering"
```

---

### Task 6: Convert `useAllUsers` to `useInfiniteQuery` and rebuild the All Users screen

**Files:**
- Modify: `hooks/useUsers.ts`
- Modify: `app/(main)/(tabs)/all-users/index.tsx`

> **Note:** These two changes are in a single task because changing `useAllUsers` to `useInfiniteQuery` will break the existing screen. Both must be updated together to keep the repo compilable.

- [ ] **Step 1: Update `useAllUsers` to use `useInfiniteQuery`**

In `hooks/useUsers.ts`, update the TanStack Query import:

```tsx
// Before
import { useQuery, useQueryClient, UseQueryResult } from '@tanstack/react-query';
// After
import { useInfiniteQuery, useQuery, useQueryClient } from '@tanstack/react-query';
```

Replace the existing `useAllUsers` function (lines 135-149) with:

```tsx
export const useAllUsers = (query?: Omit<GetUsersQuery, 'page'>) => {
  const isLoggedIn = useIsLoggedIn();

  return useInfiniteQuery<GetUsersResponse, AxiosError<ApiError>>({
    queryKey: ['admin', 'users', query ?? {}],
    queryFn: async ({ pageParam }) => {
      const { data } = await api.get<GetUsersResponse>('/user/users', {
        params: buildParams({ ...query, page: pageParam as number })
      });
      return data;
    },
    initialPageParam: 1,
    getNextPageParam: (lastPage) =>
      lastPage.page < lastPage.totalPages ? lastPage.page + 1 : undefined,
    enabled: isLoggedIn,
    staleTime: 1000 * 60 * 2
  });
};
```

Key changes:
- Omit `page` from the query type (managed by `useInfiniteQuery`)
- `initialPageParam: 1`
- `getNextPageParam` returns next page number or `undefined` when done
- Remove the `UseQueryResult` return type annotation (inferred by `useInfiniteQuery`)

- [ ] **Step 2: Rewrite the screen**

Replace the entire contents of `app/(main)/(tabs)/all-users/index.tsx` with:

```tsx
import { useMemo, useState } from 'react';
import { ActivityIndicator, FlatList, View } from 'react-native';
import { Badge, Button, Divider, IconButton, TextInput } from 'react-native-paper';
import Container from '@/components/Container';
import { LoadingIndicator } from '@/components/LoadingScreen';
import { ThemedText } from '@/components/ThemedText';
import EmptyState from '@/components/ui/EmptyState';
import UserListItem from '@/components/admin/UserListItem';
import SortButton, { type SortOption } from '@/components/admin/SortButton';
import UserFilterDrawer, {
  countActiveFilters,
  DEFAULT_USER_FILTERS,
  type UserFilters
} from '@/components/admin/UserFilterDrawer';
import { useAllUsers } from '@/hooks/useUsers';
import { useDebounce } from '@/hooks/useDebounce';
import { Colors } from '@/constants/Colors';

const AllUsersList = () => {
  // Search
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 350);

  // Filters
  const [filters, setFilters] = useState<UserFilters>(DEFAULT_USER_FILTERS);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const activeFilterCount = useMemo(() => countActiveFilters(filters), [filters]);

  // Sort
  const [sort, setSort] = useState<SortOption>('createdAt:desc');

  // Query
  const {
    data,
    isPending,
    isError,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isFetching,
    refetch
  } = useAllUsers({
    q: debouncedSearch || undefined,
    roles: filters.roles,
    isVerified: filters.isVerified,
    isVerifiedTherapist: filters.isVerifiedTherapist,
    hasTherapist: filters.hasTherapist,
    createdFrom: filters.createdFrom,
    createdTo: filters.createdTo,
    lastLoginFrom: filters.lastLoginFrom,
    lastLoginTo: filters.lastLoginTo,
    sort,
    limit: 25
  });

  const users = useMemo(
    () => data?.pages.flatMap((p) => p.items) ?? [],
    [data]
  );

  const facets = data?.pages[0]?.facets;
  const total = data?.pages[0]?.total;

  if (isPending) return <LoadingIndicator marginBottom={0} />;
  if (isError)
    return (
      <Container>
        <View className="flex-1 items-center justify-center gap-4 p-8">
          <ThemedText type="smallTitle" className="text-center">
            Something went wrong
          </ThemedText>
          <ThemedText type="small" className="text-center text-sway-darkGrey">
            Failed to load users
          </ThemedText>
          <Button mode="contained" buttonColor={Colors.sway.bright} textColor="black" onPress={() => refetch()}>
            Retry
          </Button>
        </View>
      </Container>
    );

  return (
    <>
      <Container>
        <ThemedText type="title" className="px-4 text-center">
          All Users
        </ThemedText>

        {/* Search bar */}
        <View className="px-4 pt-2">
          <TextInput
            mode="outlined"
            placeholder="Search by name, email, or username"
            value={search}
            onChangeText={setSearch}
            left={<TextInput.Icon icon="magnify" />}
            right={
              search ? (
                <TextInput.Icon icon="close" onPress={() => setSearch('')} />
              ) : isFetching && debouncedSearch ? (
                <TextInput.Icon
                  icon={() => (
                    <ActivityIndicator size="small" color={Colors.sway.bright} />
                  )}
                />
              ) : null
            }
            outlineColor={Colors.sway.buttonBackgroundSolid}
            activeOutlineColor={Colors.sway.bright}
            textColor={Colors.sway.lightGrey}
            placeholderTextColor={Colors.sway.darkGrey}
          />
        </View>

        {/* Sort + Filter buttons row */}
        <View className="flex-row items-center gap-2 px-4 py-2">
          <SortButton value={sort} onChange={setSort} />

          <View className="relative">
            <IconButton
              icon="filter-variant"
              onPress={() => setDrawerOpen(true)}
              iconColor={Colors.sway.lightGrey}
              accessibilityLabel="Open filters"
            />
            {activeFilterCount > 0 && (
              <Badge style={{ position: 'absolute', top: 2, right: 2 }}>
                {activeFilterCount}
              </Badge>
            )}
          </View>

          {total !== undefined && (
            <ThemedText type="small" className="ml-auto text-sway-darkGrey">
              {total} {total === 1 ? 'user' : 'users'}
            </ThemedText>
          )}
        </View>

        {/* User list */}
        {users.length === 0 ? (
          <EmptyState
            icon="account-search-outline"
            title="No users match your filters"
            subtitle="Try adjusting your search or filter criteria"
          />
        ) : (
          <FlatList
            data={users}
            keyExtractor={(item) => item._id}
            renderItem={({ item }) => <UserListItem user={item} />}
            ItemSeparatorComponent={() => <Divider />}
            onEndReachedThreshold={0.5}
            onEndReached={() => {
              if (hasNextPage && !isFetchingNextPage) fetchNextPage();
            }}
            ListFooterComponent={
              isFetchingNextPage ? (
                <View className="items-center py-4">
                  <ActivityIndicator size="small" color={Colors.sway.bright} />
                </View>
              ) : null
            }
          />
        )}
      </Container>

      <UserFilterDrawer
        visible={drawerOpen}
        onDismiss={() => setDrawerOpen(false)}
        values={filters}
        onApply={setFilters}
        facets={facets}
      />
    </>
  );
};

export default AllUsersList;
```

- [ ] **Step 3: Validate**

```bash
npm run lint
```

Expected: all checks pass.

- [ ] **Step 4: Manual test**

```bash
npx expo start
```

Test the following:
1. Search — type a name, verify results filter after 350ms
2. Clear search — tap the X, verify results reset
3. Sort — tap sort button, try each option
4. Filters — open drawer, select roles, apply, verify badge count updates
5. Infinite scroll — scroll down, verify more users load
6. Empty state — apply filters that match no users, verify empty state shows
7. Loading — verify initial loading indicator and scroll-to-load spinner

- [ ] **Step 5: Commit**

```bash
git add hooks/useUsers.ts app/\(main\)/\(tabs\)/all-users/index.tsx
git commit -m "feat: add search, filtering, sorting, and infinite scroll to All Users screen"
```

---

### Task 7: Final validation and cleanup

- [ ] **Step 1: Run full validation**

```bash
npx eslint --fix .
npx prettier --write .
npm run lint
```

Expected: all checks pass with no errors.

- [ ] **Step 2: Verify no regressions in client timeline**

Open the app, navigate to a therapist account → client detail timeline. Verify the renamed `AttemptFilterDrawer` still works correctly — filters open, apply, reset, and the badge count shows.

- [ ] **Step 3: Final commit if formatting changed**

```bash
git add -A
git status
```

If there are formatting-only changes:

```bash
git commit -m "style: format with prettier"
```
