import { memo, useCallback } from 'react';
import { Pressable, View } from 'react-native';
import { ThemedText } from '@/components/ThemedText';
import { Colors } from '@/constants/Colors';
import type { AttentionContributor, AttentionScore } from '@/utils/attentionScore';
import Icon from '@react-native-vector-icons/material-design-icons';

type AttentionBandStyle = {
  bg: string;
  border: string;
  accent: string;
  countIcon: string;
  // Icon name must match MaterialDesignIcons
  iconName: 'check-circle-outline' | 'alert-outline' | 'alert-octagon-outline' | 'help-circle-outline';
};

const BAND_STYLES: Record<AttentionScore['band'], AttentionBandStyle> = {
  green: {
    bg: Colors.tint.teal,
    border: Colors.tint.tealBorder,
    accent: Colors.sway.bright,
    countIcon: 'check',
    iconName: 'check-circle-outline'
  },
  amber: {
    bg: Colors.tint.info,
    border: Colors.tint.infoBorder,
    accent: Colors.primary.warning,
    countIcon: '!',
    iconName: 'alert-outline'
  },
  red: {
    bg: Colors.tint.error,
    border: Colors.tint.errorBorder,
    accent: Colors.primary.error,
    countIcon: '!',
    iconName: 'alert-octagon-outline'
  },
  unknown: {
    bg: Colors.tint.neutral,
    border: Colors.divider.medium,
    accent: Colors.sway.darkGrey,
    countIcon: '?',
    iconName: 'help-circle-outline'
  }
};

type ContributorRowProps = {
  contributor: AttentionContributor;
  onPress?: () => void;
  accent: string;
};

const ContributorRow = memo(({ contributor, onPress, accent }: ContributorRowProps) => {
  const interactive = !!onPress;
  const color = contributor.tripped ? accent : Colors.sway.darkGrey;

  const content = (
    <View className="flex-row items-center gap-3 px-4 py-3">
      <View
        className="size-6 items-center justify-center rounded-full"
        style={{ backgroundColor: contributor.tripped ? accent + '22' : Colors.chip.dotInactive }}
      >
        <ThemedText type="small" style={{ color, fontSize: 12, lineHeight: 14 }}>
          {contributor.tripped ? '!' : '✓'}
        </ThemedText>
      </View>
      <View className="flex-1">
        <ThemedText type="smallBold" style={{ color: Colors.sway.lightGrey }}>
          {contributor.label}
        </ThemedText>
        <ThemedText type="small" style={{ color: Colors.sway.darkGrey, marginTop: 2 }}>
          {contributor.detail}
        </ThemedText>
      </View>
      {interactive && <Icon name="chevron-right" size={18} color={Colors.sway.darkGrey} />}
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
};

const AttentionBanner = memo(({ score, onPressVerification }: AttentionBannerProps) => {
  const style = BAND_STYLES[score.band];
  const handleVerificationPress = useCallback(() => {
    onPressVerification?.();
  }, [onPressVerification]);

  return (
    <View
      accessibilityRole="summary"
      className="overflow-hidden rounded-2xl border"
      style={{ backgroundColor: style.bg, borderColor: style.border }}
    >
      <View className="flex-row items-center gap-4 px-4 py-4">
        <View
          className="size-14 items-center justify-center rounded-full border"
          style={{
            backgroundColor: style.accent + '1f',
            borderColor: style.accent + '55',
            borderStyle: score.band === 'unknown' ? 'dashed' : 'solid'
          }}
        >
          <ThemedText type="subtitle" style={{ color: style.accent, lineHeight: 28 }}>
            {score.band === 'green' ? '0' : score.band === 'unknown' ? '?' : `${score.trippedCount}`}
          </ThemedText>
        </View>
        <View className="flex-1">
          <ThemedText type="smallTitle" style={{ color: Colors.sway.lightGrey, lineHeight: 22 }}>
            {score.headline}
          </ThemedText>
          <ThemedText type="small" style={{ color: Colors.sway.darkGrey, marginTop: 2 }}>
            {score.band === 'unknown'
              ? 'The nightly rollup has not completed yet'
              : `${score.trippedCount} of ${score.totalChecks} checks tripped`}
          </ThemedText>
        </View>
      </View>

      <View className="border-t" style={{ borderColor: Colors.divider.light }}>
        {score.contributors.map((c) => (
          <ContributorRow
            key={c.key}
            contributor={c}
            accent={style.accent}
            onPress={c.key === 'verification' && c.tripped ? handleVerificationPress : undefined}
          />
        ))}
      </View>
    </View>
  );
});

AttentionBanner.displayName = 'AttentionBanner';

export default AttentionBanner;
