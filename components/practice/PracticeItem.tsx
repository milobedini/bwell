import { memo } from 'react';
import { Pressable, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Colors } from '@/constants/Colors';
import { dueLabel, formatShortDate } from '@/utils/dates';
import { getModuleIcon } from '@/utils/moduleIcons';
import type { PracticeItem as PracticeItemType } from '@milobedini/shared-types';
import MaterialCommunityIcons from '@react-native-vector-icons/material-design-icons';

import { ThemedText } from '../ThemedText';

type PracticeItemProps = {
  item: PracticeItemType;
};

const PracticeItemBase = ({ item }: PracticeItemProps) => {
  const router = useRouter();
  const isCompleted = item.status === 'completed';
  const isInProgress = item.status === 'in_progress';
  const icon = getModuleIcon(item.moduleType);

  const handlePress = () => {
    router.push({
      pathname: '/(main)/(tabs)/practice/[id]',
      params: { id: item.assignmentId }
    });
  };

  const cardStyle = isCompleted
    ? { backgroundColor: Colors.chip.darkCard }
    : {
        backgroundColor: Colors.tint.teal,
        borderWidth: 1,
        borderColor: Colors.tint.tealBorder
      };

  return (
    <Pressable
      onPress={handlePress}
      className="active:opacity-80"
      style={[{ borderRadius: 12, padding: 16 }, cardStyle]}
    >
      <View className="flex-row items-center gap-3">
        {/* Icon */}
        <View
          className="items-center justify-center rounded-lg"
          style={{
            width: 40,
            height: 40,
            backgroundColor: isCompleted ? Colors.chip.darkCardAlt : Colors.tint.teal
          }}
        >
          <MaterialCommunityIcons
            name={icon}
            size={20}
            color={isCompleted ? Colors.sway.darkGrey : Colors.sway.bright}
          />
        </View>

        {/* Content */}
        <View className="flex-1 gap-1">
          <ThemedText type="smallBold">{item.moduleTitle}</ThemedText>

          <View className="flex-row flex-wrap gap-2">
            {item.therapistName ? (
              <ThemedText type="small" style={{ color: Colors.sway.darkGrey }}>
                {item.therapistName}
              </ThemedText>
            ) : null}
            {item.dueAt ? (
              <ThemedText type="small" style={{ color: Colors.sway.darkGrey }}>
                {dueLabel(item.dueAt)}
              </ThemedText>
            ) : null}
            {isCompleted && item.latestAttempt?.completedAt ? (
              <ThemedText type="small" style={{ color: Colors.sway.darkGrey }}>
                Completed {formatShortDate(item.latestAttempt.completedAt)}
              </ThemedText>
            ) : null}
          </View>

          {/* Progress bar for in-progress items */}
          {isInProgress && item.percentComplete > 0 ? (
            <View
              className="mt-1 overflow-hidden rounded-full"
              style={{ height: 4, backgroundColor: Colors.chip.darkCardAlt }}
            >
              <View
                style={{
                  height: 4,
                  width: `${Math.min(100, Math.round(item.percentComplete))}%`,
                  backgroundColor: Colors.sway.bright,
                  borderRadius: 4
                }}
              />
            </View>
          ) : null}
        </View>

        {/* Right-side indicator */}
        <View className="items-end">
          {isCompleted && item.latestAttempt?.totalScore !== undefined && item.latestAttempt.scoreBandLabel ? (
            <View className="items-end gap-1">
              <ThemedText type="smallBold" style={{ color: Colors.sway.bright }}>
                {item.latestAttempt.totalScore}
              </ThemedText>
              <ThemedText type="small" style={{ color: Colors.sway.darkGrey }}>
                {item.latestAttempt.scoreBandLabel}
              </ThemedText>
            </View>
          ) : !isCompleted ? (
            <ThemedText type="smallBold" style={{ color: Colors.sway.bright }}>
              {isInProgress ? 'Continue' : 'Start'}
            </ThemedText>
          ) : null}
          <MaterialCommunityIcons name="chevron-right" size={18} color={Colors.sway.darkGrey} />
        </View>
      </View>
    </Pressable>
  );
};

const PracticeItem = memo(PracticeItemBase);

export default PracticeItem;
