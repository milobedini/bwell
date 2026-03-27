import { useCallback, useMemo, useState } from 'react';
import { useRouter } from 'expo-router';
import { useTherapistAssignments } from '@/hooks/useAssignments';
import { useTherapistAttemptModules } from '@/hooks/useAttempts';
import { useClients } from '@/hooks/useUsers';
import type { AssignmentSortOption } from '@milobedini/shared-types';

import ContentContainer from '../ContentContainer';
import ErrorComponent, { ErrorTypes } from '../ErrorComponent';
import { LoadingIndicator } from '../LoadingScreen';
import EmptyState from '../ui/EmptyState';

import AssignmentFilterDrawer, {
  type AssignmentFilterValues,
  DEFAULT_ASSIGNMENT_FILTERS
} from './AssignmentFilterDrawer';
import AssignmentsListTherapist from './AssignmentsListTherapist';

const TherapistActiveAssignments = () => {
  const router = useRouter();
  const [sort, setSort] = useState<AssignmentSortOption>('urgency');
  const [filters, setFilters] = useState<AssignmentFilterValues>(DEFAULT_ASSIGNMENT_FILTERS);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const {
    items,
    totalItems,
    isLoading,
    isError,
    isRefetching,
    refetch,
    hasNextPage,
    fetchNextPage,
    isFetchingNextPage,
    isFetching
  } = useTherapistAssignments({
    ...filters,
    sortBy: sort
  });

  const { data: clientsData } = useClients();
  const { data: modulesData } = useTherapistAttemptModules();

  const patientChoices = useMemo(
    () =>
      clientsData?.map((p) => ({
        id: p._id,
        name: p.name || p.username,
        email: p.email
      })) ?? [],
    [clientsData]
  );

  const moduleChoices = useMemo(
    () => modulesData?.modules?.map((m) => ({ id: m._id, title: m.title })) ?? [],
    [modulesData]
  );

  const selectedPatientName = useMemo(
    () => patientChoices.find((p) => p.id === filters.patientId)?.name,
    [patientChoices, filters.patientId]
  );

  const selectedModuleName = useMemo(
    () => moduleChoices.find((m) => m.id === filters.moduleId)?.title,
    [moduleChoices, filters.moduleId]
  );

  const handleClearFilter = useCallback((key: keyof AssignmentFilterValues) => {
    setFilters((prev) => ({ ...prev, [key]: undefined }));
  }, []);

  const handleClearAll = useCallback(() => setFilters(DEFAULT_ASSIGNMENT_FILTERS), []);

  const handleOpenFilterDrawer = useCallback(() => setDrawerOpen(true), []);
  const handleCloseFilterDrawer = useCallback(() => setDrawerOpen(false), []);
  const handleApplyFilters = useCallback((v: AssignmentFilterValues) => {
    setFilters(v);
    setDrawerOpen(false);
  }, []);
  const handleResetFilters = useCallback(() => setFilters(DEFAULT_ASSIGNMENT_FILTERS), []);

  const hasActiveFilters = Object.values(filters).some(Boolean);

  if (isLoading) return <LoadingIndicator marginBottom={0} />;
  if (isError && !items.length) return <ErrorComponent errorType={ErrorTypes.GENERAL_ERROR} />;

  return (
    <ContentContainer padded={false}>
      {!isFetching && items.length === 0 ? (
        hasActiveFilters ? (
          <EmptyState
            icon="clipboard-text-outline"
            title="No matching assignments"
            subtitle="Try adjusting your filters"
          />
        ) : (
          <EmptyState
            icon="clipboard-text-outline"
            title="No active assignments"
            action={{
              label: 'Create assignment',
              onPress: () =>
                router.push({
                  pathname: '/assignments/add',
                  params: { headerTitle: 'Create Assignment' }
                })
            }}
          />
        )
      ) : (
        <AssignmentsListTherapist
          items={items}
          totalItems={totalItems}
          sort={sort}
          onSortChange={setSort}
          filters={filters}
          onOpenFilterDrawer={handleOpenFilterDrawer}
          onClearFilter={handleClearFilter}
          onClearAllFilters={handleClearAll}
          patientName={selectedPatientName}
          moduleName={selectedModuleName}
          isRefetching={isRefetching}
          isFetching={isFetching}
          isPending={isLoading}
          isFetchingNextPage={isFetchingNextPage}
          hasNextPage={hasNextPage ?? false}
          fetchNextPage={fetchNextPage}
          refetch={refetch}
          isError={isError}
        />
      )}

      <AssignmentFilterDrawer
        visible={drawerOpen}
        onDismiss={handleCloseFilterDrawer}
        values={filters}
        onApply={handleApplyFilters}
        onReset={handleResetFilters}
        moduleChoices={moduleChoices}
        patientChoices={patientChoices}
      />
    </ContentContainer>
  );
};

export default TherapistActiveAssignments;
