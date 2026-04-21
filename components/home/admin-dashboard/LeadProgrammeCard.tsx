import { memo } from 'react';
import { View } from 'react-native';
import { ThemedText } from '@/components/ThemedText';
import { Colors } from '@/constants/Colors';
import { useAdminOutcomes } from '@/hooks/useAdminOutcomes';
import type { AdminOverviewResponse } from '@milobedini/shared-types';

import OutcomesSparkline from './OutcomesSparkline';
import OutcomeTriplet from './OutcomeTriplet';

type ProgrammeSummary = AdminOverviewResponse['programmes'][number];

const INSTRUMENT_LABEL: Record<string, string> = {
  phq9: 'PHQ-9',
  gad7: 'GAD-7',
  pdss: 'PDSS'
};

const INSTRUMENT_CUTOFF: Record<string, string> = {
  phq9: 'PHQ-9 ≥ 10',
  gad7: 'GAD-7 ≥ 8',
  pdss: 'PDSS ≥ 8'
};

const INSTRUMENT_DELTA: Record<string, string | undefined> = {
  phq9: 'Δ ≥ 6 PHQ-9 points',
  gad7: 'Δ ≥ 4 GAD-7 points',
  pdss: undefined
};

const formatLeadRate = (rate: number | null, suppressed: boolean): string => {
  if (suppressed) return '—';
  return `${Math.round((rate ?? 0) * 100)}`;
};

type Props = {
  programme: ProgrammeSummary;
};

const LeadProgrammeCard = memo(({ programme }: Props) => {
  const outcomes = programme.outcomes;
  const instrumentLabel = outcomes
    ? (INSTRUMENT_LABEL[outcomes.instrument] ?? outcomes.instrument.toUpperCase())
    : null;
  const { data: trend } = useAdminOutcomes({
    instrument: outcomes?.instrument ?? 'phq9',
    programmeId: programme.programmeId,
    granularity: 'month',
    enabled: !!outcomes
  });

  if (!outcomes || !instrumentLabel) return null;

  const cutoffLabel = INSTRUMENT_CUTOFF[outcomes.instrument] ?? `${instrumentLabel} cutoff`;
  const deltaLabel = INSTRUMENT_DELTA[outcomes.instrument];
  const lead = outcomes.recovery;

  return (
    <View
      className="rounded-2xl border p-4"
      style={{ backgroundColor: Colors.chip.darkCard, borderColor: Colors.tint.tealBorder }}
    >
      <ThemedText
        type="small"
        style={{ color: Colors.sway.darkGrey, fontSize: 11, letterSpacing: 0.8, textTransform: 'uppercase' }}
      >
        Lead programme
      </ThemedText>
      <ThemedText type="smallBold" style={{ color: Colors.sway.lightGrey, marginTop: 2 }}>
        {programme.title} · {instrumentLabel}
      </ThemedText>

      <View className="mt-3 flex-row items-baseline gap-2">
        <ThemedText
          type="title"
          style={{
            color: lead.suppressed ? Colors.sway.darkGrey : Colors.sway.bright,
            fontSize: 56,
            lineHeight: 60,
            fontStyle: lead.suppressed ? 'italic' : 'normal'
          }}
        >
          {formatLeadRate(lead.rate, lead.suppressed)}
        </ThemedText>
        {!lead.suppressed && (
          <ThemedText type="subtitle" style={{ color: Colors.sway.bright, lineHeight: 28 }}>
            %
          </ThemedText>
        )}
      </View>
      <ThemedText type="small" style={{ color: Colors.sway.darkGrey, marginTop: -2 }}>
        Recovery · n = {lead.n} paired assessments · last 90 days
      </ThemedText>

      <View className="mt-4">
        <OutcomeTriplet
          recovery={outcomes.recovery}
          reliableImprovement={outcomes.reliableImprovement}
          reliableRecovery={outcomes.reliableRecovery}
          cutoffLabel={cutoffLabel}
          reliableChangeDeltaLabel={deltaLabel}
        />
      </View>

      {trend && trend.series.length > 0 && (
        <OutcomesSparkline series={trend.series} instrumentLabel={instrumentLabel} />
      )}
    </View>
  );
});

LeadProgrammeCard.displayName = 'LeadProgrammeCard';

export default LeadProgrammeCard;
