import { useCallback, useEffect, useMemo, useState } from 'react';
import * as Haptics from 'expo-haptics';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSaveModuleAttempt, useSubmitAttempt } from '@/hooks/useAttempts';
import type { AttemptDetailResponseItem, FiveAreasData } from '@milobedini/shared-types';

export const AREA_KEYS = ['situation', 'thoughts', 'emotions', 'physical', 'behaviours', 'reflection'] as const;
export type AreaKey = (typeof AREA_KEYS)[number];

export const AREA_LABELS: Record<AreaKey, string> = {
  situation: 'Situation',
  thoughts: 'Thoughts',
  emotions: 'Emotions',
  physical: 'Physical Sensations',
  behaviours: 'Behaviours',
  reflection: 'Reflection'
};

export const AREA_HINTS: Record<AreaKey, string> = {
  situation: 'Who were you with? What happened? When and where?',
  thoughts: "Sentences about what went through your mind. e.g. 'They don't care about me', 'I'm useless'",
  emotions: 'Usually one word: sad, angry, anxious, guilty, hopeless, frustrated',
  physical: 'What you noticed in your body: heart racing, tension, low energy, stomach churning',
  behaviours: 'Actions you took: stayed in bed, snapped at them, withdrew, avoided a situation',
  reflection: 'Looking at the cycle above — how could you break it to improve your mood?'
};

type UseFiveAreasStateParams = {
  attempt: AttemptDetailResponseItem;
  mode: 'view' | 'edit';
};

export const useFiveAreasState = ({ attempt, mode }: UseFiveAreasStateParams) => {
  const router = useRouter();
  const { assignmentId } = useLocalSearchParams<{ assignmentId?: string }>();

  const canEdit = mode === 'edit' && attempt.status !== 'submitted';

  const { mutateSilently: saveAttemptSilently, isPending: isSaving } = useSaveModuleAttempt(attempt._id);
  const { mutate: submitAttempt, isPending: isSubmitting } = useSubmitAttempt(attempt._id);

  const [fields, setFields] = useState<Partial<FiveAreasData>>({});
  const [dirtyKeys, setDirtyKeys] = useState<Set<AreaKey>>(new Set());
  const [currentStep, setCurrentStep] = useState(0);
  const [showReview, setShowReview] = useState(false);

  useEffect(() => {
    const serverData = attempt.fiveAreas;
    if (serverData) {
      setFields({ ...serverData });
      if (canEdit) {
        const firstEmpty = AREA_KEYS.findIndex((key) => !serverData[key]?.trim());
        setCurrentStep(firstEmpty === -1 ? AREA_KEYS.length - 1 : firstEmpty);
      }
    }
  }, [attempt._id]); // eslint-disable-line react-hooks/exhaustive-deps

  const hasDirtyChanges = dirtyKeys.size > 0;
  const currentKey = AREA_KEYS[currentStep];

  const completedSteps = useMemo(() => new Set(AREA_KEYS.filter((key) => !!fields[key]?.trim())), [fields]);

  const updateField = useCallback((key: AreaKey, value: string) => {
    setFields((prev) => ({ ...prev, [key]: value }));
    setDirtyKeys((prev) => new Set(prev).add(key));
  }, []);

  const buildPayload = useCallback(() => {
    const fiveAreas: Partial<FiveAreasData> = {};
    for (const key of dirtyKeys) {
      fiveAreas[key] = fields[key] ?? '';
    }
    return { fiveAreas };
  }, [dirtyKeys, fields]);

  const goForward = useCallback(() => {
    if (currentStep >= AREA_KEYS.length - 1) {
      if (hasDirtyChanges) {
        const payload = buildPayload();
        saveAttemptSilently(payload, {
          onSuccess: () => {
            setDirtyKeys(new Set());
            setShowReview(true);
          }
        });
      } else {
        setShowReview(true);
      }
      return;
    }

    if (hasDirtyChanges) {
      const payload = buildPayload();
      saveAttemptSilently(payload, {
        onSuccess: () => {
          setDirtyKeys(new Set());
          setCurrentStep((s) => s + 1);
        }
      });
    } else {
      setCurrentStep((s) => s + 1);
    }
  }, [currentStep, hasDirtyChanges, buildPayload, saveAttemptSilently]);

  const goBack = useCallback(() => {
    if (currentStep <= 0) return;
    if (hasDirtyChanges) {
      const payload = buildPayload();
      saveAttemptSilently(payload, {
        onSuccess: () => {
          setDirtyKeys(new Set());
          setCurrentStep((s) => s - 1);
        }
      });
    } else {
      setCurrentStep((s) => s - 1);
    }
  }, [currentStep, hasDirtyChanges, buildPayload, saveAttemptSilently]);

  const goToStep = useCallback(
    (step: number) => {
      if (step < 0 || step >= AREA_KEYS.length) return;
      const targetKey = AREA_KEYS[step];
      if (!completedSteps.has(targetKey) && step !== currentStep) return;

      Haptics.selectionAsync().catch(() => {});

      if (hasDirtyChanges) {
        const payload = buildPayload();
        saveAttemptSilently(payload, {
          onSuccess: () => {
            setDirtyKeys(new Set());
            setCurrentStep(step);
            setShowReview(false);
          }
        });
      } else {
        setCurrentStep(step);
        setShowReview(false);
      }
    },
    [completedSteps, currentStep, hasDirtyChanges, buildPayload, saveAttemptSilently]
  );

  const handleSubmit = useCallback(() => {
    const afterSave = () => {
      submitAttempt(assignmentId ? { assignmentId: String(assignmentId) } : {}, {
        onSuccess: () => {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
          router.back();
        }
      });
    };

    if (hasDirtyChanges) {
      const payload = buildPayload();
      saveAttemptSilently(payload, {
        onSuccess: () => {
          setDirtyKeys(new Set());
          afterSave();
        }
      });
    } else {
      afterSave();
    }
  }, [hasDirtyChanges, buildPayload, saveAttemptSilently, submitAttempt, assignmentId, router]);

  const handleExit = useCallback(() => {
    if (hasDirtyChanges) {
      const payload = buildPayload();
      saveAttemptSilently(payload, {
        onSuccess: () => {
          setDirtyKeys(new Set());
          router.back();
        }
      });
    } else {
      router.back();
    }
  }, [hasDirtyChanges, buildPayload, saveAttemptSilently, router]);

  return {
    fields,
    currentStep,
    currentKey,
    showReview,
    completedSteps,
    canEdit,
    isSaving,
    isSubmitting,
    hasDirtyChanges,
    updateField,
    goForward,
    goBack,
    goToStep,
    handleSubmit,
    handleExit
  };
};
