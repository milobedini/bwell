import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Dimensions, FlatList, ListRenderItemInfo, ScrollView, View, ViewToken } from 'react-native';
import { Card, Chip, Divider, ProgressBar } from 'react-native-paper';
import * as Haptics from 'expo-haptics';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { PrimaryButton } from '@/components/ThemedButton';
import { ThemedText } from '@/components/ThemedText';
import { renderErrorToast, renderSuccessToast } from '@/components/toast/toastOptions';
import { SaveProgressChip } from '@/components/ui/Chip';
import { Colors } from '@/constants/Colors';
import { useSaveModuleAttempt, useSubmitAttempt } from '@/hooks/useAttempts';
import type {
  AttemptAnswer,
  AttemptDetail,
  AttemptDetailItem,
  AttemptDetailResponseItem
} from '@milobedini/shared-types';

import Dots from './Dots';
import QuestionSlide from './QuestionSlide';

const { width } = Dimensions.get('window');
const PAGE_W = width;

type QuestionnairePresenterProps = {
  attempt: AttemptDetailResponseItem;
  detail: AttemptDetail;
  mode: 'view' | 'edit';
  patientName?: string;
};

export default function QuestionnairePresenter({ attempt, detail, mode, patientName }: QuestionnairePresenterProps) {
  const router = useRouter();
  const { assignmentId } = useLocalSearchParams<{ assignmentId?: string }>();

  const { mutate: saveAttempt, isPending: isSaving, isSuccess: saved } = useSaveModuleAttempt(attempt._id);
  const { mutate: submitAttempt } = useSubmitAttempt(attempt._id);

  const { moduleSnapshot, totalScore, scoreBandLabel, band, durationSecs, userNote, startedAt, completedAt } = attempt;
  const title = moduleSnapshot?.title ?? 'Module';
  const progress = (detail.percentComplete || 0) / 100;

  // local cache of answers
  const answersMap = useRef<Map<string, AttemptAnswer>>(new Map());
  const [index, setIndex] = useState(0);
  const flatRef = useRef<FlatList<AttemptDetailItem>>(null);

  // hydrate from server
  useEffect(() => {
    const m = new Map<string, AttemptAnswer>();
    for (const it of detail.items) {
      if (it.chosenScore != null) {
        m.set(it.questionId, {
          question: it.questionId,
          chosenScore: it.chosenScore ?? 0,
          chosenIndex: it.chosenIndex ?? undefined,
          chosenText: it.chosenText ?? undefined
        });
      }
    }
    answersMap.current = m;
  }, [attempt._id, detail.items]);

  const currentAnswersArray = useCallback(() => Array.from(answersMap.current.values()), []);

  const scrollTo = useCallback((i: number) => {
    if (!flatRef.current) return;
    setTimeout(() => flatRef.current?.scrollToIndex({ index: i, animated: true }), 50);
  }, []);

  const getItemLayout = useCallback((_: unknown, i: number) => ({ length: PAGE_W, offset: PAGE_W * i, index: i }), []);

  const handleAnswered = useCallback(
    async (q: AttemptDetailItem, pick: { score: number; index: number; text: string }) => {
      if (mode !== 'edit') return;
      Haptics.selectionAsync().catch(() => {});
      answersMap.current.set(q.questionId, {
        question: q.questionId,
        chosenScore: pick.score,
        chosenIndex: pick.index,
        chosenText: pick.text
      });

      saveAttempt({ answers: currentAnswersArray() }, { onError: (err) => renderErrorToast(err) });

      if (index < detail.items.length - 1) {
        const next = index + 1;
        scrollTo(next);
        setIndex(next);
      }
    },
    [mode, index, detail.items.length, saveAttempt, currentAnswersArray, scrollTo]
  );

  const renderItem = useCallback(
    ({ item }: ListRenderItemInfo<AttemptDetailItem>) => (
      <View style={{ width: PAGE_W, paddingHorizontal: 16, alignItems: 'center' }}>
        <QuestionSlide
          key={item.questionId}
          mode={mode}
          question={item}
          onPick={handleAnswered}
          colors={{
            card: Colors.sway.buttonBackground,
            accent: Colors.sway.bright,
            muted: Colors.sway.darkGrey,
            textOnDark: 'white'
          }}
        />
      </View>
    ),
    [handleAnswered, mode]
  );

  const onViewableItemsChanged = useRef(({ viewableItems }: { viewableItems: ViewToken[] }) => {
    const v = viewableItems?.[0]?.index;
    if (typeof v === 'number') setIndex(v);
  }).current;

  const bandChip = useMemo(() => {
    if (mode !== 'view' || totalScore == null) return null;
    return (
      <Chip
        mode="flat"
        elevated
        style={{ backgroundColor: Colors.primary.accent }}
        textStyle={{ color: Colors.sway.dark }}
      >
        {scoreBandLabel ?? band?.label ?? '–'} {typeof totalScore === 'number' ? `• Score: ${totalScore}` : ''}
      </Chip>
    );
  }, [band?.label, mode, scoreBandLabel, totalScore]);

  const durationText = useMemo(() => {
    if (!durationSecs) return null;
    const m = Math.floor(durationSecs / 60);
    const s = durationSecs % 60;
    return `${m}m ${s}s`;
  }, [durationSecs]);

  const allAnswered = useMemo(
    () => detail.totalQuestions > 0 && detail.answeredCount === detail.totalQuestions,
    [detail.answeredCount, detail.totalQuestions]
  );

  const handleSubmit = useCallback(() => {
    if (mode !== 'edit') return router.back();

    // last save, then submit
    saveAttempt(
      { answers: currentAnswersArray() },
      {
        onError: (err) => renderErrorToast(err),
        onSuccess: () => {
          submitAttempt(assignmentId ? { assignmentId: String(assignmentId) } : {}, {
            onError: (err) => renderErrorToast(err),
            onSuccess: () => {
              renderSuccessToast('Submitted module attempt');
              router.back();
            }
          });
        }
      }
    );
  }, [mode, saveAttempt, submitAttempt, currentAnswersArray, assignmentId, router]);

  return (
    <ScrollView className="flex-1">
      {/* Header */}
      <View className="gap-2 px-4 pt-1">
        <ThemedText type="title">
          {title}
          {patientName && ` by ${patientName}`}
        </ThemedText>
        {moduleSnapshot?.disclaimer && <ThemedText>{moduleSnapshot.disclaimer}</ThemedText>}
        <View className="mt-2 gap-1.5">
          <ProgressBar progress={progress} color={Colors.sway.bright} />
          <ThemedText>
            {detail.answeredCount}/{detail.totalQuestions} answered • {Math.round(progress * 100)}%
          </ThemedText>
        </View>
        <View className="flex-row flex-wrap items-center gap-2">
          {bandChip}
          {mode === 'view' ? (
            <Chip style={{ backgroundColor: '#262E42' }} textStyle={{ color: 'white' }}>
              Completed {new Date(completedAt ?? '').toLocaleDateString()}
            </Chip>
          ) : (
            <Chip style={{ backgroundColor: '#262E42' }} textStyle={{ color: 'white' }}>
              In progress {startedAt ? `• ${new Date(startedAt).toLocaleDateString()}` : ''}
            </Chip>
          )}
          {durationText ? (
            <Chip style={{ backgroundColor: '#262E42' }} textStyle={{ color: 'white' }}>
              Duration {durationText}
            </Chip>
          ) : null}
        </View>
        {userNote ? (
          <Card style={{ backgroundColor: Colors.sway.buttonBackground, marginTop: 8 }}>
            <Card.Content>
              <ThemedText type="smallTitle" className="mb-1 opacity-90">
                Note
              </ThemedText>
              <ThemedText className="opacity-90">{userNote}</ThemedText>
            </Card.Content>
          </Card>
        ) : null}
      </View>

      <Divider className="my-4" bold />

      {/* Questions pager */}
      <FlatList
        ref={flatRef}
        horizontal
        showsHorizontalScrollIndicator={false}
        data={detail.items}
        keyExtractor={(q) => q.questionId}
        renderItem={renderItem}
        onViewableItemsChanged={onViewableItemsChanged}
        pagingEnabled
        decelerationRate="fast"
        snapToAlignment="start"
        getItemLayout={getItemLayout}
        initialScrollIndex={index}
        onMomentumScrollEnd={(e) => {
          const i = Math.round(e.nativeEvent.contentOffset.x / PAGE_W);
          if (i !== index) setIndex(i);
        }}
      />

      <Dots total={detail.items.length} index={index} />

      {/* Save indicators (only meaningful when patient) */}
      <SaveProgressChip saved={saved} isSaving={isSaving} />

      {/* Footer (patient edit) */}
      {mode === 'edit' && (
        <View className="p-4 pt-2">
          <PrimaryButton
            onPress={allAnswered ? handleSubmit : () => router.back()}
            disabled={detail.answeredCount === 0}
            title={allAnswered ? 'Submit' : 'Exit'}
          />
        </View>
      )}
    </ScrollView>
  );
}
