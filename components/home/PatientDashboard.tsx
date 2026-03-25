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
      refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={Colors.sway.bright} />}
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
      <EffortStrip weeklyCompletion={data.weeklyCompletion} onTimeStreak={data.onTimeStreak} />

      {/* Coming Up */}
      <ComingUpList assignments={data.upcomingAssignments} hasMore={hasMoreAssignments} />

      {/* Your Progress */}
      <ProgressSection trends={data.scoreTrends} />

      {/* Bottom spacing */}
      <View className="h-8" />
    </ScrollView>
  );
});

PatientDashboard.displayName = 'PatientDashboard';

export default PatientDashboard;
