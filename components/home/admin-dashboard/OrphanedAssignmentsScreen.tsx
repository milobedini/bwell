import { useCallback, useMemo } from 'react';
import { FlatList, type ListRenderItem, RefreshControl, View } from 'react-native';
import { Colors } from '@/constants/Colors';
import { DEFAULT_ORPHANED_FILTERS, useAdminOrphanedAssignments } from '@/hooks/useAdminOrphanedAssignments';
import type { AdminOrphanedAssignmentRow as AdminOrphanedAssignmentRowType } from '@milobedini/shared-types';

import ContentContainer from '../../ContentContainer';
import ErrorComponent, { ErrorTypes } from '../../ErrorComponent';
import { LoadingIndicator } from '../../LoadingScreen';
import { ThemedText } from '../../ThemedText';

import OrphanedAssignmentRow from './OrphanedAssignmentRow';

const BASE_ROW_STYLE = {
  backgroundColor: Colors.chip.darkCard,
  borderLeftWidth: 1,
  borderRightWidth: 1,
  borderColor: Colors.divider.medium
} as const;

const FIRST_ROW_STYLE = {
  ...BASE_ROW_STYLE,
  borderTopWidth: 1,
  borderTopLeftRadius: 16,
  borderTopRightRadius: 16
} as const;

const LAST_ROW_STYLE = {
  ...BASE_ROW_STYLE,
  borderBottomWidth: 1,
  borderBottomLeftRadius: 16,
  borderBottomRightRadius: 16
} as const;

const FIRST_AND_LAST_ROW_STYLE = {
  ...FIRST_ROW_STYLE,
  borderBottomWidth: 1,
  borderBottomLeftRadius: 16,
  borderBottomRightRadius: 16
} as const;

const pickRowStyle = (isFirst: boolean, isLast: boolean) => {
  if (isFirst && isLast) return FIRST_AND_LAST_ROW_STYLE;
  if (isFirst) return FIRST_ROW_STYLE;
  if (isLast) return LAST_ROW_STYLE;
  return BASE_ROW_STYLE;
};

const OrphanedAssignmentsScreen = () => {
  const {
    data,
    isLoading,
    isError,
    refetch,
    isRefetching,
    isFetching,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage
  } = useAdminOrphanedAssignments(DEFAULT_ORPHANED_FILTERS);

  const items: AdminOrphanedAssignmentRowType[] = useMemo(() => data?.pages.flatMap((p) => p.items) ?? [], [data]);

  const renderItem = useCallback<ListRenderItem<AdminOrphanedAssignmentRowType>>(
    ({ item, index }) => {
      const isLast = index === items.length - 1;
      return (
        <View className="mx-4 overflow-hidden" style={pickRowStyle(index === 0, isLast)}>
          <OrphanedAssignmentRow row={item} isLast={isLast} />
        </View>
      );
    },
    [items.length]
  );

  const handleEndReached = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage) void fetchNextPage();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  if (isLoading) {
    return (
      <View className="flex-1 bg-sway-dark">
        <LoadingIndicator marginBottom={0} />
      </View>
    );
  }

  if (isError) return <ErrorComponent errorType={ErrorTypes.GENERAL_ERROR} />;

  return (
    <View className="flex-1 bg-sway-dark" testID="admin-orphaned-assignments-screen">
      <ContentContainer>
        <View className="py-3">
          <ThemedText type="eyebrow" style={{ color: Colors.sway.darkGrey }}>
            Admin attention
          </ThemedText>
          <ThemedText type="subtitle" style={{ color: Colors.sway.lightGrey, marginTop: 2 }}>
            Orphaned assignments
          </ThemedText>
          <ThemedText
            type="caption"
            style={{ color: Colors.sway.darkGrey, marginTop: 4, fontSize: 12, lineHeight: 16 }}
          >
            Held by a therapist who is unverified or no longer exists.
          </ThemedText>
        </View>
      </ContentContainer>

      <FlatList
        data={items}
        keyExtractor={(row) => row.assignmentId}
        renderItem={renderItem}
        contentContainerStyle={{ paddingBottom: 32 }}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={Colors.sway.bright} />}
        onEndReached={handleEndReached}
        onEndReachedThreshold={0.4}
        ListEmptyComponent={
          !isFetching && items.length === 0 ? (
            <View
              className="mx-4 mt-2 rounded-xl border px-4 py-6"
              style={{ backgroundColor: Colors.chip.darkCardDeep, borderColor: Colors.divider.light }}
            >
              <ThemedText type="small" style={{ color: Colors.sway.darkGrey, textAlign: 'center' }}>
                Every assignment is held by a verified therapist.
              </ThemedText>
            </View>
          ) : null
        }
        ListFooterComponent={
          isFetchingNextPage ? (
            <View className="py-4">
              <ThemedText type="small" style={{ color: Colors.sway.darkGrey, textAlign: 'center' }}>
                Loading more…
              </ThemedText>
            </View>
          ) : null
        }
      />
    </View>
  );
};

export default OrphanedAssignmentsScreen;
