import { memo, useMemo } from 'react';
import { View } from 'react-native';
import { ThemedText } from '@/components/ThemedText';
import { Colors } from '@/constants/Colors';
import type { AdminOutcomesResponse } from '@milobedini/shared-types';

const MONTH_ABBR = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const CHART_HEIGHT = 48;
const SUPPRESSED_NOTCH_RATIO = 0.18; // pale notch so axis stays contiguous even with no data.
const MIN_BAR_HEIGHT = 3;

const formatBucketLabel = (iso: string): string => {
  const d = new Date(iso);
  const yy = String(d.getUTCFullYear()).slice(-2);
  return `${MONTH_ABBR[d.getUTCMonth()]} '${yy}`;
};

type DeltaTone = 'up' | 'down' | 'flat' | 'none';

type DeltaSummary = {
  tone: DeltaTone;
  label: string;
};

const computeDelta = (series: AdminOutcomesResponse['series']): DeltaSummary => {
  const resolved = series
    .map((b) => (!b.recovery.suppressed && b.recovery.rate !== null ? b.recovery.rate : null))
    .filter((v): v is number => v !== null);
  if (resolved.length < 2) return { tone: 'none', label: 'Not enough data' };
  const first = resolved[0];
  const last = resolved[resolved.length - 1];
  const deltaPp = Math.round((last - first) * 100);
  if (deltaPp === 0) return { tone: 'flat', label: '→ flat vs start' };
  if (deltaPp > 0) return { tone: 'up', label: `↑ ${deltaPp}pp vs start` };
  return { tone: 'down', label: `↓ ${Math.abs(deltaPp)}pp vs start` };
};

type Props = {
  series: AdminOutcomesResponse['series'];
  instrumentLabel: string;
};

const OutcomesSparkline = memo(({ series, instrumentLabel }: Props) => {
  const delta = useMemo(() => computeDelta(series), [series]);

  if (series.length === 0) return null;

  const deltaColour =
    delta.tone === 'up' ? Colors.sway.bright : delta.tone === 'down' ? Colors.primary.error : Colors.sway.darkGrey;

  const firstLabel = formatBucketLabel(series[0].bucket.startsAt);
  const lastLabel = formatBucketLabel(series[series.length - 1].bucket.startsAt);
  const midIdx = Math.floor((series.length - 1) / 2);
  const midLabel = formatBucketLabel(series[midIdx].bucket.startsAt);

  return (
    <View
      className="mt-4 rounded-xl px-3 py-3"
      style={{ backgroundColor: Colors.chip.darkCardDeep, borderColor: Colors.divider.light, borderWidth: 1 }}
    >
      <View className="flex-row items-center justify-between">
        <ThemedText
          type="small"
          style={{ color: Colors.sway.darkGrey, fontSize: 11, letterSpacing: 0.6, textTransform: 'uppercase' }}
        >
          {instrumentLabel} recovery · {series.length} months
        </ThemedText>
        <ThemedText type="small" style={{ color: deltaColour, fontSize: 12 }}>
          {delta.label}
        </ThemedText>
      </View>

      <View className="mt-3 flex-row items-end gap-1" style={{ height: CHART_HEIGHT }}>
        {series.map((bucket, idx) => {
          const { recovery } = bucket;
          const isSuppressed = recovery.suppressed || recovery.rate === null;
          const ratio = isSuppressed ? SUPPRESSED_NOTCH_RATIO : Math.min(1, Math.max(0, recovery.rate ?? 0));
          const height = Math.max(MIN_BAR_HEIGHT, Math.round(ratio * CHART_HEIGHT));
          return (
            <View
              key={`${bucket.bucket.startsAt}-${idx}`}
              style={{
                flex: 1,
                height,
                borderRadius: 2,
                backgroundColor: isSuppressed ? Colors.divider.medium : Colors.sway.bright,
                opacity: isSuppressed ? 0.7 : 1
              }}
            />
          );
        })}
      </View>

      <View className="mt-2 flex-row justify-between">
        <ThemedText type="small" style={{ color: Colors.sway.darkGrey, fontSize: 11 }}>
          {firstLabel}
        </ThemedText>
        <ThemedText type="small" style={{ color: Colors.sway.darkGrey, fontSize: 11 }}>
          {midLabel}
        </ThemedText>
        <ThemedText type="small" style={{ color: Colors.sway.darkGrey, fontSize: 11 }}>
          {lastLabel}
        </ThemedText>
      </View>
    </View>
  );
});

OutcomesSparkline.displayName = 'OutcomesSparkline';

export default OutcomesSparkline;
