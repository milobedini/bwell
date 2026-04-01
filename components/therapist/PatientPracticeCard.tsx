import { memo } from 'react';
import { Pressable, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Colors } from '@/constants/Colors';
import { dueLabel, formatShortDate } from '@/utils/dates';
import { getModuleIcon } from '@/utils/moduleIcons';
import type { PracticeItem } from '@milobedini/shared-types';
import MaterialCommunityIcons from '@react-native-vector-icons/material-design-icons';

import { ThemedText } from '../ThemedText';

type PatientPracticeCardProps = {
  item: PracticeItem;
  sparkline?: number[];
  patientId: string;
};

const SPARKLINE_BAR_COUNT = 5;
const SPARKLINE_MAX_HEIGHT = 20;

const Sparkline = ({ values }: { values: number[] }) => {
  const maxValue = Math.max(...values, 1);
  const bars = values.slice(-SPARKLINE_BAR_COUNT);

  return (
    <View className="flex-row items-end gap-0.5" style={{ height: SPARKLINE_MAX_HEIGHT }}>
      {bars.map((value, index) => {
        const isLast = index === bars.length - 1;
        const height = Math.max(3, Math.round((value / maxValue) * SPARKLINE_MAX_HEIGHT));
        return (
          <View
            key={index}
            style={{
              width: 4,
              height,
              borderRadius: 2,
              backgroundColor: isLast ? Colors.sway.bright : Colors.sway.darkGrey
            }}
          />
        );
      })}
    </View>
  );
};

const PatientPracticeCardBase = ({ item, sparkline, patientId }: PatientPracticeCardProps) => {
  const router = useRouter();
  const isCompleted = item.status === 'completed';
  const isInProgress = item.status === 'in_progress';
  const icon = getModuleIcon(item.moduleType);

  const hasAttempt = !!item.latestAttempt?.attemptId;

  const handlePress = () => {
    if (!hasAttempt) return; // Nothing to view for not-started items
    router.push({
      pathname: '/(main)/(tabs)/review/[id]',
      params: { id: item.latestAttempt!.attemptId, patientId }
    });
  };

  const statusText = (() => {
    if (isCompleted && item.latestAttempt?.completedAt) {
      return `Submitted ${formatShortDate(item.latestAttempt.completedAt)}`;
    }
    if (isInProgress && item.percentComplete > 0) {
      return `${Math.round(item.percentComplete)}% complete`;
    }
    return 'Not started';
  })();

  const recurrenceLabel = (() => {
    if (!item.recurrence || item.recurrence.freq === 'none') return null;
    const interval = item.recurrence.interval ?? 1;
    if (item.recurrence.freq === 'weekly') {
      return interval === 1 ? 'Weekly' : `Every ${interval} weeks`;
    }
    return interval === 1 ? 'Monthly' : `Every ${interval} months`;
  })();

  return (
    <Pressable
      onPress={handlePress}
      disabled={!hasAttempt}
      className="active:opacity-80"
      style={{ backgroundColor: Colors.chip.darkCard, borderRadius: 12, padding: 12 }}
    >
      <View className="flex-row items-center gap-3">
        {/* Module icon */}
        <View
          className="items-center justify-center rounded-lg"
          style={{ width: 36, height: 36, backgroundColor: Colors.chip.darkCardAlt }}
        >
          <MaterialCommunityIcons
            name={icon}
            size={18}
            color={isCompleted ? Colors.sway.darkGrey : Colors.sway.bright}
          />
        </View>

        {/* Content */}
        <View className="flex-1 gap-0.5">
          <View className="flex-row items-center gap-2">
            <ThemedText type="smallBold" style={{ flexShrink: 1 }}>
              {item.moduleTitle}
            </ThemedText>
            {item.attemptCount > 1 ? (
              <View
                className="items-center justify-center rounded-full px-1.5 py-0.5"
                style={{ backgroundColor: Colors.chip.pill }}
              >
                <ThemedText type="small" style={{ color: Colors.sway.darkGrey }}>
                  #{item.attemptCount}
                </ThemedText>
              </View>
            ) : null}
          </View>

          <ThemedText type="small" style={{ color: isCompleted ? Colors.sway.darkGrey : Colors.sway.bright }}>
            {statusText}
          </ThemedText>

          <View className="flex-row flex-wrap gap-2">
            {item.dueAt ? (
              <ThemedText type="small" style={{ color: Colors.sway.darkGrey }}>
                {dueLabel(item.dueAt)}
              </ThemedText>
            ) : null}
            {recurrenceLabel ? (
              <ThemedText type="small" style={{ color: Colors.sway.darkGrey }}>
                {recurrenceLabel}
              </ThemedText>
            ) : null}
          </View>
        </View>

        {/* Right: score + sparkline or chevron */}
        <View className="items-end gap-1">
          {isCompleted && item.latestAttempt?.totalScore !== undefined && item.latestAttempt.scoreBandLabel ? (
            <View className="items-end">
              <ThemedText type="smallBold" style={{ color: Colors.sway.bright }}>
                {item.latestAttempt.totalScore}
              </ThemedText>
              <ThemedText type="small" style={{ color: Colors.sway.darkGrey }}>
                {item.latestAttempt.scoreBandLabel}
              </ThemedText>
            </View>
          ) : null}
          {sparkline && sparkline.length > 1 ? (
            <Sparkline values={sparkline} />
          ) : hasAttempt ? (
            <MaterialCommunityIcons name="chevron-right" size={18} color={Colors.sway.darkGrey} />
          ) : null}
        </View>
      </View>
    </Pressable>
  );
};

const PatientPracticeCard = memo(PatientPracticeCardBase);

export default PatientPracticeCard;
