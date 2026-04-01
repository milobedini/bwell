import { memo, useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  SectionList,
  type SectionListData,
  type SectionListRenderItemInfo,
  View
} from 'react-native';
import { Chip } from 'react-native-paper';
import { router } from 'expo-router';
import { Colors } from '@/constants/Colors';
import { useTherapistReview } from '@/hooks/usePractice';
import { filterChipStyle, filterChipTextStyle } from '@/utils/chipStyles';
import { timeAgo } from '@/utils/dates';
import { getModuleIcon } from '@/utils/moduleIcons';
import { getSeverityColors } from '@/utils/severity';
import type { ReviewItem, SortOption } from '@milobedini/shared-types';
import MaterialCommunityIcons from '@react-native-vector-icons/material-design-icons';

import ContentContainer from '../ContentContainer';
import ErrorComponent, { ErrorTypes } from '../ErrorComponent';
import { LoadingIndicator } from '../LoadingScreen';
import { ThemedText } from '../ThemedText';
import EmptyState from '../ui/EmptyState';

import NeedsAttentionSection from './NeedsAttentionSection';

type ReviewSection = { title: string; data: ReviewItem[] };

const SORT_OPTIONS: { value: SortOption; label: string }[] = [
  { value: 'newest', label: 'Newest' },
  { value: 'oldest', label: 'Oldest' },
  { value: 'severity', label: 'Severity' }
];

const ItemSeparator = () => <View className="h-3" />;

// Group ReviewItems by the completedAt date from their latestAttempt
const groupReviewByDate = (items: ReviewItem[]): ReviewSection[] => {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today.getTime() - 86_400_000);
  const dow = today.getDay() || 7;
  const thisWeekStart = new Date(today.getTime() - (dow - 1) * 86_400_000);
  const lastWeekStart = new Date(thisWeekStart.getTime() - 7 * 86_400_000);
  const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  const buckets = new Map<string, ReviewItem[]>();

  const getKey = (dateStr?: string): string => {
    if (!dateStr) return 'Earlier';
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return 'Earlier';
    if (d >= today) return 'Today';
    if (d >= yesterday) return 'Yesterday';
    if (d >= thisWeekStart) return 'This Week';
    if (d >= lastWeekStart) return 'Last Week';
    if (d >= thisMonthStart) return 'This Month';
    return new Intl.DateTimeFormat(undefined, { month: 'long', year: 'numeric' }).format(d);
  };

  const order = items.reduce<string[]>((acc, item) => {
    const key = getKey(item.latestAttempt?.completedAt);
    if (!buckets.has(key)) {
      buckets.set(key, []);
      acc.push(key);
    }
    buckets.get(key)!.push(item);
    return acc;
  }, []);

  return order.map((title) => ({ title, data: buckets.get(title)! }));
};

const ReviewListItemBase = ({ item }: { item: ReviewItem }) => {
  const severity = getSeverityColors(item.latestAttempt?.scoreBandLabel);
  const { relative, formatted } = timeAgo(item.latestAttempt?.completedAt ?? '');
  const icon = getModuleIcon(item.moduleType);
  const attemptId = item.latestAttempt?.attemptId;

  const handlePress = () => {
    if (attemptId) {
      router.push({ pathname: '/review/[id]', params: { id: attemptId } });
    }
  };

  return (
    <Pressable onPress={handlePress} className="overflow-hidden rounded-xl bg-chip-darkCard active:opacity-80">
      <View className="flex-row">
        {/* Severity accent border */}
        <View className="w-1 rounded-l-xl" style={{ backgroundColor: severity.border }} />

        <View className="flex-1 gap-2 p-4">
          {/* Row 1: Icon + Module title */}
          <View className="flex-row items-center gap-2">
            <MaterialCommunityIcons name={icon} size={18} color={Colors.sway.darkGrey} />
            <ThemedText type="smallBold" className="flex-1 flex-shrink" numberOfLines={1}>
              {item.moduleTitle}
            </ThemedText>

            {/* Score pill (questionnaires only) */}
            {item.latestAttempt?.totalScore != null && (
              <View
                className="rounded-lg px-2 py-0.5"
                style={{ backgroundColor: severity.pillBg, alignItems: 'center' }}
              >
                <ThemedText type="smallBold" style={{ color: severity.border }}>
                  {item.latestAttempt.totalScore}
                </ThemedText>
              </View>
            )}
          </View>

          {/* Row 2: Patient name + band label + time */}
          <View className="flex-row items-center justify-between">
            <View className="flex-1 flex-row items-center gap-1.5">
              <MaterialCommunityIcons name="account" size={14} color={Colors.sway.darkGrey} />
              <ThemedText type="small" style={{ color: Colors.sway.darkGrey }} numberOfLines={1}>
                {item.patientName}
              </ThemedText>
            </View>

            <View className="flex-row items-center gap-1.5">
              {!!item.latestAttempt?.scoreBandLabel && (
                <ThemedText type="small" style={{ color: severity.text }}>
                  {item.latestAttempt.scoreBandLabel}
                </ThemedText>
              )}
              <ThemedText type="small" style={{ color: Colors.sway.darkGrey }}>
                {relative ?? formatted}
              </ThemedText>
            </View>
          </View>
        </View>
      </View>
    </Pressable>
  );
};

const ReviewListItem = memo(ReviewListItemBase);

const SectionHeader = memo(function SectionHeader({ title }: { title: string }) {
  return (
    <View
      className="border-b px-4 pb-2 pt-3"
      style={{
        backgroundColor: Colors.sway.dark,
        borderBottomColor: Colors.chip.darkCardAlt
      }}
    >
      <ThemedText
        type="smallBold"
        style={{ color: Colors.sway.darkGrey, fontSize: 12, textTransform: 'uppercase', letterSpacing: 0.8 }}
      >
        {title}
      </ThemedText>
    </View>
  );
});

const ReviewScreen = () => {
  const [sort, setSort] = useState<SortOption>('newest');

  const {
    data,
    isPending,
    isError,
    isRefetching,
    refetch,
    hasNextPage,
    fetchNextPage,
    isFetchingNextPage,
    isFetching
  } = useTherapistReview({ sort });

  const needsAttention = useMemo(() => data?.needsAttention ?? [], [data?.needsAttention]);
  const submissions = useMemo(() => data?.submissions ?? [], [data?.submissions]);

  const sections = useMemo(() => groupReviewByDate(submissions), [submissions]);

  const renderItem = useCallback(
    ({ item }: SectionListRenderItemInfo<ReviewItem>) => <ReviewListItem item={item} />,
    []
  );

  const renderSectionHeader = useCallback(
    ({ section }: { section: SectionListData<ReviewItem, ReviewSection> }) => <SectionHeader title={section.title} />,
    []
  );

  const handleEndReached = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage) fetchNextPage();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  if (isPending) return <LoadingIndicator marginBottom={0} />;
  if (isError && !sections.length) return <ErrorComponent errorType={ErrorTypes.GENERAL_ERROR} />;

  const listHeader = (
    <View>
      {/* Needs Attention section */}
      {needsAttention.length > 0 && <NeedsAttentionSection items={needsAttention} />}

      {/* Sort chips */}
      <View className="flex-row items-center gap-2 py-2">
        <ThemedText
          type="small"
          style={{ color: Colors.sway.darkGrey, fontSize: 12, textTransform: 'uppercase', letterSpacing: 0.8 }}
        >
          Sort:
        </ThemedText>
        {SORT_OPTIONS.map((opt) => (
          <Chip
            key={opt.value}
            selected={sort === opt.value}
            onPress={() => setSort(opt.value)}
            compact
            style={filterChipStyle(sort === opt.value)}
            textStyle={filterChipTextStyle(sort === opt.value)}
          >
            {opt.label}
          </Chip>
        ))}
      </View>

      {/* All Submissions header */}
      <View className="border-b pb-2 pt-1" style={{ borderBottomColor: Colors.chip.darkCardAlt }}>
        <ThemedText
          type="smallBold"
          style={{ color: Colors.sway.darkGrey, fontSize: 12, textTransform: 'uppercase', letterSpacing: 0.8 }}
        >
          All Submissions
        </ThemedText>
      </View>
    </View>
  );

  return (
    <ContentContainer>
      {!isFetching && submissions.length === 0 ? (
        <>
          {listHeader}
          <EmptyState
            icon="clipboard-check-outline"
            title="No submissions yet"
            subtitle="Completed work from your patients will appear here"
          />
        </>
      ) : (
        <SectionList
          sections={sections}
          keyExtractor={(item) => item.assignmentId}
          renderItem={renderItem}
          renderSectionHeader={renderSectionHeader}
          ItemSeparatorComponent={ItemSeparator}
          stickySectionHeadersEnabled
          ListHeaderComponent={listHeader}
          contentContainerStyle={{ paddingBottom: 16 }}
          refreshControl={
            <RefreshControl
              refreshing={isRefetching && !isFetchingNextPage}
              onRefresh={refetch}
              tintColor={Colors.sway.bright}
              progressBackgroundColor={Colors.chip.darkCard}
            />
          }
          onEndReached={handleEndReached}
          onEndReachedThreshold={0.3}
          ListFooterComponent={
            isFetchingNextPage ? <ActivityIndicator color={Colors.sway.bright} style={{ paddingVertical: 16 }} /> : null
          }
        />
      )}
    </ContentContainer>
  );
};

export default ReviewScreen;
