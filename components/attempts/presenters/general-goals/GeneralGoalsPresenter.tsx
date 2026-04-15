import { ActivityIndicator, Pressable, ScrollView, View } from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller';
import ContentContainer from '@/components/ContentContainer';
import ThemedButton from '@/components/ThemedButton';
import { ThemedText } from '@/components/ThemedText';
import EmptyState from '@/components/ui/EmptyState';
import { Colors } from '@/constants/Colors';
import { AttemptStatus } from '@/types/types';
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

  // ── View mode ──
  if (!state.canEdit) {
    return (
      <ContentContainer>
        <ScrollView contentContainerStyle={{ paddingBottom: 40 }} showsVerticalScrollIndicator={false}>
          {/* In-progress indicator for therapist */}
          {mode === 'view' && attempt.status !== AttemptStatus.SUBMITTED && (
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
              key={goal._uid}
              index={index}
              goalText={goal.goalText}
              rating={goal.rating}
              isReRating={state.isReRating}
              canEdit={false}
              previousRatings={state.previousRatings}
              currentDate={attempt.lastInteractionAt ?? attempt.createdAt}
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
      <View className="flex-1">
        {/* Floating save indicator */}
        {(state.isDirty || state.isSaving) && (
          <Pressable
            className="absolute right-4 top-2 z-10 h-10 w-10 items-center justify-center rounded-full"
            style={{
              backgroundColor: Colors.chip.darkCardDeep,
              borderWidth: 1,
              borderColor: Colors.tint.tealBorder,
              shadowColor: Colors.sway.bright,
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.35,
              shadowRadius: 8,
              elevation: 8
            }}
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

        <KeyboardAwareScrollView
          bottomOffset={62}
          contentContainerStyle={{ paddingBottom: 120 }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
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
              key={goal._uid}
              index={index}
              goalText={goal.goalText}
              rating={goal.rating}
              isReRating={state.isReRating}
              canEdit
              previousRatings={state.previousRatings}
              onGoalTextChange={(text) => state.updateGoalText(index, text)}
              onRatingChange={(rating) => state.updateGoalRating(index, rating)}
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
              onReflectionChange={state.updateReflection}
            />
          )}

          {/* Submit button */}
          {state.goals.length > 0 && (
            <View className="mt-6">
              <ThemedButton
                title={state.isSubmitting ? 'Submitting...' : 'Submit'}
                onPress={state.handleSubmit}
                disabled={!state.canSubmit || state.isSubmitting}
              />
            </View>
          )}
        </KeyboardAwareScrollView>
      </View>
    </ContentContainer>
  );
};

export default GeneralGoalsPresenter;
