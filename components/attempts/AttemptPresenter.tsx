import { useCallback, useMemo, useRef, useState } from 'react';
import { Dimensions, FlatList, ListRenderItemInfo, ScrollView, View, ViewToken } from 'react-native';
import { ActivityIndicator, Card, Chip, Divider, ProgressBar } from 'react-native-paper';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import { Colors } from '@/constants/Colors';
import { Fonts } from '@/constants/Typography';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import type { AttemptAnswer, AttemptDetailItem, AttemptDetailResponseItem } from '@milobedini/shared-types';

import QuestionSlide from '../questions/QuestionSlide';
import { PrimaryButton } from '../ThemedButton';
import { ThemedText } from '../ThemedText';

type AttemptPresenterProps = {
  attempt: AttemptDetailResponseItem;
  mode: 'view' | 'edit';
  onAnswer?: (payload: AttemptAnswer) => void;
  onSubmit?: () => void;
  isSaving?: boolean;
  saved?: boolean;
};

const { width } = Dimensions.get('window');
const PAGE_W = width;

const Dots = ({ total, index }: { total: number; index: number }) => {
  if (total <= 1) return null;
  return (
    <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 8, paddingVertical: 8 }}>
      {Array.from({ length: total }).map((_, i) => {
        const active = i === index;
        return (
          <View
            key={i}
            style={{
              width: active ? 12 : 6,
              height: 6,
              borderRadius: 3,
              backgroundColor: active ? Colors.sway.bright : '#3A496B'
            }}
          />
        );
      })}
    </View>
  );
};

const AttemptPresenter = ({ attempt, mode, onAnswer, onSubmit, isSaving, saved }: AttemptPresenterProps) => {
  const flatRef = useRef<FlatList<AttemptDetailItem>>(null);
  const [index, setIndex] = useState(0);
  const router = useRouter();

  const {
    detail: { items, answeredCount, totalQuestions, percentComplete },
    moduleSnapshot,
    totalScore,
    scoreBandLabel,
    band,
    durationSecs,
    userNote,
    startedAt,
    completedAt
  } = attempt;

  const title = moduleSnapshot?.title ?? 'Module';

  const progress = (percentComplete || 0) / 100;

  const scrollTo = useCallback((i: number) => {
    if (!flatRef.current) return;
    // A short timeout can help after state updates so paging is smooth
    setTimeout(() => flatRef.current?.scrollToIndex({ index: i, animated: true }), 50);
  }, []);

  const getItemLayout = useCallback(
    (_: unknown, i: number) => ({
      length: PAGE_W,
      offset: PAGE_W * i,
      index: i
    }),
    []
  );

  const handleAnswered = useCallback(
    (q: AttemptDetailItem, pick: { score: number; index: number; text: string }) => {
      Haptics.selectionAsync().catch(() => {});
      onAnswer?.({
        question: q.questionId,
        chosenScore: pick.score,
        chosenIndex: pick.index,
        chosenText: pick.text
      });

      if (index < items.length - 1) {
        const next = index + 1;
        scrollTo(next);
        setIndex(next);
      }
    },
    [index, items.length, onAnswer, scrollTo]
  );

  const renderItem = useCallback(
    ({ item }: ListRenderItemInfo<AttemptDetailItem>) => (
      <View
        style={{
          width: PAGE_W,
          paddingHorizontal: 16,
          alignItems: 'center'
        }}
      >
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

  const allAnswered = useMemo(() => {
    return answeredCount === totalQuestions;
  }, [answeredCount, totalQuestions]);

  const handleSubmit = useCallback(() => {
    if (allAnswered) onSubmit?.();
    else router.back();
  }, [router, onSubmit, allAnswered]);

  return (
    <ScrollView className="flex-1">
      {/* Header Summary */}
      <View className="gap-2 px-4 pt-1">
        <ThemedText type="title">{title}</ThemedText>
        {moduleSnapshot?.disclaimer && <ThemedText>{moduleSnapshot.disclaimer}</ThemedText>}
        <View className="mt-2 gap-1.5">
          <ProgressBar progress={progress} color={Colors.sway.bright} />
          <ThemedText>
            {answeredCount}/{totalQuestions} answered • {Math.round(progress * 100)}%
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

      {/* Questions - horizontal pages */}
      <FlatList
        ref={flatRef}
        horizontal
        showsHorizontalScrollIndicator={false}
        data={items}
        keyExtractor={(q) => q.questionId}
        renderItem={renderItem}
        onViewableItemsChanged={onViewableItemsChanged}
        decelerationRate="fast"
        snapToInterval={PAGE_W}
        snapToAlignment="start"
        getItemLayout={getItemLayout}
        onMomentumScrollEnd={(e) => {
          const i = Math.round(e.nativeEvent.contentOffset.x / PAGE_W);
          if (i !== index) setIndex(i);
        }}
      />

      {/* Pagination dots */}
      <Dots total={items.length} index={index} />

      {saved && (
        <Chip
          icon={() => <MaterialCommunityIcons name="check-circle-outline" size={24} color={'#34D399'} />}
          mode="outlined"
          textStyle={{
            fontFamily: Fonts.Black,
            color: '#34D399'
          }}
          style={{
            backgroundColor: Colors.sway.buttonBackground,
            borderColor: '#065F46',
            alignSelf: 'center',
            marginTop: 8
          }}
        >
          Saved
        </Chip>
      )}
      {isSaving && (
        <Chip
          textStyle={{
            fontFamily: Fonts.Black,
            color: '#34D399'
          }}
          style={{
            backgroundColor: Colors.sway.dark,
            alignSelf: 'center',
            marginTop: 8
          }}
          icon={() => <ActivityIndicator animating={isSaving} color={Colors.sway.bright} style={{ marginRight: 12 }} />}
        >
          Saving
        </Chip>
      )}
      {/* Footer actions */}
      {mode === 'edit' && (
        <View className="p-4 pt-2">
          <PrimaryButton
            onPress={handleSubmit}
            disabled={answeredCount === 0}
            title={allAnswered ? 'Submit' : 'Exit'}
          />
        </View>
      )}
    </ScrollView>
  );
};

export default AttemptPresenter;
