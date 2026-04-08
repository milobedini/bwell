import { memo, useState } from 'react';
import { LayoutAnimation, Platform, Pressable, UIManager, View } from 'react-native';
import { ThemedText } from '@/components/ThemedText';
import { Colors } from '@/constants/Colors';
import { Fonts } from '@/constants/Typography';
import type { DiaryTotals } from '@milobedini/shared-types';
import MaterialCommunityIcons from '@react-native-vector-icons/material-design-icons';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

type MetricConfig = {
  key: keyof Omit<DiaryTotals, 'count'>;
  label: string;
  color: string;
};

const METRICS: MetricConfig[] = [
  { key: 'avgMood', label: 'Mood', color: Colors.diary.moodWarm },
  { key: 'avgAchievement', label: 'Achieve', color: Colors.diary.enjoyment },
  { key: 'avgCloseness', label: 'Close', color: Colors.diary.closeness },
  { key: 'avgEnjoyment', label: 'Enjoy', color: Colors.diary.enjoyment }
];

type WeeklySummaryProps = {
  totals: DiaryTotals;
  defaultOpen?: boolean;
};

const WeeklySummary = memo(
  ({ totals, defaultOpen = false }: WeeklySummaryProps) => {
    const [open, setOpen] = useState(defaultOpen);
    const visibleMetrics = METRICS.filter((m) => totals[m.key] != null);

    if (visibleMetrics.length === 0) return null;

    const toggle = () => {
      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
      setOpen((prev) => !prev);
    };

    return (
      <View style={{ backgroundColor: Colors.chip.darkCard, borderRadius: 12, padding: 14, marginTop: 8 }}>
        <Pressable
          onPress={toggle}
          style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}
          accessibilityRole="button"
          accessibilityState={{ expanded: open }}
          accessibilityLabel={`Weekly Summary, ${visibleMetrics.length} metrics`}
        >
          <ThemedText style={{ fontFamily: Fonts.Bold, fontSize: 13 }}>Weekly Summary</ThemedText>
          <MaterialCommunityIcons name={open ? 'chevron-up' : 'chevron-down'} size={16} color={Colors.sway.darkGrey} />
        </Pressable>

        {open && (
          <View style={{ flexDirection: 'row', gap: 8, marginTop: 12 }}>
            {visibleMetrics.map((m) => (
              <View
                key={m.key}
                style={{
                  flex: 1,
                  backgroundColor: Colors.sway.dark,
                  borderRadius: 8,
                  paddingVertical: 10,
                  paddingHorizontal: 6,
                  alignItems: 'center'
                }}
              >
                <ThemedText style={{ color: Colors.sway.darkGrey, fontSize: 9, marginBottom: 4 }}>{m.label}</ThemedText>
                <ThemedText style={{ fontSize: 18, fontFamily: Fonts.Bold, color: m.color }}>
                  {(totals[m.key] as number).toFixed(1)}
                </ThemedText>
              </View>
            ))}
          </View>
        )}
      </View>
    );
  },
  (prev, next) =>
    prev.defaultOpen === next.defaultOpen &&
    prev.totals.count === next.totals.count &&
    METRICS.every((m) => prev.totals[m.key] === next.totals[m.key])
);

WeeklySummary.displayName = 'WeeklySummary';

export default WeeklySummary;
