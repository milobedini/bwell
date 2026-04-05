import { useCallback, useEffect, useMemo, useState } from 'react';
import * as Haptics from 'expo-haptics';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { toast } from 'sonner-native';
import { TOAST_DURATIONS, TOAST_STYLES } from '@/components/toast/toastOptions';
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
  const [highestStep, setHighestStep] = useState(0); // track furthest step reached
  const [showReview, setShowReview] = useState(false);

  useEffect(() => {
    const serverData = attempt.fiveAreas;
    if (serverData) {
      setFields({ ...serverData });
      const canEditNow = mode === 'edit' && attempt.status !== 'submitted';
      if (canEditNow) {
        const firstEmpty = AREA_KEYS.findIndex((key) => !serverData[key]?.trim());
        const resumeStep = firstEmpty === -1 ? AREA_KEYS.length - 1 : firstEmpty;
        setCurrentStep(resumeStep);
        setHighestStep(resumeStep);
      }
    }
  }, [attempt._id, attempt.fiveAreas, attempt.status, mode]);

  const currentKey = AREA_KEYS[currentStep];

  // A step is "completed" (tappable) if it has content OR the user has progressed past it
  const completedSteps = useMemo(
    () => new Set(AREA_KEYS.filter((key, i) => !!fields[key]?.trim() || i < highestStep)),
    [fields, highestStep]
  );

  const updateField = useCallback((key: AreaKey, value: string) => {
    setFields((prev) => ({ ...prev, [key]: value }));
    setDirtyKeys((prev) => {
      if (prev.has(key)) return prev;
      const next = new Set(prev);
      next.add(key);
      return next;
    });
  }, []);

  const saveDirtyAndThen = useCallback(
    (onDone: () => void) => {
      if (dirtyKeys.size === 0) {
        onDone();
        return;
      }
      const fiveAreas: Partial<FiveAreasData> = {};
      for (const key of dirtyKeys) {
        fiveAreas[key] = fields[key] ?? '';
      }
      saveAttemptSilently(
        { fiveAreas },
        {
          onSuccess: () => {
            setDirtyKeys(new Set());
            onDone();
          },
          onError: () => {
            toast.error('Failed to save progress', {
              duration: TOAST_DURATIONS.error,
              styles: TOAST_STYLES.error
            });
          }
        }
      );
    },
    [dirtyKeys, fields, saveAttemptSilently]
  );

  const goForward = useCallback(() => {
    if (currentStep >= AREA_KEYS.length - 1) {
      saveDirtyAndThen(() => setShowReview(true));
      return;
    }
    saveDirtyAndThen(() => {
      const next = currentStep + 1;
      setCurrentStep(next);
      setHighestStep((h) => Math.max(h, next));
    });
  }, [currentStep, saveDirtyAndThen]);

  const goBack = useCallback(() => {
    if (currentStep <= 0) return;
    saveDirtyAndThen(() => setCurrentStep((s) => s - 1));
  }, [currentStep, saveDirtyAndThen]);

  const goToStep = useCallback(
    (step: number) => {
      if (step < 0 || step >= AREA_KEYS.length) return;
      // Allow navigating to any step the user has previously reached
      if (step > highestStep && step !== currentStep) return;

      Haptics.selectionAsync().catch(() => {});
      saveDirtyAndThen(() => {
        setCurrentStep(step);
        setShowReview(false);
      });
    },
    [highestStep, currentStep, saveDirtyAndThen]
  );

  const handleSubmit = useCallback(() => {
    saveDirtyAndThen(() => {
      submitAttempt(assignmentId ? { assignmentId: String(assignmentId) } : {}, {
        onSuccess: () => {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
          router.back();
        }
      });
    });
  }, [saveDirtyAndThen, submitAttempt, assignmentId, router]);

  return {
    fields,
    currentStep,
    currentKey,
    showReview,
    completedSteps,
    canEdit,
    isSaving,
    isSubmitting,
    updateField,
    goForward,
    goBack,
    goToStep,
    handleSubmit
  };
};
