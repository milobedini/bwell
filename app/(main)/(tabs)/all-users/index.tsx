import { useMemo, useState } from 'react';
import { ActivityIndicator, FlatList, View } from 'react-native';
import { Badge, Button, Divider, IconButton, TextInput } from 'react-native-paper';
import SortButton, { type SortOption } from '@/components/admin/SortButton';
import UserFilterDrawer, {
  countActiveFilters,
  DEFAULT_USER_FILTERS,
  type UserFilters
} from '@/components/admin/UserFilterDrawer';
import UserListItem from '@/components/admin/UserListItem';
import Container from '@/components/Container';
import { LoadingIndicator } from '@/components/LoadingScreen';
import { ThemedText } from '@/components/ThemedText';
import EmptyState from '@/components/ui/EmptyState';
import { Colors } from '@/constants/Colors';
import { useDebounce } from '@/hooks/useDebounce';
import { useAllUsers } from '@/hooks/useUsers';

const AllUsersList = () => {
  // Search
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 350);

  // Filters
  const [filters, setFilters] = useState<UserFilters>(DEFAULT_USER_FILTERS);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const activeFilterCount = useMemo(() => countActiveFilters(filters), [filters]);

  // Sort
  const [sort, setSort] = useState<SortOption>('createdAt:desc');

  // Query
  const { data, isPending, isError, fetchNextPage, hasNextPage, isFetchingNextPage, isFetching, refetch } = useAllUsers(
    {
      q: debouncedSearch || undefined,
      roles: filters.roles,
      isVerified: filters.isVerified,
      isVerifiedTherapist: filters.isVerifiedTherapist,
      hasTherapist: filters.hasTherapist,
      createdFrom: filters.createdFrom,
      createdTo: filters.createdTo,
      lastLoginFrom: filters.lastLoginFrom,
      lastLoginTo: filters.lastLoginTo,
      sort,
      limit: 25
    }
  );

  const users = useMemo(() => data?.pages.flatMap((p) => p.items) ?? [], [data]);

  const facets = data?.pages[0]?.facets;
  const total = data?.pages[0]?.total;

  if (isPending) return <LoadingIndicator marginBottom={0} />;
  if (isError)
    return (
      <Container>
        <View className="flex-1 items-center justify-center gap-4 p-8">
          <ThemedText type="smallTitle" className="text-center">
            Something went wrong
          </ThemedText>
          <ThemedText type="small" className="text-center text-sway-darkGrey">
            Failed to load users
          </ThemedText>
          <Button mode="contained" buttonColor={Colors.sway.bright} textColor="black" onPress={() => refetch()}>
            Retry
          </Button>
        </View>
      </Container>
    );

  return (
    <>
      <Container>
        <ThemedText type="title" className="px-4 text-center">
          All Users
        </ThemedText>

        {/* Search bar */}
        <View className="px-4 pt-2">
          <TextInput
            mode="outlined"
            placeholder="Search by name, email, or username"
            value={search}
            onChangeText={setSearch}
            left={<TextInput.Icon icon="magnify" />}
            right={
              search ? (
                <TextInput.Icon icon="close" onPress={() => setSearch('')} />
              ) : isFetching && debouncedSearch ? (
                <TextInput.Icon icon={() => <ActivityIndicator size="small" color={Colors.sway.bright} />} />
              ) : null
            }
            outlineColor={Colors.sway.buttonBackgroundSolid}
            activeOutlineColor={Colors.sway.bright}
            textColor={Colors.sway.lightGrey}
            placeholderTextColor={Colors.sway.darkGrey}
          />
        </View>

        {/* Sort + Filter buttons row */}
        <View className="flex-row items-center gap-2 px-4 py-2">
          <SortButton value={sort} onChange={setSort} />

          <View className="relative">
            <IconButton
              icon="filter-variant"
              onPress={() => setDrawerOpen(true)}
              iconColor={Colors.sway.lightGrey}
              accessibilityLabel="Open filters"
            />
            {activeFilterCount > 0 && (
              <Badge style={{ position: 'absolute', top: 2, right: 2 }}>{activeFilterCount}</Badge>
            )}
          </View>

          {total !== undefined && (
            <ThemedText type="small" className="ml-auto text-sway-darkGrey">
              {total} {total === 1 ? 'user' : 'users'}
            </ThemedText>
          )}
        </View>

        {/* User list */}
        {users.length === 0 ? (
          <EmptyState
            icon="account-search-outline"
            title="No users match your filters"
            subtitle="Try adjusting your search or filter criteria"
          />
        ) : (
          <FlatList
            data={users}
            keyExtractor={(item) => item._id}
            renderItem={({ item }) => <UserListItem user={item} />}
            ItemSeparatorComponent={() => <Divider />}
            onEndReachedThreshold={0.5}
            onEndReached={() => {
              if (hasNextPage && !isFetchingNextPage) fetchNextPage();
            }}
            ListFooterComponent={
              isFetchingNextPage ? (
                <View className="items-center py-4">
                  <ActivityIndicator size="small" color={Colors.sway.bright} />
                </View>
              ) : null
            }
          />
        )}
      </Container>

      <UserFilterDrawer
        visible={drawerOpen}
        onDismiss={() => setDrawerOpen(false)}
        values={filters}
        onApply={setFilters}
        facets={facets}
      />
    </>
  );
};

export default AllUsersList;
