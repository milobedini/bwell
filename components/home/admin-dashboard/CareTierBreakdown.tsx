import { memo } from 'react';
import { View } from 'react-native';
import { ThemedText } from '@/components/ThemedText';
import { Colors } from '@/constants/Colors';
import { TIER_LABEL } from '@/utils/adminLabels';
import type { CareTier, OutcomeResult } from '@milobedini/shared-types';

const TIER_PILL: Record<CareTier, { background: string; color: string }> = {
  self_help: { background: Colors.tint.neutral, color: Colors.sway.darkGrey },
  cbt_guided: { background: Colors.tint.teal, color: Colors.sway.bright },
  pwp_guided: { background: Colors.therapist.tint, color: Colors.therapist.purpleLight }
};

const formatCell = (result: OutcomeResult): { value: string; subscript: string | null; suppressed: boolean } => {
  if (result.suppressed) {
    const label = result.reason === 'below_k' ? `< ${Math.max(result.n, 5)} patients` : 'insufficient';
    return { value: label, subscript: null, suppressed: true };
  }
  return {
    value: `${Math.round((result.rate ?? 0) * 100)}%`,
    subscript: `n=${result.n}`,
    suppressed: false
  };
};

type Row = {
  careTier: CareTier;
  recovery: OutcomeResult;
  reliableImprovement: OutcomeResult;
  reliableRecovery: OutcomeResult;
};

type Props = {
  rows: Row[];
};

const CareTierBreakdown = memo(({ rows }: Props) => {
  return (
    <View
      className="mt-3 overflow-hidden rounded-2xl border"
      style={{ backgroundColor: Colors.chip.darkCard, borderColor: Colors.divider.medium }}
    >
      {/* Header row */}
      <View
        className="flex-row items-center px-4 py-2.5"
        style={{ backgroundColor: Colors.chip.darkCardDeep, borderBottomWidth: 1, borderColor: Colors.divider.light }}
      >
        <View className="flex-1">
          <ThemedText
            type="small"
            style={{
              color: Colors.sway.darkGrey,
              fontSize: 10,
              letterSpacing: 0.8,
              textTransform: 'uppercase'
            }}
          >
            Tier
          </ThemedText>
        </View>
        {(['Rec.', 'Rel. imp.', 'Rel. rec.'] as const).map((label) => (
          <View key={label} className="ml-2 items-end" style={{ minWidth: 60 }}>
            <ThemedText
              type="small"
              style={{
                color: Colors.sway.darkGrey,
                fontSize: 10,
                letterSpacing: 0.8,
                textTransform: 'uppercase'
              }}
            >
              {label}
            </ThemedText>
          </View>
        ))}
      </View>

      {rows.map((row, index) => {
        const pill = TIER_PILL[row.careTier];
        const rec = formatCell(row.recovery);
        const imp = formatCell(row.reliableImprovement);
        const rr = formatCell(row.reliableRecovery);
        const isLast = index === rows.length - 1;

        return (
          <View
            key={row.careTier}
            className="flex-row items-center px-4 py-3"
            style={{
              borderBottomWidth: isLast ? 0 : 1,
              borderColor: Colors.divider.light
            }}
          >
            <View className="flex-1">
              <View className="self-start rounded-md px-2 py-0.5" style={{ backgroundColor: pill.background }}>
                <ThemedText
                  type="smallBold"
                  style={{
                    color: pill.color,
                    fontSize: 10,
                    letterSpacing: 0.4,
                    textTransform: 'uppercase'
                  }}
                >
                  {TIER_LABEL[row.careTier]}
                </ThemedText>
              </View>
            </View>
            {[rec, imp, rr].map((cell, i) => (
              <View key={i} className="ml-2 items-end" style={{ minWidth: 60 }}>
                <ThemedText
                  type="smallBold"
                  style={{
                    color: cell.suppressed ? Colors.sway.darkGrey : Colors.sway.lightGrey,
                    fontStyle: cell.suppressed ? 'italic' : 'normal',
                    fontSize: cell.suppressed ? 11 : 13
                  }}
                >
                  {cell.value}
                </ThemedText>
                {cell.subscript && (
                  <ThemedText type="small" style={{ color: Colors.sway.darkGrey, fontSize: 10 }}>
                    {cell.subscript}
                  </ThemedText>
                )}
              </View>
            ))}
          </View>
        );
      })}
    </View>
  );
});

CareTierBreakdown.displayName = 'CareTierBreakdown';

export default CareTierBreakdown;
