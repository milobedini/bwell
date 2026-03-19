import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  FlatList,
  KeyboardAvoidingView,
  ListRenderItemInfo,
  Platform,
  Pressable,
  ScrollView,
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
import NumericField from './NumericField';
import ReflectionPrompt from './ReflectionPrompt';
import WeeklySummary from './WeeklySummary';

type ActivityDiaryPresenterProps = {
  attempt: AttemptDetailResponseItem & { diary: DiaryDetail };
  mode: 'view' | 'edit';
  patientName?: string;
};

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
  const { moduleSnapshot, weekStart, userNote, startedAt, completedAt, diary, updatedAt } = attempt;

  const [userNoteText, setUserNoteText] = useState(attempt.userNote ?? '');
  const [noteDirty, setNoteDirty] = useState(false);
  const [disclaimerOpen, setDisclaimerOpen] = useState(false);

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

  const [activeDayISO, setActiveDayISO] = useState(() => dateISO(days[0] || monday));

  // local state
  const [slots, setSlots] = useState<Record<SlotKey, SlotValue>>({});

  const [reflectionPrompt] = useState(() => REFLECTION_PROMPTS[Math.floor(Math.random() * REFLECTION_PROMPTS.length)]);

  // seed + hydrate from diary.days
  useEffect(() => {
    const seed: Record<SlotKey, SlotValue> = {};
    for (const d of days) {
      const iso = dateISO(d);
      for (const row of buildDaySlots(iso)) {
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
  }, [attempt._id, days, diary.days]);

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
    () => buildDaySlots(activeDayISO).map((r) => ({ key: r.key, value: slots[r.key] ?? r.value })),
    [activeDayISO, slots]
  );

  const slotFillsByDay = useMemo(() => {
    const result: Record<string, boolean[]> = {};
    for (const d of days) {
      const iso = dateISO(d);
      const daySlots = buildDaySlots(iso);
      result[iso] = daySlots.map((r) => isSlotFilled(slots[r.key] ?? r.value));
    }
    return result;
  }, [days, slots]);

  const updateSlot = useCallback(
    (key: SlotKey, patch: Partial<SlotValue>) => {
      setSlots((prev) => {
        const next = { ...prev };
        next[key] = { ...(prev[key] || {}), ...patch };
        return next;
      });

      if (canEdit) Haptics.selectionAsync().catch(() => {});
      markDirty(key);
    },
    [canEdit, markDirty]
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
      }
    });
  }, [dirtyKeys, noteDirty, buildSavePayload, saveAttemptSilently]);

  const renderSlot = useCallback(
    ({ item }: ListRenderItemInfo<{ key: SlotKey; value: SlotValue }>) => {
      const { key, value } = item;
      const disabled = !canEdit;
      const tintColor = moodColor(value.mood);
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
              mode="flat"
              disabled={disabled}
              label={mode === 'edit' ? 'Activity' : undefined}
              placeholder={mode === 'edit' ? 'What did you do?' : undefined}
              placeholderTextColor={'white'}
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
              label="Mood"
              value={value.mood}
              min={0}
              max={100}
              maxLength={3}
              disabled={disabled}
              onChange={(n) => updateSlot(key, { mood: n })}
            />
            <NumericField
              label="Achievement"
              value={value.achievement}
              min={0}
              max={10}
              maxLength={2}
              disabled={disabled}
              onChange={(n) => updateSlot(key, { achievement: n })}
            />
            <NumericField
              label="Closeness"
              value={value.closeness}
              min={0}
              max={10}
              maxLength={2}
              disabled={disabled}
              onChange={(n) => updateSlot(key, { closeness: n })}
            />
            <NumericField
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
    [canEdit, updateSlot, mode]
  );

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.select({ ios: 120, default: 0 })}
    >
      <FlatList
        data={dayRows}
        keyExtractor={(row) => row.key}
        renderItem={renderSlot}
        initialNumToRender={8}
        maxToRenderPerBatch={8}
        windowSize={6}
        removeClippedSubviews
        ListHeaderComponent={
          <View>
            {/* Sticky header region */}
            <View className="z-20 gap-1 bg-sway-dark px-4 pt-1">
              {patientName && <ThemedText type="subtitle">{`by ${patientName}`}</ThemedText>}

              <View className="flex-row flex-wrap items-center gap-2">
                <Chip
                  style={{ backgroundColor: Colors.sway.bright }}
                  textStyle={{ color: Colors.sway.dark, fontFamily: Fonts.Bold }}
                >
                  {`${Math.round(progress * 100)}%`}
                </Chip>
                {mode === 'view' ? (
                  <Chip style={{ backgroundColor: Colors.chip.darkCard }} textStyle={{ color: 'white' }}>
                    {completedAt
                      ? `Completed ${new Date(completedAt).toLocaleDateString()}`
                      : `Last Update ${new Date(updatedAt).toLocaleDateString()}`}
                  </Chip>
                ) : (
                  <>
                    {startedAt && !dirtyKeys.size && (
                      <Chip style={{ backgroundColor: Colors.chip.darkCard }} textStyle={{ color: 'white' }}>
                        {`Started ${new Date(startedAt).toLocaleDateString()}`}
                      </Chip>
                    )}
                    {updatedAt && (
                      <Chip style={{ backgroundColor: Colors.chip.darkCard }} textStyle={{ color: 'white' }}>
                        {`Updated ${new Date(updatedAt).toLocaleDateString()}`}
                      </Chip>
                    )}
                  </>
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

              {userNote ? (
                <Card style={{ backgroundColor: Colors.sway.buttonBackground }}>
                  <Card.Content>
                    <ThemedText type="smallTitle" className="mb-1 opacity-90">
                      Note
                    </ThemedText>
                    <ThemedText className="opacity-90">{userNote}</ThemedText>
                  </Card.Content>
                </Card>
              ) : null}

              {canEdit && <ReflectionPrompt prompt={reflectionPrompt} />}

              <WeeklySummary totals={diary.totals} />

              {/* Horizontal day selector */}
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
              <View className="h-3" />
            </View>
          </View>
        }
        ListFooterComponent={
          <View>
            {canEdit && (
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
                    placeholderTextColor="white"
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
                </Card.Content>
              </Card>
            )}
            {mode === 'edit' && (
              <View className="gap-3 pb-2">
                <PrimaryButton
                  title={allAnswered ? 'Submit diary' : dirtyKeys.size || noteDirty ? `Save & Exit` : 'Exit'}
                  onPress={() => {
                    if (!canEdit || !allAnswered) {
                      if (dirtyKeys.size || noteDirty) {
                        saveAttempt(buildSavePayload(), {
                          onSuccess: () => {
                            setDirtyKeys(new Set());
                            setNoteDirty(false);
                            router.back();
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
                        onSuccess: () => router.back()
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
                  <PrimaryButton title="Cancel" onPress={router.back} variant="error" />
                )}
              </View>
            )}
            {mode !== 'edit' && <PrimaryButton title="Exit" onPress={() => router.back()} />}
          </View>
        }
        // make the very top header sticky
        stickyHeaderIndices={[0]}
      />
    </KeyboardAvoidingView>
  );
};

export default ActivityDiaryPresenter;
