import { useMemo } from 'react';
import { useViewMyAssignments } from '@/hooks/useAssignments';
import { useScoreTrends } from '@/hooks/useScoreTrends';
import { AssignmentStatusSearchOptions } from '@/types/types';
import { getWeekStart } from '@/utils/dates';
import type { MyAssignmentView, ScoreTrendItem } from '@milobedini/shared-types';

export type PatientDashboardData = {
  focusAssignment: MyAssignmentView | null;
  upcomingAssignments: MyAssignmentView[]; // excludes focus card item, max 3
  weeklyCompletion: { completed: number; total: number };
  onTimeStreak: { current: number; history: ('on_time' | 'late')[] };
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
): { current: number; history: ('on_time' | 'late')[] } => {
  // Sort by completion date descending (most recent first)
  const withDue = completedAssignments
    .filter((a) => a.dueAt && a.latestAttempt?.completedAt)
    .sort(
      (a, b) => new Date(b.latestAttempt!.completedAt!).getTime() - new Date(a.latestAttempt!.completedAt!).getTime()
    );

  const history: ('on_time' | 'late')[] = withDue.slice(0, 7).map((a) => {
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
  const isRefetching = activeQuery.isRefetching || completedQuery.isRefetching || trendsQuery.isRefetching;

  const refetch = () => {
    activeQuery.refetch();
    completedQuery.refetch();
    trendsQuery.refetch();
  };

  const data = useMemo((): PatientDashboardData | null => {
    if (isPending) return null;

    const activeAssignments = activeQuery.data ?? [];
    const completedAssignments = completedQuery.data ?? [];
    const scoreTrends = trendsQuery.data?.trends ?? [];

    const hasData = activeAssignments.length > 0 || completedAssignments.length > 0 || scoreTrends.length > 0;

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
  }, [isPending, activeQuery.data, completedQuery.data, trendsQuery.data]);

  return { data, isPending, isError, isRefetching, refetch };
};
