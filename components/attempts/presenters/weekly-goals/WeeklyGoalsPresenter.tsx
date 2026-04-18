import { type ReactNode, useCallback, useRef, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, TextInput, View } from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller';
import { MotiView } from 'moti';
import ContentContainer from '@/components/ContentContainer';
import ThemedButton from '@/components/ThemedButton';
import { ThemedText } from '@/components/ThemedText';
import type { ActionMenuItem } from '@/components/ui/ActionMenu';
import ActionMenu from '@/components/ui/ActionMenu';
import { Colors } from '@/constants/Colors';
import { AttemptStatus } from '@/types/types';
import type { AttemptDetailResponseItem } from '@milobedini/shared-types';
import MaterialCommunityIcons from '@react-native-vector-icons/material-design-icons';

import BloomGlow from './BloomGlow';
import CoachMessage from './CoachMessage';
import MomentCard from './MomentCard';
import ReflectionThread from './ReflectionThread';
import { MAX_GOALS, useWeeklyGoalsState } from './useWeeklyGoalsState';
import WeekRail from './WeekRail';

type WeeklyGoalsPresenterProps = {
  attempt: AttemptDetailResponseItem;
  mode: 'view' | 'edit';
  patientName?: string;
};

const OPENING_PROMPTS = [
  'What would you like to do this week?',
  'What else?',
  'Any more?',
  'One more if you like.',
  'How about another?',
  'Anything else on your mind?',
  'Last one, go for it.'
];

// TODO: Lift to `components/ui/FloatingActionButton.tsx` when a second caller
// appears (e.g. GeneralGoalsPresenter's save FAB) so the shared API is designed
// against two real use sites rather than speculatively.
type FloatingActionButtonProps = {
  visible: boolean;
  borderColor: string;
  shadowColor: string;
  shadowOpacity: number;
  onPress: () => void;
  disabled?: boolean;
  accessibilityLabel: string;
  children: ReactNode;
};

const FloatingActionButton = ({
  visible,
  borderColor,
  shadowColor,
  shadowOpacity,
  onPress,
  disabled,
  accessibilityLabel,
  children
}: FloatingActionButtonProps) => (
  <MotiView
    from={{ opacity: 0, scale: 0.7 }}
    animate={{ opacity: visible ? 1 : 0, scale: visible ? 1 : 0.7 }}
    transition={{ type: 'timing', duration: 200 }}
    pointerEvents={visible ? 'auto' : 'none'}
  >
    <Pressable
      className="h-12 w-12 items-center justify-center rounded-full"
      style={{
        backgroundColor: Colors.chip.darkCardDeep,
        borderWidth: 1,
        borderColor,
        shadowColor,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity,
        shadowRadius: 10,
        elevation: 8
      }}
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      hitSlop={8}
    >
      {children}
    </Pressable>
  </MotiView>
);

const WeeklyGoalsPresenter = ({ attempt, mode, patientName }: WeeklyGoalsPresenterProps) => {
  const [submitBloomTrigger, setSubmitBloomTrigger] = useState(0);
  const handleSubmitSuccess = useCallback(() => setSubmitBloomTrigger((n) => n + 1), []);
  const state = useWeeklyGoalsState({ attempt, mode, onSubmitSuccess: handleSubmitSuccess });
  const [draft, setDraft] = useState('');
  const [activeGoalIndex, setActiveGoalIndex] = useState<number | null>(null);
  const [resetMenuVisible, setResetMenuVisible] = useState(false);
  const draftInputRef = useRef<TextInput | null>(null);

  const handleReset = useCallback(() => {
    state.reset();
    setDraft('');
    setActiveGoalIndex(null);
  }, [state]);

  const resetActions: ActionMenuItem[] = [
    {
      icon: 'restart',
      label: 'Reset conversation',
      onPress: handleReset,
      variant: 'destructive',
      confirmTitle: 'Reset this week?',
      confirmDescription:
        'This clears every goal and reflection you’ve added so you can start over. You can still save or submit afterwards.',
      confirmLabel: 'Reset'
    }
  ];

  const hasAnyContent = state.goals.length > 0 || state.reflectionFilled;

  const handleAdd = useCallback(() => {
    const text = draft.trim();
    if (!text || !state.canAddGoal) return;
    state.addGoal(text);
    setDraft('');
    draftInputRef.current?.focus();
  }, [draft, state]);

  if (!state.canEdit) {
    return (
      <ContentContainer padded={false}>
        <WeekRail
          goals={state.goals}
          completedCount={state.completedCount}
          activeIndex={null}
          canEdit={false}
          onPressGoal={() => {}}
        />

        <ScrollView contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 48 }}>
          {mode === 'view' && attempt.status !== AttemptStatus.SUBMITTED && (
            <View
              className="mb-4 mt-4 flex-row items-center gap-2 rounded-xl p-3"
              style={{
                backgroundColor: Colors.tint.info,
                borderColor: Colors.tint.infoBorder,
                borderWidth: 1
              }}
            >
              <MaterialCommunityIcons name="progress-clock" size={18} color={Colors.primary.info} />
              <ThemedText type="small" style={{ color: Colors.primary.info }}>
                This week is still in progress.
              </ThemedText>
            </View>
          )}

          <View className="mb-4 mt-6">
            <ThemedText
              type="smallBold"
              style={{
                color: Colors.sway.darkGrey,
                letterSpacing: 3,
                textTransform: 'uppercase',
                fontSize: 10
              }}
            >
              Weekly Goals
            </ThemedText>
            <ThemedText type="subtitle" style={{ marginTop: 4 }}>
              {patientName ? `${patientName}'s week` : 'Your week'}
            </ThemedText>
            <ThemedText type="small" style={{ color: Colors.sway.darkGrey, marginTop: 6 }}>
              {state.completedCount} of {state.goals.length} goals completed
            </ThemedText>
          </View>

          {state.goals.length === 0 ? (
            <ThemedText type="small" style={{ color: Colors.sway.darkGrey }}>
              No goals recorded for this week.
            </ThemedText>
          ) : (
            state.goals.map((goal, i) => (
              <MomentCard
                key={goal._uid}
                goal={goal}
                index={i}
                canEdit={false}
                isActive={false}
                onFocus={() => {}}
                onBlur={() => {}}
                onGoalTextChange={() => {}}
                onToggleCompleted={() => {}}
                onUpdateMastery={() => {}}
                onUpdatePleasure={() => {}}
                onUpdateNotes={() => {}}
                onRemove={() => {}}
              />
            ))
          )}

          <ReflectionThread reflection={state.reflection} canEdit={false} onChange={() => {}} />

          {attempt.userNote && (
            <View className="mt-6">
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

  const nextPromptIndex = Math.min(state.goals.length, OPENING_PROMPTS.length - 1);
  const currentOpenerPrompt = OPENING_PROMPTS[nextPromptIndex];
  const showComposer = state.canAddGoal;
  const atLeastOneFilled = state.filledGoals.length >= 1;

  return (
    <ContentContainer padded={false}>
      {/* Submit-success overlay bloom; pointer-events disabled so it never intercepts. */}
      <View
        pointerEvents="none"
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 20
        }}
      >
        <BloomGlow trigger={submitBloomTrigger} size={280} />
      </View>

      <ActionMenu
        visible={resetMenuVisible}
        onDismiss={() => setResetMenuVisible(false)}
        title="Start over"
        subtitle="Clear this week’s draft and begin again."
        actions={resetActions}
      />

      <WeekRail
        goals={state.goals}
        completedCount={state.completedCount}
        activeIndex={activeGoalIndex}
        canEdit
        onPressGoal={(i) => setActiveGoalIndex(i)}
        onToggle={state.toggleCompleted}
      />

      <View
        pointerEvents="box-none"
        style={{ position: 'absolute', right: 16, bottom: 16, zIndex: 30 }}
        className="gap-2"
      >
        <FloatingActionButton
          visible={state.isDirty || state.isSaving}
          borderColor={Colors.tint.tealBorder}
          shadowColor={Colors.sway.bright}
          shadowOpacity={0.35}
          onPress={state.save}
          disabled={state.isSaving || !state.isDirty}
          accessibilityLabel={state.isSaving ? 'Saving' : 'Save changes'}
        >
          {state.isSaving ? (
            <ActivityIndicator size="small" color={Colors.sway.bright} />
          ) : (
            <MaterialCommunityIcons name="content-save-edit-outline" size={22} color={Colors.primary.warning} />
          )}
        </FloatingActionButton>

        <FloatingActionButton
          visible={hasAnyContent}
          borderColor={Colors.tint.errorBorder}
          shadowColor={Colors.primary.error}
          shadowOpacity={0.3}
          onPress={() => setResetMenuVisible(true)}
          accessibilityLabel="Reset conversation"
        >
          <MaterialCommunityIcons name="restart" size={22} color={Colors.primary.error} />
        </FloatingActionButton>
      </View>

      <KeyboardAwareScrollView
        bottomOffset={120}
        contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 16, paddingBottom: 120 }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <MotiView
          from={{ opacity: 0, translateY: 8 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: 'timing', duration: 300 }}
          className="mb-6"
        >
          <ThemedText
            type="smallBold"
            style={{
              color: Colors.sway.darkGrey,
              letterSpacing: 3,
              textTransform: 'uppercase',
              fontSize: 10
            }}
          >
            Weekly Goals · Session
          </ThemedText>
          <ThemedText type="title" style={{ marginTop: 2, marginBottom: 4 }}>
            {state.goals.length === 0 ? 'Let’s plan your week.' : 'Your week, shaping up.'}
          </ThemedText>
          <ThemedText type="small" style={{ color: Colors.sway.darkGrey, lineHeight: 20 }}>
            {`Answer in your own words. We’ll build a list together, one goal at a time. ${MAX_GOALS} max.`}
          </ThemedText>
        </MotiView>

        {state.goals.map((goal, i) => (
          <MomentCard
            key={goal._uid}
            goal={goal}
            index={i}
            canEdit
            isActive={activeGoalIndex === i}
            onFocus={() => setActiveGoalIndex(i)}
            onBlur={() => setActiveGoalIndex((curr) => (curr === i ? null : curr))}
            onGoalTextChange={(t) => state.updateGoalText(i, t)}
            onToggleCompleted={() => state.toggleCompleted(i)}
            onUpdateMastery={(v) => state.updateMastery(i, v)}
            onUpdatePleasure={(v) => state.updatePleasure(i, v)}
            onUpdateNotes={(t) => state.updateNotes(i, t)}
            onRemove={() => state.removeGoal(i)}
          />
        ))}

        {showComposer && (
          <View className="mb-3">
            <CoachMessage glyph="?" prompt={currentOpenerPrompt} typewriter />
          </View>
        )}

        {showComposer && (
          <MotiView
            from={{ opacity: 0, translateY: 6 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ type: 'timing', duration: 240 }}
            className="mb-6 flex-row"
          >
            <View className="mr-3 items-center" style={{ width: 16 }}>
              <View
                className="mt-2 h-3 w-3 rounded-full"
                style={{
                  backgroundColor: Colors.chip.darkCardDeep,
                  borderWidth: 1.5,
                  borderColor: Colors.sway.bright
                }}
              />
            </View>
            <View
              className="flex-1"
              style={{
                backgroundColor: Colors.chip.darkCardDeep,
                borderLeftWidth: 2,
                borderLeftColor: Colors.sway.bright,
                paddingVertical: 12,
                paddingHorizontal: 14
              }}
            >
              <ThemedText
                type="smallBold"
                style={{
                  color: Colors.sway.bright,
                  letterSpacing: 1.5,
                  textTransform: 'uppercase',
                  fontSize: 10,
                  marginBottom: 6
                }}
              >
                You
              </ThemedText>
              <TextInput
                ref={draftInputRef}
                value={draft}
                onChangeText={setDraft}
                placeholder="Type your answer…"
                placeholderTextColor={Colors.sway.darkGrey}
                multiline
                submitBehavior="blurAndSubmit"
                returnKeyType="done"
                onSubmitEditing={handleAdd}
                style={{
                  color: Colors.sway.lightGrey,
                  fontSize: 17,
                  fontFamily: 'Lato-Regular',
                  lineHeight: 24,
                  minHeight: 24,
                  padding: 0
                }}
                accessibilityLabel="Add a goal"
              />

              <View className="mt-3 flex-row items-center justify-between">
                <ThemedText type="small" style={{ color: Colors.sway.darkGrey, fontSize: 11 }}>
                  {state.goals.length} / {MAX_GOALS}
                </ThemedText>
                <Pressable
                  onPress={handleAdd}
                  disabled={draft.trim().length === 0}
                  className="flex-row items-center gap-1.5 rounded-full px-3 py-1.5 active:opacity-70"
                  style={{
                    backgroundColor: draft.trim().length === 0 ? Colors.chip.darkCardAlt : Colors.sway.bright,
                    opacity: draft.trim().length === 0 ? 0.5 : 1
                  }}
                  accessibilityRole="button"
                  accessibilityLabel="Add goal to your week"
                >
                  <ThemedText
                    type="smallBold"
                    style={{
                      color: draft.trim().length === 0 ? Colors.sway.darkGrey : Colors.sway.dark,
                      fontSize: 13
                    }}
                  >
                    Add to week
                  </ThemedText>
                  <MaterialCommunityIcons
                    name="arrow-right"
                    size={14}
                    color={draft.trim().length === 0 ? Colors.sway.darkGrey : Colors.sway.dark}
                  />
                </Pressable>
              </View>
            </View>
          </MotiView>
        )}

        {!showComposer && state.firstEmptyGoalIndex >= 0 && (
          <CoachMessage
            glyph="!"
            prompt="You’ve got a goal waiting for some words above. Tap it to finish your thought."
            typewriter={false}
            tone="muted"
          />
        )}

        {!state.canAddGoal && state.goals.length >= MAX_GOALS && (
          <View
            className="mb-6 rounded-sm p-3"
            style={{
              backgroundColor: Colors.tintSubtle.teal,
              borderLeftWidth: 2,
              borderLeftColor: Colors.sway.bright
            }}
          >
            <ThemedText type="small" style={{ color: Colors.sway.lightGrey }}>
              Seven is the cap for the week. Keep it realistic; you can always revisit next week.
            </ThemedText>
          </View>
        )}

        {atLeastOneFilled && (
          <ReflectionThread reflection={state.reflection} canEdit onChange={state.updateReflection} />
        )}

        {atLeastOneFilled && (
          <MotiView
            from={{ opacity: 0, translateY: 10 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ type: 'timing', duration: 300, delay: 120 }}
            className="mt-8"
          >
            <View className="mb-3">
              <CoachMessage
                glyph="✓"
                prompt={
                  state.canSubmit
                    ? 'Ready when you are. Submitting hands this week back to your therapist.'
                    : 'When you’ve answered at least one reflection beat above, we can close the week.'
                }
                typewriter={false}
                tone={state.canSubmit ? 'coach' : 'muted'}
              />
            </View>
            <ThemedButton
              title={state.isSubmitting ? 'Closing the week…' : 'Close the week'}
              onPress={state.handleSubmit}
              disabled={!state.canSubmit || state.isSubmitting}
            />
          </MotiView>
        )}
      </KeyboardAwareScrollView>
    </ContentContainer>
  );
};

export default WeeklyGoalsPresenter;
