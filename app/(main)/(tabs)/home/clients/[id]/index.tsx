import { useMemo, useState } from 'react';
import { FlatList, TouchableOpacity, View } from 'react-native';
import { Appbar, Badge, IconButton } from 'react-native-paper';
import { clsx } from 'clsx';
import Constants from 'expo-constants';
import { Link, useLocalSearchParams } from 'expo-router';
import Container from '@/components/Container';
import ErrorComponent, { ErrorTypes } from '@/components/ErrorComponent';
import { LoadingIndicator } from '@/components/LoadingScreen';
import { ThemedText } from '@/components/ThemedText';
import { DateChip, DueChip } from '@/components/ui/Chip';
import { FilterDrawer } from '@/components/ui/FilterDrawer';
import { Colors } from '@/constants/Colors';
import type { FilterDrawerValues } from '@/constants/Filters';
import { useGetPatientTimeline } from '@/hooks/useAttempts';
import { useModules } from '@/hooks/useModules';
import { AttemptStatus, ModuleType } from '@/types/types';
import { dateString } from '@/utils/dates';

const defaultFilters: FilterDrawerValues = {
  status: ['submitted'],
  limit: 20,
  moduleId: undefined
};

const ClientDetail = () => {
  const { id } = useLocalSearchParams();
  const { data: modules } = useModules();

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [filters, setFilters] = useState<FilterDrawerValues>(defaultFilters);

  const statusParam = useMemo(() => {
    const s = filters.status ?? ['submitted'];
    // If "all" is present, just pass 'all'
    if (s.includes('all')) return 'all';
    return s.join(',');
  }, [filters.status]);

  const { data, attempts, isPending, isError, fetchNextPage, hasNextPage, isFetchingNextPage, refetch } =
    useGetPatientTimeline({
      patientId: id as string,
      moduleId: filters.moduleId,
      limit: filters.limit ?? 20,
      status: statusParam
    });

  const activeFilterCount = useMemo(() => {
    let n = 0;
    if (filters.moduleId) n++;
    if ((filters.status?.length ?? 0) > 0 && !(filters.status?.length === 1 && filters.status?.[0] === 'submitted'))
      n++;
    if (filters.limit && filters.limit !== 20) n++;
    return n;
  }, [filters]);

  const renderHeader = () => (
    <Appbar.Header
      mode="small"
      elevated
      statusBarHeight={Constants.statusBarHeight + 32}
      style={{
        backgroundColor: Colors.primary.charcoal,
        borderBottomWidth: 1,
        borderBottomColor: Colors.primary.accent
      }}
    >
      <Appbar.Content title={<ThemedText type="subtitle">Client timeline</ThemedText>} />
      <View className="relative">
        <IconButton
          icon="filter-variant"
          onPress={() => setDrawerOpen(true)}
          accessibilityLabel="Open filters"
          iconColor={Colors.sway.lightGrey}
        />
        {activeFilterCount > 0 && <Badge style={{ position: 'absolute', top: 2, right: 2 }}>{activeFilterCount}</Badge>}
      </View>
      <IconButton icon="refresh" onPress={() => refetch()} iconColor={Colors.sway.lightGrey} />
    </Appbar.Header>
  );

  if (isPending) return <LoadingIndicator marginBottom={0} />;
  if (isError) return <ErrorComponent errorType={ErrorTypes.GENERAL_ERROR} />;
  if (!data || !attempts || !modules) return <ErrorComponent errorType={ErrorTypes.NO_CONTENT} />;

  return (
    <>
      {renderHeader()}
      <Container>
        {attempts.length ? (
          <FlatList
            data={attempts}
            keyExtractor={(item) => item._id}
            onEndReachedThreshold={0.6}
            onEndReached={() => {
              if (hasNextPage && !isFetchingNextPage) fetchNextPage();
            }}
            ListFooterComponent={isFetchingNextPage ? <LoadingIndicator marginBottom={16} /> : null}
            renderItem={({ item, index }) => {
              const bgColor = index % 2 === 0 ? '' : 'bg-sway-buttonBackground';
              return (
                <Link
                  asChild
                  href={{
                    pathname: '/attempts/[id]',
                    params: {
                      id: item._id,
                      headerTitle: `${item.module.title} (${dateString(item.completedAt || '')})`
                    }
                  }}
                  push
                  withAnchor
                >
                  <TouchableOpacity key={item._id} className={clsx('gap-2 p-4', bgColor)}>
                    <ThemedText type="subtitle">{item.module.title}</ThemedText>
                    {item.status === AttemptStatus.SUBMITTED && item.moduleType === ModuleType.QUESTIONNAIRE && (
                      <ThemedText>
                        {item.totalScore} {item.scoreBandLabel}
                      </ThemedText>
                    )}
                    {/* Chips */}
                    <View className="flex-row items-center gap-4">
                      {item.completedAt && <DateChip prefix={'Completed'} dateString={item.completedAt} />}
                      {!item.completedAt && <DueChip dueAt={item.dueAt} />}
                    </View>
                  </TouchableOpacity>
                </Link>
              );
            }}
          ></FlatList>
        ) : (
          <ThemedText className="p-4">No submissions...</ThemedText>
        )}
      </Container>
      <FilterDrawer
        visible={drawerOpen}
        onDismiss={() => setDrawerOpen(false)}
        values={filters}
        onChange={setFilters}
        onApply={(v) => setFilters(v)}
        onReset={() => setFilters(defaultFilters)}
        title="Timeline filters"
        moduleChoices={modules.map((module) => {
          return { id: module._id, title: module.title };
        })}
      />
    </>
  );
};

export default ClientDetail;
export { defaultFilters };
