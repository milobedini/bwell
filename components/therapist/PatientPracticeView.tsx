import { memo, useCallback, useMemo, useState } from 'react';
import {
  Pressable,
  RefreshControl,
  SectionList,
  type SectionListData,
  type SectionListRenderItemInfo,
  View
} from 'react-native';
import { Badge } from 'react-native-paper';
import { Stack, useRouter } from 'expo-router';
import { Colors } from '@/constants/Colors';
import type { AttemptFilterDrawerValues } from '@/constants/Filters';
import { useRemoveAssignment } from '@/hooks/useAssignments';
import { useGetPatientTimeline } from '@/hooks/useAttempts';
import { usePatientModules, usePatientPractice } from '@/hooks/usePractice';
import { dueLabel } from '@/utils/dates';
import type { PracticeItem } from '@milobedini/shared-types';
import MaterialCommunityIcons from '@react-native-vector-icons/material-design-icons';

import ContentContainer from '../ContentContainer';
import { LoadingIndicator } from '../LoadingScreen';
import { ThemedText } from '../ThemedText';
import type { ActionMenuItem } from '../ui/ActionMenu';
import ActionMenu from '../ui/ActionMenu';
import { AttemptFilterDrawer } from '../ui/AttemptFilterDrawer';
import EmptyState from '../ui/EmptyState';

import FilteredAttemptList from './FilteredAttemptList';
import PatientPracticeCard from './PatientPracticeCard';

type PatientPracticeViewProps = {
  patientId: string;
  patientName: string;
};

type Section = {
  title: string;
  data: PracticeItem[];
};

type ActiveFilterChipsProps = {
  filters: AttemptFilterDrawerValues;
  moduleName?: string;
  onClear: (key: keyof AttemptFilterDrawerValues) => void;
  onClearAll: () => void;
};

const ActiveFilterChips = memo(({ filters, moduleName, onClear, onClearAll }: ActiveFilterChipsProps) => {
  type Chip = { key: keyof AttemptFilterDrawerValues; label: string };

  const chips = (
    [
      filters.status &&
        filters.status.length > 0 &&
        !(filters.status.length === 1 && filters.status[0] === 'all') &&
        ({ key: 'status', label: `Status: ${filters.status.join(', ')}` } satisfies Chip),
      filters.moduleId && moduleName && ({ key: 'moduleId', label: `Module: ${moduleName}` } satisfies Chip),
      filters.severity &&
        ({
          key: 'severity',
          label: `Severity: ${filters.severity.charAt(0).toUpperCase() + filters.severity.slice(1)}`
        } satisfies Chip),
      filters.limit && filters.limit !== 20 && ({ key: 'limit', label: `Limit: ${filters.limit}` } satisfies Chip)
    ] as (Chip | false | undefined | 0 | '')[]
  ).filter((c): c is Chip => !!c);

  if (chips.length === 0) return null;

  return (
    <View className="flex-row flex-wrap items-center gap-1.5 px-4 pb-2">
      {chips.map((c) => (
        <Pressable
          key={c.key}
          onPress={() => onClear(c.key)}
          className="flex-row items-center gap-1 rounded-full px-2.5 py-1"
          style={{ backgroundColor: Colors.tint.teal }}
        >
          <ThemedText type="small" style={{ color: Colors.sway.bright }}>
            {c.label}
          </ThemedText>
          <ThemedText type="small" style={{ color: Colors.sway.bright, opacity: 0.6 }}>
            ✕
          </ThemedText>
        </Pressable>
      ))}
      {chips.length >= 2 && (
        <Pressable onPress={onClearAll}>
          <ThemedText type="small" style={{ color: Colors.sway.darkGrey }} className="ml-1">
            Clear all
          </ThemedText>
        </Pressable>
      )}
    </View>
  );
});

ActiveFilterChips.displayName = 'ActiveFilterChips';

const PatientPracticeViewBase = ({ patientId, patientName }: PatientPracticeViewProps) => {
  const { data, isPending, isFetching, refetch } = usePatientPractice(patientId);
  const router = useRouter();
  const [menuItem, setMenuItem] = useState<PracticeItem | null>(null);
  const { mutate: removeAssignmentMutate } = useRemoveAssignment();

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [filters, setFilters] = useState<AttemptFilterDrawerValues | null>(null);

  const { data: patientModules } = usePatientModules(patientId);

  const isFiltered = filters !== null;

  const activeFilterCount = useMemo(() => {
    if (!filters) return 0;
    return [
      !!filters.moduleId,
      (filters.status?.length ?? 0) > 0 && !(filters.status?.length === 1 && filters.status?.[0] === 'all'),
      !!filters.severity,
      !!filters.limit && filters.limit !== 20
    ].filter(Boolean).length;
  }, [filters]);

  const headerRight = useCallback(
    () => (
      <Pressable
        onPress={() => setDrawerOpen(true)}
        accessibilityLabel="Open filters"
        className="h-10 w-10 items-center justify-center"
        hitSlop={8}
      >
        <MaterialCommunityIcons
          name="filter-variant"
          size={22}
          color={isFiltered ? Colors.sway.bright : Colors.sway.lightGrey}
        />
        {activeFilterCount > 0 && <Badge style={{ position: 'absolute', top: 0, right: 0 }}>{activeFilterCount}</Badge>}
      </Pressable>
    ),
    [isFiltered, activeFilterCount]
  );

  const statusParam = useMemo(() => {
    if (!filters?.status?.length) return 'all';
    if (filters.status.includes('all')) return 'all';
    return filters.status.join(',');
  }, [filters?.status]);

  const timeline = useGetPatientTimeline({
    patientId,
    moduleId: filters?.moduleId,
    limit: filters?.limit ?? 20,
    status: statusParam,
    severity: filters?.severity,
    enabled: isFiltered
  });

  const sections: Section[] = [
    { title: 'Today', data: data?.today ?? [] },
    { title: 'This Week', data: data?.thisWeek ?? [] },
    { title: 'Upcoming', data: data?.upcoming ?? [] },
    { title: 'Recently Completed', data: data?.recentlyCompleted ?? [] }
  ].filter((section) => section.data.length > 0);

  const handleLongPress = useCallback((item: PracticeItem) => {
    setMenuItem(item);
  }, []);

  const handleEdit = useCallback(() => {
    if (!menuItem) return;
    router.push({
      pathname: '/(main)/(tabs)/patients/edit',
      params: {
        assignmentId: menuItem.assignmentId,
        patientName,
        moduleTitle: menuItem.moduleTitle,
        programTitle: menuItem.programTitle,
        moduleType: menuItem.moduleType,
        ...(menuItem.dueAt ? { dueAt: menuItem.dueAt } : {}),
        ...(menuItem.recurrence ? { recurrence: JSON.stringify(menuItem.recurrence) } : {}),
        ...(menuItem.notes ? { notes: menuItem.notes } : {}),
        headerTitle: 'Edit Assignment'
      }
    });
  }, [menuItem, patientName, router]);

  const handleRemove = useCallback(() => {
    if (!menuItem) return;
    removeAssignmentMutate({ assignmentId: menuItem.assignmentId });
  }, [menuItem, removeAssignmentMutate]);

  const handleResetFilters = useCallback(() => {
    setFilters(null);
  }, []);

  const moduleChoices = useMemo(
    () => patientModules?.map((m) => ({ id: m._id, title: m.title })) ?? [],
    [patientModules]
  );

  const selectedModuleName = useMemo(
    () => moduleChoices.find((m) => m.id === filters?.moduleId)?.title,
    [moduleChoices, filters?.moduleId]
  );

  const handleClearFilter = useCallback((key: keyof AttemptFilterDrawerValues) => {
    setFilters((prev) => {
      if (!prev) return null;
      const next = { ...prev, [key]: undefined };
      // if all filters are now empty, reset to null (unfiltered mode)
      const hasAny =
        next.moduleId ||
        next.severity ||
        (next.limit && next.limit !== 20) ||
        (next.status && next.status.length > 0 && !(next.status.length === 1 && next.status[0] === 'all'));
      return hasAny ? next : null;
    });
  }, []);

  const menuActions: ActionMenuItem[] = menuItem
    ? [
        { icon: 'pencil-outline', label: 'Edit assignment', onPress: handleEdit },
        {
          icon: 'delete-outline',
          label: 'Remove assignment',
          onPress: handleRemove,
          variant: 'destructive',
          confirmTitle: 'Remove assignment?',
          confirmDescription: `This will permanently remove the ${menuItem.moduleTitle} assignment. Any in-progress work will be lost.`,
          confirmLabel: 'Remove'
        }
      ]
    : [];

  const renderItem = useCallback(
    ({ item }: SectionListRenderItemInfo<PracticeItem>) => (
      <PatientPracticeCard
        item={item}
        sparkline={data?.sparklines?.[item.moduleId]}
        patientId={patientId}
        patientName={patientName}
        onLongPress={handleLongPress}
      />
    ),
    [data?.sparklines, patientId, patientName, handleLongPress]
  );

  const renderSectionHeader = useCallback(
    ({ section }: { section: SectionListData<PracticeItem, Section> }) => (
      <View className="pb-2 pt-4">
        <ThemedText
          type="smallBold"
          style={{
            textTransform: 'uppercase',
            letterSpacing: 1,
            color: section.title === 'Today' ? Colors.sway.bright : Colors.sway.darkGrey
          }}
        >
          {section.title}
        </ThemedText>
      </View>
    ),
    []
  );

  const renderItemSeparator = useCallback(() => <View className="h-2" />, []);

  const keyExtractor = useCallback((item: PracticeItem) => item.assignmentId, []);

  if (isPending) return <LoadingIndicator marginBottom={0} />;

  const isEmpty = !isFetching && sections.length === 0;

  return (
    <>
      <Stack.Screen options={{ headerRight }} />
      <ContentContainer padded={false}>
        {isFiltered ? (
          <View className="flex-1">
            <ActiveFilterChips
              filters={filters}
              moduleName={selectedModuleName}
              onClear={handleClearFilter}
              onClearAll={handleResetFilters}
            />
            <FilteredAttemptList
              attempts={timeline.attempts}
              patientName={patientName}
              isFetching={timeline.isFetching}
              isPending={timeline.isPending}
              hasNextPage={!!timeline.hasNextPage}
              isFetchingNextPage={timeline.isFetchingNextPage}
              fetchNextPage={timeline.fetchNextPage}
              refetch={timeline.refetch}
            />
          </View>
        ) : isEmpty ? (
          <View className="flex-1 px-4">
            <EmptyState
              icon="clipboard-text-outline"
              title="No practice items"
              subtitle="This patient has no active or recent practice items."
            />
          </View>
        ) : (
          <SectionList
            sections={sections}
            keyExtractor={keyExtractor}
            renderItem={renderItem}
            renderSectionHeader={renderSectionHeader}
            ItemSeparatorComponent={renderItemSeparator}
            stickySectionHeadersEnabled={false}
            contentContainerStyle={{ paddingBottom: 80, paddingHorizontal: 16, paddingTop: 8 }}
            refreshControl={
              <RefreshControl
                refreshing={isFetching && !isPending}
                onRefresh={refetch}
                tintColor={Colors.sway.bright}
              />
            }
          />
        )}
      </ContentContainer>
      <ActionMenu
        visible={!!menuItem}
        onDismiss={() => setMenuItem(null)}
        title={menuItem?.moduleTitle}
        subtitle={menuItem?.dueAt ? dueLabel(menuItem.dueAt) : 'No due date'}
        actions={menuActions}
      />
      <AttemptFilterDrawer
        visible={drawerOpen}
        onDismiss={() => setDrawerOpen(false)}
        values={filters ?? { status: [], limit: 20 }}
        onChange={setFilters}
        onApply={setFilters}
        onReset={handleResetFilters}
        title="Client filters"
        moduleChoices={moduleChoices}
        showSeverity
      />
    </>
  );
};

const PatientPracticeView = memo(PatientPracticeViewBase);

export default PatientPracticeView;
