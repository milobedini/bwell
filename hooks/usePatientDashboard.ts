import { useCallback, useMemo } from 'react';
import { useMyPractice } from '@/hooks/usePractice';
import { useScoreTrends } from '@/hooks/useScoreTrends';
import { getWeekStart } from '@/utils/dates';
import type { PracticeItem, ScoreTrendItem } from '@milobedini/shared-types';

export type PatientDashboardData = {
  focusAssignment: PracticeItem | null;
  upcomingAssignments: PracticeItem[]; // excludes focus card item, max 3
  weeklyCompletion: { completed: number; total: number };
  onTimeStreak: { current: number; history: ('on_time' | 'late')[] };
  scoreTrends: ScoreTrendItem[];
  activeAssignmentCount: number;
  weekStart: string;
  hasData: boolean;
};

const getFocusAssignment = (assignments: PracticeItem[]): PracticeItem | null => {
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

  // 3. No due date — just pick the first assignment
  const noDue = assignments.filter((a) => !a.dueAt);
  if (noDue.length > 0) return noDue[0];

  return null;
};

const deriveWeeklyCompletion = (
  completedItems: PracticeItem[],
  activeItems: PracticeItem[]
): { completed: number; total: number } => {
  const weekStart = new Date(getWeekStart());
  const completedThisWeek = completedItems.filter(
    (a) => a.latestAttempt?.completedAt && new Date(a.latestAttempt.completedAt) >= weekStart
  ).length;
  const total = completedThisWeek + activeItems.length;
  return { completed: completedThisWeek, total };
};

const deriveOnTimeStreak = (completedItems: PracticeItem[]): { current: number; history: ('on_time' | 'late')[] } => {
  // Sort by completion date descending (most recent first)
  const withDue = completedItems
    .filter((a) => a.dueAt && a.latestAttempt?.completedAt)
    .sort(
      (a, b) => new Date(b.latestAttempt!.completedAt!).getTime() - new Date(a.latestAttempt!.completedAt!).getTime()
    );

  const history: ('on_time' | 'late')[] = withDue.slice(0, 7).map((a) => {
    const completedAt = new Date(a.latestAttempt!.completedAt!);
    const dueAt = new Date(a.dueAt!);
    return completedAt <= dueAt ? 'on_time' : 'late';
  });

  const firstLate = history.indexOf('late');
  const current = firstLate === -1 ? history.length : firstLate;

  return { current, history };
};

export const usePatientDashboard = () => {
  const practiceQuery = useMyPractice();
  const trendsQuery = useScoreTrends();

  const isPending = practiceQuery.isPending || trendsQuery.isPending;
  const isError = practiceQuery.isError || trendsQuery.isError;
  const isRefetching = practiceQuery.isRefetching || trendsQuery.isRefetching;

  const refetch = useCallback(() => {
    practiceQuery.refetch();
    trendsQuery.refetch();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [practiceQuery.refetch, trendsQuery.refetch]);

  const data = useMemo((): PatientDashboardData | null => {
    if (isPending) return null;

    const practice = practiceQuery.data;
    // Active items = today + thisWeek + upcoming buckets
    const activeAssignments = [
      ...(practice?.today ?? []),
      ...(practice?.thisWeek ?? []),
      ...(practice?.upcoming ?? [])
    ];
    const completedAssignments = practice?.recentlyCompleted ?? [];
    const scoreTrends = trendsQuery.data?.trends ?? [];

    const hasData = activeAssignments.length > 0 || completedAssignments.length > 0 || scoreTrends.length > 0;

    const focusAssignment = getFocusAssignment(activeAssignments);

    // Upcoming: active assignments excluding focus card, with due dates, sorted by due date (overdue first), max 3
    const upcomingAssignments = activeAssignments
      .filter((a) => a.assignmentId !== focusAssignment?.assignmentId)
      .filter((a) => a.dueAt)
      .sort((a, b) => new Date(a.dueAt!).getTime() - new Date(b.dueAt!).getTime())
      .slice(0, 3);

    return {
      focusAssignment,
      upcomingAssignments,
      weeklyCompletion: deriveWeeklyCompletion(completedAssignments, activeAssignments),
      onTimeStreak: deriveOnTimeStreak(completedAssignments),
      scoreTrends,
      activeAssignmentCount: activeAssignments.length,
      weekStart: getWeekStart(),
      hasData
    };
  }, [isPending, practiceQuery.data, trendsQuery.data]);

  return { data, isPending, isError, isRefetching, refetch };
};
