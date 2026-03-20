# Admin All Users — Search, Filter & Sort

**Date:** 2026-03-20
**Status:** Approved

## Overview

Add search, filtering, sorting, and infinite scroll to the admin All Users screen. The backend (`GET /user/users`) already supports all query parameters — this is a frontend-only feature.

As a housekeeping step, rename the existing `FilterDrawer` to `AttemptFilterDrawer` to accurately reflect its purpose (therapist timeline attempt filtering), making room for the new `UserFilterDrawer`.

## Architecture Decisions

- **Approach B (purpose-built):** New `UserFilterDrawer` component rather than extending the existing `FilterDrawer`, which is shaped around attempt/timeline filtering. Keeps both components focused.
- **Rename existing drawer:** `FilterDrawer` → `AttemptFilterDrawer` (file, component, exported types `FilterDrawerProps` → `AttemptFilterDrawerProps`, and `FilterDrawerValues` → `AttemptFilterDrawerValues` in `constants/Filters.ts`). Update imports in `app/(main)/(tabs)/home/clients/[id]/index.tsx`.
- **Future reuse:** The filter state shape, debounce hook, and drawer structure are kept generic enough to adapt for a therapist-facing patient search screen later — but no abstract "configurable filter" machinery is built now.

## Data Flow & State Management

### State

All state is local to the All Users screen — no global store needed.

- **Search:** `useState<string>` → debounced via `useDebounce(value, 350)` → passed as `q` param
- **Filters:** `useState<UserFilters>` holding:
  ```ts
  type UserFilters = {
    roles?: UserRole[]
    isVerified?: boolean
    isVerifiedTherapist?: boolean
    hasTherapist?: boolean
    createdFrom?: string  // ISO date
    createdTo?: string
    lastLoginFrom?: string
    lastLoginTo?: string
  }
  ```
- **Sort:** `useState<SortOption>` where:
  ```ts
  type SortOption = 'name:asc' | 'name:desc' | 'createdAt:desc' | 'createdAt:asc' | 'lastLogin:desc'
  ```
  Maps to labels: Name A-Z, Name Z-A, Newest First, Oldest First, Last Login (most recent first). Default: `"createdAt:desc"`.

### Query

Replace the current `useQuery` in `useAllUsers` with `useInfiniteQuery`:
- Receives merged params: debounced search + filters + sort
- `initialPageParam: 1`
- `getNextPageParam: (lastPage) => lastPage.page < lastPage.totalPages ? lastPage.page + 1 : undefined`
- Query function merges `pageParam` as `page` into the request params
- Pages flattened for FlatList via `data.pages.flatMap(p => p.items)`
- 2-minute staleTime (matching current hook)
- Remove the `select` field projection — return all fields so enriched list items have access to roles, verification status, lastLogin, and therapistInfo
- Existing mutation invalidation (`['admin', 'users']`) will correctly match via TanStack Query prefix matching

### Facets

The API returns facet counts (role counts, verification counts) in the response. These are displayed as badge numbers on filter chips inside the drawer (e.g. "Patient (42)").

## Components

### Renamed Files

- **`components/ui/FilterDrawer.tsx`** → **`components/ui/AttemptFilterDrawer.tsx`** — rename component, exported types (`FilterDrawerProps` → `AttemptFilterDrawerProps`), and update import in `app/(main)/(tabs)/home/clients/[id]/index.tsx`
- **`constants/Filters.ts`** — rename `FilterDrawerValues` → `AttemptFilterDrawerValues`

### Modified Files

- **`app/(main)/(tabs)/all-users/index.tsx`** — reworked with search bar, sort button, filters button, enriched list items, infinite scroll via FlatList
- **`hooks/useUsers.ts`** — replace `useAllUsers` with `useInfiniteQuery` version

### New Files

- **`hooks/useDebounce.ts`** — generic value-debounce hook (`useDebounce<T>(value: T, delay: number): T`), reusable anywhere. Distinct from the existing `useDebouncedCallback` in `utils/debounce.ts` which debounces callbacks.
- **`components/admin/UserFilterDrawer.tsx`** — slide-in drawer with filter sections
- **`components/admin/UserListItem.tsx`** — enriched list row component
- **`components/admin/SortButton.tsx`** — inline sort toggle/dropdown

### Reused

- `Chip` (react-native-paper) for filter multi-select
- `StatusChip` for role/verification badges on list items
- Animation pattern from `AttemptFilterDrawer` (Animated.View translateX + backdrop). Note: use `useWindowDimensions()` instead of the static `Dimensions.get()` in the existing drawer.
- `EmptyState` for no-results state
- `LoadingIndicator` for loading states

## UX Details

### Search Bar

- `TextInput` (react-native-paper, mode="outlined") pinned at top
- Placeholder: "Search by name, email, or username"
- Clear button visible while typing
- 350ms debounce before triggering query
- Subtle loading indicator while debounced query is in flight

### Filter Drawer

- Opens from the right (consistent with existing `AttemptFilterDrawer`)
- Sections stacked vertically with clear labels:
  1. **Roles** — multi-select chips: Patient, Therapist, Admin (with facet count badges)
  2. **Email Verified** — Yes / No toggle chips (with facet counts)
  3. **Therapist Verified** — Yes / No toggle chips (with facet counts)
  4. **Has Therapist** — Yes / No toggle chips (with facet counts)
  5. **Created Date** — From / To date inputs (use `TextInput` with ISO date format `YYYY-MM-DD` and keyboard type `numeric`; cross-platform date picker can be added as a follow-up)
  6. **Last Login** — From / To date inputs (same pattern as Created Date)
- Footer buttons: Reset All / Apply
- "Filters" button on main screen shows active filter count badge (e.g. "Filters (3)"). Count = number of filter keys with a non-default value set (each of the 8 fields counts as 1 when populated).

### Sort Button

- Inline next to Filters button
- Shows current sort label (e.g. "Name A-Z")
- Tapping opens a menu with options: Name A-Z, Name Z-A, Newest First, Oldest First, Last Login
- Selection applies immediately (no "Apply" step)

### Infinite Scroll

- `FlatList` with `onEndReached` triggering `fetchNextPage`
- `onEndReachedThreshold={0.5}`
- Small spinner at list footer while loading next page
- No indicator when `hasNextPage` is false

### Enriched List Items

Each row displays:
- **Name** (bold) with **username** in muted text beside it. If `name` is undefined, show username as the primary text.
- **Email** below name
- **Role badges** — `StatusChip` components (green Patient, blue Therapist, red Admin). Multiple roles show multiple chips.
- **Verification indicators** — email verified icon/chip; for therapists, "Verified Therapist" / "Unverified" badge
- **Last login** — relative time (e.g. "2 hours ago") in muted text, right-aligned
- **Therapist name** — if patient has assigned therapist, show "Therapist: Dr. Smith" in secondary text
- Row is pressable (navigation target TBD — no-op for now)

### Empty & Loading States

- Initial load: centred `LoadingIndicator`
- No results: `EmptyState` with "No users match your filters"
- Error: inline error message with retry option

## Out of Scope

- User detail screen (row press is no-op for now)
- Therapist-facing patient search (future — this design is structured to support it later)
- Backend changes (API already supports everything needed)
