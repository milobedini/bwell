import { memo, useCallback } from 'react';
import { Pressable, TextInput, View } from 'react-native';
import { ThemedText } from '@/components/ThemedText';
import { Colors } from '@/constants/Colors';
import { Fonts } from '@/constants/Typography';
import MaterialCommunityIcons from '@react-native-vector-icons/material-design-icons';

import MetricStepper from './MetricStepper';
import MoodSlider from './MoodSlider';
import ReflectionPrompt from './ReflectionPrompt';

type SlotAccordionPanelProps = {
  label: string;
  activity: string;
  mood: number | undefined;
  achievement: number | undefined;
  closeness: number | undefined;
  enjoyment: number | undefined;
  isFilled: boolean;
  isComplete: boolean;
  canEdit: boolean;
  showReflectionPrompt: boolean;
  reflectionPrompt: string;
  onActivityChange: (text: string) => void;
  onMoodChange: (value: number) => void;
  onStepperChange: (field: 'achievement' | 'closeness' | 'enjoyment', value: number) => void;
  onCollapse: () => void;
};

const getDotColor = (isComplete: boolean, isFilled: boolean): string => {
  if (isComplete) return Colors.sway.bright;
  if (isFilled) return Colors.diary.moodWarm;
  return Colors.chip.dotInactive;
};

const SlotAccordionPanel = memo(
  ({
    label,
    activity,
    mood,
    achievement,
    closeness,
    enjoyment,
    isFilled,
    isComplete,
    canEdit,
    showReflectionPrompt,
    reflectionPrompt,
    onActivityChange,
    onMoodChange,
    onStepperChange,
    onCollapse
  }: SlotAccordionPanelProps) => {
    const dotColor = getDotColor(isComplete, isFilled);

    const handleAchievementChange = useCallback(
      (value: number) => onStepperChange('achievement', value),
      [onStepperChange]
    );

    const handleClosenessChange = useCallback(
      (value: number) => onStepperChange('closeness', value),
      [onStepperChange]
    );

    const handleEnjoymentChange = useCallback(
      (value: number) => onStepperChange('enjoyment', value),
      [onStepperChange]
    );

    return (
      <View
        style={{
          backgroundColor: Colors.diary.panelBg,
          borderWidth: 1,
          borderColor: Colors.diary.panelBorder,
          borderRadius: 12,
          padding: 16
        }}
      >
        {/* Header row */}
        <Pressable
          onPress={onCollapse}
          accessibilityRole="button"
          accessibilityLabel={`${label}. Double tap to collapse`}
          className="flex-row items-center active:opacity-70"
        >
          <View
            style={{
              width: 8,
              height: 8,
              borderRadius: 4,
              backgroundColor: dotColor,
              marginRight: 8
            }}
          />
          <ThemedText type="small" style={{ color: Colors.sway.bright, flex: 1 }}>
            {label}
          </ThemedText>
          <MaterialCommunityIcons name="chevron-down" size={16} color={Colors.sway.darkGrey} />
        </Pressable>

        {/* Content */}
        <View className="mt-3 gap-3">
          {/* Reflection prompt */}
          {showReflectionPrompt && canEdit && <ReflectionPrompt prompt={reflectionPrompt} />}

          {/* Activity */}
          {canEdit ? (
            <View>
              <ThemedText
                style={{
                  color: Colors.sway.darkGrey,
                  fontSize: 10,
                  textTransform: 'uppercase',
                  letterSpacing: 0.8,
                  fontFamily: Fonts.Bold,
                  marginBottom: 4
                }}
              >
                Activity
              </ThemedText>
              <TextInput
                value={activity}
                onChangeText={onActivityChange}
                placeholder="What did you do?"
                placeholderTextColor={Colors.sway.darkGrey}
                style={{
                  backgroundColor: Colors.sway.dark,
                  borderRadius: 10,
                  padding: 12,
                  borderWidth: 1,
                  borderColor: Colors.tint.tealBorder,
                  color: Colors.sway.lightGrey,
                  fontSize: 14,
                  fontFamily: Fonts.Regular
                }}
              />
            </View>
          ) : (
            activity !== '' && (
              <ThemedText type="small" style={{ color: Colors.sway.lightGrey }}>
                {activity}
              </ThemedText>
            )
          )}

          {/* Mood slider */}
          <MoodSlider value={mood} onChange={onMoodChange} disabled={!canEdit} />

          {/* Stepper grid */}
          <View className="flex-row gap-2">
            <View className="flex-1">
              <MetricStepper
                label="Achievement"
                value={achievement}
                color={Colors.diary.enjoyment}
                onChange={handleAchievementChange}
                disabled={!canEdit}
              />
            </View>
            <View className="flex-1">
              <MetricStepper
                label="Closeness"
                value={closeness}
                color={Colors.diary.closeness}
                onChange={handleClosenessChange}
                disabled={!canEdit}
              />
            </View>
            <View className="flex-1">
              <MetricStepper
                label="Enjoyment"
                value={enjoyment}
                color={Colors.diary.enjoyment}
                onChange={handleEnjoymentChange}
                disabled={!canEdit}
              />
            </View>
          </View>
        </View>
      </View>
    );
  }
);

SlotAccordionPanel.displayName = 'SlotAccordionPanel';

export default SlotAccordionPanel;
