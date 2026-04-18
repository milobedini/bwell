import { useEffect, useRef, useState } from 'react';
import { Pressable, TextInput, View } from 'react-native';
import { MotiView } from 'moti';
import { ThemedText } from '@/components/ThemedText';
import { Colors } from '@/constants/Colors';
import MaterialCommunityIcons from '@react-native-vector-icons/material-design-icons';

import BloomGlow from './BloomGlow';
import type { GoalWithId } from './useWeeklyGoalsState';

// Subtle colour accent rotation. Kept small — the angle is conversational, not rainbow.
const ACCENTS = [Colors.sway.bright, Colors.diary.enjoyment, Colors.diary.moodCool, Colors.diary.moodWarm] as const;

const MiniRating = ({
  label,
  value,
  onChange,
  accent,
  disabled
}: {
  label: string;
  value: number | null;
  onChange: (v: number | null) => void;
  accent: string;
  disabled?: boolean;
}) => (
  <View className="gap-1.5">
    <View className="flex-row items-center justify-between">
      <ThemedText
        type="small"
        style={{ color: Colors.sway.darkGrey, letterSpacing: 1.2, textTransform: 'uppercase', fontSize: 10 }}
      >
        {label}
      </ThemedText>
      <ThemedText type="smallBold" style={{ color: value == null ? Colors.sway.darkGrey : accent }}>
        {value == null ? '—' : `${value}`}
        <ThemedText type="small" style={{ color: Colors.sway.darkGrey }}>
          {' / 10'}
        </ThemedText>
      </ThemedText>
    </View>
    <View className="flex-row gap-[2px]">
      {Array.from({ length: 11 }, (_, i) => i).map((n) => {
        const filled = value != null && n <= value;
        return (
          <Pressable
            key={n}
            disabled={disabled}
            onPress={() => onChange(value === n ? null : n)}
            hitSlop={4}
            accessibilityRole="button"
            accessibilityLabel={`${label} ${n} out of 10`}
            accessibilityState={{ selected: value === n }}
            className="flex-1 active:opacity-70"
            style={{
              height: 14,
              borderRadius: 2,
              backgroundColor: filled ? accent : Colors.chip.darkCardAlt,
              opacity: filled ? (value === n ? 1 : 0.6) : 1
            }}
          />
        );
      })}
    </View>
  </View>
);

type MomentCardProps = {
  goal: GoalWithId;
  index: number;
  canEdit: boolean;
  isActive: boolean;
  onFocus: () => void;
  onBlur: () => void;
  onGoalTextChange: (text: string) => void;
  onToggleCompleted: () => void;
  onUpdateMastery: (v: number | null) => void;
  onUpdatePleasure: (v: number | null) => void;
  onUpdateNotes: (v: string) => void;
  onRemove: () => void;
};

const MomentCard = ({
  goal,
  index,
  canEdit,
  isActive,
  onFocus,
  onBlur,
  onGoalTextChange,
  onToggleCompleted,
  onUpdateMastery,
  onUpdatePleasure,
  onUpdateNotes,
  onRemove
}: MomentCardProps) => {
  const accent = ACCENTS[index % ACCENTS.length];
  const [expanded, setExpanded] = useState(isActive || goal.completed);
  const [bloomTrigger, setBloomTrigger] = useState(0);
  const prevCompletedRef = useRef(goal.completed);

  // Fire the bloom only on false→true transitions so un-ticking stays silent.
  useEffect(() => {
    if (goal.completed && !prevCompletedRef.current) {
      setExpanded(true);
      setBloomTrigger((n) => n + 1);
    }
    prevCompletedRef.current = goal.completed;
  }, [goal.completed]);

  const showDetails = canEdit && (expanded || isActive);

  return (
    <MotiView
      from={{ opacity: 0, translateX: 12 }}
      animate={{ opacity: 1, translateX: 0 }}
      transition={{ type: 'timing', duration: 260 }}
      className="flex-row"
    >
      <View className="mr-3 items-center" style={{ width: 16 }}>
        <View
          className="h-3 w-3 rounded-sm"
          style={{
            backgroundColor: goal.completed ? accent : Colors.chip.darkCardDeep,
            borderWidth: 1.5,
            borderColor: accent,
            transform: [{ rotate: '45deg' }],
            marginTop: 10
          }}
        />
        <View className="mt-2 flex-1" style={{ width: 1, backgroundColor: Colors.divider.medium }} />
      </View>

      <View
        className="mb-5 flex-1"
        style={{
          backgroundColor: Colors.chip.darkCard,
          borderLeftWidth: 2,
          borderLeftColor: accent,
          paddingLeft: 14,
          paddingRight: 14,
          paddingVertical: 14
        }}
      >
        <View className="mb-2 flex-row items-center justify-between">
          <View className="flex-row items-center gap-2">
            <ThemedText
              type="smallBold"
              style={{
                color: accent,
                letterSpacing: 1.5,
                textTransform: 'uppercase',
                fontSize: 10
              }}
            >
              You · Goal {index + 1}
            </ThemedText>
            {goal.completed && (
              <View
                className="flex-row items-center gap-1 rounded-sm px-1.5 py-0.5"
                style={{ backgroundColor: Colors.tint.teal }}
              >
                <MaterialCommunityIcons name="check" size={10} color={Colors.sway.bright} />
                <ThemedText type="smallBold" style={{ color: Colors.sway.bright, fontSize: 10 }}>
                  DONE
                </ThemedText>
              </View>
            )}
          </View>

          {canEdit && (
            <Pressable
              onPress={onRemove}
              hitSlop={8}
              accessibilityRole="button"
              accessibilityLabel={`Remove goal ${index + 1}`}
              className="active:opacity-60"
            >
              <MaterialCommunityIcons name="close" size={16} color={Colors.sway.darkGrey} />
            </Pressable>
          )}
        </View>

        {canEdit ? (
          <TextInput
            value={goal.goalText}
            onChangeText={onGoalTextChange}
            onFocus={() => {
              setExpanded(true);
              onFocus();
            }}
            onBlur={onBlur}
            placeholder="Type what you'd like to do…"
            placeholderTextColor={Colors.sway.darkGrey}
            multiline
            blurOnSubmit
            returnKeyType="done"
            style={{
              color: Colors.sway.lightGrey,
              fontSize: 17,
              fontFamily: 'Lato-Regular',
              lineHeight: 24,
              minHeight: 24,
              paddingVertical: 2
            }}
            accessibilityLabel={`Goal ${index + 1} text`}
          />
        ) : (
          <ThemedText type="default">{goal.goalText || '—'}</ThemedText>
        )}

        {canEdit && (
          <View className="mt-3 self-start">
            <View
              pointerEvents="none"
              style={{
                position: 'absolute',
                left: -20,
                top: -20,
                right: -20,
                bottom: -20,
                alignItems: 'flex-start',
                justifyContent: 'center'
              }}
            >
              <BloomGlow trigger={bloomTrigger} size={96} />
            </View>
            <Pressable
              onPress={onToggleCompleted}
              className="flex-row items-center gap-2 rounded-full px-3 py-1.5 active:opacity-70"
              style={{
                backgroundColor: goal.completed ? Colors.tint.teal : Colors.chip.darkCardDeep,
                borderWidth: 1,
                borderColor: goal.completed ? Colors.tint.tealBorder : Colors.divider.medium
              }}
              accessibilityRole="checkbox"
              accessibilityState={{ checked: goal.completed }}
              accessibilityLabel={`Mark goal ${index + 1} as ${goal.completed ? 'not done' : 'done'}`}
            >
              <MaterialCommunityIcons
                name={goal.completed ? 'check-circle' : 'circle-outline'}
                size={14}
                color={goal.completed ? Colors.sway.bright : Colors.sway.darkGrey}
              />
              <ThemedText
                type="smallBold"
                style={{ color: goal.completed ? Colors.sway.bright : Colors.sway.darkGrey }}
              >
                {goal.completed ? "I've done this" : 'Tap when done'}
              </ThemedText>
            </Pressable>
          </View>
        )}

        {showDetails && (
          <MotiView
            from={{ opacity: 0, translateY: -6 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ type: 'timing', duration: 200 }}
            className="mt-4 gap-4"
          >
            {goal.completed && (
              <View className="flex-row items-start gap-3">
                <View
                  className="mt-0.5 h-6 w-6 items-center justify-center rounded-full"
                  style={{
                    backgroundColor: Colors.tintSubtle.teal,
                    borderWidth: 1,
                    borderColor: Colors.tint.tealBorder
                  }}
                >
                  <ThemedText type="smallBold" style={{ color: Colors.sway.bright, fontSize: 11 }}>
                    ?
                  </ThemedText>
                </View>
                <View className="flex-1">
                  <ThemedText
                    type="small"
                    style={{
                      color: Colors.sway.darkGrey,
                      letterSpacing: 1.2,
                      textTransform: 'uppercase',
                      fontSize: 10
                    }}
                  >
                    Coach
                  </ThemedText>
                  <ThemedText type="default" style={{ color: Colors.sway.lightGrey, marginTop: 2, lineHeight: 22 }}>
                    How did that feel?
                  </ThemedText>
                  <ThemedText type="small" style={{ color: Colors.sway.darkGrey, marginTop: 2, fontStyle: 'italic' }}>
                    Optional — only if it helps you notice something.
                  </ThemedText>
                </View>
              </View>
            )}

            <MiniRating
              label="Mastery (how well)"
              value={goal.masteryRating}
              onChange={onUpdateMastery}
              accent={accent}
            />
            <MiniRating
              label="Pleasure (how good)"
              value={goal.pleasureRating}
              onChange={onUpdatePleasure}
              accent={accent}
            />

            <View>
              <ThemedText
                type="small"
                style={{
                  color: Colors.sway.darkGrey,
                  letterSpacing: 1.2,
                  textTransform: 'uppercase',
                  fontSize: 10,
                  marginBottom: 6
                }}
              >
                A quick note (optional)
              </ThemedText>
              <TextInput
                value={goal.completionNotes ?? ''}
                onChangeText={onUpdateNotes}
                placeholder="Anything you want to remember about this one?"
                placeholderTextColor={Colors.sway.darkGrey}
                multiline
                blurOnSubmit
                returnKeyType="done"
                style={{
                  backgroundColor: Colors.chip.darkCardDeep,
                  color: Colors.sway.lightGrey,
                  borderRadius: 6,
                  padding: 10,
                  minHeight: 44,
                  fontSize: 14,
                  fontFamily: 'Lato-Regular'
                }}
              />
            </View>
          </MotiView>
        )}

        {!canEdit && (goal.masteryRating != null || goal.pleasureRating != null || goal.completionNotes) && (
          <View className="mt-3 gap-3">
            {goal.masteryRating != null && (
              <MiniRating label="Mastery" value={goal.masteryRating} onChange={() => {}} accent={accent} disabled />
            )}
            {goal.pleasureRating != null && (
              <MiniRating label="Pleasure" value={goal.pleasureRating} onChange={() => {}} accent={accent} disabled />
            )}
            {goal.completionNotes && (
              <View
                className="rounded-sm p-3"
                style={{ backgroundColor: Colors.chip.darkCardDeep, borderLeftWidth: 2, borderLeftColor: accent }}
              >
                <ThemedText type="small" style={{ color: Colors.sway.lightGrey }}>
                  {goal.completionNotes}
                </ThemedText>
              </View>
            )}
          </View>
        )}

        {canEdit && !isActive && expanded && (
          <Pressable
            onPress={() => setExpanded(false)}
            className="mt-3 self-start active:opacity-70"
            hitSlop={6}
            accessibilityLabel="Collapse goal details"
          >
            <ThemedText type="small" style={{ color: Colors.sway.darkGrey, letterSpacing: 1.2, fontSize: 10 }}>
              ⌃ HIDE DETAILS
            </ThemedText>
          </Pressable>
        )}
        {canEdit && !isActive && !expanded && (
          <Pressable
            onPress={() => setExpanded(true)}
            className="mt-3 self-start active:opacity-70"
            hitSlop={6}
            accessibilityLabel="Show goal details"
          >
            <ThemedText type="small" style={{ color: Colors.sway.darkGrey, letterSpacing: 1.2, fontSize: 10 }}>
              ⌄ RATE OR NOTE
            </ThemedText>
          </Pressable>
        )}
      </View>
    </MotiView>
  );
};

export default MomentCard;
