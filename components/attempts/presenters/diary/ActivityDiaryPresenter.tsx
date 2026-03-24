import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  FlatList,
  Keyboard,
  KeyboardAvoidingView,
  ListRenderItemInfo,
  Platform,
  Pressable,
  ScrollView,
  type TextInput as RNTextInput,
  View
} from 'react-native';
import { Card, Chip, TextInput } from 'react-native-paper';
import * as Haptics from 'expo-haptics';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { PrimaryButton } from '@/components/ThemedButton';
import { ThemedText } from '@/components/ThemedText';
import { SaveProgressChip } from '@/components/ui/Chip';
import { Colors } from '@/constants/Colors';
import { Fonts } from '@/constants/Typography';
import { useSaveModuleAttempt, useSubmitAttempt } from '@/hooks/useAttempts';
import {
  buildDaySlots,
  dateISO,
  FIELD_NAMES,
  FIELDS_PER_SLOT,
  isSlotFilled,
  moodColor,
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
import MaterialCommunityIcons from '@react-native-vector-icons/material-design-icons';

import DayChip from './DayChip';
import DiaryInputToolbar from './DiaryInputToolbar';
import NumericField from './NumericField';
import ReflectionPrompt from './ReflectionPrompt';
import WeeklySummary from './WeeklySummary';

type ActivityDiaryPresenterProps = {
  attempt: AttemptDetailResponseItem & { diary: DiaryDetail };
  mode: 'view' | 'edit';
  patientName?: string;
};

const DIARY_NAV_ID = 'diaryNav';

// Estimated height of a single slot card (Card.Title + 5 fields + spacing).
// Used by getItemLayout for fast FlatList scrollToIndex without measurement.
const SLOT_CARD_HEIGHT = 370;

const ActivityDiaryPresenter = ({ attempt, mode, patientName }: ActivityDiaryPresenterProps) => {
  const [dirtyKeys, setDirtyKeys] = useState<Set<SlotKey>>(new Set());

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
  const { moduleSnapshot, weekStart, startedAt, completedAt, diary, updatedAt, userNote } = attempt;

  const [userNoteText, setUserNoteText] = useState(attempt.userNote ?? '');
  const [noteDirty, setNoteDirty] = useState(false);
  const [disclaimerOpen, setDisclaimerOpen] = useState(false);

  const flatListRef = useRef<FlatList>(null);
  const inputRefs = useRef<Map<string, RNTextInput>>(new Map());
  const [focusedFieldIdx, setFocusedFieldIdx] = useState<number | null>(null);

  // Reset toolbar state when keyboard is dismissed via OS gesture (#4)
  useEffect(() => {
    const sub = Keyboard.addListener('keyboardDidHide', () => setFocusedFieldIdx(null));
    return () => sub.remove();
  }, []);

  const markDirty = useCallback((k: SlotKey) => {
    setDirtyKeys((prev) => {
      if (prev.has(k)) return prev;
      const next = new Set(prev);
      next.add(k);
      return next;
    });
  }, []);

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

  const weekSlots = useMemo(() => {
    const result: Record<string, { key: SlotKey; value: SlotValue }[]> = {};
    for (const d of days) {
      const iso = dateISO(d);
      result[iso] = buildDaySlots(iso);
    }
    return result;
  }, [days]);

  const [activeDayISO, setActiveDayISO] = useState(() => dateISO(days[0] || monday));

  // Clear stale refs and reset toolbar when switching days (#6)
  useEffect(() => {
    inputRefs.current.clear();
    setFocusedFieldIdx(null);
  }, [activeDayISO]);

  // local state
  const [slots, setSlots] = useState<Record<SlotKey, SlotValue>>({});

  const [reflectionPrompt] = useState(() => REFLECTION_PROMPTS[Math.floor(Math.random() * REFLECTION_PROMPTS.length)]);

  // seed + hydrate from diary.days
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

  const progress = useMemo(() => {
    const vals = Object.values(slots);
    if (!vals.length) return 0;
    const filled = vals.filter(isSlotFilled).length;
    return filled / vals.length;
  }, [slots]);

  const allAnswered = useMemo(() => {
    return Object.values(slots).every((v) => v.activity.trim().length > 0);
  }, [slots]);

  const dayRows = useMemo(
    () => (weekSlots[activeDayISO] ?? []).map((r) => ({ key: r.key, value: slots[r.key] ?? r.value })),
    [activeDayISO, slots, weekSlots]
  );

  // Total fields for the current day
  const totalFields = dayRows.length * FIELDS_PER_SLOT;

  // Build the ordered ref key for a given slot index + field index
  const refKey = useCallback((slotIdx: number, fieldIdx: number) => `${slotIdx}-${fieldIdx}`, []);

  // Register a ref
  const registerRef = useCallback((key: string, ref: RNTextInput | null) => {
    if (ref) {
      inputRefs.current.set(key, ref);
    } else {
      inputRefs.current.delete(key);
    }
  }, []);

  // Stable ref callback cache — avoids recreating arrow functions on every render (#2)
  const refCallbackCache = useRef<Map<string, (r: RNTextInput | null) => void>>(new Map());
  const getRefCallback = useCallback(
    (key: string) => {
      if (!refCallbackCache.current.has(key)) {
        refCallbackCache.current.set(key, (r: RNTextInput | null) => registerRef(key, r));
      }
      return refCallbackCache.current.get(key)!;
    },
    [registerRef]
  );

  // Focus a field by flat index — scroll first so virtualised items mount before focus (#5)
  const focusField = useCallback(
    (flatIdx: number) => {
      const slotIdx = Math.floor(flatIdx / FIELDS_PER_SLOT);
      const fieldIdx = flatIdx % FIELDS_PER_SLOT;
      const key = refKey(slotIdx, fieldIdx);

      const tryFocus = () => {
        const input = inputRefs.current.get(key);
        input?.focus();
      };

      if (flatListRef.current && slotIdx < dayRows.length) {
        flatListRef.current.scrollToIndex({ index: slotIdx, animated: true, viewPosition: 0.3 });
        // Allow next frame for virtualised item to mount after scroll
        requestAnimationFrame(tryFocus);
      } else {
        tryFocus();
      }
    },
    [refKey, dayRows.length]
  );

  // Toolbar context label
  const toolbarLabel = useMemo(() => {
    if (focusedFieldIdx == null) return '';
    const slotIdx = Math.floor(focusedFieldIdx / FIELDS_PER_SLOT);
    const fieldIdx = focusedFieldIdx % FIELDS_PER_SLOT;
    const slotLbl = dayRows[slotIdx]?.value.label ?? '';
    return `${FIELD_NAMES[fieldIdx]} — ${slotLbl}`;
  }, [focusedFieldIdx, dayRows]);

  const getItemLayout = useCallback(
    (_data: unknown, index: number) => ({
      length: SLOT_CARD_HEIGHT,
      offset: SLOT_CARD_HEIGHT * index,
      index
    }),
    []
  );

  const slotFillsByDay = useMemo(() => {
    const result: Record<string, boolean[]> = {};
    for (const [iso, daySlots] of Object.entries(weekSlots)) {
      result[iso] = daySlots.map((r) => isSlotFilled(slots[r.key] ?? r.value));
    }
    return result;
  }, [weekSlots, slots]);

  const updateSlot = useCallback(
    (key: SlotKey, patch: Partial<SlotValue>) => {
      setSlots((prev) => {
        const next = { ...prev };
        next[key] = { ...(prev[key] || {}), ...patch };
        return next;
      });

      markDirty(key);
    },
    [markDirty]
  );

  const buildPayload = useCallback(
    (keys: Iterable<SlotKey>): DiaryEntryInput[] => {
      const out: DiaryEntryInput[] = [];
      for (const k of keys) {
        const v = slots[k];
        if (!v) continue;
        out.push({
          at: v.at.toISOString(),
          label: v.label,
          activity: v.activity ?? '',
          mood: v.mood,
          achievement: v.achievement,
          closeness: v.closeness,
          enjoyment: v.enjoyment
        });
      }
      return out;
    },
    [slots]
  );

  const buildSavePayload = useCallback((): SaveProgressInput => {
    const payload: SaveProgressInput = { merge: true };
    if (dirtyKeys.size) payload.diaryEntries = buildPayload(dirtyKeys);
    if (noteDirty) payload.userNote = userNoteText;
    return payload;
  }, [dirtyKeys, noteDirty, userNoteText, buildPayload]);

  const saveDirty = useCallback(() => {
    if (!dirtyKeys.size && !noteDirty) return;
    saveAttemptSilently(buildSavePayload(), {
      onSuccess: () => {
        setDirtyKeys(new Set());
        setNoteDirty(false);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
      }
    });
  }, [dirtyKeys, noteDirty, buildSavePayload, saveAttemptSilently]);

  const renderSlot = useCallback(
    ({ item, index: slotIdx }: ListRenderItemInfo<{ key: SlotKey; value: SlotValue }>) => {
      const { key, value } = item;
      const disabled = !canEdit;
      const tintColor = moodColor(value.mood);
      const accessoryProps = canEdit ? { inputAccessoryViewID: DIARY_NAV_ID } : {};
      return (
        <Card
          style={{
            backgroundColor: Colors.sway.buttonBackground,
            marginBottom: 10,
            marginHorizontal: 8,
            borderLeftWidth: 3,
            borderLeftColor: tintColor ?? 'transparent'
          }}
        >
          <Card.Title
            title={value.label}
            titleStyle={{ color: 'white', fontFamily: Fonts.Bold }}
            right={() =>
              tintColor && value.mood != null ? (
                <ThemedText style={{ fontSize: 11, color: tintColor, marginRight: 12 }}>mood {value.mood}</ThemedText>
              ) : null
            }
          />
          <Card.Content style={{ gap: 8 }}>
            <TextInput
              ref={getRefCallback(refKey(slotIdx, 0))}
              onFocus={() => setFocusedFieldIdx(slotIdx * FIELDS_PER_SLOT + 0)}
              {...accessoryProps}
              mode="flat"
              disabled={disabled}
              label={mode === 'edit' ? 'Activity' : undefined}
              placeholder={mode === 'edit' ? 'What did you do?' : undefined}
              placeholderTextColor={Colors.sway.darkGrey}
              value={value.activity}
              onChangeText={(t) => updateSlot(key, { activity: t })}
              style={{
                backgroundColor: 'transparent'
              }}
              className=" overflow-hidden text-ellipsis border border-sway-darkGrey text-white"
              textColor="white"
              underlineColor="transparent"
              activeUnderlineColor={Colors.sway.bright}
              theme={{ colors: { onSurfaceVariant: Colors.sway.lightGrey } }}
              clearButtonMode={mode === 'edit' ? 'always' : 'never'}
            />
            <NumericField
              ref={getRefCallback(refKey(slotIdx, 1))}
              onFocus={() => setFocusedFieldIdx(slotIdx * FIELDS_PER_SLOT + 1)}
              inputAccessoryViewID={canEdit ? DIARY_NAV_ID : undefined}
              label="Mood"
              value={value.mood}
              min={0}
              max={100}
              maxLength={3}
              disabled={disabled}
              onChange={(n) => updateSlot(key, { mood: n })}
            />
            <NumericField
              ref={getRefCallback(refKey(slotIdx, 2))}
              onFocus={() => setFocusedFieldIdx(slotIdx * FIELDS_PER_SLOT + 2)}
              inputAccessoryViewID={canEdit ? DIARY_NAV_ID : undefined}
              label="Achievement"
              value={value.achievement}
              min={0}
              max={10}
              maxLength={2}
              disabled={disabled}
              onChange={(n) => updateSlot(key, { achievement: n })}
            />
            <NumericField
              ref={getRefCallback(refKey(slotIdx, 3))}
              onFocus={() => setFocusedFieldIdx(slotIdx * FIELDS_PER_SLOT + 3)}
              inputAccessoryViewID={canEdit ? DIARY_NAV_ID : undefined}
              label="Closeness"
              value={value.closeness}
              min={0}
              max={10}
              maxLength={2}
              disabled={disabled}
              onChange={(n) => updateSlot(key, { closeness: n })}
            />
            <NumericField
              ref={getRefCallback(refKey(slotIdx, 4))}
              onFocus={() => setFocusedFieldIdx(slotIdx * FIELDS_PER_SLOT + 4)}
              inputAccessoryViewID={canEdit ? DIARY_NAV_ID : undefined}
              label="Enjoyment"
              value={value.enjoyment}
              min={0}
              max={10}
              maxLength={2}
              disabled={disabled}
              onChange={(n) => updateSlot(key, { enjoyment: n })}
            />
          </Card.Content>
        </Card>
      );
    },
    [canEdit, updateSlot, mode, getRefCallback, refKey]
  );

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.select({ ios: 120, default: 0 })}
    >
      {/* Sticky day selector — always visible */}
      <View
        style={{ borderBottomWidth: 1, borderBottomColor: Colors.chip.darkCard }}
        className="bg-sway-dark px-4 pb-2 pt-1"
      >
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 0, gap: 8 }}
        >
          {days.map((d) => {
            const iso = dateISO(d);
            return (
              <DayChip
                key={iso}
                date={d}
                selected={iso === activeDayISO}
                slotFills={slotFillsByDay[iso] ?? []}
                onPress={() => setActiveDayISO(iso)}
              />
            );
          })}
        </ScrollView>
      </View>

      <FlatList
        ref={flatListRef}
        data={dayRows}
        keyExtractor={(row) => row.key}
        renderItem={renderSlot}
        getItemLayout={getItemLayout}
        onScrollToIndexFailed={(info) => {
          setTimeout(() => {
            flatListRef.current?.scrollToIndex({ index: info.index, animated: true, viewPosition: 0.3 });
          }, 100);
        }}
        initialNumToRender={8}
        maxToRenderPerBatch={8}
        windowSize={6}
        removeClippedSubviews
        ListHeaderComponent={
          <View className="gap-3 px-4 pb-3 pt-3">
            {patientName && <ThemedText type="subtitle">{`by ${patientName}`}</ThemedText>}

            <View className="flex-row flex-wrap items-center gap-2">
              <Chip
                style={{ backgroundColor: Colors.sway.bright }}
                textStyle={{ color: Colors.sway.dark, fontFamily: Fonts.Bold }}
              >
                {`${Math.round(progress * 100)}%`}
              </Chip>
              {mode === 'view' ? (
                <ThemedText type="small" style={{ color: Colors.sway.darkGrey }}>
                  {completedAt
                    ? `Completed ${new Date(completedAt).toLocaleDateString()}`
                    : `Updated ${new Date(updatedAt).toLocaleDateString()}`}
                </ThemedText>
              ) : (
                <ThemedText type="small" style={{ color: Colors.sway.darkGrey }}>
                  {[
                    startedAt && !dirtyKeys.size && `Started ${new Date(startedAt).toLocaleDateString()}`,
                    updatedAt && `Updated ${new Date(updatedAt).toLocaleDateString()}`
                  ]
                    .filter(Boolean)
                    .join(' · ')}
                </ThemedText>
              )}
              <SaveProgressChip saved={saved} isSaving={isSaving} />
              {moduleSnapshot?.disclaimer ? (
                <Pressable
                  onPress={() => setDisclaimerOpen((prev) => !prev)}
                  hitSlop={8}
                  accessibilityRole="button"
                  accessibilityLabel="Safety information"
                >
                  <MaterialCommunityIcons name="information-outline" size={20} color={Colors.sway.lightGrey} />
                </Pressable>
              ) : null}
              {(!!dirtyKeys.size || noteDirty) && (
                <Chip
                  icon={() => <MaterialCommunityIcons name="content-save" size={24} color={Colors.chip.green} />}
                  mode="outlined"
                  textStyle={{ fontFamily: Fonts.Black, color: Colors.chip.green }}
                  style={{
                    backgroundColor: Colors.sway.buttonBackground,
                    borderColor: Colors.chip.greenBorder
                  }}
                  disabled={!dirtyKeys.size && !noteDirty}
                  onPress={saveDirty}
                >
                  {dirtyKeys.size || noteDirty ? 'Save changes' : 'Saved'}
                </Chip>
              )}
            </View>

            {disclaimerOpen && moduleSnapshot?.disclaimer ? (
              <ThemedText style={{ fontSize: 12, color: Colors.sway.darkGrey, marginTop: 4 }}>
                {moduleSnapshot.disclaimer}
              </ThemedText>
            ) : null}

            {canEdit && <ReflectionPrompt prompt={reflectionPrompt} />}

            <WeeklySummary totals={diary.totals} />
          </View>
        }
        ListFooterComponent={
          <View>
            {canEdit ? (
              <Card
                style={{
                  backgroundColor: Colors.sway.buttonBackground,
                  marginBottom: 10,
                  marginHorizontal: 8
                }}
              >
                <Card.Title title="Note for therapist" titleStyle={{ color: 'white', fontFamily: Fonts.Bold }} />
                <Card.Content>
                  <TextInput
                    mode="flat"
                    placeholder="Anything you'd like your therapist to know this week..."
                    placeholderTextColor={Colors.sway.darkGrey}
                    value={userNoteText}
                    onChangeText={(t) => {
                      setUserNoteText(t);
                      setNoteDirty(true);
                    }}
                    multiline
                    maxLength={500}
                    style={{ backgroundColor: 'transparent', minHeight: 64 }}
                    className="overflow-hidden text-ellipsis border border-sway-darkGrey text-white"
                    textColor="white"
                    underlineColor="transparent"
                    activeUnderlineColor={Colors.sway.bright}
                    theme={{ colors: { onSurfaceVariant: Colors.sway.lightGrey } }}
                    clearButtonMode="always"
                  />
                  <ThemedText
                    type="small"
                    style={{
                      textAlign: 'right',
                      marginTop: 4,
                      color: userNoteText.length >= 450 ? Colors.primary.error : Colors.sway.darkGrey
                    }}
                  >
                    {`${userNoteText.length}/500`}
                  </ThemedText>
                </Card.Content>
              </Card>
            ) : userNote ? (
              <Card
                style={{
                  backgroundColor: Colors.sway.buttonBackground,
                  marginBottom: 10,
                  marginHorizontal: 8
                }}
              >
                <Card.Title title="Patient note" titleStyle={{ color: 'white', fontFamily: Fonts.Bold }} />
                <Card.Content>
                  <ThemedText style={{ color: Colors.sway.lightGrey }}>{userNote}</ThemedText>
                </Card.Content>
              </Card>
            ) : null}
            {mode === 'edit' && (
              <View className="gap-3 pb-2">
                <PrimaryButton
                  className="mb-2"
                  title={allAnswered ? 'Submit diary' : dirtyKeys.size || noteDirty ? `Save & Exit` : 'Exit'}
                  onPress={() => {
                    if (!canEdit || !allAnswered) {
                      if (dirtyKeys.size || noteDirty) {
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
                      } else {
                        router.back();
                      }
                      return;
                    }
                    // ensure latest edits are saved before submit
                    const afterSave = () =>
                      submitAttempt(assignmentId ? { assignmentId: String(assignmentId) } : {}, {
                        onSuccess: () => {
                          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
                          router.back();
                        }
                      });

                    if (dirtyKeys.size || noteDirty) {
                      saveAttemptSilently(buildSavePayload(), {
                        onSuccess: () => {
                          setDirtyKeys(new Set());
                          setNoteDirty(false);
                          afterSave();
                        }
                      });
                    } else {
                      afterSave();
                    }
                  }}
                />
                {(!!dirtyKeys.size || noteDirty) && (
                  <PrimaryButton title="Discard changes" onPress={router.back} variant="error" />
                )}
              </View>
            )}
            {mode !== 'edit' && <PrimaryButton className="mb-2" title="Exit" onPress={() => router.back()} />}
          </View>
        }
      />
      {canEdit && (
        <DiaryInputToolbar
          nativeID={DIARY_NAV_ID}
          label={toolbarLabel}
          canGoPrev={focusedFieldIdx != null && focusedFieldIdx > 0}
          canGoNext={focusedFieldIdx != null && focusedFieldIdx < totalFields - 1}
          onPrev={() => {
            if (focusedFieldIdx != null && focusedFieldIdx > 0) {
              focusField(focusedFieldIdx - 1);
            }
          }}
          onNext={() => {
            if (focusedFieldIdx != null && focusedFieldIdx < totalFields - 1) {
              focusField(focusedFieldIdx + 1);
            }
          }}
        />
      )}
    </KeyboardAvoidingView>
  );
};

export default ActivityDiaryPresenter;
