import { useMemo, useState } from 'react';
import { FlatList, Pressable, RefreshControl, View } from 'react-native';
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

const AdminAuditScreen = () => {
  const [filters, setFilters] = useState<UseAdminAuditFilters>({});
  const [drawerVisible, toggleDrawerVisible] = useToggle(false);

  const { data, isLoading, isError, refetch, isRefetching, fetchNextPage, hasNextPage, isFetchingNextPage } =
    useAdminAudit(filters);

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
            <ThemedText
              type="small"
              style={{
                color: Colors.sway.darkGrey,
                fontSize: 11,
                letterSpacing: 0.8,
                textTransform: 'uppercase'
              }}
            >
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
              type="small"
              style={{
                color: activeFilterCount > 0 ? Colors.sway.bright : Colors.sway.darkGrey,
                fontSize: 12
              }}
            >
              Filters{activeFilterCount > 0 ? ` · ${activeFilterCount}` : ''}
            </ThemedText>
          </Pressable>
        </View>
      </ContentContainer>

      <FlatList
        data={events}
        keyExtractor={(event) => event._id}
        renderItem={({ item, index }) => (
          <View
            className="mx-4 overflow-hidden"
            style={{
              backgroundColor: Colors.chip.darkCard,
              borderLeftWidth: 1,
              borderRightWidth: 1,
              borderColor: Colors.divider.medium,
              borderTopWidth: index === 0 ? 1 : 0,
              borderTopLeftRadius: index === 0 ? 16 : 0,
              borderTopRightRadius: index === 0 ? 16 : 0,
              borderBottomWidth: index === events.length - 1 ? 1 : 0,
              borderBottomLeftRadius: index === events.length - 1 ? 16 : 0,
              borderBottomRightRadius: index === events.length - 1 ? 16 : 0
            }}
          >
            <AuditRow event={item} isLast={index === events.length - 1} />
          </View>
        )}
        contentContainerStyle={{ paddingBottom: 32 }}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={Colors.sway.bright} />}
        onEndReached={() => {
          if (hasNextPage && !isFetchingNextPage) void fetchNextPage();
        }}
        onEndReachedThreshold={0.4}
        ListEmptyComponent={
          !isRefetching ? (
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
