import { memo } from 'react';
import { View } from 'react-native';
import { ThemedText } from '@/components/ThemedText';
import { Colors } from '@/constants/Colors';
import type { AdminOverviewResponse, OutcomeResult } from '@milobedini/shared-types';

type ProgrammeSummary = AdminOverviewResponse['programmes'][number];

const INSTRUMENT_LABEL: Record<string, string> = {
  phq9: 'PHQ-9',
  gad7: 'GAD-7',
  pdss: 'PDSS'
};

const formatRate = (r: OutcomeResult): string => {
  if (r.suppressed) return r.reason === 'below_k' ? '—' : '—';
  return `${Math.round((r.rate ?? 0) * 100)}%`;
};

type Props = {
  programme: ProgrammeSummary;
};

const ProgrammeRow = memo(({ programme }: Props) => {
  const outcomes = programme.outcomes;

  if (!outcomes) {
    return (
      <View className="flex-row items-center justify-between rounded-xl bg-chip-darkCardDeep px-4 py-3">
        <View className="flex-1 pr-2">
          <ThemedText type="smallBold" style={{ color: Colors.sway.lightGrey }}>
            {programme.title}
          </ThemedText>
          <ThemedText type="small" style={{ color: Colors.sway.darkGrey, marginTop: 2, fontSize: 11 }}>
            No clinical instrument · non-IAPT programme
          </ThemedText>
        </View>
        <View className="items-end">
          <ThemedText type="smallTitle" style={{ color: Colors.sway.lightGrey, lineHeight: 22 }}>
            {programme.enrolledUsers}
          </ThemedText>
          <ThemedText type="small" style={{ color: Colors.sway.darkGrey, fontSize: 11 }}>
            enrolled
          </ThemedText>
        </View>
      </View>
    );
  }

  const isSuppressed = outcomes.recovery.suppressed;
  const instrumentLabel = INSTRUMENT_LABEL[outcomes.instrument] ?? outcomes.instrument.toUpperCase();

  return (
    <View className="rounded-xl bg-chip-pill px-4 py-3">
      <View className="flex-row items-center justify-between">
        <View className="flex-1 pr-2">
          <ThemedText type="smallBold" style={{ color: Colors.sway.lightGrey }}>
            {programme.title}
          </ThemedText>
          <ThemedText type="small" style={{ color: Colors.sway.darkGrey, marginTop: 2, fontSize: 11 }}>
            {instrumentLabel} · n={outcomes.recovery.n} paired · last 90d
          </ThemedText>
        </View>
        <View className="items-end">
          <ThemedText
            type="smallTitle"
            style={{
              color: isSuppressed ? Colors.sway.darkGrey : Colors.sway.bright,
              fontStyle: isSuppressed ? 'italic' : 'normal',
              lineHeight: 22
            }}
          >
            {isSuppressed ? (outcomes.recovery.reason === 'below_k' ? '< 5' : '< 20') : formatRate(outcomes.recovery)}
          </ThemedText>
          <ThemedText type="small" style={{ color: Colors.sway.darkGrey, fontSize: 11 }}>
            recovery
          </ThemedText>
        </View>
      </View>
    </View>
  );
});

ProgrammeRow.displayName = 'ProgrammeRow';

export default ProgrammeRow;
