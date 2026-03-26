import { memo, useCallback } from 'react';
import { Pressable, View } from 'react-native';
import { useRouter } from 'expo-router';
import { ThemedText } from '@/components/ThemedText';
import { Colors } from '@/constants/Colors';

type EffortStripProps = {
  weeklyCompletion: { completed: number; total: number };
  onTimeStreak: { current: number; history: ('on_time' | 'late')[] };
};

const DOT_COLORS = {
  on_time: Colors.sway.bright,
  late: Colors.primary.error
} as const;

const EffortStrip = memo(({ weeklyCompletion, onTimeStreak }: EffortStripProps) => {
  const router = useRouter();
  const { completed, total } = weeklyCompletion;
  const pct = total > 0 ? (completed / total) * 100 : 0;

  const goToAssignments = useCallback(() => {
    router.push('/(main)/(tabs)/assignments');
  }, [router]);

  return (
    <View className="mb-5 flex-row gap-2.5">
      {/* Weekly Completion */}
      <Pressable onPress={goToAssignments} className="flex-1 rounded-[14px] bg-chip-darkCard p-4">
        <View className="flex-row items-baseline">
          <ThemedText type="subtitle" style={{ color: Colors.sway.bright, fontSize: 30, lineHeight: 34 }}>
            {completed}
          </ThemedText>
          <ThemedText type="default" style={{ color: Colors.sway.darkGrey }}>
            /{total}
          </ThemedText>
        </View>
        <ThemedText type="small" className="mt-0.5" style={{ color: Colors.sway.darkGrey }}>
          {total === 0 ? 'No assignments yet' : 'Assignments done'}
        </ThemedText>
        <View className="mt-2.5 h-1 rounded-sm bg-chip-darkCardDeep">
          <View
            style={{
              width: `${pct}%`,
              height: '100%',
              backgroundColor: pct > 0 ? Colors.sway.bright : 'transparent',
              borderRadius: 2
            }}
          />
        </View>
      </Pressable>

      {/* On-Time Streak */}
      <View className="flex-1 rounded-[14px] bg-chip-darkCard p-4">
        <ThemedText type="subtitle" style={{ color: Colors.sway.bright, fontSize: 30, lineHeight: 34 }}>
          {onTimeStreak.current}
        </ThemedText>
        <ThemedText type="small" className="mt-0.5" style={{ color: Colors.sway.darkGrey }}>
          {onTimeStreak.history.length === 0 ? 'Complete your first on time' : 'On-time streak'}
        </ThemedText>
        <View className="mt-2.5 flex-row gap-1">
          {onTimeStreak.history.map((entry, i) => (
            <View
              key={i}
              style={{
                width: 10,
                height: 10,
                borderRadius: 5,
                backgroundColor: DOT_COLORS[entry]
              }}
            />
          ))}
        </View>
      </View>
    </View>
  );
});

EffortStrip.displayName = 'EffortStrip';

export default EffortStrip;
