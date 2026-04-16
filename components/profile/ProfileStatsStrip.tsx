import { type ComponentProps } from 'react';
import { Pressable, View } from 'react-native';
import { ThemedText } from '@/components/ThemedText';
import { Colors } from '@/constants/Colors';
import type { DashboardStats, PatientProfileStatsResponse } from '@milobedini/shared-types';
import MaterialCommunityIcons from '@react-native-vector-icons/material-design-icons';

type MCIName = ComponentProps<typeof MaterialCommunityIcons>['name'];

type StatItemProps = {
  label: string;
  value: string | number;
  icon: MCIName;
  iconColour?: string;
  sublabel?: string;
  sublabelColour?: string;
  onPress?: () => void;
};

const StatItem = ({ label, value, icon, iconColour, sublabel, sublabelColour, onPress }: StatItemProps) => {
  const inner = (
    <>
      <MaterialCommunityIcons name={icon} size={18} color={iconColour ?? Colors.sway.darkGrey} />
      <ThemedText type="smallTitle" style={{ marginBottom: 0 }}>
        {value}
      </ThemedText>
      <ThemedText
        type="small"
        style={{ color: Colors.sway.darkGrey, textAlign: 'center', fontSize: 12, lineHeight: 16 }}
      >
        {label}
      </ThemedText>
      {sublabel && (
        <ThemedText
          type="small"
          style={{
            color: sublabelColour ?? Colors.sway.darkGrey,
            fontSize: 11,
            lineHeight: 14
          }}
        >
          {sublabel}
        </ThemedText>
      )}
    </>
  );

  if (onPress) {
    return (
      <Pressable
        onPress={onPress}
        className="flex-1 items-center gap-1 py-3 active:opacity-70"
        accessibilityRole="button"
      >
        {inner}
      </Pressable>
    );
  }

  return <View className="flex-1 items-center gap-1 py-3">{inner}</View>;
};

const Divider = () => (
  <View
    style={{
      width: 1,
      alignSelf: 'stretch',
      marginVertical: 12,
      backgroundColor: 'rgba(166,173,187,0.15)'
    }}
  />
);

// ── Patient stats ──

type PatientStatsProps = {
  stats: PatientProfileStatsResponse;
};

const trendConfig = {
  improving: { icon: 'trending-up', colour: Colors.primary.success, label: 'Improving' },
  worsening: { icon: 'trending-down', colour: Colors.primary.error, label: 'Worsening' },
  stable: { icon: 'minus', colour: Colors.primary.warning, label: 'Stable' }
} as const;

const PatientStats = ({ stats }: PatientStatsProps) => {
  const trend = stats.latestScore ? trendConfig[stats.latestScore.trend] : null;

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
        label={stats.latestScore?.band ?? 'Score'}
        value={stats.latestScore?.score ?? '--'}
        icon="clipboard-pulse-outline"
        iconColour={Colors.sway.bright}
        sublabel={trend?.label}
        sublabelColour={trend?.colour}
      />
      <Divider />
      <StatItem
        label="This Week"
        value={stats.sessionsThisWeek}
        icon="calendar-check-outline"
        iconColour={Colors.primary.info}
      />
      <Divider />
      <StatItem
        label="Due"
        value={stats.assignmentsDue}
        icon="clipboard-list-outline"
        iconColour={stats.assignmentsDue > 0 ? Colors.primary.warning : Colors.sway.darkGrey}
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
      borderColor: 'rgba(124,58,237,0.2)'
    }}
    testID="therapist-stats-strip"
  >
    <StatItem
      label="Attention"
      value={stats.needsAttention}
      icon="alert-circle-outline"
      iconColour={stats.needsAttention > 0 ? Colors.primary.error : Colors.sway.darkGrey}
      onPress={onPress}
    />
    <Divider />
    <StatItem
      label="Submitted"
      value={stats.submittedThisWeek}
      icon="check-circle-outline"
      iconColour={Colors.primary.success}
      onPress={onPress}
    />
    <Divider />
    <StatItem
      label="Overdue"
      value={stats.overdueAssignments}
      icon="clock-alert-outline"
      iconColour={stats.overdueAssignments > 0 ? Colors.primary.warning : Colors.sway.darkGrey}
      onPress={onPress}
    />
  </View>
);

// ── Skeleton ──

const StatsStripSkeleton = () => (
  <View
    className="mx-4 flex-row rounded-2xl"
    style={{ backgroundColor: Colors.chip.darkCard, height: 100 }}
    testID="stats-strip-skeleton"
  >
    {[0, 1, 2].map((i) => (
      <View key={i} className="flex-1 items-center justify-center gap-2 py-3">
        <View style={{ width: 18, height: 18, borderRadius: 4, backgroundColor: Colors.chip.darkCardAlt }} />
        <View style={{ width: 32, height: 20, borderRadius: 4, backgroundColor: Colors.chip.darkCardAlt }} />
        <View style={{ width: 48, height: 12, borderRadius: 4, backgroundColor: Colors.chip.darkCardAlt }} />
      </View>
    ))}
  </View>
);

export { PatientStats, StatsStripSkeleton, TherapistStats };
