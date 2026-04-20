import { memo } from 'react';
import { View } from 'react-native';
import { ThemedText } from '@/components/ThemedText';
import { Colors } from '@/constants/Colors';
import type { OutcomeResult } from '@milobedini/shared-types';

type OutcomeRow = {
  key: 'recovery' | 'reliableImprovement' | 'reliableRecovery';
  label: string;
  definition: string;
  accent: string;
  result: OutcomeResult;
};

const formatRate = (result: OutcomeResult): string => {
  if (result.suppressed) {
    return result.reason === 'below_k' ? `< ${Math.max(result.n, 5)} patients` : 'insufficient data';
  }
  const pct = Math.round((result.rate ?? 0) * 100);
  return `${pct}%`;
};

type Props = {
  recovery: OutcomeResult;
  reliableImprovement: OutcomeResult;
  reliableRecovery: OutcomeResult;
  cutoffLabel: string; // e.g. "PHQ-9 ≥ 10"
  reliableChangeDeltaLabel?: string; // e.g. "Δ ≥ 6 PHQ-9 points"
};

const OutcomeTriplet = memo(
  ({ recovery, reliableImprovement, reliableRecovery, cutoffLabel, reliableChangeDeltaLabel }: Props) => {
    const rows: OutcomeRow[] = [
      {
        key: 'recovery',
        label: 'Recovery',
        definition: `Above cutoff → below (${cutoffLabel})`,
        accent: Colors.sway.bright,
        result: recovery
      },
      {
        key: 'reliableImprovement',
        label: 'Reliable improvement',
        definition: reliableChangeDeltaLabel
          ? `${reliableChangeDeltaLabel} — clinically meaningful Δ`
          : 'No Δ defined for this instrument',
        accent: Colors.primary.info,
        result: reliableImprovement
      },
      {
        key: 'reliableRecovery',
        label: 'Reliable recovery',
        definition: 'Both criteria (strictest)',
        accent: Colors.sway.bright,
        result: reliableRecovery
      }
    ];

    return (
      <View className="gap-2">
        {rows.map((row) => {
          const isSuppressed = row.result.suppressed;
          return (
            <View
              key={row.key}
              className="flex-row items-center rounded-xl px-3 py-3"
              style={{
                backgroundColor: isSuppressed ? Colors.chip.darkCardDeep : Colors.chip.pill,
                opacity: isSuppressed ? 0.8 : 1
              }}
            >
              <View className="mr-3 size-2 rounded-full" style={{ backgroundColor: row.accent }} />
              <View className="flex-1">
                <ThemedText
                  type="smallBold"
                  style={{ color: isSuppressed ? Colors.sway.darkGrey : Colors.sway.lightGrey }}
                >
                  {row.label}
                </ThemedText>
                <ThemedText type="small" style={{ color: Colors.sway.darkGrey, marginTop: 2, fontSize: 11 }}>
                  {row.definition}
                </ThemedText>
              </View>
              <View className="items-end">
                <ThemedText
                  type="smallTitle"
                  style={{
                    color: isSuppressed ? Colors.sway.darkGrey : row.accent,
                    fontStyle: isSuppressed ? 'italic' : 'normal',
                    lineHeight: 22
                  }}
                >
                  {formatRate(row.result)}
                </ThemedText>
                <ThemedText type="small" style={{ color: Colors.sway.darkGrey, marginTop: 0, fontSize: 11 }}>
                  n={row.result.n}
                </ThemedText>
              </View>
            </View>
          );
        })}
      </View>
    );
  }
);

OutcomeTriplet.displayName = 'OutcomeTriplet';

export default OutcomeTriplet;
