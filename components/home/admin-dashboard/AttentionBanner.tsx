import { type ComponentProps, memo } from 'react';
import { Pressable, View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { ThemedText } from '@/components/ThemedText';
import { Colors } from '@/constants/Colors';
import type { AttentionContributor, AttentionContributorKey, AttentionScore } from '@/utils/attentionScore';
import Icon from '@react-native-vector-icons/material-design-icons';

type MdiName = ComponentProps<typeof Icon>['name'];

// SVG ring geometry: r=50 → circumference ≈ 2π·50 ≈ 314.
const RING_SIZE = 120;
const RING_RADIUS = 50;
const RING_CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS;

type BandStyle = {
  bg: string;
  border: string;
  accent: string;
  rowTint: string;
};

const BAND_STYLES: Record<AttentionScore['band'], BandStyle> = {
  green: {
    bg: Colors.tint.teal,
    border: Colors.tint.tealBorder,
    accent: Colors.sway.bright,
    rowTint: Colors.tintSubtle.teal
  },
  amber: {
    bg: Colors.tint.info,
    border: Colors.tint.infoBorder,
    accent: Colors.primary.warning,
    rowTint: Colors.chip.pill
  },
  red: {
    bg: Colors.tint.error,
    border: Colors.tint.errorBorder,
    accent: Colors.primary.error,
    rowTint: Colors.chip.pill
  },
  unknown: {
    bg: Colors.tint.neutral,
    border: Colors.divider.medium,
    accent: Colors.sway.darkGrey,
    rowTint: Colors.chip.pill
  }
};

// Per-contributor icon vocabulary — colour-blind friendly paired with colour.
// The rollup icon flips with state: sync-alert when stale or never run,
// check-circle-outline when fresh. Other icons stay stable because they
// represent the concept, not the state.
const iconFor = ({ key, tripped }: { key: AttentionContributorKey; tripped: boolean }): MdiName => {
  if (key === 'rollup') return tripped ? 'sync-alert' : 'check-circle-outline';
  switch (key) {
    case 'verification':
      return 'account-clock-outline';
    case 'stalled':
      return 'timer-sand';
    case 'orphaned':
      return 'link-variant-off';
  }
};

type RingProps = {
  band: AttentionScore['band'];
  trippedCount: number;
  totalChecks: number;
  accent: string;
};

const AttentionRing = memo(({ band, trippedCount, totalChecks, accent }: RingProps) => {
  const proportion = totalChecks > 0 ? Math.min(1, Math.max(0, trippedCount / totalChecks)) : 0;
  const offset = RING_CIRCUMFERENCE * (1 - proportion);
  const isUnknown = band === 'unknown';
  const centerGlyph = band === 'green' ? '0' : isUnknown ? '?' : String(trippedCount);

  return (
    <View className="items-center justify-center" style={{ width: RING_SIZE, height: RING_SIZE }}>
      <Svg width={RING_SIZE} height={RING_SIZE} viewBox={`0 0 ${RING_SIZE} ${RING_SIZE}`}>
        <Circle
          cx={RING_SIZE / 2}
          cy={RING_SIZE / 2}
          r={RING_RADIUS}
          stroke={Colors.divider.medium}
          strokeWidth={8}
          fill="none"
          strokeDasharray={isUnknown ? '6 6' : undefined}
        />
        {!isUnknown && (
          <Circle
            cx={RING_SIZE / 2}
            cy={RING_SIZE / 2}
            r={RING_RADIUS}
            stroke={accent}
            strokeWidth={8}
            fill="none"
            strokeLinecap="round"
            strokeDasharray={`${RING_CIRCUMFERENCE} ${RING_CIRCUMFERENCE}`}
            strokeDashoffset={offset}
            transform={`rotate(-90 ${RING_SIZE / 2} ${RING_SIZE / 2})`}
          />
        )}
      </Svg>
      <View className="absolute items-center justify-center">
        <ThemedText type="title" style={{ color: accent, fontSize: 36, lineHeight: 40 }}>
          {centerGlyph}
        </ThemedText>
        <ThemedText
          type="small"
          style={{ color: Colors.sway.darkGrey, fontSize: 11, marginTop: 2, letterSpacing: 0.4 }}
        >
          {isUnknown ? 'awaiting data' : `of ${totalChecks} checks`}
        </ThemedText>
      </View>
    </View>
  );
});

AttentionRing.displayName = 'AttentionRing';

type ContributorRowProps = {
  contributor: AttentionContributor;
  accent: string;
  onPress?: () => void;
};

const ContributorRow = memo(({ contributor, accent, onPress }: ContributorRowProps) => {
  const interactive = !!onPress;
  const glyphColour = contributor.tripped ? accent : Colors.sway.darkGrey;
  const glyphBg = contributor.tripped ? accent + '22' : Colors.chip.dotInactive;

  const content = (
    <View className="flex-row items-start gap-3 px-4 py-3">
      <View className="size-8 items-center justify-center rounded-full" style={{ backgroundColor: glyphBg }}>
        <Icon name={iconFor({ key: contributor.key, tripped: contributor.tripped })} size={16} color={glyphColour} />
      </View>
      <View className="flex-1">
        <View className="flex-row items-center justify-between gap-2">
          <ThemedText type="smallBold" style={{ color: Colors.sway.lightGrey }}>
            {contributor.label}
          </ThemedText>
          <ThemedText type="small" style={{ color: contributor.tripped ? accent : Colors.sway.darkGrey, fontSize: 13 }}>
            {contributor.value}
          </ThemedText>
        </View>
        <ThemedText type="small" style={{ color: Colors.sway.darkGrey, marginTop: 2, fontSize: 12, lineHeight: 16 }}>
          {contributor.detail}
        </ThemedText>
        {contributor.ctaLabel && (
          <ThemedText type="small" style={{ color: accent, marginTop: 6, fontSize: 12, letterSpacing: 0.3 }}>
            {contributor.ctaLabel}
          </ThemedText>
        )}
      </View>
    </View>
  );

  if (interactive) {
    return (
      <Pressable onPress={onPress} className="active:bg-chip-pillPressed">
        {content}
      </Pressable>
    );
  }
  return content;
});

ContributorRow.displayName = 'ContributorRow';

export type AttentionBannerProps = {
  score: AttentionScore;
  onPressVerification?: () => void;
  onPressStalled?: () => void;
  onPressOrphaned?: () => void;
  onPressRollup?: () => void;
};

const AttentionBanner = memo(
  ({ score, onPressVerification, onPressStalled, onPressOrphaned, onPressRollup }: AttentionBannerProps) => {
    const style = BAND_STYLES[score.band];
    const handlers: Record<AttentionContributorKey, (() => void) | undefined> = {
      verification: onPressVerification,
      stalled: onPressStalled,
      orphaned: onPressOrphaned,
      rollup: onPressRollup
    };

    return (
      <View
        accessibilityRole="summary"
        className="overflow-hidden rounded-2xl border"
        style={{ backgroundColor: style.bg, borderColor: style.border }}
      >
        <View className="items-center px-4 pb-3 pt-5">
          <AttentionRing
            band={score.band}
            trippedCount={score.trippedCount}
            totalChecks={score.totalChecks}
            accent={style.accent}
          />
          <ThemedText type="smallTitle" style={{ color: Colors.sway.lightGrey, marginTop: 12, textAlign: 'center' }}>
            {score.headline}
          </ThemedText>
          <ThemedText
            type="small"
            style={{ color: Colors.sway.darkGrey, marginTop: 4, textAlign: 'center', fontSize: 12 }}
          >
            {score.band === 'unknown'
              ? 'The nightly rollup has not completed yet'
              : `${score.trippedCount} of ${score.totalChecks} checks tripped`}
          </ThemedText>
        </View>

        <View className="border-t" style={{ borderColor: Colors.divider.light }}>
          {score.contributors.map((c) => {
            // A row is interactive if the score has surfaced a ctaLabel for it
            // (and a handler has been wired). This lets attentionScore decide
            // when a contributor earns a drill-in — rollup is always on,
            // verification opens whenever the queue is non-empty, and
            // stalled / orphaned only light up when tripped.
            const handler = c.ctaLabel ? handlers[c.key] : undefined;
            return <ContributorRow key={c.key} contributor={c} accent={style.accent} onPress={handler} />;
          })}
        </View>
      </View>
    );
  }
);

AttentionBanner.displayName = 'AttentionBanner';

export default AttentionBanner;
