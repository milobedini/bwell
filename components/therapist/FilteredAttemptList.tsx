import { memo, useCallback } from 'react';
import { FlatList, Pressable, RefreshControl, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Colors } from '@/constants/Colors';
import { dueLabel, formatShortDate } from '@/utils/dates';
import { getModuleIcon } from '@/utils/moduleIcons';
import type { AttemptListItem, ScoreBandSummary } from '@milobedini/shared-types';
import MaterialCommunityIcons from '@react-native-vector-icons/material-design-icons';

import { LoadingIndicator } from '../LoadingScreen';
import { ThemedText } from '../ThemedText';
import EmptyState from '../ui/EmptyState';

type TimelineAttempt = AttemptListItem & { band?: ScoreBandSummary };

type FilteredAttemptListProps = {
  attempts: TimelineAttempt[];
  patientName: string;
  isFetching: boolean;
  isPending: boolean;
  hasNextPage: boolean;
  isFetchingNextPage: boolean;
  fetchNextPage: () => void;
  refetch: () => void;
};

type AttemptCardProps = {
  item: TimelineAttempt;
  patientName: string;
  onPress: (item: TimelineAttempt) => void;
};

const AttemptCard = memo(({ item, onPress }: AttemptCardProps) => {
  const icon = getModuleIcon(item.moduleType);
  const isCompleted = item.status === 'submitted';

  const statusText = (() => {
    if (isCompleted && item.completedAt) {
      return `Submitted ${formatShortDate(item.completedAt)}`;
    }
    if (item.status === 'started' && item.percentComplete) {
      return `${Math.round(item.percentComplete)}% complete`;
    }
    if (item.status === 'abandoned') return 'Abandoned';
    return 'Not started';
  })();

  return (
    <Pressable
      onPress={() => onPress(item)}
      className="active:opacity-80"
      style={{ backgroundColor: Colors.chip.darkCard, borderRadius: 12, padding: 12 }}
    >
      <View className="flex-row items-center gap-3">
        <View
          className="items-center justify-center rounded-lg"
          style={{ width: 36, height: 36, backgroundColor: Colors.chip.darkCardAlt }}
        >
          <MaterialCommunityIcons
            name={icon}
            size={18}
            color={isCompleted ? Colors.sway.darkGrey : Colors.sway.bright}
          />
        </View>

        <View className="flex-1 gap-0.5">
          <ThemedText type="smallBold" style={{ flexShrink: 1 }}>
            {item.module.title}
          </ThemedText>
          <ThemedText type="small" style={{ color: isCompleted ? Colors.sway.darkGrey : Colors.sway.bright }}>
            {statusText}
          </ThemedText>
          {item.dueAt ? (
            <ThemedText type="small" style={{ color: Colors.sway.darkGrey }}>
              {dueLabel(item.dueAt)}
            </ThemedText>
          ) : null}
        </View>

        <View className="items-end gap-1">
          {isCompleted && item.totalScore !== undefined && item.scoreBandLabel ? (
            <View className="items-end">
              <ThemedText type="smallBold" style={{ color: Colors.sway.bright }}>
                {item.totalScore}
              </ThemedText>
              <ThemedText type="small" style={{ color: Colors.sway.darkGrey }}>
                {item.scoreBandLabel}
              </ThemedText>
            </View>
          ) : (
            <MaterialCommunityIcons name="chevron-right" size={18} color={Colors.sway.darkGrey} />
          )}
        </View>
      </View>
    </Pressable>
  );
});

AttemptCard.displayName = 'AttemptCard';

const FilteredAttemptListBase = ({
  attempts,
  patientName,
  isFetching,
  isPending,
  hasNextPage,
  isFetchingNextPage,
  fetchNextPage,
  refetch
}: FilteredAttemptListProps) => {
  const router = useRouter();

  const handlePress = useCallback(
    (item: TimelineAttempt) => {
      router.push({
        pathname: '/(main)/(tabs)/patients/attempt/[id]',
        params: { id: item._id, headerTitle: patientName }
      });
    },
    [router, patientName]
  );

  const renderItem = useCallback(
    ({ item }: { item: TimelineAttempt }) => (
      <AttemptCard item={item} patientName={patientName} onPress={handlePress} />
    ),
    [patientName, handlePress]
  );

  const keyExtractor = useCallback((item: TimelineAttempt) => item._id, []);

  if (isPending) return <LoadingIndicator marginBottom={0} />;

  return (
    <FlatList
      data={attempts}
      keyExtractor={keyExtractor}
      renderItem={renderItem}
      onEndReachedThreshold={0.6}
      onEndReached={() => {
        if (hasNextPage && !isFetchingNextPage) fetchNextPage();
      }}
      ListFooterComponent={isFetchingNextPage ? <LoadingIndicator marginBottom={16} /> : null}
      ListEmptyComponent={
        !isFetching ? (
          <EmptyState icon="filter-off-outline" title="No results" subtitle="Try adjusting your filters" />
        ) : null
      }
      contentContainerStyle={{ paddingBottom: 80, paddingHorizontal: 16, gap: 8, paddingTop: 8 }}
      refreshControl={
        <RefreshControl refreshing={isFetching && !isPending} onRefresh={refetch} tintColor={Colors.sway.bright} />
      }
    />
  );
};

const FilteredAttemptList = memo(FilteredAttemptListBase);

export default FilteredAttemptList;
