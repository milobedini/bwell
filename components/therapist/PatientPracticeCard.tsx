import { memo } from 'react';
import { Pressable, View } from 'react-native';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import { Colors } from '@/constants/Colors';
import { dueLabel, submittedLabel } from '@/utils/dates';
import { getModuleIcon } from '@/utils/moduleIcons';
import type { PracticeItem } from '@milobedini/shared-types';
import MaterialCommunityIcons from '@react-native-vector-icons/material-design-icons';

import { ThemedText } from '../ThemedText';
import BarSparkline from '../ui/BarSparkline';

type PatientPracticeCardProps = {
  item: PracticeItem;
  sparkline?: number[];
  patientId: string;
  patientName: string;
  onLongPress?: (item: PracticeItem) => void;
};

const SPARKLINE_BAR_COUNT = 5;
const SPARKLINE_MAX_HEIGHT = 20;

const PatientPracticeCardBase = ({ item, sparkline, patientName, onLongPress }: PatientPracticeCardProps) => {
  const router = useRouter();
  const isCompleted = item.status === 'completed';
  const isInProgress = item.status === 'in_progress';
  const icon = getModuleIcon(item.moduleType);

  const canNavigate =
    item.status !== 'not_started' && !!item.latestAttempt?.attemptId && !(isInProgress && item.percentComplete === 0);

  const handlePress = () => {
    router.push({
      pathname: '/(main)/(tabs)/patients/attempt/[id]',
      params: { id: item.latestAttempt!.attemptId, headerTitle: patientName }
    });
  };

  const handleLongPress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onLongPress?.(item);
  };

  const isOverdue = !isCompleted && !!item.dueAt && new Date(item.dueAt) < new Date();

  const statusText = (() => {
    if (isCompleted && item.latestAttempt?.completedAt) {
      return `Submitted ${submittedLabel(item.latestAttempt.completedAt)}`;
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
      onPress={canNavigate ? handlePress : undefined}
      onLongPress={handleLongPress}
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

          {isInProgress && item.percentComplete > 0 ? (
            <View
              className="overflow-hidden rounded-full"
              style={{ height: 4, backgroundColor: Colors.chip.darkCardAlt, marginTop: 2 }}
            >
              <View
                className="rounded-full"
                style={{
                  height: 4,
                  width: `${Math.round(item.percentComplete)}%`,
                  backgroundColor: Colors.sway.bright
                }}
              />
            </View>
          ) : null}

          {!isCompleted ? (
            <View className="flex-row flex-wrap items-center gap-2">
              {isOverdue ? (
                <View
                  className="rounded-full px-2 py-0.5"
                  style={{ backgroundColor: Colors.tint.error, borderWidth: 1, borderColor: Colors.tint.errorBorder }}
                >
                  <ThemedText type="small" style={{ color: Colors.primary.error }}>
                    Overdue
                  </ThemedText>
                </View>
              ) : null}
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
          ) : null}
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
            <BarSparkline values={sparkline} barCount={SPARKLINE_BAR_COUNT} maxHeight={SPARKLINE_MAX_HEIGHT} />
          ) : canNavigate ? (
            <MaterialCommunityIcons name="chevron-right" size={18} color={Colors.sway.darkGrey} />
          ) : null}
        </View>
      </View>
    </Pressable>
  );
};

const PatientPracticeCard = memo(PatientPracticeCardBase);

export default PatientPracticeCard;
