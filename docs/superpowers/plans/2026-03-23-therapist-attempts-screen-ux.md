# Therapist Attempts Screen UX Redesign — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Overhaul the therapist attempts list with filtering, sorting, date grouping, cursor pagination, pull-to-refresh, and visual polish.

**Architecture:** Backend-first approach — extend the existing `/therapist/attempts/latest` endpoint with query params and cursor pagination, add a `/therapist/attempts/modules` endpoint, then rebuild the frontend screen with `SectionList`, inline sort chips, extended filter drawer, and active filter chips.

**Tech Stack:** Express/MongoDB (backend), React Native SectionList, TanStack React Query `useInfiniteQuery`, NativeWind, react-native-paper Chips, existing `AttemptFilterDrawer` pattern.

**Git strategy:** Backend changes on `main` (in `../cbt/`). Frontend changes on feature branch `feat/therapist-attempts-ux` (in `./`).

---

## Task 1: Backend — Extend `getTherapistLatest` with filter params and cursor pagination

**Files:**
- Modify: `../cbt/src/controllers/attemptsController.ts:520-617`

**Context:** The current `getTherapistLatest` controller runs a MongoDB aggregation that groups by `(user, module)` and takes the latest submitted attempt per group. We need to:
1. Remove the group-by-latest-per-pair logic (the screen should show ALL submitted attempts, not just the latest per patient/module pair — otherwise filtering and pagination would hide historical entries)
2. Add filter params: `patientId`, `moduleId`, `severity`, `status`, `sort`
3. Add cursor-based pagination returning `nextCursor` and `totalCount`

- [ ] **Step 1: Parse new query params**

In `getTherapistLatest`, replace the current param parsing:

```typescript
// Replace this:
const { limit = '200' } = req.query as { limit?: string }
const lim = Math.min(parseInt(limit, 10) || 200, 500)

// With this:
const {
  limit = '20',
  patientId,
  moduleId,
  severity,
  status = 'submitted',
  sort = 'newest',
  cursor,
} = req.query as {
  limit?: string
  patientId?: string
  moduleId?: string
  severity?: string
  status?: string
  sort?: string
  cursor?: string
}
const lim = Math.min(parseInt(limit, 10) || 20, 100)
```

- [ ] **Step 2: Build dynamic `$match` stage**

Replace the static `$match` with a dynamic one built from params:

```typescript
const match: Record<string, unknown> = { therapist: therapistId }

// Status filter
if (status === 'all') {
  // no status filter
} else if (status === 'active') {
  match.status = 'started'
} else if (status?.includes(',')) {
  match.status = { $in: status.split(',') }
} else {
  match.status = status || 'submitted'
}

// Patient filter
if (patientId) {
  match.user = new Types.ObjectId(patientId)
}

// Module filter
if (moduleId) {
  match.module = new Types.ObjectId(moduleId)
}

// Severity filter (score band label regex)
if (severity === 'severe') {
  match.scoreBandLabel = { $regex: /severe|high/i }
} else if (severity === 'moderate') {
  match.scoreBandLabel = { $regex: /moderate/i }
} else if (severity === 'mild') {
  match.scoreBandLabel = { $regex: /mild|minimal|low/i }
}
```

- [ ] **Step 3: Build sort stage and cursor filter**

```typescript
// Sort
let sortStage: Record<string, 1 | -1>
if (sort === 'oldest') {
  sortStage = { completedAt: 1, _id: 1 }
} else if (sort === 'severity') {
  // Severity weight is added as a computed field before sorting
  sortStage = { _severityWeight: -1, completedAt: -1, _id: -1 }
} else {
  // newest (default)
  sortStage = { completedAt: -1, _id: -1 }
}

// Snapshot base match BEFORE cursor conditions (for totalCount)
const baseMatch = { ...match }

// Cursor filter (for pagination)
if (cursor && sort !== 'severity') {
  const cursorDate = new Date(cursor)
  if (!isNaN(cursorDate.getTime())) {
    if (sort === 'oldest') {
      match.completedAt = { $gt: cursorDate }
    } else {
      match.completedAt = { $lt: cursorDate }
    }
  }
}
```

- [ ] **Step 4: Rebuild the aggregation pipeline**

Replace the entire aggregation with:

```typescript
const pipeline: PipelineStage[] = [
  { $match: match },
]

// Add severity weight for severity sort
if (sort === 'severity') {
  pipeline.push({
    $addFields: {
      _severityWeight: {
        $switch: {
          branches: [
            { case: { $regexMatch: { input: { $ifNull: ['$scoreBandLabel', ''] }, regex: /severe|high/i } }, then: 3 },
            { case: { $regexMatch: { input: { $ifNull: ['$scoreBandLabel', ''] }, regex: /moderate/i } }, then: 2 },
            { case: { $regexMatch: { input: { $ifNull: ['$scoreBandLabel', ''] }, regex: /mild|minimal|low/i } }, then: 1 },
          ],
          default: 0,
        },
      },
    },
  })

  // Cursor for severity sort: "weight_isoDate_id"
  if (cursor) {
    const [wStr, isoDate, id] = cursor.split('_')
    const w = parseInt(wStr, 10)
    const d = new Date(isoDate)
    if (!isNaN(w) && !isNaN(d.getTime()) && id) {
      pipeline.push({
        $match: {
          $or: [
            { _severityWeight: { $lt: w } },
            { _severityWeight: w, completedAt: { $lt: d } },
            { _severityWeight: w, completedAt: d, _id: { $lt: new Types.ObjectId(id) } },
          ],
        },
      })
    }
  }
}

pipeline.push(
  { $sort: sortStage },
  // Lookups (keep existing)
  {
    $lookup: {
      from: 'scoreBands',
      let: { m: '$module', s: '$totalScore' },
      pipeline: [
        { $match: { $expr: { $and: [{ $eq: ['$module', '$$m'] }, { $lte: ['$min', '$$s'] }, { $gte: ['$max', '$$s'] }] } } },
        { $project: { _id: 1, label: 1, interpretation: 1, min: 1, max: 1 } },
      ],
      as: 'band',
    },
  },
  { $addFields: { band: { $arrayElemAt: ['$band', 0] } } },
  { $lookup: { from: 'users-data', localField: 'user', foreignField: '_id', as: 'user' } },
  { $lookup: { from: 'modules', localField: 'module', foreignField: '_id', as: 'module' } },
  { $addFields: { user: { $arrayElemAt: ['$user', 0] }, module: { $arrayElemAt: ['$module', 0] } } },
  {
    $project: {
      _id: 1,
      user: { _id: 1, username: 1, email: 1, name: 1 },
      module: { _id: 1, title: 1 },
      moduleType: 1,
      totalScore: 1,
      scoreBandLabel: 1,
      band: 1,
      completedAt: 1,
      weekStart: 1,
      iteration: 1,
      _severityWeight: 1,
    },
  },
  { $limit: lim + 1 }, // fetch one extra to determine nextCursor
)

const rows = await ModuleAttempt.aggregate(pipeline)
```

- [ ] **Step 5: Build response with cursor and totalCount**

```typescript
// Count total matching (without cursor conditions) for header subtitle
const totalCount = await ModuleAttempt.countDocuments(baseMatch)

// Determine nextCursor
const hasMore = rows.length > lim
const pageRows = hasMore ? rows.slice(0, lim) : rows

let nextCursor: string | null = null
if (hasMore) {
  const last = pageRows[pageRows.length - 1]
  if (sort === 'severity') {
    nextCursor = `${last._severityWeight}_${last.completedAt}_${last._id}`
  } else {
    nextCursor = new Date(last.completedAt).toISOString()
  }
}

// Clean up internal fields and decorate
const decorated = pageRows.map(({ _severityWeight, ...r }) => ({
  ...r,
  percentComplete: 100,
}))

res.status(200).json({ success: true, rows: decorated, nextCursor, totalCount })
```

- [ ] **Step 6: Commit**

```bash
cd ../cbt
git add src/controllers/attemptsController.ts
git commit -m "feat: extend therapist latest attempts with filters, sort, and cursor pagination"
```

---

## Task 2: Backend — Add `getTherapistAttemptModules` endpoint

**Files:**
- Modify: `../cbt/src/controllers/attemptsController.ts` (add new function at end)
- Modify: `../cbt/src/routes/userRoute.ts` (add route)

**Context:** The filter drawer needs a list of distinct modules that have been attempted by the therapist's patients. This is a lightweight aggregation on the `ModuleAttempt` collection.

- [ ] **Step 1: Add the controller function**

Add to the end of `../cbt/src/controllers/attemptsController.ts`:

```typescript
// GET /therapist/attempts/modules
export const getTherapistAttemptModules = async (req: Request, res: Response) => {
  try {
    const therapistId = req.user?._id as Types.ObjectId
    const me = await User.findById(therapistId, 'roles isVerifiedTherapist')
    if (
      !me ||
      (!me.roles.includes(UserRole.ADMIN) &&
        !(me.roles.includes(UserRole.THERAPIST) && me.isVerifiedTherapist))
    ) {
      res.status(403).json({ success: false, message: 'Access denied' })
      return
    }

    const modules = await ModuleAttempt.aggregate([
      { $match: { therapist: therapistId } },
      { $group: { _id: '$module', moduleType: { $first: '$moduleType' } } },
      {
        $lookup: {
          from: 'modules',
          localField: '_id',
          foreignField: '_id',
          as: 'mod',
        },
      },
      { $addFields: { mod: { $arrayElemAt: ['$mod', 0] } } },
      {
        $project: {
          _id: 1,
          title: '$mod.title',
          moduleType: 1,
        },
      },
      { $sort: { title: 1 } },
    ])

    res.status(200).json({ success: true, modules })
  } catch (error) {
    errorHandler(res, error)
  }
}
```

- [ ] **Step 2: Add the route**

In `../cbt/src/routes/userRoute.ts`, add the import and route:

```typescript
// Add to imports (line 13):
import {
  getMyAttempts,
  getTherapistLatest,
  getPatientModuleTimeline,
  getTherapistAttemptModules,  // ADD
} from '../controllers/attemptsController'

// Add route after line 35:
router.get('/therapist/attempts/modules', getTherapistAttemptModules)
```

- [ ] **Step 3: Commit**

```bash
cd ../cbt
git add src/controllers/attemptsController.ts src/routes/userRoute.ts
git commit -m "feat: add endpoint for therapist attempt module choices"
```

---

## Task 3: Frontend — Create feature branch and update filter constants

**Files:**
- Modify: `constants/Filters.ts`

- [ ] **Step 1: Create feature branch**

```bash
git checkout -b feat/therapist-attempts-ux
```

- [ ] **Step 2: Add `sectionHeader` to overlay tokens in `constants/Colors.ts`**

Add to the `overlay` object in `constants/Colors.ts`:

```typescript
sectionHeader: 'rgba(38,46,66,0.5)',
```

- [ ] **Step 3: Update filter types and defaults**

Replace the contents of `constants/Filters.ts`:

```typescript
export type DrawerStatusOption = 'submitted' | 'active' | 'started' | 'abandoned' | 'all';

export type SeverityOption = 'severe' | 'moderate' | 'mild';

export type SortOption = 'newest' | 'oldest' | 'severity';

export type AttemptFilterDrawerValues = {
  status?: DrawerStatusOption[];
  moduleId?: string;
  limit?: number;
  // New fields for therapist attempts screen
  patientId?: string;
  severity?: SeverityOption;
};

export const DEFAULT_FILTERS: AttemptFilterDrawerValues = {
  status: ['submitted'],
  limit: 20,
  moduleId: undefined,
  patientId: undefined,
  severity: undefined,
};

// Small helper to guarantee presence of defaults
export const withDefaults = (v?: AttemptFilterDrawerValues): AttemptFilterDrawerValues => ({
  ...DEFAULT_FILTERS,
  ...(v ?? {}),
});
```

- [ ] **Step 4: Run validation**

```bash
npm run lint
```

- [ ] **Step 5: Commit**

```bash
git add constants/Filters.ts constants/Colors.ts
git commit -m "feat: add severity and patient filter types to filter constants"
```

---

## Task 4: Frontend — Add `groupByDate` utility

**Files:**
- Modify: `utils/dates.ts` (add function)

- [ ] **Step 1: Add the `groupByDate` function**

Append to `utils/dates.ts`:

```typescript
type DateSection<T> = {
  title: string;
  data: T[];
};

export const groupByDate = <T extends { completedAt?: string }>(rows: T[]): DateSection<T>[] => {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today.getTime() - 86_400_000);
  const thisWeekStart = new Date(today.getTime() - today.getDay() * 86_400_000);
  const lastWeekStart = new Date(thisWeekStart.getTime() - 7 * 86_400_000);
  const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  const buckets = new Map<string, T[]>();

  const getKey = (dateStr?: string): string => {
    if (!dateStr) return 'Earlier';
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return 'Earlier';

    if (d >= today) return 'Today';
    if (d >= yesterday) return 'Yesterday';
    if (d >= thisWeekStart) return 'This Week';
    if (d >= lastWeekStart) return 'Last Week';
    if (d >= thisMonthStart) return 'This Month';

    // Month name + year for older entries
    return new Intl.DateTimeFormat(undefined, { month: 'long', year: 'numeric' }).format(d);
  };

  const order = rows.reduce<string[]>((acc, row) => {
    const key = getKey(row.completedAt);
    if (!buckets.has(key)) {
      buckets.set(key, []);
      acc.push(key);
    }
    buckets.get(key)!.push(row);
    return acc;
  }, []);

  return order.map((title) => ({ title, data: buckets.get(title)! }));
};
```

- [ ] **Step 2: Run validation**

```bash
npm run lint
```

- [ ] **Step 3: Commit**

```bash
git add utils/dates.ts
git commit -m "feat: add groupByDate utility for SectionList date headers"
```

---

## Task 5: Frontend — Refactor `useTherapistGetLatestAttempts` to `useInfiniteQuery` and add modules hook

**Files:**
- Modify: `hooks/useAttempts.ts:45-60`

- [ ] **Step 1: Add the response type and refactor the hook**

Replace the `useTherapistGetLatestAttempts` function (lines 45-60) in `hooks/useAttempts.ts`:

```typescript
import type { SortOption } from '@/constants/Filters';

// Add these types above the hook:
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

type TherapistLatestSelected = {
  pages: TherapistLatestPage[];
  rows: TherapistLatestRow[];
  nextCursor: string | null;
  totalCount: number;
};

export const useTherapistGetLatestAttempts = (filters: TherapistLatestFilters = {}) => {
  const isLoggedIn = useIsLoggedIn();
  const { patientId, moduleId, severity, status, sort = 'newest', limit = 20 } = filters;

  const query = useInfiniteQuery<
    TherapistLatestPage,
    AxiosError,
    TherapistLatestSelected,
    readonly ['attempts', 'therapist', 'latest', TherapistLatestFilters],
    string | null
  >({
    queryKey: ['attempts', 'therapist', 'latest', { patientId, moduleId, severity, status, sort, limit }] as const,
    initialPageParam: null,
    queryFn: async ({ pageParam }): Promise<TherapistLatestPage> => {
      const { data } = await api.get<TherapistLatestPage>(
        '/user/therapist/attempts/latest',
        {
          params: {
            patientId,
            moduleId,
            severity,
            status: Array.isArray(status) ? status.join(',') : status,
            sort,
            limit,
            cursor: pageParam ?? undefined,
          },
        }
      );
      return data;
    },
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
    select: (infinite: InfiniteData<TherapistLatestPage, string | null>): TherapistLatestSelected => ({
      pages: infinite.pages,
      rows: infinite.pages.flatMap((p) => p.rows),
      nextCursor: infinite.pages.at(-1)?.nextCursor ?? null,
      totalCount: infinite.pages[0]?.totalCount ?? 0,
    }),
    enabled: isLoggedIn,
  });

  return {
    ...query,
    rows: query.data?.rows ?? [],
    totalCount: query.data?.totalCount ?? 0,
    nextCursor: query.data?.nextCursor ?? null,
  };
};
```

- [ ] **Step 2: Add the modules hook**

Add below the refactored hook:

```typescript
type TherapistModulesResponse = {
  success: boolean;
  modules: Array<{ _id: string; title: string; moduleType: string }>;
};

export const useTherapistAttemptModules = () => {
  const isLoggedIn = useIsLoggedIn();

  return useQuery<TherapistModulesResponse>({
    queryKey: ['attempts', 'therapist', 'modules'],
    queryFn: async (): Promise<TherapistModulesResponse> => {
      const { data } = await api.get<TherapistModulesResponse>(
        '/user/therapist/attempts/modules'
      );
      return data;
    },
    enabled: isLoggedIn,
    staleTime: 1000 * 60 * 30, // 30 minutes — module list rarely changes
  });
};
```

- [ ] **Step 3: Add `SortOption` import at top of file**

Ensure the import is added at the top of `hooks/useAttempts.ts`:

```typescript
import { type SortOption } from '@/constants/Filters';
```

- [ ] **Step 4: Run validation**

```bash
npm run lint
```

- [ ] **Step 5: Commit**

```bash
git add hooks/useAttempts.ts
git commit -m "feat: refactor therapist attempts hook to useInfiniteQuery with filters"
```

---

## Task 6: Frontend — Extend `AttemptFilterDrawer` with patient, severity, and module name filters

**Files:**
- Modify: `components/ui/AttemptFilterDrawer.tsx`

**Context:** The existing drawer has Status, Module (by ID or chips), and Limit sections. We need to:
1. Add a Patient section with searchable text input + scrollable matches
2. Replace the Module section to work with the new modules endpoint data
3. Add a Severity chip row section
4. Remove the Limit section (cursor pagination replaces it)

- [ ] **Step 1: Update the props type**

Replace the existing `AttemptFilterDrawerProps` type:

```typescript
import type { SeverityOption } from '@/constants/Filters';

export type AttemptFilterDrawerProps = {
  visible: boolean;
  onDismiss: () => void;
  values: AttemptFilterDrawerValues;
  onChange: (values: AttemptFilterDrawerValues) => void;
  onApply: (values: AttemptFilterDrawerValues) => void;
  onReset?: () => void;
  moduleChoices?: { id: string; title: string }[];
  title?: string;
  // New props for therapist attempts screen
  patientChoices?: { id: string; name: string; email: string }[];
  showSeverity?: boolean;
  showPatient?: boolean;
};
```

- [ ] **Step 2: Add patient search state and filter logic**

Inside the component, after the existing `useState` calls, add:

```typescript
const [patientSearch, setPatientSearch] = useState('');

const filteredPatients = useMemo(() => {
  if (!patientChoices?.length) return [];
  if (!patientSearch.trim()) return patientChoices;
  const q = patientSearch.toLowerCase();
  return patientChoices.filter(
    (p) => p.name.toLowerCase().includes(q) || p.email.toLowerCase().includes(q)
  );
}, [patientChoices, patientSearch]);
```

Also sync `patientSearch` on drawer open — add to the existing `useEffect` that runs when `visible` changes:

```typescript
useEffect(() => {
  if (visible) {
    setLocal(values);
    setLimitText(values.limit?.toString() ?? '');
    setPatientSearch(''); // Reset patient search on open
  }
}, [visible, values]);
```

- [ ] **Step 3: Add Patient section UI**

Add before the Module section in the JSX (after the Status section):

```tsx
{/* Patient */}
{showPatient && patientChoices && (
  <View style={styles.section}>
    <ThemedText type="smallTitle" style={styles.sectionTitle}>
      Patient
    </ThemedText>
    <TextInput
      mode="outlined"
      placeholder="Search patients..."
      value={patientSearch}
      onChangeText={setPatientSearch}
      left={<TextInput.Icon icon="magnify" />}
      style={{ backgroundColor: Colors.chip.darkCard }}
    />
    <View style={styles.rowWrap}>
      <Chip
        selected={!local.patientId}
        onPress={() => setLocal((prev) => ({ ...prev, patientId: undefined }))}
        style={styles.chip}
      >
        Any
      </Chip>
      {filteredPatients.map((p) => (
        <Chip
          key={p.id}
          selected={local.patientId === p.id}
          onPress={() =>
            setLocal((prev) => ({
              ...prev,
              patientId: prev.patientId === p.id ? undefined : p.id,
            }))
          }
          style={styles.chip}
        >
          {p.name}
        </Chip>
      ))}
    </View>
  </View>
)}
```

- [ ] **Step 4: Add Severity section UI**

Add after the Module section:

```tsx
{/* Severity */}
{showSeverity && (
  <View style={styles.section}>
    <ThemedText type="smallTitle" style={styles.sectionTitle}>
      Severity
    </ThemedText>
    <View style={styles.rowWrap}>
      <Chip
        selected={!local.severity}
        onPress={() => setLocal((prev) => ({ ...prev, severity: undefined }))}
        style={styles.chip}
      >
        Any
      </Chip>
      {(['severe', 'moderate', 'mild'] as const).map((sev) => (
        <Chip
          key={sev}
          selected={local.severity === sev}
          onPress={() =>
            setLocal((prev) => ({
              ...prev,
              severity: prev.severity === sev ? undefined : sev,
            }))
          }
          style={styles.chip}
        >
          {sev.charAt(0).toUpperCase() + sev.slice(1)}
        </Chip>
      ))}
    </View>
  </View>
)}
```

- [ ] **Step 5: Update `handleApply` to skip limit clamping when limit is not shown**

The existing `handleApply` clamps limit. Since the drawer may be used without the limit section, guard it:

```typescript
const handleApply = () => {
  let next = { ...local };
  if (limitText !== undefined && local.limit !== undefined) {
    const n = parseInt(limitText, 10);
    const limitNum = clamp(Number.isFinite(n) ? n : 20, 1, 100);
    next = { ...next, limit: limitNum };
  }
  onChange(next);
  onApply(next);
  onDismiss();
};
```

- [ ] **Step 6: Update `handleReset` to clear new fields**

```typescript
const handleReset = () => {
  setLocal(DEFAULT_FILTERS);
  setPatientSearch('');
  onChange(DEFAULT_FILTERS);
  onReset?.();
};
```

- [ ] **Step 7: Run validation**

```bash
npm run lint
```

- [ ] **Step 8: Commit**

```bash
git add components/ui/AttemptFilterDrawer.tsx
git commit -m "feat: extend filter drawer with patient search, severity, and module name filters"
```

---

## Task 7: Frontend — Rebuild `TherapistLatestAttempts` with SectionList, sort, filters, and visual polish

**Files:**
- Modify: `components/attempts/TherapistLatestAttempts.tsx`

**Context:** This is the main refactor. The component currently uses a simple `FlatList` with no filters. We're replacing it with a `SectionList`, adding a header with subtitle count, sort chips, active filter chips, and wiring up the filter drawer.

- [ ] **Step 1: Add imports**

Update the imports at the top of the file:

```typescript
import { type ComponentProps, memo, useCallback, useMemo, useState } from 'react';
import {
  Pressable,
  RefreshControl,
  SectionList,
  type SectionListRenderItemInfo,
  View,
} from 'react-native';
import { Chip, IconButton } from 'react-native-paper';
import { Link } from 'expo-router';
import { Colors } from '@/constants/Colors';
import {
  type AttemptFilterDrawerValues,
  DEFAULT_FILTERS,
  type SortOption,
} from '@/constants/Filters';
import { useTherapistAttemptModules, useTherapistGetLatestAttempts } from '@/hooks/useAttempts';
import { useClients } from '@/hooks/useUsers';
import { groupByDate, timeAgo } from '@/utils/dates';
import { getSeverityColors } from '@/utils/severity';
import type { TherapistLatestRow } from '@milobedini/shared-types';
import MaterialCommunityIcons from '@react-native-vector-icons/material-design-icons';

import ContentContainer from '../ContentContainer';
import ErrorComponent, { ErrorTypes } from '../ErrorComponent';
import { LoadingIndicator } from '../LoadingScreen';
import { ThemedText } from '../ThemedText';
import { AttemptFilterDrawer } from '../ui/AttemptFilterDrawer';
import EmptyState from '../ui/EmptyState';
```

- [ ] **Step 2: Keep `MODULE_TYPE_ICONS`, `getModuleIcon`, and `ItemSeparator` unchanged**

These stay exactly as they are.

- [ ] **Step 3: Apply visual polish to `TherapistAttemptListItemBase`**

Make three changes inside the existing component:

a) Change `gap-2` to `gap-3` in the card content View:
```tsx
// Change:
<View className="flex-1 gap-2 p-4">
// To:
<View className="flex-1 gap-3 p-4">
```

b) Add `minWidth: 40` to the score pill:
```tsx
// Change:
<View className="rounded-lg px-3 py-1" style={{ backgroundColor: severity.pillBg }}>
// To:
<View className="rounded-lg px-3 py-1" style={{ backgroundColor: severity.pillBg, minWidth: 40, alignItems: 'center' }}>
```

c) Show relative time only (remove absolute date from card):
```tsx
// Change:
<ThemedText type="small" className="text-xs text-sway-darkGrey">
  {relative ? `${relative} · ${formatted}` : formatted}
</ThemedText>
// To:
<ThemedText type="small" className="text-xs text-sway-darkGrey">
  {relative ?? formatted}
</ThemedText>
```

- [ ] **Step 4: Add sort chips component**

Add above `TherapistLatestAttempts`:

```typescript
const SORT_OPTIONS: { value: SortOption; label: string }[] = [
  { value: 'newest', label: 'Newest' },
  { value: 'oldest', label: 'Oldest' },
  { value: 'severity', label: 'Severity' },
];

const SortChips = memo(({ value, onChange }: { value: SortOption; onChange: (s: SortOption) => void }) => (
  <View className="flex-row items-center gap-2 px-4 py-2">
    <ThemedText type="small" className="text-xs uppercase tracking-wide text-sway-darkGrey">
      Sort:
    </ThemedText>
    {SORT_OPTIONS.map((opt) => (
      <Chip
        key={opt.value}
        selected={value === opt.value}
        onPress={() => onChange(opt.value)}
        compact
        style={{
          backgroundColor: value === opt.value ? Colors.tint.teal : 'transparent',
          borderColor: value === opt.value ? Colors.sway.bright : Colors.chip.darkCardAlt,
          borderWidth: 1,
        }}
        textStyle={{
          color: value === opt.value ? Colors.sway.bright : Colors.sway.darkGrey,
          fontSize: 13,
        }}
      >
        {opt.label}
      </Chip>
    ))}
  </View>
));
```

- [ ] **Step 5: Add active filter chips component**

```typescript
const ActiveFilterChips = memo(
  ({
    filters,
    patientName,
    moduleName,
    onClear,
    onClearAll,
  }: {
    filters: AttemptFilterDrawerValues;
    patientName?: string;
    moduleName?: string;
    onClear: (key: keyof AttemptFilterDrawerValues) => void;
    onClearAll: () => void;
  }) => {
    const chips: { key: keyof AttemptFilterDrawerValues; label: string }[] = [];

    if (filters.patientId && patientName) {
      chips.push({ key: 'patientId', label: `Patient: ${patientName}` });
    }
    if (filters.moduleId && moduleName) {
      chips.push({ key: 'moduleId', label: `Module: ${moduleName}` });
    }
    if (filters.severity) {
      chips.push({
        key: 'severity',
        label: `Severity: ${filters.severity.charAt(0).toUpperCase() + filters.severity.slice(1)}`,
      });
    }
    if (
      filters.status &&
      !(filters.status.length === 1 && filters.status[0] === 'submitted')
    ) {
      chips.push({ key: 'status', label: `Status: ${filters.status.join(', ')}` });
    }

    if (chips.length === 0) return null;

    return (
      <View className="flex-row flex-wrap items-center gap-1.5 px-4 pb-2">
        {chips.map((c) => (
          <Pressable
            key={c.key}
            onPress={() => onClear(c.key)}
            className="flex-row items-center gap-1 rounded-full px-2.5 py-1"
            style={{ backgroundColor: Colors.tint.teal }}
          >
            <ThemedText style={{ fontSize: 12, color: Colors.sway.bright }}>{c.label}</ThemedText>
            <ThemedText style={{ fontSize: 12, color: Colors.sway.bright, opacity: 0.6 }}>✕</ThemedText>
          </Pressable>
        ))}
        {chips.length >= 2 && (
          <Pressable onPress={onClearAll}>
            <ThemedText style={{ fontSize: 12, color: Colors.sway.darkGrey, marginLeft: 4 }}>
              Clear all
            </ThemedText>
          </Pressable>
        )}
      </View>
    );
  }
);
```

- [ ] **Step 6: Add section header component**

```typescript
const SectionHeader = memo(({ title }: { title: string }) => (
  <View
    className="border-b px-4 py-2"
    style={{
      backgroundColor: Colors.overlay.sectionHeader,
      borderBottomColor: Colors.chip.darkCardAlt,
    }}
  >
    <ThemedText type="smallBold" className="text-xs uppercase tracking-wide text-sway-darkGrey">
      {title}
    </ThemedText>
  </View>
));
```

- [ ] **Step 7: Rebuild the main `TherapistLatestAttempts` component**

Replace the entire `TherapistLatestAttempts` component:

```typescript
const TherapistLatestAttempts = () => {
  const [sort, setSort] = useState<SortOption>('newest');
  const [filters, setFilters] = useState<AttemptFilterDrawerValues>(DEFAULT_FILTERS);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const {
    rows,
    totalCount,
    isPending,
    isError,
    isRefetching,
    refetch,
    hasNextPage,
    fetchNextPage,
    isFetchingNextPage,
  } = useTherapistGetLatestAttempts({
    ...filters,
    sort,
    status: filters.status?.join(','),
  });

  const { data: clientsData } = useClients();
  const { data: modulesData } = useTherapistAttemptModules();

  const patientChoices = useMemo(
    () =>
      clientsData?.patients?.map((p) => ({
        id: p._id,
        name: p.name || p.username,
        email: p.email,
      })) ?? [],
    [clientsData]
  );

  const moduleChoices = useMemo(
    () => modulesData?.modules?.map((m) => ({ id: m._id, title: m.title })) ?? [],
    [modulesData]
  );

  const sections = useMemo(() => groupByDate(rows), [rows]);

  const selectedPatientName = useMemo(
    () => patientChoices.find((p) => p.id === filters.patientId)?.name,
    [patientChoices, filters.patientId]
  );

  const selectedModuleName = useMemo(
    () => moduleChoices.find((m) => m.id === filters.moduleId)?.title,
    [moduleChoices, filters.moduleId]
  );

  const handleClearFilter = useCallback(
    (key: keyof AttemptFilterDrawerValues) => {
      setFilters((prev) => ({
        ...prev,
        [key]: key === 'status' ? DEFAULT_FILTERS.status : undefined,
      }));
    },
    []
  );

  const handleClearAll = useCallback(() => setFilters(DEFAULT_FILTERS), []);

  const renderItem = useCallback(
    ({ item }: SectionListRenderItemInfo<TherapistLatestRow>) => (
      <TherapistAttemptListItem item={item} />
    ),
    []
  );

  const renderSectionHeader = useCallback(
    ({ section: { title } }: { section: { title: string } }) => (
      <SectionHeader title={title} />
    ),
    []
  );

  const handleEndReached = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage) fetchNextPage();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  if (isPending) return <LoadingIndicator marginBottom={0} />;
  if (isError) return <ErrorComponent errorType={ErrorTypes.GENERAL_ERROR} />;

  return (
    <ContentContainer padded={false}>
      {/* Header */}
      <View className="flex-row items-start justify-between px-4 pt-4">
        <View>
          <ThemedText type="title">Attempts</ThemedText>
          <ThemedText type="small" className="text-sway-darkGrey">
            {totalCount} {totalCount === 1 ? 'submission' : 'submissions'}
          </ThemedText>
        </View>
        <IconButton
          icon="filter-variant"
          iconColor={Colors.sway.lightGrey}
          onPress={() => setDrawerOpen(true)}
          style={{ backgroundColor: Colors.sway.buttonBackgroundSolid }}
        />
      </View>

      {/* Sort chips */}
      <SortChips value={sort} onChange={setSort} />

      {/* Active filter chips */}
      <ActiveFilterChips
        filters={filters}
        patientName={selectedPatientName}
        moduleName={selectedModuleName}
        onClear={handleClearFilter}
        onClearAll={handleClearAll}
      />

      {/* List */}
      {sections.length > 0 ? (
        <SectionList
          sections={sections}
          keyExtractor={(item) => item._id}
          renderItem={renderItem}
          renderSectionHeader={renderSectionHeader}
          ItemSeparatorComponent={ItemSeparator}
          stickySectionHeadersEnabled
          contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 16 }}
          refreshControl={
            <RefreshControl
              refreshing={isRefetching && !isFetchingNextPage}
              onRefresh={refetch}
              tintColor={Colors.sway.bright}
            />
          }
          onEndReached={handleEndReached}
          onEndReachedThreshold={0.3}
        />
      ) : (
        <EmptyState
          icon="clipboard-text-outline"
          title="No submissions yet"
          subtitle="Completed work from your patients will appear here"
        />
      )}

      {/* Filter drawer */}
      <AttemptFilterDrawer
        visible={drawerOpen}
        onDismiss={() => setDrawerOpen(false)}
        values={filters}
        onChange={setFilters}
        onApply={(v) => {
          setFilters(v);
          setDrawerOpen(false);
        }}
        onReset={() => setFilters(DEFAULT_FILTERS)}
        title="Filter Attempts"
        moduleChoices={moduleChoices}
        patientChoices={patientChoices}
        showSeverity
        showPatient
      />
    </ContentContainer>
  );
};

export default TherapistLatestAttempts;
```

- [ ] **Step 8: Run validation**

```bash
npm run lint
```

- [ ] **Step 9: Commit**

```bash
git add components/attempts/TherapistLatestAttempts.tsx
git commit -m "feat: rebuild therapist attempts with SectionList, sort, filters, and visual polish"
```

---

## Task 8: Frontend — Verify empty state and loading states

**Files:** No new files — verification only

- [ ] **Step 1: Verify empty state with filters**

The empty state should show when `!isFetchingNextPage && sections.length === 0`. This is already handled in the component above. Confirm the guard works: when filters exclude all results, the empty state should render (not a blank screen).

- [ ] **Step 2: Verify pull-to-refresh**

The `RefreshControl` is wired to `refetch` and `isRefetching && !isFetchingNextPage`. Pull down on the list — the teal spinner should appear, and the list should refresh with the current filters applied.

- [ ] **Step 3: Verify infinite scroll**

Scroll to the bottom of the list. If `hasNextPage` is true, `fetchNextPage` should fire. New rows should merge into existing date sections without scroll jumps (because `groupByDate` recomputes from all loaded rows).

- [ ] **Step 4: Run full validation**

```bash
npm run lint
```

- [ ] **Step 5: Commit any fixes if needed**

```bash
git add components/attempts/TherapistLatestAttempts.tsx
git commit -m "fix: address loading state edge cases in therapist attempts"
```

---

## Task 9: Format, validate, and final commit

**Files:** All modified files

- [ ] **Step 1: Format all files**

```bash
npx prettier --write .
```

- [ ] **Step 2: Run full validation**

```bash
npm run lint
```

- [ ] **Step 3: Fix any issues found and re-run validation**

- [ ] **Step 4: Final commit if formatting changed anything**

```bash
git add -A
git commit -m "chore: format and lint cleanup"
```
