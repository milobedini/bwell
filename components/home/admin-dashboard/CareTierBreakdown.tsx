import { memo } from 'react';
import { View } from 'react-native';
import { ThemedText } from '@/components/ThemedText';
import { Colors } from '@/constants/Colors';
import type { CareTier, OutcomeResult } from '@milobedini/shared-types';

const TIER_LABEL: Record<CareTier, string> = {
  self_help: 'Self-help',
  cbt_guided: 'CBT',
  pwp_guided: 'PWP'
};

type Props = {
  rows: { careTier: CareTier; recovery: OutcomeResult }[];
};

const CareTierBreakdown = memo(({ rows }: Props) => {
  return (
    <View className="mt-2 gap-1.5">
      {rows.map((row) => {
        const isSuppressed = row.recovery.suppressed;
        const value = isSuppressed
          ? row.recovery.reason === 'below_k'
            ? '< 5 patients'
            : 'insufficient'
          : `${Math.round((row.recovery.rate ?? 0) * 100)}%`;
        return (
          <View key={row.careTier} className="flex-row items-center justify-between">
            <ThemedText type="small" style={{ color: Colors.sway.darkGrey, fontSize: 11 }}>
              {TIER_LABEL[row.careTier]}
            </ThemedText>
            <ThemedText
              type="smallBold"
              style={{
                color: isSuppressed ? Colors.sway.darkGrey : Colors.sway.lightGrey,
                fontStyle: isSuppressed ? 'italic' : 'normal',
                fontSize: 12
              }}
            >
              {value}
            </ThemedText>
          </View>
        );
      })}
    </View>
  );
});

CareTierBreakdown.displayName = 'CareTierBreakdown';

export default CareTierBreakdown;
