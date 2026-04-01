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
import { Chip, IconButton } from 'react-native-paper';
import { router } from 'expo-router';
import { Colors } from '@/constants/Colors';
import { useTherapistReview } from '@/hooks/usePractice';
import { useClients } from '@/hooks/useUsers';
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
import ReviewFilterDrawer, { DEFAULT_REVIEW_FILTERS, type ReviewFilterValues } from './ReviewFilterDrawer';

type ReviewSection = { title: string; data: ReviewItem[] };

const SORT_OPTIONS: { value: SortOption; label: string }[] = [
  { value: 'newest', label: 'Newest' },
  { value: 'oldest', label: 'Oldest' },
  { value: 'severity', label: 'Severity' }
];

const ItemSeparator = () => <View className="h-3" />;

// Fixed-order bucket keys (newest → oldest)
const FIXED_KEYS = ['Today', 'Yesterday', 'This Week', 'Last Week', 'This Month'] as const;

// Group ReviewItems by completedAt date, maintaining fixed chronological order
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
    if (!dateStr) return 'Unknown';
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return 'Unknown';
    if (d >= today) return 'Today';
    if (d >= yesterday) return 'Yesterday';
    if (d >= thisWeekStart) return 'This Week';
    if (d >= lastWeekStart) return 'Last Week';
    if (d >= thisMonthStart) return 'This Month';
    return new Intl.DateTimeFormat(undefined, { month: 'long', year: 'numeric' }).format(d);
  };

  // Track named-month keys with their date for sorting
  const monthKeyDates = new Map<string, Date>();

  for (const item of items) {
    const dateStr = item.latestAttempt?.completedAt;
    const key = getKey(dateStr);
    if (!buckets.has(key)) {
      buckets.set(key, []);
      if (!(FIXED_KEYS as readonly string[]).includes(key) && key !== 'Unknown' && dateStr) {
        monthKeyDates.set(key, new Date(dateStr));
      }
    }
    buckets.get(key)!.push(item);
  }

  // Sort month keys newest-first by their representative date
  const sortedMonthKeys = Array.from(monthKeyDates.entries())
    .sort((a, b) => b[1].getTime() - a[1].getTime())
    .map(([key]) => key);

  // Build sections: fixed keys → sorted month keys → unknown
  const sections: ReviewSection[] = [];
  for (const key of FIXED_KEYS) {
    const data = buckets.get(key);
    if (data?.length) sections.push({ title: key, data });
  }
  for (const key of sortedMonthKeys) {
    const data = buckets.get(key);
    if (data?.length) sections.push({ title: key, data });
  }
  const unknown = buckets.get('Unknown');
  if (unknown?.length) sections.push({ title: 'Earlier', data: unknown });

  return sections;
};

const ReviewListItemBase = ({ item }: { item: ReviewItem }) => {
  const severity = getSeverityColors(item.latestAttempt?.scoreBandLabel);
  const { relative, formatted } = timeAgo(item.latestAttempt?.completedAt ?? '');
  const icon = getModuleIcon(item.moduleType);
  const attemptId = item.latestAttempt?.attemptId;

  const handlePress = () => {
    if (attemptId) {
      router.push({ pathname: '/review/[id]', params: { id: attemptId, headerTitle: item.patientName } });
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
      className="border-b pb-2 pt-3"
      style={{
        backgroundColor: Colors.sway.dark,
        borderBottomColor: Colors.chip.darkCardAlt,
        marginBottom: 12
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

const ActiveFilterChips = memo(function ActiveFilterChips({
  filters,
  patientName,
  moduleName,
  onClear,
  onClearAll
}: {
  filters: ReviewFilterValues;
  patientName?: string;
  moduleName?: string;
  onClear: (key: keyof ReviewFilterValues) => void;
  onClearAll: () => void;
}) {
  const chips: { key: keyof ReviewFilterValues; label: string }[] = [];

  if (filters.patientId && patientName) {
    chips.push({ key: 'patientId', label: `Patient: ${patientName}` });
  }
  if (filters.moduleId && moduleName) {
    chips.push({ key: 'moduleId', label: `Module: ${moduleName}` });
  }
  if (filters.severity) {
    chips.push({
      key: 'severity',
      label: `Severity: ${filters.severity.charAt(0).toUpperCase() + filters.severity.slice(1)}`
    });
  }

  if (chips.length === 0) return null;

  return (
    <View className="flex-row flex-wrap items-center gap-1.5 pb-2">
      {chips.map((c) => (
        <Pressable
          key={c.key}
          onPress={() => onClear(c.key)}
          className="flex-row items-center gap-1 rounded-full px-2.5 py-1"
          style={{ backgroundColor: Colors.tint.teal }}
        >
          <ThemedText style={{ fontSize: 12, color: Colors.sway.bright }}>{c.label}</ThemedText>
          <ThemedText style={{ fontSize: 12, color: Colors.sway.bright, opacity: 0.6 }}>✕</ThemedText>
        </Pressable>
      ))}
      {chips.length >= 2 && (
        <Pressable onPress={onClearAll}>
          <ThemedText style={{ fontSize: 12, color: Colors.sway.darkGrey, marginLeft: 4 }}>Clear all</ThemedText>
        </Pressable>
      )}
    </View>
  );
});

const ReviewScreen = () => {
  const [sort, setSort] = useState<SortOption>('newest');
  const [filters, setFilters] = useState<ReviewFilterValues>(DEFAULT_REVIEW_FILTERS);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const { data: clientsData } = useClients();

  const patientChoices = useMemo(
    () => clientsData?.map((c) => ({ id: c._id, name: c.name || c.username, email: c.email })) ?? [],
    [clientsData]
  );

  const {
    data,
    isLoading,
    isError,
    isRefetching,
    refetch,
    hasNextPage,
    fetchNextPage,
    isFetchingNextPage,
    isFetching
  } = useTherapistReview({
    sort,
    patientId: filters.patientId,
    moduleId: filters.moduleId,
    severity: filters.severity
  });

  const needsAttention = useMemo(() => data?.needsAttention ?? [], [data?.needsAttention]);
  const submissions = useMemo(() => data?.submissions ?? [], [data?.submissions]);

  // Derive unique module choices from all submissions
  const moduleChoices = useMemo(() => {
    const seen = new Map<string, string>();
    for (const item of submissions) {
      if (!seen.has(item.moduleId)) {
        seen.set(item.moduleId, item.moduleTitle);
      }
    }
    return Array.from(seen, ([id, title]) => ({ id, title }));
  }, [submissions]);

  const selectedPatientName = useMemo(
    () => patientChoices.find((p) => p.id === filters.patientId)?.name,
    [patientChoices, filters.patientId]
  );

  const selectedModuleName = useMemo(
    () => moduleChoices.find((m) => m.id === filters.moduleId)?.title,
    [moduleChoices, filters.moduleId]
  );

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

  const handleClearFilter = useCallback((key: keyof ReviewFilterValues) => {
    setFilters((prev) => ({ ...prev, [key]: undefined }));
  }, []);

  const handleClearAll = useCallback(() => setFilters(DEFAULT_REVIEW_FILTERS), []);

  // Only show full-screen loader on initial load (no cached data yet)
  if (isLoading) return <LoadingIndicator marginBottom={0} />;
  if (isError && !sections.length) return <ErrorComponent errorType={ErrorTypes.GENERAL_ERROR} />;

  const listHeader = (
    <View>
      {/* Needs Attention section */}
      {needsAttention.length > 0 && <NeedsAttentionSection items={needsAttention} />}

      {/* Header: count + filter button */}
      <View className="flex-row items-center justify-between pt-2">
        <ThemedText type="small" style={{ color: Colors.sway.darkGrey, opacity: isFetching && !isLoading ? 0.4 : 1 }}>
          {data?.total ?? 0} {(data?.total ?? 0) === 1 ? 'submission' : 'submissions'}
        </ThemedText>
        <IconButton
          icon="filter-variant"
          iconColor={Colors.sway.lightGrey}
          onPress={() => setDrawerOpen(true)}
          style={{ backgroundColor: Colors.sway.buttonBackgroundSolid }}
        />
      </View>

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

      {/* Active filter chips */}
      <ActiveFilterChips
        filters={filters}
        patientName={selectedPatientName}
        moduleName={selectedModuleName}
        onClear={handleClearFilter}
        onClearAll={handleClearAll}
      />

      {/* All Submissions header */}
      <View className="border-b pb-2 pt-1" style={{ borderBottomColor: Colors.chip.darkCardAlt, marginBottom: 12 }}>
        <ThemedText
          type="smallBold"
          style={{ color: Colors.sway.darkGrey, fontSize: 12, textTransform: 'uppercase', letterSpacing: 0.8 }}
        >
          All Submissions
        </ThemedText>
      </View>
    </View>
  );

  // Dim list content while filter/sort refetch is in progress (but not during pagination)
  const isFilterRefetching = isFetching && !isFetchingNextPage && !isLoading;

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
          showsVerticalScrollIndicator={false}
          keyExtractor={(item) => item.assignmentId}
          renderItem={renderItem}
          renderSectionHeader={renderSectionHeader}
          ItemSeparatorComponent={ItemSeparator}
          stickySectionHeadersEnabled
          ListHeaderComponent={listHeader}
          contentContainerStyle={{ paddingBottom: 16, opacity: isFilterRefetching ? 0.5 : 1 }}
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
            isFetchingNextPage || isFilterRefetching ? (
              <ActivityIndicator color={Colors.sway.bright} style={{ paddingVertical: 16 }} />
            ) : null
          }
        />
      )}

      <ReviewFilterDrawer
        visible={drawerOpen}
        onDismiss={() => setDrawerOpen(false)}
        values={filters}
        onApply={setFilters}
        onReset={() => setFilters(DEFAULT_REVIEW_FILTERS)}
        patientChoices={patientChoices}
        moduleChoices={moduleChoices}
      />
    </ContentContainer>
  );
};

export default ReviewScreen;
