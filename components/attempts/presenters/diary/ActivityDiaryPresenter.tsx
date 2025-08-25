import { memo, useCallback, useEffect, useMemo, useState } from 'react';
import { FlatList, KeyboardAvoidingView, ListRenderItemInfo, Platform, ScrollView, View } from 'react-native';
import { Card, Chip, Divider, ProgressBar, TextInput } from 'react-native-paper';
import * as Haptics from 'expo-haptics';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { PrimaryButton } from '@/components/ThemedButton';
import { ThemedText } from '@/components/ThemedText';
import { renderErrorToast, renderSuccessToast } from '@/components/toast/toastOptions';
import { SaveProgressChip } from '@/components/ui/Chip';
import { Colors } from '@/constants/Colors';
import { Fonts } from '@/constants/Typography';
import { useSaveModuleAttempt, useSubmitAttempt } from '@/hooks/useAttempts';
import { clamp } from '@/utils/helpers';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import type { AttemptDetailResponseItem, DiaryDetail, DiaryEntryInput } from '@milobedini/shared-types';

// Todo - review and clean up.

type Props = {
  attempt: AttemptDetailResponseItem & { diary: DiaryDetail };
  mode: 'view' | 'edit';
  patientName?: string;
};

const SLOT_START_HOUR = 6;
const SLOT_END_HOUR = 24;
const SLOT_STEP_HOURS = 2;

const pad2 = (n: number) => String(n).padStart(2, '0');

function startOfMonday(d: Date) {
  const dt = new Date(d);
  const day = dt.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  dt.setHours(0, 0, 0, 0);
  dt.setDate(dt.getDate() + diff);
  return dt;
}
function dayLabel(d: Date) {
  return d.toLocaleDateString(undefined, { weekday: 'short' });
}
function dateISO(d: Date) {
  return d.toISOString().slice(0, 10);
}
function slotLabel(h: number) {
  const end = Math.min(24, h + SLOT_STEP_HOURS);
  return `${pad2(h)}:00–${pad2(end)}:00`;
}

type SlotKey = string; // `${iso}|${label}`
type SlotValue = {
  at: Date;
  label: string;
  activity: string;
  mood?: number;
  achievement?: number;
  closeness?: number;
  enjoyment?: number;
};

function buildDaySlots(baseIso: string): { key: SlotKey; value: SlotValue }[] {
  const base = new Date(`${baseIso}T00:00:00.000Z`);
  const rows: { key: SlotKey; value: SlotValue }[] = [];
  for (let h = SLOT_START_HOUR; h < SLOT_END_HOUR; h += SLOT_STEP_HOURS) {
    const at = new Date(base);
    at.setUTCHours(h, 0, 0, 0);
    const label = slotLabel(h);
    const key = `${dateISO(at)}|${label}`;
    rows.push({ key, value: { at, label, activity: '' } });
  }
  return rows;
}

export default function ActivityDiaryPresenter({ attempt, mode, patientName }: Props) {
  const [dirtyKeys, setDirtyKeys] = useState<Set<SlotKey>>(new Set());

  const router = useRouter();
  const { assignmentId } = useLocalSearchParams<{ assignmentId?: string }>();

  const { mutate: saveAttempt, isPending: isSaving, isSuccess: saved } = useSaveModuleAttempt(attempt._id);
  const { mutate: submitAttempt } = useSubmitAttempt(attempt._id);

  const canEdit = mode === 'edit';
  const { moduleSnapshot, weekStart, userNote, startedAt, completedAt, diary } = attempt;

  const title = moduleSnapshot?.title ?? 'Activity Diary';

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
    const filled = vals.filter(
      (v) =>
        (v.activity && v.activity.trim().length > 0) ||
        v.mood != null ||
        v.achievement != null ||
        v.closeness != null ||
        v.enjoyment != null
    ).length;
    return filled / vals.length;
  }, [slots]);

  const allAnswered = useMemo(() => {
    return Object.values(slots).every((v) => v.activity.trim().length > 0);
  }, [slots]);

  const dayRows = useMemo(
    () => buildDaySlots(activeDayISO).map((r) => ({ key: r.key, value: slots[r.key] ?? r.value })),
    [activeDayISO, slots]
  );

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

  const saveDirty = useCallback(() => {
    if (!dirtyKeys.size) return;
    const payload = buildPayload(dirtyKeys);
    saveAttempt(
      { diaryEntries: payload, merge: true },
      {
        onError: (err) => renderErrorToast(err),
        onSuccess: () => {
          setDirtyKeys(new Set()); // reset dirty state
        }
      }
    );
  }, [dirtyKeys, buildPayload, saveAttempt]);

  const renderSlot = useCallback(
    ({ item }: ListRenderItemInfo<{ key: SlotKey; value: SlotValue }>) => {
      const { key, value } = item;
      const disabled = !canEdit;
      return (
        <Card style={{ backgroundColor: Colors.sway.buttonBackground, marginBottom: 10, marginHorizontal: 8 }}>
          <Card.Title title={value.label} titleStyle={{ color: 'white', fontFamily: Fonts.Bold }} />
          <Card.Content style={{ gap: 8 }}>
            <TextInput
              mode="flat"
              disabled={disabled}
              label="Activity"
              placeholder="What did you do?"
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
              clearButtonMode="always"
            />
            <NumericField
              label="Mood"
              value={value.mood ?? 0}
              min={0}
              max={100}
              maxLength={3}
              disabled={disabled}
              onChange={(n) => updateSlot(key, { mood: n })}
            />
            <NumericField
              label="Achievement"
              value={value.achievement ?? 0}
              min={0}
              max={10}
              maxLength={2}
              disabled={disabled}
              onChange={(n) => updateSlot(key, { achievement: n })}
            />
            <NumericField
              label="Closeness"
              value={value.closeness ?? 0}
              min={0}
              max={10}
              maxLength={2}
              disabled={disabled}
              onChange={(n) => updateSlot(key, { closeness: n })}
            />
            <NumericField
              label="Enjoyment"
              value={value.enjoyment ?? 0}
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
    [canEdit, updateSlot]
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
              <ThemedText type="title">
                {title}
                {patientName && ` by ${patientName}`}
              </ThemedText>

              {moduleSnapshot?.disclaimer ? <ThemedText>{moduleSnapshot.disclaimer}</ThemedText> : null}

              <View className="gap-1">
                <ProgressBar progress={progress} color={Colors.sway.bright} />
                <ThemedText>{Math.round(progress * 100)}%</ThemedText>
              </View>

              <View className="flex-row flex-wrap items-center gap-2">
                {mode === 'view' ? (
                  <Chip style={{ backgroundColor: '#262E42' }} textStyle={{ color: 'white' }}>
                    Completed {completedAt ? new Date(completedAt).toLocaleDateString() : '—'}
                  </Chip>
                ) : (
                  <Chip style={{ backgroundColor: '#262E42' }} textStyle={{ color: 'white' }}>
                    In progress {startedAt ? `• ${new Date(startedAt).toLocaleDateString()}` : ''}
                  </Chip>
                )}
                <SaveProgressChip saved={saved} isSaving={isSaving} />
                {!!dirtyKeys.size && (
                  <Chip
                    icon={() => <MaterialCommunityIcons name="content-save" size={24} color={'#34D399'} />}
                    mode="outlined"
                    textStyle={{ fontFamily: Fonts.Black, color: '#34D399' }}
                    style={{
                      backgroundColor: Colors.sway.buttonBackground,
                      borderColor: '#065F46',
                      alignSelf: 'center',
                      marginTop: 8
                    }}
                    disabled={!dirtyKeys.size}
                    onPress={saveDirty}
                  >
                    {dirtyKeys.size ? `Save changes (${dirtyKeys.size})` : 'Saved'}
                  </Chip>
                )}
              </View>

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
              <Divider className="my-2" bold />

              {/* Horizontal day selector */}
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ paddingHorizontal: 0, gap: 8 }}
              >
                {days.map((d) => {
                  const value = dateISO(d);
                  const selected = value === activeDayISO;
                  return (
                    <Chip
                      key={value}
                      mode={selected ? 'flat' : 'outlined'}
                      selected={selected}
                      onPress={() => setActiveDayISO(value)}
                      style={{
                        backgroundColor: selected ? Colors.sway.bright : Colors.sway.buttonBackground
                      }}
                      textStyle={{ color: selected ? Colors.sway.dark : 'white', fontFamily: Fonts.Bold }}
                    >
                      {`${dayLabel(d)} ${d.getDate()}`}
                    </Chip>
                  );
                })}
              </ScrollView>

              <View style={{ height: 12 }} />
            </View>
          </View>
        }
        ListFooterComponent={
          <View>
            {mode === 'edit' && (
              <View className="gap-3 pb-2">
                <PrimaryButton
                  title={allAnswered ? 'Submit diary' : !!dirtyKeys.size ? `Save & Exit (${dirtyKeys.size})` : 'Exit'}
                  onPress={() => {
                    if (!canEdit || !allAnswered) {
                      if (dirtyKeys.size) {
                        const payload = buildPayload(dirtyKeys);
                        saveAttempt(
                          { diaryEntries: payload, merge: true },
                          {
                            onError: (err) => renderErrorToast(err),
                            onSuccess: () => {
                              setDirtyKeys(new Set());
                              router.back();
                            }
                          }
                        );
                      } else {
                        router.back();
                      }
                      return;
                    }
                    // ensure latest edits are saved before submit
                    const afterSave = () =>
                      submitAttempt(assignmentId ? { assignmentId: String(assignmentId) } : {}, {
                        onError: (err) => renderErrorToast(err),
                        onSuccess: () => {
                          renderSuccessToast('Submitted activity diary');
                          router.back();
                        }
                      });

                    if (dirtyKeys.size) {
                      const payload = buildPayload(dirtyKeys);
                      saveAttempt(
                        { diaryEntries: payload, merge: true },
                        {
                          onError: (err) => renderErrorToast(err),
                          onSuccess: () => {
                            setDirtyKeys(new Set());
                            afterSave();
                          }
                        }
                      );
                    } else {
                      afterSave();
                    }
                  }}
                />
                {!!dirtyKeys.size && <PrimaryButton title="Cancel" onPress={router.back} variant="error" />}
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
}

const NumericField = memo(function NumericField({
  label,
  value,
  min,
  max,
  disabled,
  onChange,
  maxLength = 3 // e.g. mood 0..100
}: {
  label: string;
  value?: number;
  min: number;
  max: number;
  disabled?: boolean;
  onChange: (n: number) => void;
  maxLength?: number;
}) {
  const [text, setText] = useState<string>(value == null ? '' : String(value));

  // keep in sync if parent changes (e.g., after hydration)
  useEffect(() => {
    setText(value == null ? '' : String(value));
  }, [value]);

  const handleChange = useCallback(
    (t: string) => {
      // allow empty while typing; filter to digits only
      const digits = t.replace(/[^\d]/g, '');
      setText(digits);

      if (digits === '') return; // user still typing
      const parsed = clamp(parseInt(digits, 10) || 0, min, max);
      if (parsed !== value) onChange(parsed);
    },
    [min, max, onChange, value]
  );

  return (
    <View className="flex-row items-center justify-between">
      <ThemedText style={{ width: 110 }}>{label}</ThemedText>
      <View className="flex-row items-center gap-2">
        <TextInput
          mode="outlined"
          value={text}
          onChangeText={handleChange}
          disabled={disabled}
          keyboardType="number-pad"
          inputMode="numeric"
          maxLength={maxLength}
          style={{
            backgroundColor: 'transparent',
            height: 32,
            textAlign: 'center'
          }}
          contentStyle={{ color: 'white', textAlign: 'center' }}
          outlineStyle={{ borderColor: Colors.sway.darkGrey }}
          theme={{ colors: { onSurfaceVariant: Colors.sway.lightGrey } }}
          placeholder={`${min}–${max}`}
          placeholderTextColor={'#AEB7C7'}
          returnKeyType="done"
          submitBehavior="blurAndSubmit"
        />
        <ThemedText style={{ opacity: 0.8, width: 70 }}>{`(${min}–${max})`}</ThemedText>
      </View>
    </View>
  );
});
