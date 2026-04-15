import { useCallback, useMemo, useState } from 'react';
import { useSaveModuleAttempt, useSubmitAttempt } from '@/hooks/useAttempts';
import type { AttemptDetailResponseItem, GeneralGoalEntry, GeneralGoalsData } from '@milobedini/shared-types';

type UseGeneralGoalsStateParams = {
  attempt: AttemptDetailResponseItem;
  mode: 'view' | 'edit';
};

export const useGeneralGoalsState = ({ attempt, mode }: UseGeneralGoalsStateParams) => {
  const initialData = attempt.generalGoals;
  const isReRating = initialData?.isReRating ?? false;
  const previousRatings = useMemo(() => initialData?.previousRatings ?? [], [initialData?.previousRatings]);

  const [goals, setGoals] = useState<GeneralGoalEntry[]>(initialData?.goals?.length ? initialData.goals : []);
  const [reflection, setReflection] = useState(initialData?.reflection ?? '');
  const [isDirty, setIsDirty] = useState(false);

  const canEdit = mode === 'edit' && attempt.status !== 'submitted';
  const canAddGoal = canEdit && !isReRating && goals.length < 3;

  const { mutateSilently: saveAttemptSilently, isPending: isSaving } = useSaveModuleAttempt(attempt._id);
  const { mutate: submitAttempt, isPending: isSubmitting } = useSubmitAttempt(attempt._id);

  const buildPayload = useCallback(
    (): Partial<GeneralGoalsData> => ({
      goals,
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
        }
      }
    );
  }, [canEdit, isDirty, saveAttemptSilently, buildPayload]);

  const markDirty = useCallback(() => {
    setIsDirty(true);
  }, []);

  const addGoal = useCallback(() => {
    if (!canAddGoal) return;
    setGoals((prev) => [...prev, { goalText: '', rating: null }]);
    markDirty();
  }, [canAddGoal, markDirty]);

  const updateGoalText = useCallback(
    (index: number, text: string) => {
      if (!canEdit || isReRating) return;
      setGoals((prev) => prev.map((g, i) => (i === index ? { ...g, goalText: text } : g)));
      markDirty();
    },
    [canEdit, isReRating, markDirty]
  );

  const updateGoalRating = useCallback(
    (index: number, rating: number) => {
      if (!canEdit) return;
      setGoals((prev) => prev.map((g, i) => (i === index ? { ...g, rating } : g)));
      markDirty();
    },
    [canEdit, markDirty]
  );

  const removeGoal = useCallback(
    (index: number) => {
      if (!canEdit || isReRating) return;
      setGoals((prev) => prev.filter((_, i) => i !== index));
      markDirty();
    },
    [canEdit, isReRating, markDirty]
  );

  const updateReflection = useCallback(
    (text: string) => {
      if (!canEdit) return;
      setReflection(text);
      markDirty();
    },
    [canEdit, markDirty]
  );

  const canSubmit =
    canEdit &&
    goals.length >= 1 &&
    goals.every((g) => g.goalText?.trim() && g.rating !== null && g.rating !== undefined) &&
    reflection.trim().length > 0;

  const handleSubmit = useCallback(
    (assignmentId?: string) => {
      if (!canSubmit) return;
      saveAttemptSilently(
        { generalGoals: buildPayload() },
        {
          onSuccess: () => {
            setIsDirty(false);
            submitAttempt({ assignmentId });
          }
        }
      );
    },
    [canSubmit, saveAttemptSilently, buildPayload, submitAttempt]
  );

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
