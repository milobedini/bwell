import { useCallback, useRef, useState } from 'react';
import * as Haptics from 'expo-haptics';
import { useLocalSearchParams } from 'expo-router';
import { toast } from 'sonner-native';
import { TOAST_DURATIONS, TOAST_STYLES } from '@/components/toast/toastOptions';
import { useSaveModuleAttempt, useSubmitAttempt } from '@/hooks/useAttempts';
import { AttemptStatus } from '@/types/types';
import type { AttemptDetailResponseItem, GeneralGoalEntry, GeneralGoalsData } from '@milobedini/shared-types';

type UseGeneralGoalsStateParams = {
  attempt: AttemptDetailResponseItem;
  mode: 'view' | 'edit';
};

export type GoalWithId = GeneralGoalEntry & { _uid: string };

let nextUid = 0;
const createUid = () => `goal-${Date.now()}-${nextUid++}`;

const toGoalsWithIds = (goals: GeneralGoalEntry[]): GoalWithId[] => goals.map((g) => ({ ...g, _uid: createUid() }));

const stripIds = (goals: GoalWithId[]): GeneralGoalEntry[] =>
  goals.map(({ goalText, rating }) => ({ goalText, rating }));

const handleError = () => {
  Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(() => {});
  toast.error('Failed to save progress', {
    duration: TOAST_DURATIONS.error,
    styles: TOAST_STYLES.error
  });
};

export const useGeneralGoalsState = ({ attempt, mode }: UseGeneralGoalsStateParams) => {
  const { assignmentId } = useLocalSearchParams<{ assignmentId?: string }>();
  const initialData = attempt.generalGoals;
  const isReRating = initialData?.isReRating ?? false;
  const previousRatingsRef = useRef(initialData?.previousRatings ?? []);
  const previousRatings = previousRatingsRef.current;

  const [goals, setGoals] = useState<GoalWithId[]>(initialData?.goals?.length ? toGoalsWithIds(initialData.goals) : []);
  const [reflection, setReflection] = useState(initialData?.reflection ?? '');
  const [isDirty, setIsDirty] = useState(false);

  const canEdit = mode === 'edit' && attempt.status !== AttemptStatus.SUBMITTED;
  const canAddGoal = canEdit && !isReRating && goals.length < 3;

  const { mutateSilently: saveAttemptSilently, isPending: isSaving } = useSaveModuleAttempt(attempt._id);
  const { mutate: submitAttempt, isPending: isSubmitting } = useSubmitAttempt(attempt._id);

  const buildPayload = useCallback(
    (): Partial<GeneralGoalsData> => ({
      goals: stripIds(goals),
      reflection,
      isReRating,
      previousRatings
    }),
    [goals, reflection, isReRating, previousRatings]
  );

  const save = useCallback(() => {
    if (!canEdit || !isDirty) return;
    saveAttemptSilently(
      { generalGoals: buildPayload() },
      {
        onSuccess: () => {
          setIsDirty(false);
        },
        onError: handleError
      }
    );
  }, [canEdit, isDirty, saveAttemptSilently, buildPayload]);

  const addGoal = useCallback(() => {
    if (!canAddGoal) return;
    setGoals((prev) => [...prev, { goalText: '', rating: null, _uid: createUid() }]);
    setIsDirty(true);
  }, [canAddGoal]);

  const updateGoalText = useCallback(
    (index: number, text: string) => {
      if (!canEdit || isReRating) return;
      setGoals((prev) => prev.map((g, i) => (i === index ? { ...g, goalText: text } : g)));
      setIsDirty(true);
    },
    [canEdit, isReRating]
  );

  const updateGoalRating = useCallback(
    (index: number, rating: number) => {
      if (!canEdit) return;
      setGoals((prev) => prev.map((g, i) => (i === index ? { ...g, rating } : g)));
      setIsDirty(true);
    },
    [canEdit]
  );

  const removeGoal = useCallback(
    (index: number) => {
      if (!canEdit || isReRating) return;
      setGoals((prev) => prev.filter((_, i) => i !== index));
      setIsDirty(true);
    },
    [canEdit, isReRating]
  );

  const updateReflection = useCallback(
    (text: string) => {
      if (!canEdit) return;
      setReflection(text);
      setIsDirty(true);
    },
    [canEdit]
  );

  const canSubmit =
    canEdit &&
    goals.length >= 1 &&
    goals.every((g) => g.goalText?.trim() && g.rating !== null && g.rating !== undefined) &&
    reflection.trim().length > 0;

  const handleSubmit = useCallback(() => {
    if (!canSubmit) return;
    saveAttemptSilently(
      { generalGoals: buildPayload() },
      {
        onSuccess: () => {
          setIsDirty(false);
          submitAttempt(assignmentId ? { assignmentId: String(assignmentId) } : {}, {
            onError: handleError
          });
        },
        onError: handleError
      }
    );
  }, [canSubmit, saveAttemptSilently, buildPayload, submitAttempt, assignmentId]);

  return {
    goals,
    reflection,
    isReRating,
    previousRatings,
    canEdit,
    canAddGoal,
    canSubmit,
    isSaving,
    isSubmitting,
    isDirty,
    addGoal,
    updateGoalText,
    updateGoalRating,
    removeGoal,
    updateReflection,
    save,
    handleSubmit
  };
};
