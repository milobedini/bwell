import { type ComponentProps } from 'react';
import { Pressable, View } from 'react-native';
import { ThemedText } from '@/components/ThemedText';
import { Colors } from '@/constants/Colors';
import { formatRelativeTime } from '@/utils/dates';
import type { DashboardStats, PatientProfileStatsResponse } from '@milobedini/shared-types';
import MaterialCommunityIcons from '@react-native-vector-icons/material-design-icons';

type MCIName = ComponentProps<typeof MaterialCommunityIcons>['name'];

type StatItemProps = {
  title: string;
  value: string | number;
  icon: MCIName;
  iconColour?: string;
  description: string;
  descriptionColour?: string;
  onPress?: () => void;
};

// TODO: custom fontSize overrides (11px, 16px) bypass ThemedText type scale — consider adding
// `micro` (11px) and `body` (16px) variants to ThemedText to eliminate inline overrides here
// and in ProfileHeader, ClientsSummaryCard, SettingsGroup, SettingsRow
const StatItem = ({ title, value, icon, iconColour, description, descriptionColour, onPress }: StatItemProps) => {
  const inner = (
    <>
      <ThemedText
        type="smallBold"
        style={{
          color: Colors.sway.darkGrey,
          textAlign: 'center',
          fontSize: 11,
          lineHeight: 14,
          letterSpacing: 0.8
        }}
      >
        {title.toUpperCase()}
      </ThemedText>
      <View className="mt-1 flex-row items-center gap-1">
        <MaterialCommunityIcons name={icon} size={16} color={iconColour ?? Colors.sway.darkGrey} />
        <ThemedText type="smallBold" style={{ fontSize: 16, lineHeight: 20 }}>
          {value}
        </ThemedText>
      </View>
      <ThemedText
        type="small"
        style={{
          color: descriptionColour ?? Colors.sway.darkGrey,
          textAlign: 'center',
          fontSize: 11,
          lineHeight: 14,
          marginTop: 2
        }}
      >
        {description}
      </ThemedText>
    </>
  );

  if (onPress) {
    return (
      <Pressable
        onPress={onPress}
        className="flex-1 items-center gap-0.5 py-4 active:opacity-70"
        accessibilityRole="button"
      >
        {inner}
      </Pressable>
    );
  }

  return <View className="flex-1 items-center gap-0.5 py-4">{inner}</View>;
};

const Divider = () => (
  <View
    style={{
      width: 1,
      alignSelf: 'stretch',
      marginVertical: 12,
      backgroundColor: Colors.divider.medium
    }}
  />
);

// ── Patient stats ──

type PatientStatsProps = {
  stats: PatientProfileStatsResponse;
  onLastCompletionPress?: () => void;
};

const PatientStats = ({ stats, onLastCompletionPress }: PatientStatsProps) => {
  const lastTime = stats.latestCompletion ? formatRelativeTime(stats.latestCompletion.completedAt) : null;

  return (
    <View
      className="mx-4 flex-row rounded-2xl"
      style={{
        backgroundColor: Colors.chip.darkCard,
        borderWidth: 1,
        borderColor: Colors.tintSubtle.tealBorder
      }}
      testID="patient-stats-strip"
    >
      <StatItem
        title="Last Done"
        value={lastTime ?? '--'}
        icon="check-circle-outline"
        iconColour={stats.latestCompletion ? Colors.primary.success : Colors.sway.darkGrey}
        description={stats.latestCompletion?.moduleTitle ?? 'Nothing yet'}
        onPress={stats.latestCompletion ? onLastCompletionPress : undefined}
      />
      <Divider />
      <StatItem
        title="Completed"
        value={stats.sessionsThisWeek}
        icon="star-circle-outline"
        iconColour={Colors.primary.success}
        description="This week"
      />
      <Divider />
      <StatItem
        title="Homework"
        value={stats.assignmentsDue}
        icon="clipboard-list-outline"
        iconColour={stats.assignmentsDue > 0 ? Colors.primary.warning : Colors.sway.darkGrey}
        description={stats.assignmentsDue === 1 ? 'Assignment due' : 'Assignments due'}
      />
    </View>
  );
};

// ── Therapist stats ──

type TherapistStatsProps = {
  stats: DashboardStats;
  onPress?: () => void;
};

const TherapistStats = ({ stats, onPress }: TherapistStatsProps) => (
  <View
    className="mx-4 flex-row rounded-2xl"
    style={{
      backgroundColor: Colors.chip.darkCard,
      borderWidth: 1,
      borderColor: Colors.therapist.tintSubtle
    }}
    testID="therapist-stats-strip"
  >
    <StatItem
      title="Clients"
      value={stats.needsAttention}
      icon="alert-circle-outline"
      iconColour={stats.needsAttention > 0 ? Colors.primary.error : Colors.sway.darkGrey}
      description="Need attention"
      onPress={onPress}
    />
    <Divider />
    <StatItem
      title="Submitted"
      value={stats.submittedThisWeek}
      icon="check-circle-outline"
      iconColour={Colors.primary.success}
      description="This week"
      onPress={onPress}
    />
    <Divider />
    <StatItem
      title="Homework"
      value={stats.overdueAssignments}
      icon="clock-alert-outline"
      iconColour={stats.overdueAssignments > 0 ? Colors.primary.warning : Colors.sway.darkGrey}
      description="Overdue"
      onPress={onPress}
    />
  </View>
);

// ── Skeleton ──

const StatsStripSkeleton = () => (
  <View
    className="mx-4 flex-row rounded-2xl"
    style={{ backgroundColor: Colors.chip.darkCard, height: 120 }}
    testID="stats-strip-skeleton"
  >
    {[0, 1, 2].map((i) => (
      <View key={i} className="flex-1 items-center justify-center gap-2 py-4">
        <View style={{ width: 36, height: 36, borderRadius: 10, backgroundColor: Colors.chip.darkCardAlt }} />
        <View style={{ width: 32, height: 20, borderRadius: 4, backgroundColor: Colors.chip.darkCardAlt }} />
        <View style={{ width: 48, height: 12, borderRadius: 4, backgroundColor: Colors.chip.darkCardAlt }} />
      </View>
    ))}
  </View>
);

export { PatientStats, StatsStripSkeleton, TherapistStats };
