import { memo } from 'react';
import { View } from 'react-native';
import { ThemedText } from '@/components/ThemedText';
import { Colors } from '@/constants/Colors';
import { formatCompactTimeAgo } from '@/utils/dates';
import type { PrivacyMode } from '@milobedini/shared-types';
import Icon from '@react-native-vector-icons/material-design-icons';

type Props = {
  asOf: string;
  rollupAsOf: string | null;
  privacyMode: PrivacyMode;
};

const FreshnessRow = memo(({ asOf, rollupAsOf, privacyMode }: Props) => {
  const isDev = privacyMode === 'reduced';
  const rollupLabel = rollupAsOf ? `Rollup · ${formatCompactTimeAgo(rollupAsOf)}` : 'Rollup · never run';

  return (
    <View className="flex-row flex-wrap items-center gap-2">
      <View className="flex-row items-center gap-1.5 rounded-full bg-chip-pill px-2.5 py-1">
        <Icon name="clock-outline" size={12} color={Colors.sway.darkGrey} />
        <ThemedText type="small" style={{ color: Colors.sway.darkGrey, fontSize: 11 }}>
          Live · {formatCompactTimeAgo(asOf)}
        </ThemedText>
      </View>
      <View className="flex-row items-center gap-1.5 rounded-full bg-chip-pill px-2.5 py-1">
        <Icon
          name={rollupAsOf ? 'database-check-outline' : 'database-alert-outline'}
          size={12}
          color={rollupAsOf ? Colors.sway.bright : Colors.sway.darkGrey}
        />
        <ThemedText
          type="small"
          style={{ color: rollupAsOf ? Colors.sway.lightGrey : Colors.sway.darkGrey, fontSize: 11 }}
        >
          {rollupLabel}
        </ThemedText>
      </View>
      {isDev && (
        <View
          className="flex-row items-center gap-1.5 rounded-full px-2.5 py-1"
          style={{ backgroundColor: Colors.tint.info, borderWidth: 1, borderColor: Colors.tint.infoBorder }}
        >
          <Icon name="alert-circle-outline" size={12} color={Colors.primary.info} />
          <ThemedText type="small" style={{ color: Colors.primary.info, fontSize: 11 }}>
            Dev mode · reduced privacy
          </ThemedText>
        </View>
      )}
    </View>
  );
});

FreshnessRow.displayName = 'FreshnessRow';

export default FreshnessRow;
