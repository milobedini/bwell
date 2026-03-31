import { type ComponentProps, memo, useCallback, useEffect, useMemo, useState } from 'react';
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
import { Link } from 'expo-router';
import { toast } from 'sonner-native';
import { TOAST_DURATIONS, TOAST_STYLES } from '@/components/toast/toastOptions';
import { Colors } from '@/constants/Colors';
import { type AttemptFilterDrawerValues, DEFAULT_FILTERS, type SortOption } from '@/constants/Filters';
import { useTherapistAttemptModules, useTherapistGetLatestAttempts } from '@/hooks/useAttempts';
import { useClients } from '@/hooks/useUsers';
import { dateString, groupByDate, timeAgo } from '@/utils/dates';
import { getSeverityColors } from '@/utils/severity';
import type { TherapistLatestRow } from '@milobedini/shared-types';
import MaterialCommunityIcons from '@react-native-vector-icons/material-design-icons';

import ContentContainer from '../ContentContainer';
import ErrorComponent, { ErrorTypes } from '../ErrorComponent';
import { LoadingIndicator } from '../LoadingScreen';
import { ThemedText } from '../ThemedText';
import { AttemptFilterDrawer } from '../ui/AttemptFilterDrawer';
import EmptyState from '../ui/EmptyState';

type MCIName = ComponentProps<typeof MaterialCommunityIcons>['name'];

type AttemptSection = { title: string; data: TherapistLatestRow[] };

const MODULE_TYPE_ICONS: Record<string, MCIName> = {
  questionnaire: 'clipboard-text-outline',
  activity_diary: 'calendar-week',
  reading: 'book-open-outline',
};

const getModuleIcon = (moduleType?: string): MCIName =>
  (moduleType && MODULE_TYPE_ICONS[moduleType]) || 'file-document-outline';

const ItemSeparator = () => <View className="h-3" />;

const TherapistAttemptListItemBase = ({ item }: { item: TherapistLatestRow }) => {
  const severity = getSeverityColors(item.scoreBandLabel);
  const { relative, formatted } = timeAgo(item.completedAt || '');
  const icon = getModuleIcon(item.moduleType);

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
      <Pressable className="overflow-hidden rounded-xl bg-chip-darkCard active:opacity-80">
        <View className="flex-row">
          {/* Severity accent border */}
          <View className="w-1 rounded-l-xl" style={{ backgroundColor: severity.border }} />

          <View className="flex-1 gap-3 p-4">
            {/* Row 1: Icon + Title + Iteration */}
            <View className="flex-row items-center gap-2">
              <MaterialCommunityIcons name={icon} size={18} color={Colors.sway.darkGrey} />
              <ThemedText type="smallTitle" className="flex-1 flex-shrink" numberOfLines={1}>
                {item.module.title}
              </ThemedText>
              {!!item.iteration && item.iteration > 1 && (
                <View className="rounded-full px-2 py-0.5" style={{ backgroundColor: Colors.tint.teal }}>
                  <ThemedText type="small" style={{ color: Colors.sway.bright, fontSize: 12 }}>
                    #{item.iteration}
                  </ThemedText>
                </View>
              )}
            </View>

            {/* Row 2: Patient name */}
            <ThemedText type="small" className="text-sway-darkGrey">
              {item.user.name}
            </ThemedText>

            {/* Row 3: Score pill + band label (questionnaires only) */}
            {!!item.totalScore && (
              <View className="flex-row items-center gap-2">
                <View
                  className="rounded-lg px-3 py-1"
                  style={{
                    backgroundColor: severity.pillBg,
                    minWidth: 40,
                    alignItems: 'center'
                  }}
                >
                  <ThemedText type="smallBold" style={{ color: severity.border }}>
                    {item.totalScore}
                  </ThemedText>
                </View>
                <ThemedText type="small" className="text-sway-darkGrey">
                  {item.scoreBandLabel}
                </ThemedText>
              </View>
            )}

            {/* Row 4: Relative time */}
            <View className="flex-row items-center gap-1">
              <MaterialCommunityIcons name="calendar" size={14} color={Colors.sway.darkGrey} />
              <ThemedText type="small" className="text-xs text-sway-darkGrey">
                {relative ?? formatted}
              </ThemedText>
            </View>
          </View>
        </View>
      </Pressable>
    </Link>
  );
};

const TherapistAttemptListItem = memo(TherapistAttemptListItemBase);

const SORT_OPTIONS: { value: SortOption; label: string }[] = [
  { value: 'newest', label: 'Newest' },
  { value: 'oldest', label: 'Oldest' },
  { value: 'severity', label: 'Severity' }
];

const SortChips = memo(function SortChips({
  value,
  onChange
}: {
  value: SortOption;
  onChange: (s: SortOption) => void;
}) {
  return (
    <View className="flex-row items-center gap-2 px-4 py-2">
      <ThemedText type="small" className="text-xs uppercase tracking-wide text-sway-darkGrey">
        Sort:
      </ThemedText>
      {SORT_OPTIONS.map((opt) => (
        <Chip
          key={opt.value}
          selected={value === opt.value}
          onPress={() => onChange(opt.value)}
          compact
          style={{
            backgroundColor: value === opt.value ? Colors.tint.teal : 'transparent',
            borderColor: value === opt.value ? Colors.sway.bright : Colors.chip.darkCardAlt,
            borderWidth: 1
          }}
          textStyle={{
            color: value === opt.value ? Colors.sway.bright : Colors.sway.darkGrey,
            fontSize: 13
          }}
        >
          {opt.label}
        </Chip>
      ))}
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
  filters: AttemptFilterDrawerValues;
  patientName?: string;
  moduleName?: string;
  onClear: (key: keyof AttemptFilterDrawerValues) => void;
  onClearAll: () => void;
}) {
  const chips: { key: keyof AttemptFilterDrawerValues; label: string }[] = [];

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
  if (filters.status && !(filters.status.length === 1 && filters.status[0] === 'submitted')) {
    chips.push({ key: 'status', label: `Status: ${filters.status.join(', ')}` });
  }

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

const SectionHeader = memo(function SectionHeader({ title }: { title: string }) {
  return (
    <View
      className="border-b px-4 pb-2 pt-3"
      style={{
        backgroundColor: Colors.sway.dark,
        borderBottomColor: Colors.chip.darkCardAlt
      }}
    >
      <ThemedText type="smallBold" className="text-xs uppercase tracking-wide text-sway-darkGrey">
        {title}
      </ThemedText>
    </View>
  );
});

const TherapistLatestAttempts = () => {
  const [sort, setSort] = useState<SortOption>('newest');
  const [filters, setFilters] = useState<AttemptFilterDrawerValues>(DEFAULT_FILTERS);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const {
    rows,
    totalCount,
    isPending,
    isError,
    isRefetching,
    refetch,
    hasNextPage,
    fetchNextPage,
    isFetchingNextPage,
    isFetching
  } = useTherapistGetLatestAttempts({
    ...filters,
    sort,
    status: filters.status?.join(',')
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

  const sections = useMemo(() => groupByDate(rows), [rows]);

  const selectedPatientName = useMemo(
    () => patientChoices.find((p) => p.id === filters.patientId)?.name,
    [patientChoices, filters.patientId]
  );

  const selectedModuleName = useMemo(
    () => moduleChoices.find((m) => m.id === filters.moduleId)?.title,
    [moduleChoices, filters.moduleId]
  );

  const handleClearFilter = useCallback((key: keyof AttemptFilterDrawerValues) => {
    setFilters((prev) => ({
      ...prev,
      [key]: key === 'status' ? DEFAULT_FILTERS.status : undefined
    }));
  }, []);

  const handleClearAll = useCallback(() => setFilters(DEFAULT_FILTERS), []);

  const renderItem = useCallback(
    ({ item }: SectionListRenderItemInfo<TherapistLatestRow>) => <TherapistAttemptListItem item={item} />,
    []
  );

  const renderSectionHeader = useCallback(
    ({ section }: { section: SectionListData<TherapistLatestRow, AttemptSection> }) => (
      <SectionHeader title={section.title} />
    ),
    []
  );

  const handleEndReached = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage) fetchNextPage();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  useEffect(() => {
    if (isError && sections.length > 0) {
      toast.error('Failed to refresh', {
        duration: TOAST_DURATIONS.error,
        styles: TOAST_STYLES.error
      });
    }
  }, [isError, sections]);

  if (isPending) return <LoadingIndicator marginBottom={0} />;
  if (isError && !sections.length) return <ErrorComponent errorType={ErrorTypes.GENERAL_ERROR} />;

  return (
    <ContentContainer padded={false}>
      {/* Header */}
      <View className="flex-row items-center justify-between px-4 pt-2">
        <ThemedText type="small" className="text-sway-darkGrey" style={{ opacity: isFetching && !isPending ? 0.4 : 1 }}>
          {totalCount} {totalCount === 1 ? 'submission' : 'submissions'}
        </ThemedText>
        <IconButton
          icon="filter-variant"
          iconColor={Colors.sway.lightGrey}
          onPress={() => setDrawerOpen(true)}
          style={{ backgroundColor: Colors.sway.buttonBackgroundSolid }}
        />
      </View>

      {/* Sort chips */}
      <SortChips value={sort} onChange={setSort} />

      {/* Active filter chips */}
      <ActiveFilterChips
        filters={filters}
        patientName={selectedPatientName}
        moduleName={selectedModuleName}
        onClear={handleClearFilter}
        onClearAll={handleClearAll}
      />

      {/* List */}
      {!isFetching && sections.length === 0 ? (
        <EmptyState
          icon="clipboard-text-outline"
          title="No submissions yet"
          subtitle="Completed work from your patients will appear here"
        />
      ) : (
        <SectionList
          sections={sections}
          keyExtractor={(item) => item._id}
          renderItem={renderItem}
          renderSectionHeader={renderSectionHeader}
          ItemSeparatorComponent={ItemSeparator}
          stickySectionHeadersEnabled
          contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 16 }}
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

      {/* Filter drawer */}
      <AttemptFilterDrawer
        visible={drawerOpen}
        onDismiss={() => setDrawerOpen(false)}
        values={filters}
        onChange={setFilters}
        onApply={(v) => {
          setFilters(v);
          setDrawerOpen(false);
        }}
        onReset={() => setFilters(DEFAULT_FILTERS)}
        title="Filter Attempts"
        moduleChoices={moduleChoices}
        patientChoices={patientChoices}
        showSeverity
        showPatient
        showLimit={false}
      />
    </ContentContainer>
  );
};

export default TherapistLatestAttempts;
