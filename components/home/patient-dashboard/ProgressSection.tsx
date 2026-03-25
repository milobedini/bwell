import { memo, useCallback } from 'react';
import { Pressable, View } from 'react-native';
import { useRouter } from 'expo-router';
import { ThemedText } from '@/components/ThemedText';
import { Colors } from '@/constants/Colors';
import type { ScoreTrendItem } from '@milobedini/shared-types';

import Sparkline from './Sparkline';

type ProgressSectionProps = {
  trends: ScoreTrendItem[];
};

const ScoreCard = memo(({ trend }: { trend: ScoreTrendItem }) => {
  const router = useRouter();

  const handlePress = useCallback(() => {
    router.push('/(main)/(tabs)/attempts');
  }, [router]);

  const hasPrevious = trend.previousScore !== null;
  const delta = hasPrevious ? trend.latestScore - trend.previousScore! : 0;
  // Lower is better for all current questionnaires (PHQ-9, GAD-7, PDSS)
  const deltaColor = delta < 0 ? Colors.primary.success : delta > 0 ? Colors.primary.error : Colors.sway.darkGrey;
  const deltaArrow = delta < 0 ? '▼' : delta > 0 ? '▲' : '—';
  const sparklineColor = delta <= 0 ? Colors.primary.success : Colors.primary.error;

  return (
    <Pressable
      onPress={handlePress}
      className="flex-1 rounded-[14px] p-3.5"
      style={({ pressed }) => ({
        backgroundColor: pressed ? Colors.chip.pillPressed : Colors.chip.darkCard
      })}
    >
      <ThemedText type="small" style={{ color: Colors.sway.darkGrey, fontWeight: '600' }}>
        {trend.moduleTitle}
      </ThemedText>
      {hasPrevious ? (
        <View className="mt-2 flex-row items-center gap-1.5">
          <ThemedText type="smallTitle" style={{ color: deltaColor, fontSize: 18 }}>
            {deltaArrow} {Math.abs(delta)}
          </ThemedText>
          <Sparkline data={trend.sparkline} color={sparklineColor} />
        </View>
      ) : (
        <View className="mt-2 flex-row items-center gap-1">
          <ThemedText type="small" style={{ color: Colors.sway.bright, fontWeight: '600', fontSize: 14 }}>
            ✓ done
          </ThemedText>
        </View>
      )}
    </Pressable>
  );
});

ScoreCard.displayName = 'ScoreCard';

const ProgressSection = memo(({ trends }: ProgressSectionProps) => {
  if (trends.length === 0) return null;

  return (
    <View className="mb-5">
      <ThemedText
        type="smallBold"
        style={{
          color: Colors.sway.darkGrey,
          textTransform: 'uppercase',
          letterSpacing: 1.2,
          fontSize: 12,
          marginBottom: 10
        }}
      >
        Your Progress
      </ThemedText>
      <View className="flex-row gap-2">
        {trends.map((trend) => (
          <ScoreCard key={trend.moduleId} trend={trend} />
        ))}
      </View>
    </View>
  );
});

ProgressSection.displayName = 'ProgressSection';

export default ProgressSection;
