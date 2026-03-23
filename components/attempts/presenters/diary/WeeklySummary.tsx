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
  { key: 'avgMood', label: 'Avg Mood', color: Colors.diary.moodWarm },
  { key: 'avgAchievement', label: 'Avg Achievement', color: Colors.sway.bright },
  { key: 'avgCloseness', label: 'Avg Closeness', color: Colors.diary.closeness },
  { key: 'avgEnjoyment', label: 'Avg Enjoyment', color: Colors.diary.enjoyment }
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
      <View
        style={{
          backgroundColor: Colors.sway.buttonBackground,
          borderRadius: 8,
          marginBottom: 12,
          overflow: 'hidden'
        }}
      >
        <Pressable
          onPress={toggle}
          style={{
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: 12
          }}
          accessibilityRole="button"
          accessibilityState={{ expanded: open }}
          accessibilityLabel={`Weekly Summary, ${visibleMetrics.length} metrics`}
        >
          <ThemedText style={{ fontFamily: Fonts.Bold, fontSize: 13 }}>Weekly Summary</ThemedText>
          <MaterialCommunityIcons name={open ? 'chevron-up' : 'chevron-down'} size={20} color={Colors.sway.lightGrey} />
        </Pressable>

        {open && (
          <View
            style={{
              flexDirection: 'row',
              flexWrap: 'wrap',
              gap: 6,
              paddingHorizontal: 12,
              paddingBottom: 12
            }}
          >
            {visibleMetrics.map((m) => (
              <View
                key={m.key}
                style={{
                  backgroundColor: Colors.sway.dark,
                  borderRadius: 6,
                  padding: 8,
                  alignItems: 'center',
                  flexBasis: '48%',
                  flexGrow: 1
                }}
              >
                <ThemedText style={{ fontSize: 20, fontFamily: Fonts.Bold, color: m.color }}>
                  {(totals[m.key] as number).toFixed(1)}
                </ThemedText>
                <ThemedText style={{ fontSize: 10, color: Colors.sway.darkGrey }}>{m.label}</ThemedText>
              </View>
            ))}
          </View>
        )}
      </View>
    );
  },
  (prev, next) =>
    prev.totals.count === next.totals.count &&
    prev.totals.avgMood === next.totals.avgMood &&
    prev.totals.avgAchievement === next.totals.avgAchievement &&
    prev.totals.avgCloseness === next.totals.avgCloseness &&
    prev.totals.avgEnjoyment === next.totals.avgEnjoyment &&
    prev.defaultOpen === next.defaultOpen
);

WeeklySummary.displayName = 'WeeklySummary';

export default WeeklySummary;
