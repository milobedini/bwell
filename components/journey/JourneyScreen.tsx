import { memo, useCallback } from 'react';
import { FlatList, RefreshControl, View } from 'react-native';
import { Colors } from '@/constants/Colors';
import { useMyPracticeHistory } from '@/hooks/usePractice';
import { useScoreTrends } from '@/hooks/useScoreTrends';
import type { PracticeItem as PracticeItemType, ScoreTrendItem } from '@milobedini/shared-types';

import ContentContainer from '../ContentContainer';
import { LoadingIndicator } from '../LoadingScreen';
import PracticeItem from '../practice/PracticeItem';
import { ThemedText } from '../ThemedText';
import EmptyState from '../ui/EmptyState';

const MAX_PHQ9_SCORE = 27;

type SparklineProps = {
  values: number[];
};

const Sparkline = ({ values }: SparklineProps) => {
  const maxValue = Math.max(...values, 1);

  return (
    <View className="flex-row items-end gap-1" style={{ height: 24 }}>
      {values.map((value, index) => {
        const isLast = index === values.length - 1;
        const heightPercent = Math.max(value / Math.max(maxValue, MAX_PHQ9_SCORE), 0.05);
        return (
          <View
            key={index}
            className="w-1.5 rounded-full"
            style={{
              height: `${Math.round(heightPercent * 100)}%`,
              backgroundColor: isLast ? Colors.sway.bright : Colors.sway.darkGrey
            }}
          />
        );
      })}
    </View>
  );
};

type ScoreTrendCardProps = {
  trend: ScoreTrendItem;
};

const ScoreTrendCard = ({ trend }: ScoreTrendCardProps) => {
  const delta = trend.previousScore !== null ? trend.latestScore - trend.previousScore : null;
  const isImproving = delta !== null && delta < 0;
  const isWorsening = delta !== null && delta > 0;
  const deltaColor = isImproving ? Colors.primary.success : isWorsening ? Colors.primary.error : Colors.sway.darkGrey;

  return (
    <View className="mb-2 rounded-xl bg-chip-darkCard p-3">
      <View className="flex-row items-center justify-between">
        <View className="flex-1 gap-1">
          <ThemedText type="smallBold">{trend.moduleTitle}</ThemedText>
          <View className="flex-row items-center gap-2">
            <ThemedText type="smallBold" style={{ color: Colors.sway.bright }}>
              {trend.latestScore}
            </ThemedText>
            {delta !== null ? (
              <ThemedText type="small" style={{ color: deltaColor }}>
                {delta > 0 ? `+${delta}` : String(delta)}
              </ThemedText>
            ) : null}
          </View>
        </View>
        {trend.sparkline.length > 0 ? <Sparkline values={trend.sparkline} /> : null}
      </View>
    </View>
  );
};

const JourneyScreen = () => {
  const { data: trendsData, isFetching: isFetchingTrends } = useScoreTrends();
  const { data, isLoading, isFetching, fetchNextPage, hasNextPage, isFetchingNextPage, refetch } =
    useMyPracticeHistory();

  const items = data?.items ?? [];
  const trends = trendsData?.trends ?? [];

  const handleEndReached = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  const renderItem = useCallback(({ item }: { item: PracticeItemType }) => <PracticeItem item={item} />, []);

  const keyExtractor = useCallback((item: PracticeItemType) => item.assignmentId, []);

  const renderSeparator = useCallback(() => <View className="h-3" />, []);

  const renderHeader = useCallback(
    () => (
      <View className="pb-4">
        <ThemedText type="subtitle" className="mb-4">
          Your Journey
        </ThemedText>

        {trends.length > 0 ? (
          <View className="mb-4">
            <ThemedText
              type="smallBold"
              style={{
                textTransform: 'uppercase',
                letterSpacing: 1,
                color: Colors.sway.darkGrey,
                marginBottom: 8
              }}
            >
              Score Trends
            </ThemedText>
            {trends.map((trend) => (
              <ScoreTrendCard key={trend.moduleId} trend={trend} />
            ))}
          </View>
        ) : !isFetchingTrends ? null : null}

        <ThemedText
          type="smallBold"
          style={{
            textTransform: 'uppercase',
            letterSpacing: 1,
            color: Colors.sway.darkGrey,
            marginBottom: 8
          }}
        >
          History
        </ThemedText>
      </View>
    ),
    [trends, isFetchingTrends]
  );

  if (isLoading) return <LoadingIndicator marginBottom={0} />;

  const isEmpty = !isFetching && items.length === 0;

  return (
    <ContentContainer padded={false}>
      <FlatList
        data={items}
        keyExtractor={keyExtractor}
        renderItem={renderItem}
        ItemSeparatorComponent={renderSeparator}
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={
          isEmpty ? (
            <EmptyState icon="chart-line" title="No history yet" subtitle="Completed modules will appear here." />
          ) : null
        }
        onEndReached={handleEndReached}
        onEndReachedThreshold={0.3}
        contentContainerStyle={{ paddingBottom: 80, paddingHorizontal: 16 }}
        refreshControl={
          <RefreshControl refreshing={isFetching && !isLoading} onRefresh={refetch} tintColor={Colors.sway.bright} />
        }
      />
    </ContentContainer>
  );
};

export default memo(JourneyScreen);
