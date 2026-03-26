# Patient Dashboard Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the single-button patient home screen with a dashboard showing a focus card, effort metrics, upcoming assignments, and score trends.

**Architecture:** A new BE endpoint `GET /api/user/score-trends` returns aggregated score trends per questionnaire. The FE composes data from `useViewMyAssignments`, `useGetMyAttempts` (for non-score data), and the new `useScoreTrends` hook. A `usePatientDashboard` hook aggregates focus card priority, weekly completion, and on-time streak. The dashboard uses a `ScrollView` with `RefreshControl`, matching the therapist dashboard pattern.

**Tech Stack:** React Native, Expo, NativeWind, TanStack React Query, @shopify/react-native-skia (sparklines), @milobedini/shared-types, Node/Express/MongoDB (BE)

**Spec:** `docs/superpowers/specs/2026-03-25-patient-dashboard-design.md`

---

## File Structure

**Backend (../cbt/):**
```
src/shared-types/types.ts              (modify — add ScoreTrendItem + ScoreTrendsResponse types)
src/controllers/attemptsController.ts  (modify — add getMyScoreTrends controller)
src/routes/userRoute.ts                (modify — register GET /score-trends route)
```

**Frontend (bwell/):**
```
components/home/
├── PatientHome.tsx                    (modify — switch between empty/populated states)
├── PatientDashboard.tsx               (create — populated dashboard container)
├── patient-dashboard/
│   ├── FocusCard.tsx                  (create — hero action card)
│   ├── EffortStrip.tsx                (create — weekly completion + on-time streak)
│   ├── ComingUpList.tsx               (create — upcoming assignment rows)
│   ├── ProgressSection.tsx            (create — score trend cards)
│   └── Sparkline.tsx                  (create — Skia mini sparkline)
hooks/
├── usePatientDashboard.ts             (create — data aggregation hook)
├── useScoreTrends.ts                  (create — calls new BE score-trends endpoint)
utils/
├── dates.ts                           (modify — add getWeekStart + dueLabel helpers)
```

---

### Task 1: Date Utility Helpers

**Files:**
- Modify: `utils/dates.ts`

We need two helpers used throughout the dashboard: a week-start calculator and a due-date label formatter.

- [ ] **Step 1: Add `getWeekStart` and `dueLabel` to `utils/dates.ts`**

Append to the end of `utils/dates.ts`:

```typescript
/** Returns the Monday 00:00 of the current week as an ISO string. */
export const getWeekStart = (): string => {
  const now = new Date();
  const day = now.getDay() || 7; // Sunday → 7
  const monday = new Date(now.getFullYear(), now.getMonth(), now.getDate() - (day - 1));
  return monday.toISOString();
};

/** Human-friendly due date label relative to today. */
export const dueLabel = (dueAt: string): string => {
  const due = new Date(dueAt);
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const dueDay = new Date(due.getFullYear(), due.getMonth(), due.getDate());
  const diffDays = Math.round((dueDay.getTime() - today.getTime()) / 86_400_000);

  if (diffDays < 0) return `Was due ${formatShortDate(dueAt)}`;
  if (diffDays === 0) return 'Due today';
  if (diffDays === 1) return 'Due tomorrow';
  if (diffDays <= 7) return `${diffDays} days`;
  return `Due ${formatShortDate(dueAt)}`;
};
```

- [ ] **Step 2: Run lint to validate**

Run: `npm run lint`
Expected: PASS

- [ ] **Step 3: Commit**

```bash
git add utils/dates.ts
git commit -m "feat: add getWeekStart and dueLabel date helpers"
```

---

### Task 2: BE — Score Trends Shared Types

**Files:**
- Modify: `../cbt/src/shared-types/types.ts`

Add the response types for the new score trends endpoint.

- [ ] **Step 1: Add types to `../cbt/src/shared-types/types.ts`**

Append before the closing of the file:

```typescript
// ==================================
// API: Patient Score Trends
// ==================================

export type ScoreTrendItem = {
  moduleTitle: string
  moduleId: string
  latestScore: number
  previousScore: number | null
  sparkline: number[] // last 5 scores, oldest first
}

export type ScoreTrendsResponse = {
  success: boolean
  trends: ScoreTrendItem[]
}
```

- [ ] **Step 2: Export the new types from `../cbt/src/shared-types/index.ts`**

The index re-exports everything from `types.ts`, so no change needed — verify with a quick check.

- [ ] **Step 3: Publish shared-types**

```bash
cd ../cbt && npm run publish-types
```

- [ ] **Step 4: Update FE types**

```bash
cd /Users/milobedini/Documents/git/bwell && npm run update-types
```

- [ ] **Step 5: Commit BE changes**

```bash
cd ../cbt
git add src/shared-types/types.ts
git commit -m "feat: add ScoreTrendItem and ScoreTrendsResponse shared types"
```

---

### Task 3: BE — Score Trends Endpoint

**Files:**
- Modify: `../cbt/src/controllers/attemptsController.ts`
- Modify: `../cbt/src/routes/userRoute.ts`

Add `GET /api/user/score-trends` — aggregates the patient's submitted questionnaire attempts, grouped by module, returning the last 5 scores per module as a sparkline array with latest + previous scores for delta calculation.

- [ ] **Step 1: Add controller to `../cbt/src/controllers/attemptsController.ts`**

Append after the `getMyAttempts` function (around line 518):

```typescript
// GET /user/score-trends
export const getMyScoreTrends = async (req: Request, res: Response) => {
  try {
    const userId = req.user?._id
    if (!userId) {
      res.status(401).json({ success: false, message: 'Unauthorized' })
      return
    }

    const pipeline: mongoose.PipelineStage[] = [
      // Only submitted questionnaire attempts with scores
      {
        $match: {
          user: userId,
          status: 'submitted',
          moduleType: 'questionnaire',
          totalScore: { $ne: null },
        },
      },
      // Sort by completion date descending (newest first)
      { $sort: { completedAt: -1 } },
      // Group by module, collect last 5 scores
      {
        $group: {
          _id: '$module',
          scores: { $push: '$totalScore' },
          completedDates: { $push: '$completedAt' },
        },
      },
      // Limit to 5 scores per module
      {
        $project: {
          _id: 1,
          scores: { $slice: ['$scores', 5] },
        },
      },
      // Lookup module title
      {
        $lookup: {
          from: 'modules',
          localField: '_id',
          foreignField: '_id',
          as: 'moduleDoc',
        },
      },
      { $unwind: '$moduleDoc' },
      // Shape the output
      {
        $project: {
          moduleId: { $toString: '$_id' },
          moduleTitle: '$moduleDoc.title',
          scores: 1,
        },
      },
    ]

    const rows = await ModuleAttempt.aggregate(pipeline)

    const trends = rows.map((row) => ({
      moduleTitle: row.moduleTitle,
      moduleId: row.moduleId,
      latestScore: row.scores[0],
      previousScore: row.scores.length > 1 ? row.scores[1] : null,
      sparkline: [...row.scores].reverse(), // oldest first for sparkline
    }))

    res.status(200).json({ success: true, trends })
  } catch (error) {
    errorHandler(res, error)
  }
}
```

- [ ] **Step 2: Register the route in `../cbt/src/routes/userRoute.ts`**

Add import and route registration. After the existing patient routes (`/attempts`, `/available`, `/assignments`), add:

```typescript
// In imports, add getMyScoreTrends:
import {
  getMyAttempts,
  getMyScoreTrends,
  getTherapistAttemptModules,
  getTherapistLatest,
  getPatientModuleTimeline,
} from "../controllers/attemptsController";

// After the existing patient routes:
// ✅ Patient: score trends for dashboard sparklines
router.get("/score-trends", getMyScoreTrends);
```

- [ ] **Step 3: Test the endpoint manually**

Start the BE server and test with curl or the app.

- [ ] **Step 4: Commit BE changes**

```bash
cd ../cbt
git add src/controllers/attemptsController.ts src/routes/userRoute.ts
git commit -m "feat: add GET /user/score-trends endpoint for patient dashboard"
```

---

### Task 4: FE — Score Trends Hook

**Files:**
- Create: `hooks/useScoreTrends.ts`

Simple hook calling the new BE endpoint.

- [ ] **Step 1: Create `hooks/useScoreTrends.ts`**

```typescript
import { api } from '@/api/api';
import type { ScoreTrendsResponse } from '@milobedini/shared-types';
import { useQuery } from '@tanstack/react-query';

import { useIsLoggedIn } from './useUsers';

export const useScoreTrends = () => {
  const isLoggedIn = useIsLoggedIn();

  return useQuery<ScoreTrendsResponse>({
    queryKey: ['score-trends', 'mine'],
    queryFn: async (): Promise<ScoreTrendsResponse> => {
      const { data } = await api.get<ScoreTrendsResponse>('/user/score-trends');
      return data;
    },
    enabled: isLoggedIn
  });
};
```

- [ ] **Step 2: Run lint to validate**

Run: `npm run lint`
Expected: PASS

- [ ] **Step 3: Commit**

```bash
git add hooks/useScoreTrends.ts
git commit -m "feat: add useScoreTrends hook for patient dashboard"
```

---

### Task 5: Patient Dashboard Data Hook

**Files:**
- Create: `hooks/usePatientDashboard.ts`

Aggregates assignment data from existing hooks and score trends from the new BE endpoint. No more client-side score derivation — the BE handles grouping and sparkline generation.

- [ ] **Step 1: Create `hooks/usePatientDashboard.ts`**

```typescript
import { useMemo } from 'react';
import { useViewMyAssignments } from '@/hooks/useAssignments';
import { useScoreTrends } from '@/hooks/useScoreTrends';
import { AssignmentStatusSearchOptions } from '@/types/types';
import type { MyAssignmentView, ScoreTrendItem } from '@milobedini/shared-types';

import { getWeekStart } from '@/utils/dates';

export type PatientDashboardData = {
  focusAssignment: MyAssignmentView | null;
  upcomingAssignments: MyAssignmentView[]; // excludes focus card item, max 3
  weeklyCompletion: { completed: number; total: number };
  onTimeStreak: { current: number; history: Array<'on_time' | 'late'> };
  scoreTrends: ScoreTrendItem[];
  weekStart: string;
  hasData: boolean;
};

const getFocusAssignment = (assignments: MyAssignmentView[]): MyAssignmentView | null => {
  const now = new Date();

  // 1. Overdue (oldest first)
  const overdue = assignments
    .filter((a) => a.dueAt && new Date(a.dueAt) < now)
    .sort((a, b) => new Date(a.dueAt!).getTime() - new Date(b.dueAt!).getTime());
  if (overdue.length > 0) return overdue[0];

  // 2. Due today or tomorrow, then nearest upcoming
  const upcoming = assignments
    .filter((a) => a.dueAt && new Date(a.dueAt) >= now)
    .sort((a, b) => new Date(a.dueAt!).getTime() - new Date(b.dueAt!).getTime());
  if (upcoming.length > 0) return upcoming[0];

  // 3. No due date — just pick the oldest assignment
  const noDue = assignments.filter((a) => !a.dueAt);
  if (noDue.length > 0) return noDue[0];

  return null;
};

const deriveWeeklyCompletion = (
  completedAssignments: MyAssignmentView[],
  activeAssignments: MyAssignmentView[]
): { completed: number; total: number } => {
  const weekStart = new Date(getWeekStart());
  const completedThisWeek = completedAssignments.filter(
    (a) => a.updatedAt && new Date(a.updatedAt) >= weekStart
  ).length;
  const total = completedThisWeek + activeAssignments.length;
  return { completed: completedThisWeek, total };
};

const deriveOnTimeStreak = (
  completedAssignments: MyAssignmentView[]
): { current: number; history: Array<'on_time' | 'late'> } => {
  // Sort by completion date descending (most recent first)
  const withDue = completedAssignments
    .filter((a) => a.dueAt && a.latestAttempt?.completedAt)
    .sort(
      (a, b) =>
        new Date(b.latestAttempt!.completedAt!).getTime() -
        new Date(a.latestAttempt!.completedAt!).getTime()
    );

  const history: Array<'on_time' | 'late'> = withDue.slice(0, 7).map((a) => {
    const completedAt = new Date(a.latestAttempt!.completedAt!);
    const dueAt = new Date(a.dueAt!);
    return completedAt <= dueAt ? 'on_time' : 'late';
  });

  let current = 0;
  for (const entry of history) {
    if (entry === 'on_time') current++;
    else break;
  }

  return { current, history };
};

export const usePatientDashboard = () => {
  const activeQuery = useViewMyAssignments({ status: AssignmentStatusSearchOptions.ACTIVE });
  const completedQuery = useViewMyAssignments({ status: AssignmentStatusSearchOptions.COMPLETED });
  const trendsQuery = useScoreTrends();

  const isPending = activeQuery.isPending || completedQuery.isPending || trendsQuery.isPending;
  const isError = activeQuery.isError || completedQuery.isError || trendsQuery.isError;
  const isRefetching =
    activeQuery.isRefetching || completedQuery.isRefetching || trendsQuery.isRefetching;

  const refetch = () => {
    activeQuery.refetch();
    completedQuery.refetch();
    trendsQuery.refetch();
  };

  const activeAssignments = activeQuery.data ?? [];
  const completedAssignments = completedQuery.data ?? [];
  const scoreTrends = trendsQuery.data?.trends ?? [];

  const data = useMemo((): PatientDashboardData | null => {
    if (isPending) return null;

    const hasData =
      activeAssignments.length > 0 || completedAssignments.length > 0 || scoreTrends.length > 0;

    const focusAssignment = getFocusAssignment(activeAssignments);

    // Upcoming: active assignments excluding focus card, sorted by due date, max 3
    const upcomingAssignments = activeAssignments
      .filter((a) => a._id !== focusAssignment?._id)
      .filter((a) => a.dueAt && new Date(a.dueAt) >= new Date())
      .sort((a, b) => new Date(a.dueAt!).getTime() - new Date(b.dueAt!).getTime())
      .slice(0, 3);

    return {
      focusAssignment,
      upcomingAssignments,
      weeklyCompletion: deriveWeeklyCompletion(completedAssignments, activeAssignments),
      onTimeStreak: deriveOnTimeStreak(completedAssignments),
      scoreTrends,
      weekStart: getWeekStart(),
      hasData
    };
  }, [isPending, activeAssignments, completedAssignments, scoreTrends]);

  return { data, isPending, isError, isRefetching, refetch };
};
```

- [ ] **Step 2: Run lint to validate**

Run: `npm run lint`
Expected: PASS

- [ ] **Step 3: Commit**

```bash
git add hooks/usePatientDashboard.ts
git commit -m "feat: add usePatientDashboard data aggregation hook"
```

---

### Task 6: Sparkline Component

**Files:**
- Create: `components/home/patient-dashboard/Sparkline.tsx`

A tiny Skia-based sparkline for score trends. Uses `@shopify/react-native-skia` which is already a project dependency.

- [ ] **Step 1: Create `components/home/patient-dashboard/Sparkline.tsx`**

```typescript
import { memo } from 'react';
import { Canvas, Path, Skia } from '@shopify/react-native-skia';
import { Colors } from '@/constants/Colors';

type SparklineProps = {
  data: number[];
  width?: number;
  height?: number;
  color?: string;
};

const Sparkline = memo(({ data, width = 48, height = 22, color = Colors.primary.success }: SparklineProps) => {
  if (data.length < 2) return null;

  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const padding = 2;
  const drawWidth = width - padding * 2;
  const drawHeight = height - padding * 2;

  const path = Skia.Path.Make();
  data.forEach((val, i) => {
    const x = padding + (i / (data.length - 1)) * drawWidth;
    // Invert Y — lower scores should appear lower on screen (better = down for PHQ/GAD/PDSS)
    const y = padding + ((val - min) / range) * drawHeight;
    if (i === 0) path.moveTo(x, y);
    else path.lineTo(x, y);
  });

  const paint = Skia.Paint();
  paint.setColor(Skia.Color(color));
  paint.setStrokeWidth(2);
  paint.setStyle(1); // Stroke
  paint.setStrokeCap(1); // Round
  paint.setStrokeJoin(1); // Round
  paint.setAntiAlias(true);

  return (
    <Canvas style={{ width, height }}>
      <Path path={path} paint={paint} />
    </Canvas>
  );
});

Sparkline.displayName = 'Sparkline';

export default Sparkline;
```

- [ ] **Step 2: Run lint to validate**

Run: `npm run lint`
Expected: PASS

- [ ] **Step 3: Commit**

```bash
git add components/home/patient-dashboard/Sparkline.tsx
git commit -m "feat: add Skia sparkline component for score trends"
```

---

### Task 7: Focus Card Component

**Files:**
- Create: `components/home/patient-dashboard/FocusCard.tsx`

Hero card showing the single most urgent action. Tinting and CTA text change based on urgency.

- [ ] **Step 1: Create `components/home/patient-dashboard/FocusCard.tsx`**

```typescript
import { memo, useCallback } from 'react';
import { Pressable, View } from 'react-native';
import { useRouter } from 'expo-router';
import { ThemedText } from '@/components/ThemedText';
import { Colors } from '@/constants/Colors';
import { dueLabel } from '@/utils/dates';
import type { MyAssignmentView } from '@milobedini/shared-types';

type FocusCardProps = {
  assignment: MyAssignmentView | null;
};

const getUrgency = (assignment: MyAssignmentView) => {
  if (!assignment.dueAt) return 'future' as const;
  const now = new Date();
  const due = new Date(assignment.dueAt);
  const diffDays = Math.round((due.getTime() - now.getTime()) / 86_400_000);
  if (diffDays < 0) return 'overdue' as const;
  if (diffDays <= 1) return 'soon' as const;
  return 'future' as const;
};

const URGENCY_STYLES = {
  overdue: {
    bg: Colors.tint.error,
    border: 'rgba(255,109,94,0.3)',
    label: 'OVERDUE',
    labelColor: Colors.primary.error,
    ctaBg: Colors.primary.error
  },
  soon: {
    bg: Colors.tint.teal,
    border: 'rgba(24,205,186,0.3)',
    label: 'YOUR FOCUS THIS WEEK',
    labelColor: Colors.sway.bright,
    ctaBg: Colors.sway.bright
  },
  future: {
    bg: Colors.tint.teal,
    border: 'rgba(24,205,186,0.15)',
    label: 'YOUR FOCUS THIS WEEK',
    labelColor: Colors.sway.bright,
    ctaBg: Colors.sway.bright
  }
} as const;

const FocusCard = memo(({ assignment }: FocusCardProps) => {
  const router = useRouter();

  const handlePress = useCallback(() => {
    if (!assignment) {
      router.push('/(main)/(tabs)/programs');
      return;
    }
    // Navigate to the assignment's module attempt
    const moduleId = assignment.module._id;
    const assignmentId = assignment._id;
    router.push(`/(main)/modules/${moduleId}?assignmentId=${assignmentId}`);
  }, [assignment, router]);

  // "All caught up" state
  if (!assignment) {
    return (
      <Pressable
        onPress={handlePress}
        style={{
          backgroundColor: Colors.tint.teal,
          borderWidth: 1.5,
          borderColor: 'rgba(24,205,186,0.15)',
          borderRadius: 16,
          padding: 18,
          marginBottom: 16
        }}
      >
        <ThemedText
          type="smallBold"
          style={{
            color: Colors.sway.bright,
            textTransform: 'uppercase',
            letterSpacing: 1.2,
            fontSize: 11,
            marginBottom: 8
          }}
        >
          ALL CAUGHT UP
        </ThemedText>
        <ThemedText type="smallTitle" style={{ marginBottom: 4 }}>
          You're up to date
        </ThemedText>
        <ThemedText type="small" style={{ color: Colors.sway.darkGrey }}>
          Explore programs or review your past work
        </ThemedText>
      </Pressable>
    );
  }

  const urgency = getUrgency(assignment);
  const styles = URGENCY_STYLES[urgency];
  const hasDraft =
    assignment.latestAttempt && !assignment.latestAttempt.completedAt;
  const ctaText = hasDraft ? 'Continue where you left off →' : 'Start →';

  return (
    <View
      style={{
        backgroundColor: styles.bg,
        borderWidth: 1.5,
        borderColor: styles.border,
        borderRadius: 16,
        padding: 18,
        marginBottom: 16
      }}
    >
      <ThemedText
        type="smallBold"
        style={{
          color: styles.labelColor,
          textTransform: 'uppercase',
          letterSpacing: 1.2,
          fontSize: 11,
          marginBottom: 8
        }}
      >
        {urgency === 'overdue' ? '⚠ ' : ''}
        {styles.label}
      </ThemedText>
      <ThemedText type="smallTitle" style={{ marginBottom: 4 }}>
        {assignment.module.title}
      </ThemedText>
      <ThemedText type="small" style={{ color: Colors.sway.darkGrey, marginBottom: 14 }}>
        {assignment.dueAt ? dueLabel(assignment.dueAt) : 'No due date'}
        {assignment.therapist?.name ? ` · From ${assignment.therapist.name}` : ''}
      </ThemedText>
      <Pressable
        onPress={handlePress}
        style={({ pressed }) => ({
          backgroundColor: styles.ctaBg,
          borderRadius: 12,
          padding: 12,
          alignItems: 'center',
          opacity: pressed ? 0.85 : 1
        })}
      >
        <ThemedText type="smallBold" style={{ color: Colors.sway.dark, fontSize: 15 }}>
          {ctaText}
        </ThemedText>
      </Pressable>
    </View>
  );
});

FocusCard.displayName = 'FocusCard';

export default FocusCard;
```

- [ ] **Step 2: Run lint to validate**

Run: `npm run lint`
Expected: PASS

- [ ] **Step 3: Commit**

```bash
git add components/home/patient-dashboard/FocusCard.tsx
git commit -m "feat: add FocusCard component for patient dashboard"
```

---

### Task 8: Effort Strip Component

**Files:**
- Create: `components/home/patient-dashboard/EffortStrip.tsx`

Two side-by-side cards: weekly completion (fraction + progress bar) and on-time streak (count + dots).

- [ ] **Step 1: Create `components/home/patient-dashboard/EffortStrip.tsx`**

```typescript
import { memo, useCallback } from 'react';
import { Pressable, View } from 'react-native';
import { useRouter } from 'expo-router';
import { ThemedText } from '@/components/ThemedText';
import { Colors } from '@/constants/Colors';

type EffortStripProps = {
  weeklyCompletion: { completed: number; total: number };
  onTimeStreak: { current: number; history: Array<'on_time' | 'late'> };
};

const DOT_COLORS = {
  on_time: Colors.sway.bright,
  late: Colors.primary.error,
  pending: Colors.chip.dotInactive
} as const;

const EffortStrip = memo(({ weeklyCompletion, onTimeStreak }: EffortStripProps) => {
  const router = useRouter();
  const { completed, total } = weeklyCompletion;
  const pct = total > 0 ? (completed / total) * 100 : 0;

  const goToAssignments = useCallback(() => {
    router.push('/(main)/(tabs)/assignments');
  }, [router]);

  return (
    <View className="mb-5 flex-row gap-2.5">
      {/* Weekly Completion */}
      <Pressable
        onPress={goToAssignments}
        className="flex-1 rounded-[14px] p-4"
        style={{ backgroundColor: Colors.chip.darkCard }}
      >
        <View className="flex-row items-baseline">
          <ThemedText type="subtitle" style={{ color: Colors.sway.bright, fontSize: 30, lineHeight: 34 }}>
            {completed}
          </ThemedText>
          <ThemedText type="default" style={{ color: Colors.sway.darkGrey }}>
            /{total}
          </ThemedText>
        </View>
        <ThemedText type="small" style={{ color: Colors.sway.darkGrey, marginTop: 2 }}>
          {total === 0 ? 'No assignments yet' : 'Assignments done'}
        </ThemedText>
        <View
          style={{
            height: 4,
            backgroundColor: Colors.chip.darkCardDeep,
            borderRadius: 2,
            marginTop: 10
          }}
        >
          <View
            style={{
              width: `${pct}%`,
              height: '100%',
              backgroundColor: pct > 0 ? Colors.sway.bright : 'transparent',
              borderRadius: 2
            }}
          />
        </View>
      </Pressable>

      {/* On-Time Streak */}
      <View className="flex-1 rounded-[14px] p-4" style={{ backgroundColor: Colors.chip.darkCard }}>
        <ThemedText type="subtitle" style={{ color: Colors.sway.bright, fontSize: 30, lineHeight: 34 }}>
          {onTimeStreak.current}
        </ThemedText>
        <ThemedText type="small" style={{ color: Colors.sway.darkGrey, marginTop: 2 }}>
          {onTimeStreak.history.length === 0 ? 'Complete your first on time' : 'On time'}
        </ThemedText>
        <View className="mt-2.5 flex-row gap-1">
          {onTimeStreak.history.map((entry, i) => (
            <View
              key={i}
              style={{
                width: 10,
                height: 10,
                borderRadius: 5,
                backgroundColor: DOT_COLORS[entry]
              }}
            />
          ))}
        </View>
      </View>
    </View>
  );
});

EffortStrip.displayName = 'EffortStrip';

export default EffortStrip;
```

- [ ] **Step 2: Run lint to validate**

Run: `npm run lint`
Expected: PASS

- [ ] **Step 3: Commit**

```bash
git add components/home/patient-dashboard/EffortStrip.tsx
git commit -m "feat: add EffortStrip component with weekly completion and on-time streak"
```

---

### Task 9: Coming Up List Component

**Files:**
- Create: `components/home/patient-dashboard/ComingUpList.tsx`

List of upcoming assignments (max 3) with "View all" link.

- [ ] **Step 1: Create `components/home/patient-dashboard/ComingUpList.tsx`**

```typescript
import { memo, useCallback } from 'react';
import { Pressable, View } from 'react-native';
import { useRouter } from 'expo-router';
import { ThemedText } from '@/components/ThemedText';
import { Colors } from '@/constants/Colors';
import { dueLabel } from '@/utils/dates';
import type { MyAssignmentView } from '@milobedini/shared-types';

type ComingUpListProps = {
  assignments: MyAssignmentView[];
  hasMore: boolean;
};

const AssignmentRow = memo(({ assignment }: { assignment: MyAssignmentView }) => {
  const router = useRouter();

  const handlePress = useCallback(() => {
    const moduleId = assignment.module._id;
    const assignmentId = assignment._id;
    router.push(`/(main)/modules/${moduleId}?assignmentId=${assignmentId}`);
  }, [assignment, router]);

  const label = assignment.dueAt ? dueLabel(assignment.dueAt) : 'No due date';
  const isDueSoon = assignment.dueAt
    ? Math.round(
        (new Date(assignment.dueAt).getTime() - Date.now()) / 86_400_000
      ) <= 1
    : false;

  return (
    <Pressable
      onPress={handlePress}
      className="mb-2 flex-row items-center justify-between rounded-[14px] px-4 py-3.5"
      style={({ pressed }) => ({
        backgroundColor: pressed ? Colors.chip.pillPressed : Colors.chip.darkCard
      })}
    >
      <View className="flex-1 mr-3">
        <ThemedText type="default" style={{ fontWeight: '600', fontSize: 15 }}>
          {assignment.module.title}
        </ThemedText>
        <ThemedText type="small" style={{ color: Colors.sway.darkGrey, marginTop: 3 }}>
          {label}
        </ThemedText>
      </View>
      {isDueSoon && (
        <ThemedText type="small" style={{ color: Colors.sway.bright, fontWeight: '600', fontSize: 13 }}>
          Start →
        </ThemedText>
      )}
      {!isDueSoon && assignment.dueAt && (
        <ThemedText type="small" style={{ color: Colors.sway.darkGrey, fontSize: 13 }}>
          {Math.max(0, Math.round((new Date(assignment.dueAt).getTime() - Date.now()) / 86_400_000))} days
        </ThemedText>
      )}
    </Pressable>
  );
});

AssignmentRow.displayName = 'AssignmentRow';

const ComingUpList = memo(({ assignments, hasMore }: ComingUpListProps) => {
  const router = useRouter();

  const goToAssignments = useCallback(() => {
    router.push('/(main)/(tabs)/assignments');
  }, [router]);

  if (assignments.length === 0) return null;

  return (
    <View className="mb-5">
      <ThemedText
        type="smallBold"
        style={{
          color: Colors.sway.darkGrey,
          textTransform: 'uppercase',
          letterSpacing: 1.2,
          fontSize: 12,
          marginBottom: 10
        }}
      >
        Coming Up
      </ThemedText>
      {assignments.map((a) => (
        <AssignmentRow key={a._id} assignment={a} />
      ))}
      {hasMore && (
        <Pressable onPress={goToAssignments} className="items-center py-1.5">
          <ThemedText type="small" style={{ color: Colors.sway.bright, fontWeight: '600' }}>
            View all assignments →
          </ThemedText>
        </Pressable>
      )}
    </View>
  );
});

ComingUpList.displayName = 'ComingUpList';

export default ComingUpList;
```

- [ ] **Step 2: Run lint to validate**

Run: `npm run lint`
Expected: PASS

- [ ] **Step 3: Commit**

```bash
git add components/home/patient-dashboard/ComingUpList.tsx
git commit -m "feat: add ComingUpList component for upcoming assignments"
```

---

### Task 10: Progress Section Component

**Files:**
- Create: `components/home/patient-dashboard/ProgressSection.tsx`

Horizontal row of score trend cards with point deltas and sparklines.

- [ ] **Step 1: Create `components/home/patient-dashboard/ProgressSection.tsx`**

```typescript
import { memo, useCallback } from 'react';
import { Pressable, View } from 'react-native';
import { useRouter } from 'expo-router';
import { ThemedText } from '@/components/ThemedText';
import { Colors } from '@/constants/Colors';
import type { ScoreTrendItem } from '@milobedini/shared-types';

import Sparkline from './Sparkline';

type ProgressSectionProps = {
  trends: ScoreTrendItem[];
};

const ScoreCard = memo(({ trend }: { trend: ScoreTrendItem }) => {
  const router = useRouter();

  const handlePress = useCallback(() => {
    router.push('/(main)/(tabs)/attempts');
  }, [router]);

  const hasPrevious = trend.previousScore !== null;
  const delta = hasPrevious ? trend.latestScore - trend.previousScore! : 0;
  // Lower is better for all current questionnaires (PHQ-9, GAD-7, PDSS)
  const deltaColor =
    delta < 0 ? Colors.primary.success : delta > 0 ? Colors.primary.error : Colors.sway.darkGrey;
  const deltaArrow = delta < 0 ? '▼' : delta > 0 ? '▲' : '—';
  const sparklineColor = delta <= 0 ? Colors.primary.success : Colors.primary.error;

  return (
    <Pressable
      onPress={handlePress}
      className="flex-1 rounded-[14px] p-3.5"
      style={({ pressed }) => ({
        backgroundColor: pressed ? Colors.chip.pillPressed : Colors.chip.darkCard
      })}
    >
      <ThemedText type="small" style={{ color: Colors.sway.darkGrey, fontWeight: '600' }}>
        {trend.moduleTitle}
      </ThemedText>
      {hasPrevious ? (
        <View className="mt-2 flex-row items-center gap-1.5">
          <ThemedText type="smallTitle" style={{ color: deltaColor, fontSize: 18 }}>
            {deltaArrow} {Math.abs(delta)}
          </ThemedText>
          <Sparkline data={trend.sparkline} color={sparklineColor} />
        </View>
      ) : (
        <View className="mt-2 flex-row items-center gap-1">
          <ThemedText type="small" style={{ color: Colors.sway.bright, fontWeight: '600', fontSize: 14 }}>
            ✓ done
          </ThemedText>
        </View>
      )}
    </Pressable>
  );
});

ScoreCard.displayName = 'ScoreCard';

const ProgressSection = memo(({ trends }: ProgressSectionProps) => {
  if (trends.length === 0) return null;

  return (
    <View className="mb-5">
      <ThemedText
        type="smallBold"
        style={{
          color: Colors.sway.darkGrey,
          textTransform: 'uppercase',
          letterSpacing: 1.2,
          fontSize: 12,
          marginBottom: 10
        }}
      >
        Your Progress
      </ThemedText>
      <View className="flex-row gap-2">
        {trends.map((trend) => (
          <ScoreCard key={trend.moduleId} trend={trend} />
        ))}
      </View>
    </View>
  );
});

ProgressSection.displayName = 'ProgressSection';

export default ProgressSection;
```

- [ ] **Step 2: Run lint to validate**

Run: `npm run lint`
Expected: PASS

- [ ] **Step 3: Commit**

```bash
git add components/home/patient-dashboard/ProgressSection.tsx
git commit -m "feat: add ProgressSection with score trend cards and sparklines"
```

---

### Task 11: Patient Dashboard Container

**Files:**
- Create: `components/home/PatientDashboard.tsx`

The main dashboard component. Renders greeting, focus card, effort strip, coming up list, and progress section inside a `ScrollView` with `RefreshControl`.

- [ ] **Step 1: Create `components/home/PatientDashboard.tsx`**

```typescript
import { memo } from 'react';
import { RefreshControl, ScrollView, View } from 'react-native';
import { ThemedText } from '@/components/ThemedText';
import { Colors } from '@/constants/Colors';
import type { PatientDashboardData } from '@/hooks/usePatientDashboard';
import { formatShortDate } from '@/utils/dates';

import ComingUpList from './patient-dashboard/ComingUpList';
import EffortStrip from './patient-dashboard/EffortStrip';
import FocusCard from './patient-dashboard/FocusCard';
import ProgressSection from './patient-dashboard/ProgressSection';

const getGreeting = (): string => {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 18) return 'Good afternoon';
  return 'Good evening';
};

type Props = {
  firstName: string;
  data: PatientDashboardData;
  isRefetching: boolean;
  refetch: () => void;
};

const PatientDashboard = memo(({ firstName, data, isRefetching, refetch }: Props) => {

  // hasMore: the hook already caps upcomingAssignments at 3 — if there were more active
  // assignments than focus (1) + coming up (3), show the "View all" link
  const shownCount = (data.focusAssignment ? 1 : 0) + data.upcomingAssignments.length;
  const totalActive = data.weeklyCompletion.total - data.weeklyCompletion.completed;
  const hasMoreAssignments = shownCount < totalActive;

  return (
    <ScrollView
      className="flex-1 px-4"
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl
          refreshing={isRefetching}
          onRefresh={refetch}
          tintColor={Colors.sway.bright}
        />
      }
    >
      {/* Greeting */}
      <View className="py-2">
        <ThemedText type="subtitle">
          {getGreeting()}, {firstName}
        </ThemedText>
        <ThemedText type="small" style={{ color: Colors.sway.darkGrey, marginTop: 2 }}>
          Week of {formatShortDate(data.weekStart)}
        </ThemedText>
      </View>

      {/* Focus Card */}
      <View className="mt-3">
        <FocusCard assignment={data.focusAssignment} />
      </View>

      {/* Effort Strip */}
      <EffortStrip
        weeklyCompletion={data.weeklyCompletion}
        onTimeStreak={data.onTimeStreak}
      />

      {/* Coming Up */}
      <ComingUpList
        assignments={data.upcomingAssignments}
        hasMore={hasMoreAssignments}
      />

      {/* Your Progress */}
      <ProgressSection trends={data.scoreTrends} />

      {/* Bottom spacing */}
      <View className="h-8" />
    </ScrollView>
  );
});

PatientDashboard.displayName = 'PatientDashboard';

export default PatientDashboard;
```

- [ ] **Step 2: Run lint to validate**

Run: `npm run lint`
Expected: PASS

- [ ] **Step 3: Commit**

```bash
git add components/home/PatientDashboard.tsx
git commit -m "feat: add PatientDashboard container with all sections"
```

---

### Task 12: Update PatientHome to Switch States

**Files:**
- Modify: `components/home/PatientHome.tsx`

Replace the single-button placeholder. Empty state uses `HomeScreen` (Skia animation + logo) with CTAs. Populated state renders `PatientDashboard` in a safe-area wrapper (same pattern as `VerifiedTherapistHome`).

- [ ] **Step 1: Rewrite `components/home/PatientHome.tsx`**

Replace the entire file content with:

```typescript
import { View } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import ContentContainer from '@/components/ContentContainer';
import { LoadingIndicator } from '@/components/LoadingScreen';
import { PrimaryButton, SecondaryButton } from '@/components/ThemedButton';
import { ThemedText } from '@/components/ThemedText';
import EmptyState from '@/components/ui/EmptyState';
import { usePatientDashboard } from '@/hooks/usePatientDashboard';
import { useProfile } from '@/hooks/useUsers';

import { HomeScreen } from './HomeScreen';
import PatientDashboard from './PatientDashboard';

const PatientHome = () => {
  const router = useRouter();
  const { data, isPending, isError, isRefetching, refetch } = usePatientDashboard();
  const { data: profile } = useProfile();
  const insets = useSafeAreaInsets();
  const firstName = profile?.name?.split(' ')[0] || profile?.username || '';

  // Loading state
  if (isPending) {
    return <HomeScreen content={<LoadingIndicator marginBottom={0} />} />;
  }

  // Error state
  if (isError || !data) {
    return (
      <View className="flex-1 bg-sway-dark" style={{ paddingTop: insets.top }}>
        <EmptyState
          icon="alert-circle-outline"
          title="Could not load dashboard"
          subtitle="Pull down to retry"
        />
      </View>
    );
  }

  // Empty state: show branded HomeScreen with CTAs
  if (!data.hasData) {
    return (
      <HomeScreen
        content={
          <ContentContainer>
            <View className="items-center gap-3 px-4">
              <ThemedText type="subtitle" style={{ textAlign: 'center' }}>
                Welcome to bwell
              </ThemedText>
              <ThemedText
                type="small"
                style={{ textAlign: 'center', lineHeight: 20 }}
              >
                Your therapy companion.{'\n'}Let's get started.
              </ThemedText>
              <View className="mt-4 w-full gap-2.5">
                <PrimaryButton
                  title="Take your first questionnaire"
                  onPress={() => router.push('/(main)/(tabs)/programs')}
                />
                <SecondaryButton
                  title="Explore programs"
                  onPress={() => router.push('/(main)/(tabs)/programs')}
                />
              </View>
            </View>
          </ContentContainer>
        }
      />
    );
  }

  // Populated state: functional dashboard
  return (
    <View className="flex-1 bg-sway-dark" style={{ paddingTop: insets.top }}>
      <PatientDashboard
        firstName={firstName}
        data={data}
        isRefetching={isRefetching}
        refetch={refetch}
      />
    </View>
  );
};

export default PatientHome;
```

- [ ] **Step 2: Run lint to validate**

Run: `npm run lint`
Expected: PASS

- [ ] **Step 3: Commit**

```bash
git add components/home/PatientHome.tsx
git commit -m "feat: update PatientHome to switch between empty and populated dashboard states"
```

---

### Task 13: Validation and Polish

**Files:**
- All newly created/modified files

Final validation pass: lint, type-check, and visual review.

- [ ] **Step 1: Run full validation**

Run: `npm run lint`
Expected: PASS — no eslint, prettier, or type errors

- [ ] **Step 2: Fix any issues found**

Address lint errors, type mismatches, or import issues. Common things to watch for:
- `useCallback` dependency arrays
- Correct import paths with `@/` prefix
- `style` prop types on `Pressable` (function vs object)
- NativeWind `className` working alongside `style` prop

- [ ] **Step 3: Start dev server and visually verify**

Run: `npx expo start --web --port 8082`

Log in as a patient user and verify:
- Empty state shows if no assignments/attempts
- Populated dashboard shows greeting, focus card, effort strip, coming up, progress
- Pull-to-refresh works
- Tapping focus card CTA navigates correctly
- Tapping assignment rows navigates correctly
- Tapping "View all assignments" navigates to assignments tab

- [ ] **Step 4: Commit any polish fixes**

```bash
git add -A
git commit -m "fix: patient dashboard polish and lint fixes"
```
