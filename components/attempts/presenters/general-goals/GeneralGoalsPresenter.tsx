import { useCallback, useEffect, useRef } from 'react';
import { ActivityIndicator, Platform, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import ContentContainer from '@/components/ContentContainer';
import ThemedButton from '@/components/ThemedButton';
import { ThemedText } from '@/components/ThemedText';
import EmptyState from '@/components/ui/EmptyState';
import KeyboardAvoidingWrapper from '@/components/ui/KeyboardAvoidingWrapper';
import { Colors } from '@/constants/Colors';
import useDebouncedCallback from '@/utils/debounce';
import type { AttemptDetailResponseItem } from '@milobedini/shared-types';
import MaterialCommunityIcons from '@react-native-vector-icons/material-design-icons';

import GoalCard from './GoalCard';
import ReflectionSection from './ReflectionSection';
import { useGeneralGoalsState } from './useGeneralGoalsState';

type GeneralGoalsPresenterProps = {
  attempt: AttemptDetailResponseItem;
  mode: 'view' | 'edit';
  patientName?: string;
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

  // ── View mode ──
  if (!state.canEdit) {
    return (
      <ContentContainer>
        <ScrollView contentContainerStyle={{ paddingBottom: 40 }}>
          {/* In-progress indicator for therapist */}
          {mode === 'view' && attempt.status !== 'submitted' && (
            <View
              className="mb-4 flex-row items-center gap-2 rounded-xl p-3"
              style={{
                backgroundColor: Colors.tint.info,
                borderColor: Colors.tint.infoBorder,
                borderWidth: 1
              }}
            >
              <MaterialCommunityIcons name="progress-clock" size={18} color={Colors.primary.info} />
              <ThemedText type="small" style={{ color: Colors.primary.info }}>
                This entry is still in progress.
              </ThemedText>
            </View>
          )}

          {state.isReRating && (
            <View
              className="mb-4 flex-row items-center gap-2 rounded-xl p-3"
              style={{
                backgroundColor: Colors.tint.teal,
                borderWidth: 1,
                borderColor: Colors.tint.tealBorder
              }}
            >
              <MaterialCommunityIcons name="refresh" size={16} color={Colors.sway.bright} />
              <ThemedText type="small" style={{ color: Colors.sway.bright }}>
                Re-rating
              </ThemedText>
            </View>
          )}

          <ThemedText type="subtitle" style={{ marginBottom: 16 }}>
            {patientName ? `${patientName}'s Goals` : 'Goals'}
          </ThemedText>

          {state.goals.map((goal, index) => (
            <GoalCard
              key={index}
              index={index}
              goalText={goal.goalText}
              rating={goal.rating}
              isReRating={state.isReRating}
              canEdit={false}
              previousRatings={state.previousRatings}
            />
          ))}

          <ReflectionSection reflection={state.reflection} isReRating={state.isReRating} canEdit={false} />

          {/* User note */}
          {attempt.userNote && (
            <View className="mt-4">
              <View className="mb-2 flex-row items-center gap-2">
                <MaterialCommunityIcons name="note-text-outline" size={18} color={Colors.sway.darkGrey} />
                <ThemedText type="smallBold" style={{ color: Colors.sway.darkGrey }}>
                  {patientName ? `${patientName}'s Note` : 'Personal Note'}
                </ThemedText>
              </View>
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
      <KeyboardAvoidingWrapper keyboardVerticalOffset={Platform.select({ ios: 120, default: 0 })}>
        <View className="flex-1">
          {/* Floating save indicator */}
          {(state.isDirty || state.isSaving) && (
            <Pressable
              style={floatingStyles.container}
              onPress={state.save}
              disabled={state.isSaving || !state.isDirty}
              accessibilityRole="button"
              accessibilityLabel={state.isSaving ? 'Saving' : 'Save changes'}
              hitSlop={8}
            >
              {state.isSaving ? (
                <ActivityIndicator size="small" color={Colors.sway.bright} />
              ) : (
                <MaterialCommunityIcons name="content-save-edit-outline" size={20} color={Colors.primary.warning} />
              )}
            </Pressable>
          )}

          <ScrollView contentContainerStyle={{ paddingBottom: 60 }} keyboardShouldPersistTaps="handled">
            {/* Header */}
            <View className="mb-4">
              <ThemedText type="subtitle">{state.isReRating ? 'Re-rate Your Goals' : 'Set Your Goals'}</ThemedText>
              <ThemedText type="small" style={{ color: Colors.sway.darkGrey, marginTop: 4 }}>
                {state.isReRating
                  ? 'Rate each goal again to track your progress.'
                  : 'Add up to 3 goals you would like to work towards.'}
              </ThemedText>
            </View>

            {/* Empty state */}
            {state.goals.length === 0 && (
              <View className="mb-4">
                <EmptyState
                  icon="flag-outline"
                  title="No goals yet"
                  subtitle="Add your first therapy goal to get started."
                  action={{ label: 'Add Goal', onPress: state.addGoal }}
                />
              </View>
            )}

            {/* Goal cards */}
            {state.goals.map((goal, index) => (
              <GoalCard
                key={index}
                index={index}
                goalText={goal.goalText}
                rating={goal.rating}
                isReRating={state.isReRating}
                canEdit
                previousRatings={state.previousRatings}
                onGoalTextChange={(text) => handleGoalTextChange(index, text)}
                onRatingChange={(rating) => handleRatingChange(index, rating)}
                onRemove={() => state.removeGoal(index)}
              />
            ))}

            {/* Add goal button */}
            {state.canAddGoal && state.goals.length > 0 && (
              <Pressable
                onPress={state.addGoal}
                className="mb-4 flex-row items-center justify-center gap-2 rounded-xl p-3 active:opacity-70"
                style={{
                  borderWidth: 1,
                  borderColor: Colors.tint.tealBorder,
                  borderStyle: 'dashed',
                  backgroundColor: Colors.tintSubtle.teal
                }}
                accessibilityRole="button"
                accessibilityLabel="Add another goal"
              >
                <MaterialCommunityIcons name="plus-circle-outline" size={20} color={Colors.sway.bright} />
                <ThemedText type="smallBold" style={{ color: Colors.sway.bright }}>
                  Add Goal ({state.goals.length}/3)
                </ThemedText>
              </Pressable>
            )}

            {/* Reflection */}
            {state.goals.length > 0 && (
              <ReflectionSection
                reflection={state.reflection}
                isReRating={state.isReRating}
                canEdit
                onReflectionChange={handleReflectionChange}
              />
            )}

            {/* Submit button */}
            {state.goals.length > 0 && (
              <View className="mt-6">
                <ThemedButton
                  title={state.isSubmitting ? 'Submitting...' : 'Submit'}
                  onPress={() => state.handleSubmit(undefined)}
                  disabled={!state.canSubmit || state.isSubmitting}
                />
              </View>
            )}
          </ScrollView>
        </View>
      </KeyboardAvoidingWrapper>
    </ContentContainer>
  );
};

const floatingStyles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 8,
    right: 16,
    zIndex: 10,
    backgroundColor: Colors.chip.darkCardDeep,
    borderRadius: 22,
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.tint.tealBorder,
    shadowColor: Colors.sway.bright,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 8
  }
});

export default GeneralGoalsPresenter;
