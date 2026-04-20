import { useRef } from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { MotiView } from 'moti';
import { ThemedText } from '@/components/ThemedText';
import BloomBurst, { type BloomBurstHandle } from '@/components/ui/BloomBurst';
import { Colors } from '@/constants/Colors';
import MaterialCommunityIcons from '@react-native-vector-icons/material-design-icons';

import type { GoalWithId } from './useWeeklyGoalsState';

type WeekRailProps = {
  goals: GoalWithId[];
  completedCount: number;
  activeIndex: number | null;
  canEdit: boolean;
  onPressGoal: (index: number) => void;
  onToggle?: (index: number) => void;
};

type WeekRailChipProps = {
  goal: GoalWithId;
  index: number;
  active: boolean;
  canEdit: boolean;
  onPressGoal: (index: number) => void;
  onToggle?: (index: number) => void;
};

const WeekRailChip = ({ goal, index, active, canEdit, onPressGoal, onToggle }: WeekRailChipProps) => {
  const done = goal.completed;
  const bloomRef = useRef<BloomBurstHandle>(null);

  const handlePress = () => {
    if (canEdit && onToggle) {
      // Bloom fires only on the false→true transition at the tapped chip.
      if (!done) bloomRef.current?.bloom();
      onToggle(index);
      return;
    }
    onPressGoal(index);
  };

  return (
    <MotiView
      from={{ opacity: 0, translateY: 4 }}
      animate={{ opacity: 1, translateY: 0 }}
      transition={{ type: 'timing', duration: 220, delay: index * 40 }}
    >
      <View>
        <View
          pointerEvents="none"
          style={{
            position: 'absolute',
            top: -30,
            bottom: -30,
            left: -30,
            right: -30,
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 10
          }}
        >
          <BloomBurst ref={bloomRef} size={120} />
        </View>
        <Pressable
          onPress={handlePress}
          onLongPress={canEdit ? () => onPressGoal(index) : undefined}
          className="flex-row items-center gap-2 rounded-full px-3 py-2 active:opacity-70"
          style={{
            backgroundColor: active ? Colors.chip.pillPressed : Colors.chip.pill,
            borderWidth: 1,
            borderColor: active ? Colors.sway.bright : done ? Colors.tint.tealBorder : Colors.chip.pillBorder,
            maxWidth: 240
          }}
          accessibilityRole={canEdit && onToggle ? 'checkbox' : 'button'}
          accessibilityState={canEdit && onToggle ? { checked: done } : undefined}
          accessibilityLabel={`Goal ${index + 1}: ${goal.goalText || 'empty'}${done ? ', completed' : ''}${
            canEdit && onToggle ? '. Tap to toggle, long-press to edit.' : ''
          }`}
        >
          <MaterialCommunityIcons
            name={done ? 'check-circle' : 'circle-outline'}
            size={16}
            color={done ? Colors.sway.bright : Colors.sway.darkGrey}
          />
          <ThemedText
            type="smallBold"
            numberOfLines={1}
            style={{
              color: done ? Colors.sway.lightGrey : Colors.sway.darkGrey,
              textDecorationLine: done ? 'line-through' : 'none',
              textDecorationColor: Colors.sway.darkGrey,
              maxWidth: 180
            }}
          >
            {goal.goalText.trim() || `Goal ${index + 1}`}
          </ThemedText>
        </Pressable>
      </View>
    </MotiView>
  );
};

// Persistent visible list. Horizontal chips with tick toggle (patient view) or pulse (edit).
// Explicitly NOT a list of bubbles, so the user never loses sight of the week.
const WeekRail = ({ goals, completedCount, activeIndex, canEdit, onPressGoal, onToggle }: WeekRailProps) => {
  const total = goals.length;

  if (total === 0) {
    return (
      <View className="px-4 py-3">
        <View className="flex-row items-center gap-2">
          <View className="h-1 w-8 rounded-full" style={{ backgroundColor: Colors.chip.dotInactive }} />
          <ThemedText
            type="small"
            style={{ color: Colors.sway.darkGrey, letterSpacing: 2, fontSize: 11, textTransform: 'uppercase' }}
          >
            Your week
          </ThemedText>
          <View className="flex-1" />
          <ThemedText type="small" style={{ color: Colors.sway.darkGrey }}>
            {'–'} / 7
          </ThemedText>
        </View>
      </View>
    );
  }

  return (
    <View className="px-4 py-3" style={{ borderBottomWidth: 1, borderBottomColor: Colors.divider.light }}>
      <View className="mb-2 flex-row items-center gap-2">
        <View className="h-1 w-8 rounded-full" style={{ backgroundColor: Colors.sway.bright }} />
        <ThemedText
          type="small"
          style={{ color: Colors.sway.darkGrey, letterSpacing: 2, fontSize: 11, textTransform: 'uppercase' }}
        >
          Your week
        </ThemedText>
        <View className="flex-1" />
        <ThemedText type="smallBold" style={{ color: Colors.sway.lightGrey }}>
          {completedCount}
          <ThemedText type="small" style={{ color: Colors.sway.darkGrey }}>
            {' '}
            / {total}
          </ThemedText>
        </ThemedText>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingRight: 4 }}>
        {goals.map((goal, i) => (
          <WeekRailChip
            key={goal._uid}
            goal={goal}
            index={i}
            active={i === activeIndex}
            canEdit={canEdit}
            onPressGoal={onPressGoal}
            onToggle={onToggle}
          />
        ))}
      </ScrollView>
    </View>
  );
};

export default WeekRail;
