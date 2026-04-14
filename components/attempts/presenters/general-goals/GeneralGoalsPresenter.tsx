import { useCallback, useEffect, useRef } from 'react';
import { Pressable, ScrollView, TextInput, View } from 'react-native';
import { clsx } from 'clsx';
import ContentContainer from '@/components/ContentContainer';
import ThemedButton from '@/components/ThemedButton';
import { ThemedText } from '@/components/ThemedText';
import { Colors } from '@/constants/Colors';
import useDebouncedCallback from '@/utils/debounce';
import type { AttemptDetailResponseItem, PreviousRating } from '@milobedini/shared-types';

import { useGeneralGoalsState } from './useGeneralGoalsState';

const FIRST_ATTEMPT_PROMPTS = [
  'Are these goals in line with your values and what is important to you?',
  'Are your goals achievable or do you need to add some steps to get to the final outcome?',
  'Are these goals relevant to improving your mood?'
];

const RE_RATING_PROMPT = 'How do you feel about your progress towards these goals?';

const RATINGS = Array.from({ length: 11 }, (_, i) => i);

type GeneralGoalsPresenterProps = {
  attempt: AttemptDetailResponseItem;
  mode: 'view' | 'edit';
  patientName?: string;
};

// ── Rating row ──
const RatingRow = ({
  selected,
  onSelect,
  disabled
}: {
  selected: number | null;
  onSelect?: (rating: number) => void;
  disabled?: boolean;
}) => (
  <View className="flex-row flex-wrap gap-1.5">
    {RATINGS.map((n) => {
      const isSelected = selected === n;
      return (
        <Pressable
          key={n}
          disabled={disabled}
          onPress={() => onSelect?.(n)}
          className={clsx(
            'h-9 w-9 items-center justify-center rounded-lg',
            isSelected ? 'active:opacity-80' : 'active:opacity-60',
            disabled && 'opacity-50'
          )}
          style={{
            backgroundColor: isSelected ? Colors.sway.bright : Colors.chip.darkCardAlt
          }}
        >
          <ThemedText type="smallBold" style={{ color: isSelected ? Colors.sway.dark : Colors.sway.lightGrey }}>
            {n}
          </ThemedText>
        </Pressable>
      );
    })}
  </View>
);

// ── Previous ratings display ──
const PreviousRatingsRow = ({ entries, goalIndex }: { entries: PreviousRating[]; goalIndex: number }) => {
  if (entries.length === 0) return null;

  return (
    <View className="mt-2 gap-1">
      <ThemedText type="small" style={{ color: Colors.sway.darkGrey }}>
        Previous ratings
      </ThemedText>
      {entries.map((entry) => (
        <View key={entry.date} className="flex-row items-center gap-2">
          <ThemedText type="small" style={{ color: Colors.sway.darkGrey }}>
            {new Date(entry.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}:
          </ThemedText>
          <ThemedText type="smallBold">{entry.ratings[goalIndex] ?? '—'}</ThemedText>
        </View>
      ))}
    </View>
  );
};

const GeneralGoalsPresenter = ({ attempt, mode, patientName }: GeneralGoalsPresenterProps) => {
  const state = useGeneralGoalsState({ attempt, mode });

  // Debounced auto-save
  const debouncedSave = useDebouncedCallback(state.save, 2000);
  const prevDirtyRef = useRef(state.isDirty);

  useEffect(() => {
    if (state.isDirty && !prevDirtyRef.current) {
      debouncedSave();
    }
    prevDirtyRef.current = state.isDirty;
  }, [state.isDirty, debouncedSave]);

  const handleGoalTextChange = useCallback(
    (index: number, text: string) => {
      state.updateGoalText(index, text);
      debouncedSave();
    },
    [state.updateGoalText, debouncedSave]
  );

  const handleRatingChange = useCallback(
    (index: number, rating: number) => {
      state.updateGoalRating(index, rating);
      debouncedSave();
    },
    [state.updateGoalRating, debouncedSave]
  );

  const handleReflectionChange = useCallback(
    (text: string) => {
      state.updateReflection(text);
      debouncedSave();
    },
    [state.updateReflection, debouncedSave]
  );

  const reflectionPrompts = state.isReRating ? [RE_RATING_PROMPT] : FIRST_ATTEMPT_PROMPTS;

  // ── View mode (therapist review or patient viewing submitted) ──
  if (!state.canEdit) {
    return (
      <ContentContainer>
        <ScrollView contentContainerStyle={{ paddingBottom: 40 }}>
          {/* In-progress indicator for therapist */}
          {mode === 'view' && attempt.status !== 'submitted' && (
            <View
              className="mb-4 rounded-lg p-3"
              style={{
                backgroundColor: Colors.tint.info,
                borderColor: Colors.primary.info,
                borderWidth: 1
              }}
            >
              <ThemedText type="small" style={{ color: Colors.primary.info }}>
                This entry is still in progress.
              </ThemedText>
            </View>
          )}

          {state.isReRating && (
            <View
              className="mb-3 rounded-lg p-3"
              style={{ backgroundColor: Colors.tint.teal, borderWidth: 1, borderColor: Colors.tint.tealBorder }}
            >
              <ThemedText type="small" style={{ color: Colors.sway.bright }}>
                Re-rating
              </ThemedText>
            </View>
          )}

          <ThemedText type="subtitle" style={{ marginBottom: 16 }}>
            {patientName ? `${patientName}'s Goals` : 'Goals'}
          </ThemedText>

          {state.goals.map((goal, index) => (
            <View key={index} className="mb-3 rounded-xl p-4" style={{ backgroundColor: Colors.chip.darkCard }}>
              <ThemedText type="smallBold" style={{ color: Colors.sway.darkGrey, marginBottom: 4 }}>
                Goal {index + 1}
              </ThemedText>
              <ThemedText style={{ marginBottom: 8 }}>{goal.goalText || '—'}</ThemedText>
              <View className="flex-row items-center gap-2">
                <ThemedText type="small" style={{ color: Colors.sway.darkGrey }}>
                  Rating:
                </ThemedText>
                <ThemedText type="smallBold" style={{ color: Colors.sway.bright }}>
                  {goal.rating !== null && goal.rating !== undefined ? `${goal.rating}/10` : '—'}
                </ThemedText>
              </View>
              {state.isReRating && <PreviousRatingsRow entries={state.previousRatings} goalIndex={index} />}
            </View>
          ))}

          {/* Reflection */}
          {state.reflection ? (
            <View className="mt-4">
              <ThemedText type="smallTitle" style={{ marginBottom: 8 }}>
                Reflection
              </ThemedText>
              <View className="rounded-xl p-4" style={{ backgroundColor: Colors.chip.darkCard }}>
                <ThemedText>{state.reflection}</ThemedText>
              </View>
            </View>
          ) : null}

          {/* User note */}
          {attempt.userNote && (
            <View className="mt-4">
              <ThemedText type="smallBold" style={{ marginBottom: 6 }}>
                {patientName ? `${patientName}'s Note` : 'Personal Note'}
              </ThemedText>
              <View className="rounded-xl p-4" style={{ backgroundColor: Colors.chip.darkCard }}>
                <ThemedText>{attempt.userNote}</ThemedText>
              </View>
            </View>
          )}
        </ScrollView>
      </ContentContainer>
    );
  }

  // ── Edit mode ──
  return (
    <ContentContainer>
      <ScrollView contentContainerStyle={{ paddingBottom: 60 }} keyboardShouldPersistTaps="handled">
        <ThemedText type="subtitle" style={{ marginBottom: 4 }}>
          {state.isReRating ? 'Re-rate Your Goals' : 'Set Your Goals'}
        </ThemedText>
        <ThemedText type="small" style={{ color: Colors.sway.darkGrey, marginBottom: 16 }}>
          {state.isReRating
            ? 'Rate each goal again to track your progress.'
            : 'Add up to 3 goals you would like to work towards.'}
        </ThemedText>

        {/* Goals */}
        {state.goals.map((goal, index) => (
          <View key={index} className="mb-4 rounded-xl p-4" style={{ backgroundColor: Colors.chip.darkCard }}>
            <View className="mb-2 flex-row items-center justify-between">
              <ThemedText type="smallBold">Goal {index + 1}</ThemedText>
              {!state.isReRating && (
                <Pressable onPress={() => state.removeGoal(index)} className="active:opacity-60" hitSlop={8}>
                  <ThemedText type="small" style={{ color: Colors.primary.error }}>
                    Remove
                  </ThemedText>
                </Pressable>
              )}
            </View>

            {/* Goal text */}
            {state.isReRating ? (
              <View className="mb-3 rounded-lg p-3" style={{ backgroundColor: Colors.chip.darkCardDeep }}>
                <ThemedText>{goal.goalText}</ThemedText>
              </View>
            ) : (
              <TextInput
                value={goal.goalText}
                onChangeText={(text) => handleGoalTextChange(index, text)}
                placeholder="Describe your goal..."
                placeholderTextColor={Colors.sway.darkGrey}
                multiline
                style={{
                  backgroundColor: Colors.chip.darkCardDeep,
                  color: Colors.sway.lightGrey,
                  borderRadius: 8,
                  padding: 12,
                  marginBottom: 12,
                  minHeight: 60,
                  fontSize: 16,
                  fontFamily: 'Lato-Regular'
                }}
              />
            )}

            {/* Previous ratings (re-rating mode) */}
            {state.isReRating && <PreviousRatingsRow entries={state.previousRatings} goalIndex={index} />}

            {/* Rating */}
            <ThemedText
              type="small"
              style={{ color: Colors.sway.darkGrey, marginBottom: 6, marginTop: state.isReRating ? 8 : 0 }}
            >
              {state.isReRating ? 'New rating (0-10)' : 'Rate this goal (0-10)'}
            </ThemedText>
            <RatingRow selected={goal.rating} onSelect={(r) => handleRatingChange(index, r)} />
          </View>
        ))}

        {/* Add goal button */}
        {state.canAddGoal && (
          <ThemedButton
            title="+ Add Goal"
            variant="outline"
            compact
            onPress={state.addGoal}
            className="mb-4 self-start"
          />
        )}

        {/* Reflection section */}
        <View className="mb-4 mt-2">
          <ThemedText type="smallTitle" style={{ marginBottom: 8 }}>
            Reflection
          </ThemedText>

          {/* Prompt questions */}
          <View className="mb-3 rounded-lg p-3" style={{ backgroundColor: Colors.diary.promptBg }}>
            {reflectionPrompts.map((prompt, i) => (
              <View key={i} className="mb-1 flex-row">
                <ThemedText type="small" style={{ color: Colors.sway.bright, marginRight: 6 }}>
                  {'\u2022'}
                </ThemedText>
                <ThemedText type="small" style={{ color: Colors.sway.bright, flex: 1 }}>
                  {prompt}
                </ThemedText>
              </View>
            ))}
          </View>

          <TextInput
            value={state.reflection}
            onChangeText={handleReflectionChange}
            placeholder="Write your reflection..."
            placeholderTextColor={Colors.sway.darkGrey}
            multiline
            style={{
              backgroundColor: Colors.chip.darkCardDeep,
              color: Colors.sway.lightGrey,
              borderRadius: 8,
              padding: 12,
              minHeight: 100,
              fontSize: 16,
              fontFamily: 'Lato-Regular'
            }}
          />
        </View>

        {/* Save indicator */}
        {state.isSaving && (
          <ThemedText type="small" style={{ color: Colors.sway.darkGrey, textAlign: 'center', marginBottom: 8 }}>
            Saving...
          </ThemedText>
        )}

        {/* Submit */}
        <ThemedButton
          title={state.isSubmitting ? 'Submitting...' : 'Submit'}
          onPress={() => state.handleSubmit(undefined)}
          disabled={!state.canSubmit || state.isSubmitting}
        />
      </ScrollView>
    </ContentContainer>
  );
};

export default GeneralGoalsPresenter;
