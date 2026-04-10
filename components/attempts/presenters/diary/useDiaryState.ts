import { useCallback, useEffect, useMemo, useState } from 'react';
import * as Haptics from 'expo-haptics';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSaveModuleAttempt, useSubmitAttempt } from '@/hooks/useAttempts';
import {
  buildDaySlots,
  dateISO,
  isSlotFilled,
  REFLECTION_PROMPTS,
  type SlotKey,
  slotLabel,
  type SlotValue,
  startOfMonday
} from '@/utils/activityHelpers';
import type {
  AttemptDetailResponseItem,
  DiaryDetail,
  DiaryEntryInput,
  SaveProgressInput
} from '@milobedini/shared-types';

type UseDiaryStateParams = {
  attempt: AttemptDetailResponseItem & { diary: DiaryDetail };
  mode: 'view' | 'edit';
};

export const useDiaryState = ({ attempt, mode }: UseDiaryStateParams) => {
  const router = useRouter();
  const { assignmentId } = useLocalSearchParams<{ assignmentId?: string }>();

  const {
    mutate: saveAttempt,
    mutateSilently: saveAttemptSilently,
    isPending: isSaving,
    isSuccess: saved
  } = useSaveModuleAttempt(attempt._id);
  const { mutate: submitAttempt } = useSubmitAttempt(attempt._id);

  const canEdit = mode === 'edit';
  const { moduleSnapshot, weekStart, diary, updatedAt, userNote } = attempt;

  const [dirtyKeys, setDirtyKeys] = useState<Set<SlotKey>>(new Set());
  const [userNoteText, setUserNoteText] = useState(attempt.userNote ?? '');
  const [noteDirty, setNoteDirty] = useState(false);
  const [disclaimerOpen, setDisclaimerOpen] = useState(false);
  const hasDirtyChanges = dirtyKeys.size > 0 || noteDirty;

  const [reflectionPrompt] = useState(() => REFLECTION_PROMPTS[Math.floor(Math.random() * REFLECTION_PROMPTS.length)]);

  const monday = useMemo(() => startOfMonday(weekStart ? new Date(weekStart) : new Date()), [weekStart]);
  const days = useMemo(
    () =>
      Array.from({ length: 7 }).map((_, i) => {
        const d = new Date(monday);
        d.setDate(monday.getDate() + i);
        return d;
      }),
    [monday]
  );

  const weekSlots = useMemo(
    () =>
      Object.fromEntries(
        days.map((d) => {
          const iso = dateISO(d);
          return [iso, buildDaySlots(iso)];
        })
      ) as Record<string, { key: SlotKey; value: SlotValue }[]>,
    [days]
  );

  const [activeDayISO, setActiveDayISO] = useState(() => dateISO(days[0] || monday));
  const [slots, setSlots] = useState<Record<SlotKey, SlotValue>>({});

  // Seed + hydrate from diary.days
  useEffect(() => {
    const seed: Record<SlotKey, SlotValue> = {};
    for (const daySlots of Object.values(weekSlots)) {
      for (const row of daySlots) {
        seed[row.key] = row.value;
      }
    }
    for (const day of diary.days ?? []) {
      for (const e of day.entries) {
        const at = new Date(e.at);
        const iso = dateISO(at);
        const label = e.label ?? slotLabel(at.getUTCHours());
        const key = `${iso}|${label}`;
        seed[key] = {
          at,
          label,
          activity: e.activity ?? '',
          mood: e.mood,
          achievement: e.achievement,
          closeness: e.closeness,
          enjoyment: e.enjoyment
        };
      }
    }
    setSlots(seed);
  }, [attempt._id, weekSlots, diary.days]);

  const allAnswered = useMemo(() => Object.values(slots).every((v) => v.activity.trim().length > 0), [slots]);

  const dayRows = useMemo(
    () => (weekSlots[activeDayISO] ?? []).map((r) => ({ key: r.key, value: slots[r.key] ?? r.value })),
    [activeDayISO, slots, weekSlots]
  );

  const slotFillsByDay = useMemo(
    () =>
      Object.fromEntries(
        Object.entries(weekSlots).map(([iso, daySlots]) => [
          iso,
          daySlots.map((r) => isSlotFilled(slots[r.key] ?? r.value))
        ])
      ) as Record<string, boolean[]>,
    [weekSlots, slots]
  );

  const slotFillCounts = useMemo(
    () =>
      Object.fromEntries(
        Object.entries(slotFillsByDay).map(([iso, fills]) => [iso, fills.filter(Boolean).length])
      ) as Record<string, number>,
    [slotFillsByDay]
  );

  const markDirty = useCallback((k: SlotKey) => {
    setDirtyKeys((prev) => {
      if (prev.has(k)) return prev;
      const next = new Set(prev);
      next.add(k);
      return next;
    });
  }, []);

  const updateSlot = useCallback(
    (key: SlotKey, patch: Partial<SlotValue>) => {
      setSlots((prev) => ({ ...prev, [key]: { ...(prev[key] || {}), ...patch } }));
      markDirty(key);
    },
    [markDirty]
  );

  const buildPayload = useCallback(
    (keys: Iterable<SlotKey>): DiaryEntryInput[] =>
      Array.from(keys)
        .filter((k) => slots[k] != null)
        .map((k) => {
          const v = slots[k];
          return {
            at: v.at.toISOString(),
            label: v.label,
            activity: v.activity ?? '',
            mood: v.mood,
            achievement: v.achievement,
            closeness: v.closeness,
            enjoyment: v.enjoyment
          };
        }),
    [slots]
  );

  const buildSavePayload = useCallback((): SaveProgressInput => {
    const payload: SaveProgressInput = { merge: true };
    if (dirtyKeys.size) payload.diaryEntries = buildPayload(dirtyKeys);
    if (noteDirty) payload.userNote = userNoteText;
    return payload;
  }, [dirtyKeys, noteDirty, userNoteText, buildPayload]);

  const saveDirty = useCallback(() => {
    if (!hasDirtyChanges) return;
    saveAttemptSilently(buildSavePayload(), {
      onSuccess: () => {
        setDirtyKeys(new Set());
        setNoteDirty(false);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
      },
      onError: () => {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(() => {});
      }
    });
  }, [hasDirtyChanges, buildSavePayload, saveAttemptSilently]);

  const handleSaveDraft = useCallback(() => {
    if (!hasDirtyChanges) {
      router.back();
      return;
    }
    saveAttempt(buildSavePayload(), {
      onSuccess: () => {
        setDirtyKeys(new Set());
        setNoteDirty(false);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
        router.back();
      },
      onError: () => {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(() => {});
      }
    });
  }, [hasDirtyChanges, buildSavePayload, saveAttempt, router]);

  const handleSubmit = useCallback(() => {
    const afterSave = () =>
      submitAttempt(assignmentId ? { assignmentId: String(assignmentId) } : {}, {
        onSuccess: () => {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
          router.back();
        },
        onError: () => {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(() => {});
        }
      });

    if (hasDirtyChanges) {
      saveAttemptSilently(buildSavePayload(), {
        onSuccess: () => {
          setDirtyKeys(new Set());
          setNoteDirty(false);
          afterSave();
        },
        onError: () => {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(() => {});
        }
      });
    } else {
      afterSave();
    }
  }, [hasDirtyChanges, buildSavePayload, saveAttemptSilently, submitAttempt, assignmentId, router]);

  return {
    activeDayISO,
    setActiveDayISO,
    userNoteText,
    setUserNoteText,
    setNoteDirty,
    disclaimerOpen,
    setDisclaimerOpen,
    hasDirtyChanges,
    reflectionPrompt,
    days,
    dayRows,
    slotFillCounts,
    allAnswered,
    canEdit,
    moduleSnapshot,
    updatedAt,
    userNote,
    diary,
    isSaving,
    saved,
    updateSlot,
    saveDirty,
    handleSaveDraft,
    handleSubmit,
    router
  };
};
