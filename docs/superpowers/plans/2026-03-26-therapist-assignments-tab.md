# Therapist Assignments Tab Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Redesign the therapist Assignments tab from a basic flat list into a patient-grouped, sortable, filterable command centre with collapsible sections, urgency indicators, and inline edit capabilities.

**Architecture:** Hybrid approach — reuse the SectionList/sort/filter architecture from the Submissions tab (`TherapistLatestAttempts.tsx`) but with patient-grouped collapsible sections instead of date-grouped sections. BE returns a flat, pre-sorted list; FE groups adjacent items into patient sections. New `useInfiniteQuery` hook with filter/sort params. Edit assignment via a Modal with existing `DueDateField`, `RecurrenceField` components.

**Tech Stack:** React Native, NativeWind, react-native-paper, react-native-reanimated, TanStack React Query, Moti, Axios, Mongoose (BE)

**Spec:** `docs/superpowers/specs/2026-03-26-therapist-assignments-tab-design.md`

---

## File Map

**Backend (../cbt/):**
- Modify: `src/controllers/assignmentsController.ts` — rewrite `listAssignmentsForTherapist`, extend `updateAssignmentStatus`
- Modify: `src/routes/assignmentsRoute.ts` — add PATCH route for general update

**Shared Types (../cbt/ shared-types package):**
- Modify: types file — add `attemptCount` to `MyAssignmentView`, add `UpdateAssignmentInput`, add `TherapistAssignmentsResponse`, add `TherapistAssignmentFilters`

**Frontend (bwell/):**
- Create: `components/assignments/PatientGroupHeader.tsx` — collapsible patient section header
- Create: `components/assignments/AssignmentCard.tsx` — individual assignment card with urgency accent
- Create: `components/assignments/AssignmentFilterDrawer.tsx` — filter drawer (patient, module, status, urgency)
- Create: `components/assignments/EditAssignmentModal.tsx` — modal for editing due date, notes, recurrence
- Modify: `hooks/useAssignments.ts` — add `useTherapistAssignments` (infinite query), `useUpdateAssignment` (mutation)
- Modify: `components/assignments/TherapistActiveAssignments.tsx` — rewrite to use new hook, manage sort/filter/collapse state
- Modify: `components/assignments/AssignmentsListTherapist.tsx` — rewrite with SectionList, sort chips, filter integration, collapsible sections

---

### Task 1: BE — Extend shared types

**Files:**
- Modify: `../cbt/` shared-types package — the types definition file containing `MyAssignmentView`

- [ ] **Step 1: Add `attemptCount` to `MyAssignmentView`**

In the shared-types package, add `attemptCount?: number` to `MyAssignmentView`:

```typescript
// Add to MyAssignmentView interface
attemptCount?: number
```

- [ ] **Step 2: Add `UpdateAssignmentInput` type**

```typescript
export type UpdateAssignmentInput = {
  status?: AssignmentStatus
  dueAt?: string
  notes?: string
  recurrence?: AssignmentRecurrence
}
```

- [ ] **Step 3: Add `TherapistAssignmentsResponse` type**

```typescript
export type TherapistAssignmentsResponse = {
  success: boolean
  items: MyAssignmentView[]
  page: number
  totalPages: number
  totalItems: number
}
```

- [ ] **Step 4: Add `TherapistAssignmentFilters` type**

```typescript
export type AssignmentSortOption = 'urgency' | 'newest' | 'oldest' | 'module'
export type AssignmentUrgencyFilter = 'overdue' | 'due_soon' | 'on_track' | 'no_due_date'

export type TherapistAssignmentFilters = {
  patientId?: string
  moduleId?: string
  status?: string  // 'assigned' | 'in_progress'
  urgency?: AssignmentUrgencyFilter
  sortBy?: AssignmentSortOption
  page?: number
  limit?: number
}
```

- [ ] **Step 5: Publish shared types**

```bash
cd ../cbt
# Update version, build, and publish
npm run publish-types
```

- [ ] **Step 6: Update FE types**

```bash
cd /Users/milobedini/Documents/git/bwell
npm run update-types
```

- [ ] **Step 7: Commit**

```bash
cd ../cbt
git add -A && git commit -m "feat: add therapist assignment filter/sort types and attemptCount"
```

---

### Task 2: BE — Rewrite `listAssignmentsForTherapist` with filters, sorting, pagination, and attempt data

**Files:**
- Modify: `../cbt/src/controllers/assignmentsController.ts`

- [ ] **Step 1: Rewrite `listAssignmentsForTherapist`**

Replace the existing function with the following. The key changes: accept query params for filtering/sorting/pagination, populate `latestAttempt`, compute `attemptCount` via aggregation, sort by patient groups with urgency-based ordering.

```typescript
export const listAssignmentsForTherapist = async (
  req: Request,
  res: Response
) => {
  try {
    const therapistId = req.user?._id as Types.ObjectId

    const {
      patientId,
      moduleId,
      status,
      urgency,
      sortBy = 'urgency',
      page = '1',
      limit = '20',
    } = req.query as {
      patientId?: string
      moduleId?: string
      status?: string
      urgency?: string
      sortBy?: string
      page?: string
      limit?: string
    }

    const pageNum = Math.max(1, parseInt(page, 10) || 1)
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 20))

    // Build filter
    const filter: Record<string, unknown> = {
      therapist: therapistId,
      status: { $in: ['assigned', 'in_progress'] },
    }

    if (patientId) filter.user = new Types.ObjectId(patientId)
    if (moduleId) filter.module = new Types.ObjectId(moduleId)
    if (status) {
      const validStatuses = status.split(',').filter((s) =>
        ['assigned', 'in_progress'].includes(s)
      )
      if (validStatuses.length) filter.status = { $in: validStatuses }
    }

    // Urgency filter
    const now = new Date()
    const in48h = new Date(now.getTime() + 48 * 60 * 60 * 1000)
    if (urgency === 'overdue') {
      filter.dueAt = { $lt: now }
    } else if (urgency === 'due_soon') {
      filter.dueAt = { $gte: now, $lte: in48h }
    } else if (urgency === 'on_track') {
      filter.dueAt = { $gt: in48h }
    } else if (urgency === 'no_due_date') {
      filter.dueAt = { $exists: false }
    }

    // Count total for pagination
    const totalItems = await ModuleAssignment.countDocuments(filter)
    const totalPages = Math.ceil(totalItems / limitNum) || 1

    // Fetch assignments
    let query = ModuleAssignment.find(filter)
      .populate('user', '_id username email name')
      .populate('module', '_id title type')
      .populate('program', '_id title')
      .populate('latestAttempt', '_id status completedAt totalScore scoreBandLabel')
      .lean()

    // Sort — all sorts keep patient assignments adjacent
    // We fetch all matching, sort in memory for patient grouping, then paginate
    const items = await query

    // Compute attemptCount for each assignment via user+module
    const userModulePairs = items.map((a) => ({
      user: a.user._id || a.user,
      module: a.module._id || a.module,
    }))

    // Batch count attempts
    const attemptCounts = await ModuleAttempt.aggregate([
      {
        $match: {
          $or: userModulePairs.map((p) => ({
            user: new Types.ObjectId(String(p.user)),
            module: new Types.ObjectId(String(p.module)),
          })),
        },
      },
      {
        $group: {
          _id: { user: '$user', module: '$module' },
          count: { $sum: 1 },
        },
      },
    ])

    const countMap = new Map<string, number>()
    for (const ac of attemptCounts) {
      countMap.set(`${ac._id.user}_${ac._id.module}`, ac.count)
    }

    const enriched = items.map((asg) => {
      const userId = String((asg.user as any)._id || asg.user)
      const moduleId = String((asg.module as any)._id || asg.module)
      const attemptCount = countMap.get(`${userId}_${moduleId}`) ?? 0
      return { ...asg, attemptCount }
    })

    // Sort with patient grouping
    const getUrgencyWeight = (a: typeof enriched[0]) => {
      if (!a.dueAt) return 3 // no due date = lowest urgency
      const diff = new Date(a.dueAt).getTime() - now.getTime()
      if (diff < 0) return 0 // overdue
      if (diff <= 48 * 60 * 60 * 1000) return 1 // due soon
      return 2 // on track
    }

    // Group by patient
    const patientGroups = new Map<string, typeof enriched>()
    for (const asg of enriched) {
      const pid = String((asg.user as any)._id || asg.user)
      const group = patientGroups.get(pid) ?? []
      group.push(asg)
      patientGroups.set(pid, group)
    }

    // Sort within each patient group
    for (const [, group] of patientGroups) {
      group.sort((a, b) => {
        if (sortBy === 'urgency') return getUrgencyWeight(a) - getUrgencyWeight(b)
        if (sortBy === 'newest')
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        if (sortBy === 'oldest')
          return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
        if (sortBy === 'module') {
          const aTitle = (a.module as any).title || ''
          const bTitle = (b.module as any).title || ''
          return aTitle.localeCompare(bTitle)
        }
        return 0
      })
    }

    // Sort patient groups by their representative assignment
    const groupEntries = Array.from(patientGroups.entries())
    groupEntries.sort(([, aGroup], [, bGroup]) => {
      const aRep = aGroup[0]
      const bRep = bGroup[0]
      if (sortBy === 'urgency') return getUrgencyWeight(aRep) - getUrgencyWeight(bRep)
      if (sortBy === 'newest')
        return new Date(bRep.createdAt).getTime() - new Date(aRep.createdAt).getTime()
      if (sortBy === 'oldest')
        return new Date(aRep.createdAt).getTime() - new Date(bRep.createdAt).getTime()
      if (sortBy === 'module') {
        const aName = (aRep.user as any).name || (aRep.user as any).username || ''
        const bName = (bRep.user as any).name || (bRep.user as any).username || ''
        return aName.localeCompare(bName)
      }
      return 0
    })

    // Flatten back to a single sorted list (patient-adjacent)
    const sorted = groupEntries.flatMap(([, group]) => group)

    // Paginate
    const start = (pageNum - 1) * limitNum
    const paged = sorted.slice(start, start + limitNum)

    res.status(200).json({
      success: true,
      items: paged,
      page: pageNum,
      totalPages,
      totalItems,
    })
  } catch (error) {
    errorHandler(res, error)
  }
}
```

- [ ] **Step 2: Add `ModuleAttempt` import**

Add to the top of `assignmentsController.ts`:

```typescript
import ModuleAttempt from '../models/moduleAttemptModel'
```

- [ ] **Step 3: Extend `updateAssignmentStatus` to accept additional fields**

Update the existing function to handle `dueAt`, `notes`, and `recurrence` in addition to `status`:

```typescript
export const updateAssignment = async (req: Request, res: Response) => {
  try {
    const therapistId = req.user?._id as Types.ObjectId
    const { assignmentId } = req.params
    const { status, dueAt, notes, recurrence } = req.body

    // Validate status if provided
    if (
      status &&
      !VALID_ASSIGNMENT_STATUSES.includes(
        status as (typeof VALID_ASSIGNMENT_STATUSES)[number]
      )
    ) {
      res.status(400).json({
        success: false,
        message: `status must be one of: ${VALID_ASSIGNMENT_STATUSES.join(', ')}`,
      })
      return
    }

    const update: Record<string, unknown> = {}
    if (status) update.status = status
    if (dueAt !== undefined) update.dueAt = dueAt ? new Date(dueAt) : null
    if (notes !== undefined) update.notes = notes
    if (recurrence !== undefined) update.recurrence = recurrence

    if (Object.keys(update).length === 0) {
      res.status(400).json({ success: false, message: 'No fields to update' })
      return
    }

    const asg = await ModuleAssignment.findOneAndUpdate(
      { _id: assignmentId, therapist: therapistId },
      update,
      { new: true }
    )
    if (!asg) {
      res.status(404).json({ success: false, message: 'Assignment not found' })
      return
    }
    res.status(200).json({ success: true, assignment: asg })
  } catch (error) {
    errorHandler(res, error)
  }
}
```

- [ ] **Step 4: Update route**

In `src/routes/assignmentsRoute.ts`, rename the import and update the route:

```typescript
import {
  createAssignment,
  listAssignmentsForTherapist,
  removeAssignment,
  updateAssignment,  // renamed from updateAssignmentStatus
} from '../controllers/assignmentsController'

// Change the PATCH route — keep both old and new for backwards compat
router.patch('/:assignmentId', authorizeTherapistOrAdmin, updateAssignment)
router.patch('/:assignmentId/status', authorizeTherapistOrAdmin, updateAssignment)
```

- [ ] **Step 5: Test BE manually**

```bash
cd ../cbt && npm run dev
```

Test the updated endpoint with curl or Postman:
- `GET /api/assignments/mine?sortBy=urgency&page=1&limit=20` — should return paginated, patient-grouped results with `attemptCount` and `latestAttempt`
- `PATCH /api/assignments/:id` with `{ "notes": "updated note" }` — should update the notes field

- [ ] **Step 6: Commit**

```bash
cd ../cbt
git add src/controllers/assignmentsController.ts src/routes/assignmentsRoute.ts
git commit -m "feat: add filters, sorting, pagination, and attemptCount to therapist assignments endpoint"
```

---

### Task 3: FE — Add `useTherapistAssignments` hook and `useUpdateAssignment` mutation

**Files:**
- Modify: `hooks/useAssignments.ts`

- [ ] **Step 1: Add assignment filter types and `useTherapistAssignments` hook**

Add to `hooks/useAssignments.ts`:

```typescript
import type {
  // ... existing imports ...
  TherapistAssignmentsResponse,
  TherapistAssignmentFilters,
  UpdateAssignmentInput,
} from '@milobedini/shared-types';
import { type InfiniteData, keepPreviousData, useInfiniteQuery, useQuery, useQueryClient } from '@tanstack/react-query';
```

Then add the hook:

```typescript
type TherapistAssignmentsSelected = {
  pages: TherapistAssignmentsResponse[];
  items: MyAssignmentView[];
  totalItems: number;
};

export const useTherapistAssignments = (filters: TherapistAssignmentFilters = {}) => {
  const isLoggedIn = useIsLoggedIn();
  const {
    patientId,
    moduleId,
    status,
    urgency,
    sortBy = 'urgency',
    limit = 20,
  } = filters;

  const query = useInfiniteQuery<
    TherapistAssignmentsResponse,
    AxiosError,
    TherapistAssignmentsSelected,
    readonly ['assignments', 'therapist', TherapistAssignmentFilters],
    number
  >({
    queryKey: ['assignments', 'therapist', { patientId, moduleId, status, urgency, sortBy, limit }] as const,
    initialPageParam: 1,
    queryFn: async ({ pageParam }): Promise<TherapistAssignmentsResponse> => {
      const { data } = await api.get<TherapistAssignmentsResponse>('/assignments/mine', {
        params: {
          patientId,
          moduleId,
          status,
          urgency,
          sortBy,
          limit,
          page: pageParam,
        },
      });
      return data;
    },
    getNextPageParam: (lastPage) =>
      lastPage.page < lastPage.totalPages ? lastPage.page + 1 : undefined,
    select: (infinite: InfiniteData<TherapistAssignmentsResponse, number>): TherapistAssignmentsSelected => ({
      pages: infinite.pages,
      items: infinite.pages.flatMap((p) => p.items),
      totalItems: infinite.pages[0]?.totalItems ?? 0,
    }),
    placeholderData: keepPreviousData,
    enabled: isLoggedIn,
  });

  return {
    ...query,
    items: query.data?.items ?? [],
    totalItems: query.data?.totalItems ?? 0,
  };
};
```

- [ ] **Step 2: Add `useUpdateAssignment` mutation**

```typescript
export const useUpdateAssignment = () => {
  const queryClient = useQueryClient();

  return useMutationWithToast<
    { success: boolean; assignment: MyAssignmentView },
    AxiosError,
    { assignmentId: string; updates: UpdateAssignmentInput }
  >({
    mutationFn: async ({ assignmentId, updates }) => {
      const { data } = await api.patch(`assignments/${assignmentId}`, updates);
      return data;
    },
    toast: {
      pending: 'Updating assignment...',
      success: 'Assignment updated',
      error: 'Failed to update assignment',
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assignments'] });
      queryClient.invalidateQueries({ queryKey: ['clients'] });
    },
  });
};
```

- [ ] **Step 3: Verify types compile**

```bash
npx tsc --noEmit
```

- [ ] **Step 4: Commit**

```bash
git add hooks/useAssignments.ts
git commit -m "feat: add useTherapistAssignments hook and useUpdateAssignment mutation"
```

---

### Task 4: FE — Create `PatientGroupHeader` component

**Files:**
- Create: `components/assignments/PatientGroupHeader.tsx`

- [ ] **Step 1: Create the collapsible patient section header**

```typescript
import { memo, useCallback } from 'react';
import { Pressable, View } from 'react-native';
import Animated, { useAnimatedStyle, withTiming } from 'react-native-reanimated';
import { Colors } from '@/constants/Colors';
import MaterialCommunityIcons from '@react-native-vector-icons/material-design-icons';

import { ThemedText } from '../ThemedText';

type PatientGroupHeaderProps = {
  patientName: string;
  assignmentCount: number;
  overdueCount: number;
  isExpanded: boolean;
  onToggle: () => void;
};

const PatientGroupHeaderBase = ({
  patientName,
  assignmentCount,
  overdueCount,
  isExpanded,
  onToggle,
}: PatientGroupHeaderProps) => {
  const chevronStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: withTiming(isExpanded ? '0deg' : '-90deg', { duration: 200 }) }],
  }));

  return (
    <Pressable
      onPress={onToggle}
      className="flex-row items-center justify-between rounded-t-xl px-4 py-3 active:opacity-80"
      style={{ backgroundColor: Colors.chip.darkCard }}
    >
      <View className="flex-1 flex-row items-center gap-2.5">
        <ThemedText type="smallTitle" numberOfLines={1} className="flex-shrink">
          {patientName}
        </ThemedText>

        <View className="rounded-full px-2.5 py-0.5" style={{ backgroundColor: Colors.chip.pill }}>
          <ThemedText type="small" style={{ color: Colors.sway.darkGrey, fontSize: 12 }}>
            {assignmentCount} active
          </ThemedText>
        </View>

        {overdueCount > 0 && (
          <View
            className="rounded-full border px-2.5 py-0.5"
            style={{
              backgroundColor: Colors.tint.error,
              borderColor: Colors.tint.errorBorder,
            }}
          >
            <ThemedText type="small" style={{ color: Colors.primary.error, fontSize: 12 }}>
              {overdueCount} overdue
            </ThemedText>
          </View>
        )}
      </View>

      <Animated.View style={chevronStyle}>
        <MaterialCommunityIcons name="chevron-down" size={20} color={Colors.sway.darkGrey} />
      </Animated.View>
    </Pressable>
  );
};

const PatientGroupHeader = memo(PatientGroupHeaderBase);
export default PatientGroupHeader;
export type { PatientGroupHeaderProps };
```

- [ ] **Step 2: Verify types compile**

```bash
npx tsc --noEmit
```

- [ ] **Step 3: Commit**

```bash
git add components/assignments/PatientGroupHeader.tsx
git commit -m "feat: add PatientGroupHeader component with collapsible sections"
```

---

### Task 5: FE — Create `AssignmentCard` component

**Files:**
- Create: `components/assignments/AssignmentCard.tsx`

- [ ] **Step 1: Create the assignment card with urgency accent border**

```typescript
import { type ComponentProps, memo, useCallback } from 'react';
import { Pressable, TouchableOpacity, View } from 'react-native';
import { Link } from 'expo-router';
import { Colors } from '@/constants/Colors';
import { dateString } from '@/utils/dates';
import type { MyAssignmentView } from '@milobedini/shared-types';
import MaterialCommunityIcons from '@react-native-vector-icons/material-design-icons';

import { ThemedText } from '../ThemedText';
import { DueChip, RecurrenceChip, TimeLeftChip } from '../ui/Chip';

type MCIName = ComponentProps<typeof MaterialCommunityIcons>['name'];

const MODULE_TYPE_ICONS: Record<string, MCIName> = {
  questionnaire: 'clipboard-text-outline',
  activity_diary: 'calendar-week',
  psychoeducation: 'book-open-outline',
  exercise: 'pencil-outline',
};

const getModuleIcon = (moduleType?: string): MCIName =>
  (moduleType && MODULE_TYPE_ICONS[moduleType]) || 'file-document-outline';

const getUrgencyColor = (dueAt?: string): string => {
  if (!dueAt) return Colors.sway.darkGrey;
  const diff = new Date(dueAt).getTime() - Date.now();
  if (diff < 0) return Colors.primary.error;
  if (diff <= 48 * 60 * 60 * 1000) return Colors.primary.warning;
  return Colors.sway.bright;
};

const getAttemptStatusLabel = (
  latestAttempt?: MyAssignmentView['latestAttempt']
): { label: string; bg: string; color: string } => {
  if (!latestAttempt)
    return { label: 'Not started', bg: Colors.tint.neutral, color: Colors.sway.darkGrey };
  if (latestAttempt.completedAt)
    return { label: 'Submitted', bg: Colors.chip.green, color: Colors.chip.greenBorder };
  return { label: 'In progress', bg: Colors.tint.teal, color: Colors.sway.bright };
};

type AssignmentCardProps = {
  item: MyAssignmentView;
  onOpenMenu: (id: string) => void;
};

const AssignmentCardBase = ({ item, onOpenMenu }: AssignmentCardProps) => {
  const urgencyColor = getUrgencyColor(item.dueAt);
  const icon = getModuleIcon(item.module.type);
  const attemptStatus = getAttemptStatusLabel(item.latestAttempt);
  const handleMenu = useCallback(() => onOpenMenu(item._id), [onOpenMenu, item._id]);

  const cardContent = (
    <View className="flex-row">
      {/* Urgency accent border */}
      <View className="w-1 rounded-l-lg" style={{ backgroundColor: urgencyColor }} />

      <View className="flex-1 gap-2 p-3">
        {/* Row 1: Icon + Title + Iteration + Dots */}
        <View className="flex-row items-center justify-between">
          <View className="flex-1 flex-row items-center gap-2">
            <MaterialCommunityIcons name={icon} size={18} color={Colors.sway.darkGrey} />
            <ThemedText type="smallTitle" numberOfLines={1} className="flex-shrink">
              {item.module.title}
            </ThemedText>
            {!!item.attemptCount && item.attemptCount > 1 && (
              <View
                className="rounded-full border px-2 py-0.5"
                style={{ borderColor: Colors.chip.neutralBorder }}
              >
                <ThemedText type="small" style={{ color: Colors.sway.darkGrey, fontSize: 11 }}>
                  #{item.attemptCount}
                </ThemedText>
              </View>
            )}
          </View>
          <TouchableOpacity
            onPress={handleMenu}
            className="h-8 w-8 items-center justify-center rounded-lg active:opacity-70"
            style={{ backgroundColor: Colors.chip.darkCardAlt }}
            hitSlop={8}
          >
            <MaterialCommunityIcons name="dots-vertical" size={16} color={Colors.sway.darkGrey} />
          </TouchableOpacity>
        </View>

        {/* Row 2: Chips */}
        <View className="flex-row flex-wrap gap-1.5">
          <DueChip dueAt={item.dueAt} />
          {item.dueAt && <TimeLeftChip dueAt={item.dueAt} />}
          {item.recurrence && <RecurrenceChip recurrence={item.recurrence} />}
          <View className="rounded-full px-2.5 py-0.5" style={{ backgroundColor: attemptStatus.bg }}>
            <ThemedText type="small" style={{ color: attemptStatus.color, fontSize: 11 }}>
              {attemptStatus.label}
            </ThemedText>
          </View>
        </View>

        {/* Row 3: Notes preview */}
        {item.notes && (
          <ThemedText
            type="italic"
            numberOfLines={1}
            style={{ color: Colors.sway.darkGrey, fontSize: 13 }}
          >
            &quot;{item.notes}&quot;
          </ThemedText>
        )}
      </View>
    </View>
  );

  // If there's a latest attempt, wrap in a Link to navigate to it
  if (item.latestAttempt?._id) {
    return (
      <Link
        asChild
        href={{
          pathname: '/attempts/[id]',
          params: {
            id: item.latestAttempt._id,
            headerTitle: `${item.module.title} (${dateString(item.latestAttempt.completedAt || '')})`,
          },
        }}
        push
        withAnchor
      >
        <Pressable
          className="mx-3 mb-2 overflow-hidden rounded-lg active:opacity-80"
          style={{ backgroundColor: Colors.chip.pill }}
        >
          {cardContent}
        </Pressable>
      </Link>
    );
  }

  return (
    <View
      className="mx-3 mb-2 overflow-hidden rounded-lg"
      style={{ backgroundColor: Colors.chip.pill }}
    >
      {cardContent}
    </View>
  );
};

const AssignmentCard = memo(AssignmentCardBase);
export default AssignmentCard;
export { getUrgencyColor };
export type { AssignmentCardProps };
```

- [ ] **Step 2: Verify types compile**

```bash
npx tsc --noEmit
```

- [ ] **Step 3: Commit**

```bash
git add components/assignments/AssignmentCard.tsx
git commit -m "feat: add AssignmentCard with urgency accent border and attempt status"
```

---

### Task 6: FE — Create `AssignmentFilterDrawer`

**Files:**
- Create: `components/assignments/AssignmentFilterDrawer.tsx`

- [ ] **Step 1: Create the filter drawer**

Follow the same pattern as `AttemptFilterDrawer.tsx`. The drawer has four sections: Patient (search picker), Module (chip select), Status (chip select), Urgency (chip select).

```typescript
import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Animated,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  useWindowDimensions,
  View,
} from 'react-native';
import { Button, Chip, Divider, IconButton, Portal, Surface } from 'react-native-paper';
import Constants from 'expo-constants';
import { Colors } from '@/constants/Colors';
import type { AssignmentUrgencyFilter } from '@milobedini/shared-types';

import { ThemedText } from '../ThemedText';
import SearchPickerDialog from '../ui/SearchPickerDialog';
import SelectField from '../ui/SelectField';

export type AssignmentFilterValues = {
  patientId?: string;
  moduleId?: string;
  status?: string;
  urgency?: AssignmentUrgencyFilter;
};

export const DEFAULT_ASSIGNMENT_FILTERS: AssignmentFilterValues = {
  patientId: undefined,
  moduleId: undefined,
  status: undefined,
  urgency: undefined,
};

type AssignmentFilterDrawerProps = {
  visible: boolean;
  onDismiss: () => void;
  values: AssignmentFilterValues;
  onApply: (values: AssignmentFilterValues) => void;
  onReset: () => void;
  moduleChoices?: { id: string; title: string }[];
  patientChoices?: { id: string; name: string; email: string }[];
};

const chipStyle = (selected: boolean) => ({
  backgroundColor: selected ? Colors.tint.teal : Colors.chip.darkCard,
  borderColor: selected ? Colors.sway.bright : Colors.chip.darkCardAlt,
  borderWidth: 1,
});

const chipTextStyle = (selected: boolean) => ({
  color: selected ? Colors.sway.bright : Colors.sway.darkGrey,
  fontSize: 13,
});

const STATUS_OPTIONS = [
  { value: undefined, label: 'All' },
  { value: 'assigned', label: 'Assigned' },
  { value: 'in_progress', label: 'In Progress' },
] as const;

const URGENCY_OPTIONS: { value: AssignmentUrgencyFilter | undefined; label: string }[] = [
  { value: undefined, label: 'All' },
  { value: 'overdue', label: 'Overdue' },
  { value: 'due_soon', label: 'Due Soon' },
  { value: 'on_track', label: 'On Track' },
  { value: 'no_due_date', label: 'No Due Date' },
];

const AssignmentFilterDrawer = ({
  visible,
  onDismiss,
  values,
  onApply,
  onReset,
  moduleChoices,
  patientChoices,
}: AssignmentFilterDrawerProps) => {
  const { width: screenWidth } = useWindowDimensions();
  const drawerWidth = Math.min(420, Math.floor(screenWidth * 0.9));
  const [local, setLocal] = useState<AssignmentFilterValues>(values);
  const [patientPickerOpen, setPatientPickerOpen] = useState(false);

  const patientPickerItems = useMemo(
    () =>
      patientChoices?.map((p) => ({
        _id: p.id,
        title: p.name,
        subtitle: p.email,
      })) ?? [],
    [patientChoices]
  );

  const selectedPatientName = useMemo(
    () => patientChoices?.find((p) => p.id === local.patientId)?.name,
    [patientChoices, local.patientId]
  );

  const translateX = useRef(new Animated.Value(drawerWidth)).current;

  useEffect(() => {
    if (visible) setLocal(values);
  }, [visible, values]);

  useEffect(() => {
    Animated.timing(translateX, {
      toValue: visible ? 0 : drawerWidth,
      duration: 220,
      useNativeDriver: true,
    }).start();
  }, [visible, translateX, drawerWidth]);

  const handleApply = () => {
    onApply(local);
    onDismiss();
  };

  const handleReset = () => {
    setLocal(DEFAULT_ASSIGNMENT_FILTERS);
    onReset();
  };

  return (
    <Portal>
      {visible && <Pressable style={styles.backdrop} onPress={onDismiss} />}
      <KeyboardAvoidingView
        behavior={Platform.select({ ios: 'padding', android: undefined })}
        pointerEvents="box-none"
        style={StyleSheet.absoluteFill}
      >
        <Animated.View
          style={[styles.drawerContainer, { width: drawerWidth, transform: [{ translateX }] }]}
          pointerEvents={visible ? 'auto' : 'none'}
        >
          <Surface elevation={3} style={styles.surface}>
            <View style={styles.header}>
              <ThemedText type="subtitle">Filter Assignments</ThemedText>
              <IconButton icon="close" onPress={onDismiss} />
            </View>

            <Divider />

            <ScrollView style={styles.scrollContent} showsVerticalScrollIndicator={false}>
              {/* Patient */}
              <View style={styles.section}>
                <ThemedText type="smallTitle" style={styles.sectionTitle}>
                  Patient
                </ThemedText>
                <SelectField
                  label="Patient"
                  value={selectedPatientName}
                  placeholder="Any patient"
                  selected={!!local.patientId}
                  leftIcon="account-circle-outline"
                  onPress={() => setPatientPickerOpen(true)}
                  onClear={() => setLocal((prev) => ({ ...prev, patientId: undefined }))}
                />
              </View>

              {/* Module */}
              <View style={styles.section}>
                <ThemedText type="smallTitle" style={styles.sectionTitle}>
                  Module
                </ThemedText>
                <View style={styles.rowWrap}>
                  <Chip
                    selected={!local.moduleId}
                    onPress={() => setLocal((prev) => ({ ...prev, moduleId: undefined }))}
                    style={chipStyle(!local.moduleId)}
                    textStyle={chipTextStyle(!local.moduleId)}
                  >
                    All
                  </Chip>
                  {moduleChoices?.map((m) => {
                    const selected = local.moduleId === m.id;
                    return (
                      <Chip
                        key={m.id}
                        selected={selected}
                        onPress={() =>
                          setLocal((prev) => ({
                            ...prev,
                            moduleId: prev.moduleId === m.id ? undefined : m.id,
                          }))
                        }
                        style={chipStyle(selected)}
                        textStyle={chipTextStyle(selected)}
                      >
                        {m.title}
                      </Chip>
                    );
                  })}
                </View>
              </View>

              {/* Status */}
              <View style={styles.section}>
                <ThemedText type="smallTitle" style={styles.sectionTitle}>
                  Status
                </ThemedText>
                <View style={styles.rowWrap}>
                  {STATUS_OPTIONS.map((opt) => {
                    const selected = local.status === opt.value;
                    return (
                      <Chip
                        key={opt.label}
                        selected={selected}
                        onPress={() => setLocal((prev) => ({ ...prev, status: opt.value }))}
                        style={chipStyle(selected)}
                        textStyle={chipTextStyle(selected)}
                      >
                        {opt.label}
                      </Chip>
                    );
                  })}
                </View>
              </View>

              {/* Urgency */}
              <View style={styles.section}>
                <ThemedText type="smallTitle" style={styles.sectionTitle}>
                  Urgency
                </ThemedText>
                <View style={styles.rowWrap}>
                  {URGENCY_OPTIONS.map((opt) => {
                    const selected = local.urgency === opt.value;
                    return (
                      <Chip
                        key={opt.label}
                        selected={selected}
                        onPress={() => setLocal((prev) => ({ ...prev, urgency: opt.value }))}
                        style={chipStyle(selected)}
                        textStyle={chipTextStyle(selected)}
                      >
                        {opt.label}
                      </Chip>
                    );
                  })}
                </View>
              </View>
            </ScrollView>

            <View style={styles.footer}>
              <Button
                onPress={handleReset}
                mode="outlined"
                textColor={Colors.sway.lightGrey}
                style={{ borderColor: Colors.chip.darkCardAlt }}
              >
                Reset
              </Button>
              <View style={{ flex: 1 }} />
              <Button onPress={onDismiss} mode="text" textColor={Colors.sway.darkGrey}>
                Cancel
              </Button>
              <Button onPress={handleApply} mode="contained" buttonColor={Colors.sway.bright} textColor="black">
                Apply
              </Button>
            </View>
          </Surface>
        </Animated.View>
      </KeyboardAvoidingView>

      <SearchPickerDialog
        visible={patientPickerOpen}
        onDismiss={() => setPatientPickerOpen(false)}
        items={patientPickerItems}
        title="Select Patient"
        onSelect={(item) => setLocal((prev) => ({ ...prev, patientId: item._id }))}
        leftIcon={() => 'account'}
        rightIcon={() => 'check-circle'}
      />
    </Portal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: Colors.overlay.light,
  },
  drawerContainer: {
    position: 'absolute',
    right: 0,
    top: 0,
    bottom: 0,
  },
  surface: {
    flex: 1,
    padding: 16,
    backgroundColor: Colors.sway.dark,
    paddingTop: Constants.statusBarHeight,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  scrollContent: { flex: 1 },
  section: { marginTop: 16, gap: 8 },
  sectionTitle: { marginBottom: 4 },
  rowWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingTop: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: Colors.chip.darkCardAlt,
  },
});

export default AssignmentFilterDrawer;
```

- [ ] **Step 2: Verify types compile**

```bash
npx tsc --noEmit
```

- [ ] **Step 3: Commit**

```bash
git add components/assignments/AssignmentFilterDrawer.tsx
git commit -m "feat: add AssignmentFilterDrawer with patient, module, status, urgency filters"
```

---

### Task 7: FE — Create `EditAssignmentModal`

**Files:**
- Create: `components/assignments/EditAssignmentModal.tsx`

- [ ] **Step 1: Create the edit modal**

Use a `Modal` with `MotiView` animation (same pattern as `ActionMenu`) rather than `@gorhom/bottom-sheet`. This avoids introducing a new pattern when the existing Moti-based modal slide-up works well.

```typescript
import { useCallback, useEffect, useState } from 'react';
import { Modal, Pressable, ScrollView, View } from 'react-native';
import { Button, TextInput } from 'react-native-paper';
import { AnimatePresence, MotiView } from 'moti';
import { Colors } from '@/constants/Colors';
import { useUpdateAssignment } from '@/hooks/useAssignments';
import type { AssignmentRecurrence, MyAssignmentView } from '@milobedini/shared-types';

import { ThemedText } from '../ThemedText';
import DueDateField from '../ui/DueDateField';
import RecurrenceField from '../ui/RecurrenceField';

type EditAssignmentModalProps = {
  visible: boolean;
  onDismiss: () => void;
  assignment: MyAssignmentView | null;
};

const EditAssignmentModal = ({ visible, onDismiss, assignment }: EditAssignmentModalProps) => {
  const [dueAt, setDueAt] = useState<string | undefined>(undefined);
  const [notes, setNotes] = useState('');
  const [recurrence, setRecurrence] = useState<AssignmentRecurrence | undefined>(undefined);

  const { mutate: updateAssignment, isPending } = useUpdateAssignment();

  useEffect(() => {
    if (visible && assignment) {
      setDueAt(assignment.dueAt);
      setNotes(assignment.notes ?? '');
      setRecurrence(assignment.recurrence);
    }
  }, [visible, assignment]);

  const handleSave = useCallback(() => {
    if (!assignment) return;
    updateAssignment(
      {
        assignmentId: assignment._id,
        updates: {
          dueAt: dueAt ?? undefined,
          notes: notes || undefined,
          recurrence,
        },
      },
      { onSuccess: onDismiss }
    );
  }, [assignment, dueAt, notes, recurrence, updateAssignment, onDismiss]);

  if (!assignment) return null;

  const patientName = assignment.user.name ?? assignment.user.username;

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={onDismiss} statusBarTranslucent>
      <View className="flex-1 justify-end">
        <AnimatePresence>
          {visible && (
            <MotiView
              from={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ type: 'timing', duration: 200 }}
              className="absolute inset-0"
            >
              <Pressable onPress={onDismiss} className="flex-1" style={{ backgroundColor: Colors.overlay.medium }} />
            </MotiView>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {visible && (
            <MotiView
              from={{ translateY: 400, opacity: 0 }}
              animate={{ translateY: 0, opacity: 1 }}
              exit={{ translateY: 400, opacity: 0 }}
              transition={{ type: 'spring', damping: 28, stiffness: 260 }}
              className="mx-4 mb-10 overflow-hidden rounded-2xl"
              style={{ backgroundColor: Colors.chip.darkCard, maxHeight: '80%' }}
            >
              {/* Header */}
              <View className="border-b px-5 pb-3 pt-5" style={{ borderBottomColor: Colors.chip.darkCardAlt }}>
                <ThemedText type="smallTitle" className="text-center">
                  Edit Assignment
                </ThemedText>
                <ThemedText type="small" className="mt-1 text-center" style={{ color: Colors.sway.darkGrey }}>
                  {assignment.module.title} — {patientName}
                </ThemedText>
              </View>

              {/* Fields */}
              <ScrollView className="px-5 py-4" showsVerticalScrollIndicator={false}>
                <View className="gap-4">
                  <DueDateField value={dueAt} onChange={setDueAt} label="Due date" />

                  <View className="gap-1">
                    <ThemedText type="smallBold">Notes</ThemedText>
                    <TextInput
                      mode="outlined"
                      value={notes}
                      onChangeText={setNotes}
                      placeholder="Add therapist notes..."
                      multiline
                      numberOfLines={3}
                      style={{ backgroundColor: Colors.chip.darkCard }}
                    />
                  </View>

                  <RecurrenceField value={recurrence} onChange={setRecurrence} label="Recurrence" />
                </View>
              </ScrollView>

              {/* Footer */}
              <View
                className="flex-row justify-end gap-2 border-t px-5 py-3"
                style={{ borderTopColor: Colors.chip.darkCardAlt }}
              >
                <Button onPress={onDismiss} mode="text" textColor={Colors.sway.darkGrey}>
                  Cancel
                </Button>
                <Button
                  onPress={handleSave}
                  mode="contained"
                  buttonColor={Colors.sway.bright}
                  textColor="black"
                  loading={isPending}
                  disabled={isPending}
                >
                  Save
                </Button>
              </View>
            </MotiView>
          )}
        </AnimatePresence>
      </View>
    </Modal>
  );
};

export default EditAssignmentModal;
```

- [ ] **Step 2: Verify types compile**

```bash
npx tsc --noEmit
```

- [ ] **Step 3: Commit**

```bash
git add components/assignments/EditAssignmentModal.tsx
git commit -m "feat: add EditAssignmentModal for editing due date, notes, recurrence"
```

---

### Task 8: FE — Rewrite `AssignmentsListTherapist` with SectionList

**Files:**
- Modify: `components/assignments/AssignmentsListTherapist.tsx`

- [ ] **Step 1: Rewrite with SectionList, sort chips, collapsible sections, and all integrations**

This is the main rewrite. Replace the entire file:

```typescript
import { type ComponentProps, memo, useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  SectionList,
  type SectionListData,
  type SectionListRenderItemInfo,
  View,
} from 'react-native';
import { Chip, FAB, IconButton } from 'react-native-paper';
import { Link } from 'expo-router';
import { toast } from 'sonner-native';
import type { ActionMenuItem } from '@/components/ui/ActionMenu';
import ActionMenu from '@/components/ui/ActionMenu';
import { TOAST_DURATIONS, TOAST_STYLES } from '@/components/toast/toastOptions';
import { Colors } from '@/constants/Colors';
import { useRemoveAssignment } from '@/hooks/useAssignments';
import type { AssignmentSortOption, MyAssignmentView } from '@milobedini/shared-types';

import { ThemedText } from '../ThemedText';

import AssignmentCard from './AssignmentCard';
import type { AssignmentFilterValues } from './AssignmentFilterDrawer';
import EditAssignmentModal from './EditAssignmentModal';
import PatientGroupHeader from './PatientGroupHeader';

type AssignmentSection = {
  title: string;
  patientId: string;
  data: MyAssignmentView[];
  overdueCount: number;
};

type AssignmentsListTherapistProps = {
  items: MyAssignmentView[];
  totalItems: number;
  sort: AssignmentSortOption;
  onSortChange: (s: AssignmentSortOption) => void;
  filters: AssignmentFilterValues;
  onOpenFilterDrawer: () => void;
  onClearFilter: (key: keyof AssignmentFilterValues) => void;
  onClearAllFilters: () => void;
  patientName?: string;
  moduleName?: string;
  isRefetching: boolean;
  isFetching: boolean;
  isPending: boolean;
  isFetchingNextPage: boolean;
  hasNextPage: boolean;
  fetchNextPage: () => void;
  refetch: () => void;
  isError: boolean;
};

const SORT_OPTIONS: { value: AssignmentSortOption; label: string }[] = [
  { value: 'urgency', label: 'Urgency' },
  { value: 'newest', label: 'Newest' },
  { value: 'oldest', label: 'Oldest' },
  { value: 'module', label: 'Module' },
];

const SortChips = memo(function SortChips({
  value,
  onChange,
}: {
  value: AssignmentSortOption;
  onChange: (s: AssignmentSortOption) => void;
}) {
  return (
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
  );
});

const ActiveFilterChips = memo(function ActiveFilterChips({
  filters,
  patientName,
  moduleName,
  onClear,
  onClearAll,
}: {
  filters: AssignmentFilterValues;
  patientName?: string;
  moduleName?: string;
  onClear: (key: keyof AssignmentFilterValues) => void;
  onClearAll: () => void;
}) {
  const chips: { key: keyof AssignmentFilterValues; label: string }[] = [];

  if (filters.patientId && patientName) {
    chips.push({ key: 'patientId', label: `Patient: ${patientName}` });
  }
  if (filters.moduleId && moduleName) {
    chips.push({ key: 'moduleId', label: `Module: ${moduleName}` });
  }
  if (filters.status) {
    const label = filters.status === 'in_progress' ? 'In Progress' : 'Assigned';
    chips.push({ key: 'status', label: `Status: ${label}` });
  }
  if (filters.urgency) {
    const labels: Record<string, string> = {
      overdue: 'Overdue',
      due_soon: 'Due Soon',
      on_track: 'On Track',
      no_due_date: 'No Due Date',
    };
    chips.push({ key: 'urgency', label: `Urgency: ${labels[filters.urgency]}` });
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
          <ThemedText style={{ fontSize: 12, color: Colors.sway.darkGrey, marginLeft: 4 }}>Clear all</ThemedText>
        </Pressable>
      )}
    </View>
  );
});

const groupByPatient = (items: MyAssignmentView[]): AssignmentSection[] => {
  const groups: AssignmentSection[] = [];
  const now = Date.now();

  for (const item of items) {
    const pid = item.user._id;
    const pName = item.user.name ?? item.user.username;
    const last = groups.at(-1);

    if (last && last.patientId === pid) {
      last.data.push(item);
      if (item.dueAt && new Date(item.dueAt).getTime() < now) {
        last.overdueCount += 1;
      }
    } else {
      const isOverdue = item.dueAt ? new Date(item.dueAt).getTime() < now : false;
      groups.push({
        title: pName,
        patientId: pid,
        data: [item],
        overdueCount: isOverdue ? 1 : 0,
      });
    }
  }

  return groups;
};

const AssignmentsListTherapist = ({
  items,
  totalItems,
  sort,
  onSortChange,
  filters,
  onOpenFilterDrawer,
  onClearFilter,
  onClearAllFilters,
  patientName,
  moduleName,
  isRefetching,
  isFetching,
  isPending,
  isFetchingNextPage,
  hasNextPage,
  fetchNextPage,
  refetch,
  isError,
}: AssignmentsListTherapistProps) => {
  const [collapsedSections, setCollapsedSections] = useState<Set<string>>(new Set());
  const [menuOpen, setMenuOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const { mutate: removeAssignment } = useRemoveAssignment();

  const sections = useMemo(() => groupByPatient(items), [items]);

  const selectedAssignment = useMemo(
    () => items.find((a) => a._id === selectedId) ?? null,
    [items, selectedId]
  );

  const allExpanded = collapsedSections.size === 0;

  const toggleSection = useCallback((patientId: string) => {
    setCollapsedSections((prev) => {
      const next = new Set(prev);
      if (next.has(patientId)) next.delete(patientId);
      else next.add(patientId);
      return next;
    });
  }, []);

  const toggleAll = useCallback(() => {
    if (allExpanded) {
      setCollapsedSections(new Set(sections.map((s) => s.patientId)));
    } else {
      setCollapsedSections(new Set());
    }
  }, [allExpanded, sections]);

  const closeMenu = useCallback(() => {
    setMenuOpen(false);
    setSelectedId(null);
  }, []);

  const openMenu = useCallback((id: string) => {
    setSelectedId(id);
    setMenuOpen(true);
  }, []);

  const handleEdit = useCallback(() => {
    setMenuOpen(false);
    // Delay slightly to avoid z-index overlap between ActionMenu closing and modal opening
    setTimeout(() => setEditOpen(true), 150);
  }, []);

  const handleRemove = useCallback(() => {
    if (!selectedId) return;
    removeAssignment({ assignmentId: selectedId }, { onSuccess: closeMenu, onError: closeMenu });
  }, [removeAssignment, selectedId, closeMenu]);

  const closeEdit = useCallback(() => {
    setEditOpen(false);
    setSelectedId(null);
  }, []);

  const actions: ActionMenuItem[] = useMemo(
    () => [
      {
        icon: 'pencil-outline' as const,
        label: 'Edit assignment',
        onPress: handleEdit,
      },
      {
        icon: 'delete-outline' as const,
        label: 'Remove assignment',
        onPress: handleRemove,
        variant: 'destructive' as const,
      },
    ],
    [handleEdit, handleRemove]
  );

  // Filter out collapsed section data
  const filteredSections = useMemo(
    () =>
      sections.map((s) => ({
        ...s,
        data: collapsedSections.has(s.patientId) ? [] : s.data,
      })),
    [sections, collapsedSections]
  );

  const renderItem = useCallback(
    ({ item }: SectionListRenderItemInfo<MyAssignmentView>) => (
      <AssignmentCard item={item} onOpenMenu={openMenu} />
    ),
    [openMenu]
  );

  const renderSectionHeader = useCallback(
    ({ section }: { section: SectionListData<MyAssignmentView, AssignmentSection> }) => (
      <PatientGroupHeader
        patientName={section.title}
        assignmentCount={
          // Use original section data length (not filtered)
          sections.find((s) => s.patientId === section.patientId)?.data.length ?? 0
        }
        overdueCount={section.overdueCount}
        isExpanded={!collapsedSections.has(section.patientId)}
        onToggle={() => toggleSection(section.patientId)}
      />
    ),
    [sections, collapsedSections, toggleSection]
  );

  const renderSectionFooter = useCallback(
    ({ section }: { section: SectionListData<MyAssignmentView, AssignmentSection> }) => {
      // Add spacing after each patient group
      if (collapsedSections.has(section.patientId)) return <View className="h-3" />;
      return <View className="mb-3 h-px" />;
    },
    [collapsedSections]
  );

  const handleEndReached = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage) fetchNextPage();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  useEffect(() => {
    if (isError && sections.length > 0) {
      toast.error('Failed to refresh', {
        duration: TOAST_DURATIONS.error,
        styles: TOAST_STYLES.error,
      });
    }
  }, [isError, sections]);

  return (
    <>
      {/* Header row */}
      <View className="flex-row items-center justify-between px-4 pt-2">
        <ThemedText
          type="small"
          className="text-sway-darkGrey"
          style={{ opacity: isFetching && !isPending ? 0.4 : 1 }}
        >
          {totalItems} {totalItems === 1 ? 'assignment' : 'assignments'}
        </ThemedText>
        <View className="flex-row items-center gap-1">
          <Pressable onPress={toggleAll}>
            <ThemedText style={{ fontSize: 13, color: Colors.sway.bright }}>
              {allExpanded ? 'Collapse all' : 'Expand all'}
            </ThemedText>
          </Pressable>
          <IconButton
            icon="filter-variant"
            iconColor={Colors.sway.lightGrey}
            onPress={onOpenFilterDrawer}
            style={{ backgroundColor: Colors.sway.buttonBackgroundSolid }}
          />
        </View>
      </View>

      {/* Sort chips */}
      <SortChips value={sort} onChange={onSortChange} />

      {/* Active filter chips */}
      <ActiveFilterChips
        filters={filters}
        patientName={patientName}
        moduleName={moduleName}
        onClear={onClearFilter}
        onClearAll={onClearAllFilters}
      />

      {/* List */}
      <SectionList
        sections={filteredSections}
        keyExtractor={(item) => item._id}
        renderItem={renderItem}
        renderSectionHeader={renderSectionHeader}
        renderSectionFooter={renderSectionFooter}
        stickySectionHeadersEnabled={false}
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 80 }}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching && !isFetchingNextPage}
            onRefresh={refetch}
            tintColor={Colors.sway.bright}
            progressBackgroundColor={Colors.chip.darkCard}
          />
        }
        onEndReached={handleEndReached}
        onEndReachedThreshold={0.3}
        ListFooterComponent={
          isFetchingNextPage ? <ActivityIndicator color={Colors.sway.bright} style={{ paddingVertical: 16 }} /> : null
        }
      />

      {/* FAB */}
      <Link
        href={{
          pathname: '/assignments/add',
          params: { headerTitle: 'Create Assignment' },
        }}
        push
        style={{
          position: 'absolute',
          right: 16,
          bottom: 16,
        }}
      >
        <FAB
          color={Colors.primary.charcoal}
          icon="plus-circle"
          size="medium"
          style={{
            elevation: 2,
            backgroundColor: Colors.primary.accent,
          }}
        />
      </Link>

      {/* Action menu */}
      <ActionMenu
        visible={menuOpen}
        onDismiss={closeMenu}
        title={selectedAssignment?.module.title}
        subtitle={
          selectedAssignment
            ? `Assigned to ${selectedAssignment.user.name ?? selectedAssignment.user.username}`
            : undefined
        }
        actions={actions}
      />

      {/* Edit modal */}
      <EditAssignmentModal visible={editOpen} onDismiss={closeEdit} assignment={selectedAssignment} />
    </>
  );
};

export default AssignmentsListTherapist;
```

- [ ] **Step 2: Verify types compile**

```bash
npx tsc --noEmit
```

- [ ] **Step 3: Commit**

```bash
git add components/assignments/AssignmentsListTherapist.tsx
git commit -m "feat: rewrite AssignmentsListTherapist with SectionList, sort, filters, collapsible sections"
```

---

### Task 9: FE — Rewrite `TherapistActiveAssignments` to wire everything together

**Files:**
- Modify: `components/assignments/TherapistActiveAssignments.tsx`

- [ ] **Step 1: Rewrite to manage sort/filter state and pass to list**

```typescript
import { useCallback, useMemo, useState } from 'react';
import { useRouter } from 'expo-router';
import { useTherapistAssignments } from '@/hooks/useAssignments';
import { useTherapistAttemptModules } from '@/hooks/useAttempts';
import { useClients } from '@/hooks/useUsers';
import type { AssignmentSortOption } from '@milobedini/shared-types';

import ContentContainer from '../ContentContainer';
import ErrorComponent, { ErrorTypes } from '../ErrorComponent';
import { LoadingIndicator } from '../LoadingScreen';
import EmptyState from '../ui/EmptyState';

import AssignmentFilterDrawer, {
  type AssignmentFilterValues,
  DEFAULT_ASSIGNMENT_FILTERS,
} from './AssignmentFilterDrawer';
import AssignmentsListTherapist from './AssignmentsListTherapist';

const TherapistActiveAssignments = () => {
  const router = useRouter();
  const [sort, setSort] = useState<AssignmentSortOption>('urgency');
  const [filters, setFilters] = useState<AssignmentFilterValues>(DEFAULT_ASSIGNMENT_FILTERS);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const {
    items,
    totalItems,
    isPending,
    isError,
    isRefetching,
    refetch,
    hasNextPage,
    fetchNextPage,
    isFetchingNextPage,
    isFetching,
  } = useTherapistAssignments({
    ...filters,
    sortBy: sort,
  });

  const { data: clientsData } = useClients();
  const { data: modulesData } = useTherapistAttemptModules();

  const patientChoices = useMemo(
    () =>
      clientsData?.map((p) => ({
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

  const selectedPatientName = useMemo(
    () => patientChoices.find((p) => p.id === filters.patientId)?.name,
    [patientChoices, filters.patientId]
  );

  const selectedModuleName = useMemo(
    () => moduleChoices.find((m) => m.id === filters.moduleId)?.title,
    [moduleChoices, filters.moduleId]
  );

  const handleClearFilter = useCallback((key: keyof AssignmentFilterValues) => {
    setFilters((prev) => ({ ...prev, [key]: undefined }));
  }, []);

  const handleClearAll = useCallback(() => setFilters(DEFAULT_ASSIGNMENT_FILTERS), []);

  if (isPending) return <LoadingIndicator marginBottom={0} />;
  if (isError && !items.length) return <ErrorComponent errorType={ErrorTypes.GENERAL_ERROR} />;

  return (
    <ContentContainer padded={false}>
      {!isFetching && items.length === 0 ? (
        <EmptyState
          icon="clipboard-text-outline"
          title="No active assignments"
          action={{
            label: 'Create assignment',
            onPress: () =>
              router.push({
                pathname: '/assignments/add',
                params: { headerTitle: 'Create Assignment' },
              }),
          }}
        />
      ) : (
        <AssignmentsListTherapist
          items={items}
          totalItems={totalItems}
          sort={sort}
          onSortChange={setSort}
          filters={filters}
          onOpenFilterDrawer={() => setDrawerOpen(true)}
          onClearFilter={handleClearFilter}
          onClearAllFilters={handleClearAll}
          patientName={selectedPatientName}
          moduleName={selectedModuleName}
          isRefetching={isRefetching}
          isFetching={isFetching}
          isPending={isPending}
          isFetchingNextPage={isFetchingNextPage}
          hasNextPage={hasNextPage ?? false}
          fetchNextPage={fetchNextPage}
          refetch={refetch}
          isError={isError}
        />
      )}

      <AssignmentFilterDrawer
        visible={drawerOpen}
        onDismiss={() => setDrawerOpen(false)}
        values={filters}
        onApply={(v) => {
          setFilters(v);
          setDrawerOpen(false);
        }}
        onReset={() => setFilters(DEFAULT_ASSIGNMENT_FILTERS)}
        moduleChoices={moduleChoices}
        patientChoices={patientChoices}
      />
    </ContentContainer>
  );
};

export default TherapistActiveAssignments;
```

- [ ] **Step 2: Run full validation**

```bash
npx eslint --fix .
npx prettier --write .
npm run lint
```

- [ ] **Step 3: Commit**

```bash
git add components/assignments/TherapistActiveAssignments.tsx
git commit -m "feat: wire TherapistActiveAssignments with sort, filter, and infinite scroll"
```

---

### Task 10: Integration testing and polish

- [ ] **Step 1: Start the BE dev server**

```bash
cd ../cbt && npm run dev
```

- [ ] **Step 2: Start the FE dev server**

```bash
cd /Users/milobedini/Documents/git/bwell && npx expo start
```

- [ ] **Step 3: Test the Assignments tab**

Navigate to the therapist Assignments tab and verify:
1. Patient-grouped sections render correctly
2. Urgency accent borders match due date status
3. Sort chips work (urgency, newest, oldest, module)
4. Collapse/expand individual sections works
5. Collapse all / Expand all works
6. Filter drawer opens, filters apply, active filter chips show
7. Pull-to-refresh works
8. Infinite scroll loads more pages
9. Dots menu → "Edit assignment" opens edit modal
10. Edit modal saves changes (due date, notes, recurrence)
11. Dots menu → "Remove assignment" removes the assignment
12. Tapping a card with a latest attempt navigates to attempt detail
13. FAB creates new assignments
14. Empty state shows when no assignments

- [ ] **Step 4: Fix any issues found during testing**

Address any layout, type, or interaction issues.

- [ ] **Step 5: Run final validation**

```bash
npx eslint --fix .
npx prettier --write .
npm run lint
```

- [ ] **Step 6: Commit any fixes**

```bash
git add -A
git commit -m "fix: polish therapist assignments tab"
```
