import { memo } from 'react';
import { Pressable, View } from 'react-native';
import { ThemedText } from '@/components/ThemedText';
import { Colors } from '@/constants/Colors';
import { DashboardStats } from '@milobedini/shared-types';

type StatPillProps = {
  value: number;
  label: string;
  color: string;
  onPress: () => void;
};

const StatPill = memo(({ value, label, color, onPress }: StatPillProps) => (
  <Pressable
    onPress={onPress}
    className="flex-1 items-center rounded-[14px] border-[1.5px] border-chip-dotInactive bg-chip-pill px-0.5 py-3"
  >
    <ThemedText type="subtitle" style={{ color, lineHeight: 28 }}>
      {value}
    </ThemedText>
    <ThemedText type="small" className="mt-0.5 text-[11px] uppercase tracking-wide text-sway-darkGrey">
      {label}
    </ThemedText>
  </Pressable>
));

StatPill.displayName = 'StatPill';

type StatStripProps = {
  stats: DashboardStats;
  onScrollToBucket: (bucket: 'attention' | 'completed' | 'inactive' | 'top') => void;
};

const StatStrip = memo(({ stats, onScrollToBucket }: StatStripProps) => (
  <View className="my-4 flex-row gap-2">
    <StatPill
      value={stats.totalClients}
      label="Clients"
      color={Colors.sway.darkGrey}
      onPress={() => onScrollToBucket('top')}
    />
    <StatPill
      value={stats.needsAttention}
      label="Attention"
      color={Colors.primary.error}
      onPress={() => onScrollToBucket('attention')}
    />
    <StatPill
      value={stats.submittedThisWeek}
      label="Submitted"
      color={Colors.sway.bright}
      onPress={() => onScrollToBucket('completed')}
    />
    <StatPill
      value={stats.overdueAssignments}
      label="Overdue"
      color={Colors.primary.warning}
      onPress={() => onScrollToBucket('attention')}
    />
  </View>
));

StatStrip.displayName = 'StatStrip';

export default StatStrip;
