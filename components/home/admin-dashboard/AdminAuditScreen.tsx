import { useCallback, useMemo, useState } from 'react';
import { FlatList, type ListRenderItem, Pressable, RefreshControl, View } from 'react-native';
import { Colors } from '@/constants/Colors';
import { useAdminAudit, type UseAdminAuditFilters } from '@/hooks/useAdminAudit';
import useToggle from '@/hooks/useToggle';
import type { AdminAuditEvent } from '@milobedini/shared-types';
import Icon from '@react-native-vector-icons/material-design-icons';

import ContentContainer from '../../ContentContainer';
import ErrorComponent, { ErrorTypes } from '../../ErrorComponent';
import { LoadingIndicator } from '../../LoadingScreen';
import { ThemedText } from '../../ThemedText';

import AuditFilterDrawer, { type ActorOption, countActiveAuditFilters } from './AuditFilterDrawer';
import AuditRow from './AuditRow';

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

const AdminAuditScreen = () => {
  const [filters, setFilters] = useState<UseAdminAuditFilters>({});
  const [drawerVisible, toggleDrawerVisible] = useToggle(false);

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
  } = useAdminAudit(filters);

  const events: AdminAuditEvent[] = useMemo(() => data?.pages.flatMap((p) => p.events) ?? [], [data]);

  // Actor facets come from the BE — keyed off the currently-active non-actor filter,
  // so they remain stable across scroll and don't collapse when an actor is selected.
  // The first page carries the authoritative facet snapshot for the current filter set.
  const actorOptions: ActorOption[] = useMemo(
    () =>
      data?.pages[0]?.facets.actors.map((a) => ({
        _id: a._id,
        username: a.username,
        name: a.name,
        count: a.count
      })) ?? [],
    [data]
  );

  const activeFilterCount = countActiveAuditFilters(filters);

  const renderItem = useCallback<ListRenderItem<AdminAuditEvent>>(
    ({ item, index }) => {
      const isLast = index === events.length - 1;
      return (
        <View className="mx-4 overflow-hidden" style={pickRowStyle(index === 0, isLast)}>
          <AuditRow event={item} isLast={isLast} />
        </View>
      );
    },
    [events.length]
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
    <View className="flex-1 bg-sway-dark" testID="admin-audit-screen">
      <ContentContainer>
        <View className="flex-row items-center justify-between py-3">
          <View>
            <ThemedText type="eyebrow" style={{ color: Colors.sway.darkGrey }}>
              Admin
            </ThemedText>
            <ThemedText type="subtitle" style={{ color: Colors.sway.lightGrey, marginTop: 2 }}>
              Audit log
            </ThemedText>
          </View>
          <Pressable
            onPress={toggleDrawerVisible}
            className="flex-row items-center gap-1.5 rounded-full px-3 py-2 active:opacity-80"
            style={{
              backgroundColor: activeFilterCount > 0 ? Colors.tint.teal : Colors.chip.darkCard,
              borderWidth: 1,
              borderColor: activeFilterCount > 0 ? Colors.tint.tealBorder : Colors.chip.darkCardAlt
            }}
            accessibilityRole="button"
            accessibilityLabel="Open audit filters"
          >
            <Icon
              name="filter-variant"
              size={16}
              color={activeFilterCount > 0 ? Colors.sway.bright : Colors.sway.darkGrey}
            />
            <ThemedText
              type="caption"
              style={{ color: activeFilterCount > 0 ? Colors.sway.bright : Colors.sway.darkGrey }}
            >
              Filters{activeFilterCount > 0 ? ` · ${activeFilterCount}` : ''}
            </ThemedText>
          </Pressable>
        </View>
      </ContentContainer>

      <FlatList
        data={events}
        keyExtractor={(event) => event._id}
        renderItem={renderItem}
        contentContainerStyle={{ paddingBottom: 32 }}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={Colors.sway.bright} />}
        onEndReached={handleEndReached}
        onEndReachedThreshold={0.4}
        ListEmptyComponent={
          // Use isFetching (not isRefetching) so the empty state doesn't flash when
          // filters change with `keepPreviousData` and the new filter set isn't cached.
          !isFetching && events.length === 0 ? (
            <View
              className="mx-4 mt-2 rounded-xl border px-4 py-6"
              style={{ backgroundColor: Colors.chip.darkCardDeep, borderColor: Colors.divider.light }}
            >
              <ThemedText type="small" style={{ color: Colors.sway.darkGrey, textAlign: 'center' }}>
                {activeFilterCount > 0 ? 'No audit events match the current filters.' : 'No audit events yet.'}
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

      <AuditFilterDrawer
        visible={drawerVisible}
        onDismiss={toggleDrawerVisible}
        values={filters}
        onApply={setFilters}
        actorOptions={actorOptions}
      />
    </View>
  );
};

export default AdminAuditScreen;
