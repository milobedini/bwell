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
    style={({ pressed }) => ({
      flex: 1,
      backgroundColor: pressed ? Colors.chip.darkCardAlt : Colors.chip.darkCard,
      borderRadius: 14,
      paddingVertical: 12,
      paddingHorizontal: 10,
      alignItems: 'center',
      borderWidth: 1,
      borderColor: Colors.chip.darkCardAlt
    })}
  >
    <ThemedText type="subtitle" style={{ color, lineHeight: 28 }}>
      {value}
    </ThemedText>
    <ThemedText
      type="small"
      style={{
        color: Colors.sway.darkGrey,
        fontSize: 11,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
        marginTop: 2
      }}
    >
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
