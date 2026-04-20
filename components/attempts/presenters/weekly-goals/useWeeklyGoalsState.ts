import { useCallback, useMemo, useState } from 'react';
import * as Haptics from 'expo-haptics';
import { useLocalSearchParams } from 'expo-router';
import { toast } from 'sonner-native';
import { TOAST_DURATIONS, TOAST_STYLES } from '@/components/toast/toastOptions';
import { useSaveModuleAttempt, useSubmitAttempt } from '@/hooks/useAttempts';
import { AttemptStatus } from '@/types/types';
import type {
  AttemptDetailResponseItem,
  WeeklyGoalEntry,
  WeeklyGoalsData,
  WeeklyGoalsReflection
} from '@milobedini/shared-types';

export const MAX_GOALS = 7;

export type GoalWithId = WeeklyGoalEntry & { _uid: string };

export type ReflectionKey = keyof WeeklyGoalsReflection;

// Reflection prompts are clinical, preserved verbatim per the BE spec.
export const REFLECTION_PROMPTS: { key: ReflectionKey; prompt: string; glyph: string }[] = [
  { key: 'moodImpact', prompt: 'What activities improved or impacted your mood?', glyph: '◐' },
  { key: 'takeaway', prompt: 'What can you take away from this?', glyph: '✎' },
  { key: 'balance', prompt: 'Did you get enough balance across activities this week?', glyph: '⟳' },
  { key: 'barriers', prompt: 'Did anything get in the way of achieving your goals this week?', glyph: '⊘' }
];

const emptyReflection: WeeklyGoalsReflection = {
  moodImpact: '',
  takeaway: '',
  balance: '',
  barriers: ''
};

let nextUid = 0;
const createUid = () => `wg-${Date.now()}-${nextUid++}`;

const emptyGoal = (): GoalWithId => ({
  _uid: createUid(),
  goalText: '',
  completed: false,
  masteryRating: null,
  pleasureRating: null,
  plannedDiaryEntryRef: null,
  completionNotes: null
});

const toGoalsWithIds = (goals: WeeklyGoalEntry[]): GoalWithId[] => goals.map((g) => ({ ...g, _uid: createUid() }));

const stripIds = (goals: GoalWithId[]): WeeklyGoalEntry[] =>
  goals.map(({ goalText, completed, masteryRating, pleasureRating, plannedDiaryEntryRef, completionNotes }) => ({
    goalText,
    completed,
    masteryRating,
    pleasureRating,
    plannedDiaryEntryRef,
    completionNotes
  }));

const handleError = () => {
  Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(() => {});
  toast.error('Failed to save progress', {
    duration: TOAST_DURATIONS.error,
    styles: TOAST_STYLES.error
  });
};

type UseWeeklyGoalsStateParams = {
  attempt: AttemptDetailResponseItem;
  mode: 'view' | 'edit';
  onSubmitSuccess?: () => void;
};

export const useWeeklyGoalsState = ({ attempt, mode, onSubmitSuccess }: UseWeeklyGoalsStateParams) => {
  const { assignmentId } = useLocalSearchParams<{ assignmentId?: string }>();
  const initialData: WeeklyGoalsData | undefined = attempt.weeklyGoals;

  const [goals, setGoals] = useState<GoalWithId[]>(initialData?.goals?.length ? toGoalsWithIds(initialData.goals) : []);
  const [reflection, setReflection] = useState<WeeklyGoalsReflection>({
    ...emptyReflection,
    ...(initialData?.reflection ?? {})
  });
  const [isDirty, setIsDirty] = useState(false);

  const canEdit = mode === 'edit' && attempt.status !== AttemptStatus.SUBMITTED;
  const canAddGoal = canEdit && goals.length < MAX_GOALS;

  const { mutateSilently: saveAttemptSilently, isPending: isSaving } = useSaveModuleAttempt(attempt._id);
  const { mutate: submitAttempt, isPending: isSubmitting } = useSubmitAttempt(attempt._id);

  const buildPayload = useCallback(
    (): Partial<WeeklyGoalsData> => ({
      goals: stripIds(goals),
      reflection
    }),
    [goals, reflection]
  );

  const save = useCallback(() => {
    if (!canEdit || !isDirty) return;
    saveAttemptSilently(
      { weeklyGoals: buildPayload() },
      {
        onSuccess: () => setIsDirty(false),
        onError: handleError
      }
    );
  }, [canEdit, isDirty, saveAttemptSilently, buildPayload]);

  const addGoal = useCallback(
    (goalText?: string) => {
      if (!canAddGoal) return;
      const next = emptyGoal();
      if (goalText) next.goalText = goalText;
      setGoals((prev) => [...prev, next]);
      setIsDirty(true);
      Haptics.selectionAsync().catch(() => {});
    },
    [canAddGoal]
  );

  const updateGoalText = useCallback(
    (index: number, text: string) => {
      if (!canEdit) return;
      setGoals((prev) => prev.map((g, i) => (i === index ? { ...g, goalText: text } : g)));
      setIsDirty(true);
    },
    [canEdit]
  );

  const toggleCompleted = useCallback(
    (index: number) => {
      if (!canEdit) return;
      setGoals((prev) =>
        prev.map((g, i) => {
          if (i !== index) return g;
          if (!g.completed) return { ...g, completed: true };
          // Un-completing clears the follow-up ratings/notes so stale data
          // doesn't linger if the goal is later re-completed.
          return {
            ...g,
            completed: false,
            masteryRating: null,
            pleasureRating: null,
            completionNotes: null
          };
        })
      );
      setIsDirty(true);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    },
    [canEdit]
  );

  const updateMastery = useCallback(
    (index: number, v: number | null) => {
      if (!canEdit) return;
      setGoals((prev) => prev.map((g, i) => (i === index ? { ...g, masteryRating: v } : g)));
      setIsDirty(true);
    },
    [canEdit]
  );

  const updatePleasure = useCallback(
    (index: number, v: number | null) => {
      if (!canEdit) return;
      setGoals((prev) => prev.map((g, i) => (i === index ? { ...g, pleasureRating: v } : g)));
      setIsDirty(true);
    },
    [canEdit]
  );

  const updateNotes = useCallback(
    (index: number, notes: string) => {
      if (!canEdit) return;
      const trimmed = notes.length === 0 ? null : notes;
      setGoals((prev) => prev.map((g, i) => (i === index ? { ...g, completionNotes: trimmed } : g)));
      setIsDirty(true);
    },
    [canEdit]
  );

  const removeGoal = useCallback(
    (index: number) => {
      if (!canEdit) return;
      setGoals((prev) => prev.filter((_, i) => i !== index));
      setIsDirty(true);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    },
    [canEdit]
  );

  const updateReflection = useCallback(
    (key: ReflectionKey, value: string) => {
      if (!canEdit) return;
      setReflection((prev) => ({ ...prev, [key]: value }));
      setIsDirty(true);
    },
    [canEdit]
  );

  const reset = useCallback(() => {
    if (!canEdit) return;
    setGoals([]);
    setReflection({ ...emptyReflection });
    setIsDirty(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
  }, [canEdit]);

  const filledGoals = useMemo(() => goals.filter((g) => g.goalText.trim().length > 0), [goals]);
  const completedCount = useMemo(() => goals.filter((g) => g.completed).length, [goals]);
  const firstEmptyGoalIndex = useMemo(() => goals.findIndex((g) => g.goalText.trim().length === 0), [goals]);
  const reflectionFilled = useMemo(() => Object.values(reflection).some((v) => v.trim().length > 0), [reflection]);

  const canSubmit = canEdit && filledGoals.length >= 1 && filledGoals.length <= MAX_GOALS && reflectionFilled;

  const handleSubmit = useCallback(() => {
    if (!canSubmit) return;
    saveAttemptSilently(
      { weeklyGoals: buildPayload() },
      {
        onSuccess: () => {
          setIsDirty(false);
          submitAttempt(assignmentId ? { assignmentId: String(assignmentId) } : {}, {
            onSuccess: () => {
              onSubmitSuccess?.();
            },
            onError: handleError
          });
        },
        onError: handleError
      }
    );
  }, [canSubmit, saveAttemptSilently, buildPayload, submitAttempt, assignmentId, onSubmitSuccess]);

  return {
    goals,
    reflection,
    canEdit,
    canAddGoal,
    canSubmit,
    isSaving,
    isSubmitting,
    isDirty,
    completedCount,
    filledGoals,
    firstEmptyGoalIndex,
    reflectionFilled,
    addGoal,
    updateGoalText,
    toggleCompleted,
    updateMastery,
    updatePleasure,
    updateNotes,
    removeGoal,
    updateReflection,
    reset,
    save,
    handleSubmit
  };
};
