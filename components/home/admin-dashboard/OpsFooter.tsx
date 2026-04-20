import { memo } from 'react';
import { View } from 'react-native';
import { ThemedText } from '@/components/ThemedText';
import { Colors } from '@/constants/Colors';
import type { AdminOverviewResponse } from '@milobedini/shared-types';

type OpsItem = {
  key: string;
  label: string;
  value: string | number;
  detail: string;
  accent?: string;
};

const formatDelta = (current: number, previous: number): string => {
  const diff = current - previous;
  if (diff === 0) return 'no change';
  const sign = diff > 0 ? '+' : '';
  return `${sign}${diff} vs prev`;
};

type Props = {
  operational: AdminOverviewResponse['operational'];
  verificationCount: number;
};

const OpsFooter = memo(({ operational, verificationCount }: Props) => {
  const { users, work } = operational;

  const items: OpsItem[] = [
    {
      key: 'active30d',
      label: 'Active · 30d',
      value: users.activeLast30d,
      detail: formatDelta(users.activeLast30d, users.activeLast30dPrevious)
    },
    {
      key: 'verifyQueue',
      label: 'Verification queue',
      value: verificationCount,
      detail: verificationCount === 0 ? 'empty' : 'oldest first'
    },
    {
      key: 'stalled',
      label: 'Stalled 7d+',
      value: work.stalledAttempts7d,
      detail: 'started, idle',
      accent: work.stalledAttempts7d > 0 ? Colors.primary.warning : undefined
    },
    {
      key: 'orphaned',
      label: 'Orphaned',
      value: work.orphanedAssignments,
      detail: 'unverified therapist',
      accent: work.orphanedAssignments > 0 ? Colors.primary.error : undefined
    }
  ];

  return (
    <View>
      <ThemedText
        type="smallBold"
        style={{
          color: Colors.sway.darkGrey,
          marginBottom: 8,
          fontSize: 11,
          letterSpacing: 0.8,
          textTransform: 'uppercase'
        }}
      >
        Operational · below the clinical fold
      </ThemedText>
      <View className="flex-row flex-wrap gap-2">
        {items.map((item) => (
          <View key={item.key} className="flex-1 rounded-xl bg-chip-darkCardDeep px-3 py-3" style={{ minWidth: '46%' }}>
            <ThemedText
              type="small"
              style={{ color: Colors.sway.darkGrey, fontSize: 11, textTransform: 'uppercase', letterSpacing: 0.6 }}
            >
              {item.label}
            </ThemedText>
            <ThemedText
              type="subtitle"
              style={{ color: item.accent ?? Colors.sway.lightGrey, marginTop: 4, lineHeight: 28 }}
            >
              {item.value}
            </ThemedText>
            <ThemedText type="small" style={{ color: Colors.sway.darkGrey, marginTop: 2, fontSize: 11 }}>
              {item.detail}
            </ThemedText>
          </View>
        ))}
      </View>
    </View>
  );
});

OpsFooter.displayName = 'OpsFooter';

export default OpsFooter;
