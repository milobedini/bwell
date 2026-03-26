import { memo, useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  SectionList,
  type SectionListData,
  type SectionListRenderItemInfo,
  View
} from 'react-native';
import { Chip, FAB, IconButton } from 'react-native-paper';
import { Link } from 'expo-router';
import { toast } from 'sonner-native';
import { TOAST_DURATIONS, TOAST_STYLES } from '@/components/toast/toastOptions';
import type { ActionMenuItem } from '@/components/ui/ActionMenu';
import ActionMenu from '@/components/ui/ActionMenu';
import { Colors } from '@/constants/Colors';
import { useRemoveAssignment } from '@/hooks/useAssignments';
import type { AssignmentSortOption, MyAssignmentView } from '@milobedini/shared-types';

import { ThemedText } from '../ThemedText';

import AssignmentCard from './AssignmentCard';
import type { AssignmentFilterValues } from './AssignmentFilterDrawer';
import EditAssignmentModal from './EditAssignmentModal';
import PatientGroupHeader from './PatientGroupHeader';

type AssignmentSection = {
  title: string;
  patientId: string;
  data: MyAssignmentView[];
  overdueCount: number;
};

type AssignmentsListTherapistProps = {
  items: MyAssignmentView[];
  totalItems: number;
  sort: AssignmentSortOption;
  onSortChange: (s: AssignmentSortOption) => void;
  filters: AssignmentFilterValues;
  onOpenFilterDrawer: () => void;
  onClearFilter: (key: keyof AssignmentFilterValues) => void;
  onClearAllFilters: () => void;
  patientName?: string;
  moduleName?: string;
  isRefetching: boolean;
  isFetching: boolean;
  isPending: boolean;
  isFetchingNextPage: boolean;
  hasNextPage: boolean;
  fetchNextPage: () => void;
  refetch: () => void;
  isError: boolean;
};

const SORT_OPTIONS: { value: AssignmentSortOption; label: string }[] = [
  { value: 'urgency', label: 'Urgency' },
  { value: 'newest', label: 'Newest' },
  { value: 'oldest', label: 'Oldest' },
  { value: 'module', label: 'Module' }
];

const SortChips = memo(function SortChips({
  value,
  onChange
}: {
  value: AssignmentSortOption;
  onChange: (s: AssignmentSortOption) => void;
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
  filters: AssignmentFilterValues;
  patientName?: string;
  moduleName?: string;
  onClear: (key: keyof AssignmentFilterValues) => void;
  onClearAll: () => void;
}) {
  const chips: { key: keyof AssignmentFilterValues; label: string }[] = [];

  if (filters.patientId && patientName) {
    chips.push({ key: 'patientId', label: `Patient: ${patientName}` });
  }
  if (filters.moduleId && moduleName) {
    chips.push({ key: 'moduleId', label: `Module: ${moduleName}` });
  }
  if (filters.status) {
    const label = filters.status === 'in_progress' ? 'In Progress' : 'Assigned';
    chips.push({ key: 'status', label: `Status: ${label}` });
  }
  if (filters.urgency) {
    const labels: Record<string, string> = {
      overdue: 'Overdue',
      due_soon: 'Due Soon',
      on_track: 'On Track',
      no_due_date: 'No Due Date'
    };
    chips.push({ key: 'urgency', label: `Urgency: ${labels[filters.urgency]}` });
  }

  if (chips.length === 0) return null;

  return (
    <View className="flex-row flex-wrap items-center gap-1.5 px-4 pb-2">
      {chips.map((c) => (
        <Pressable
          key={c.key}
          onPress={() => onClear(c.key)}
          className="flex-row items-center gap-1 rounded-full px-2.5 py-1 active:opacity-80"
          style={{ backgroundColor: Colors.tint.teal }}
        >
          <ThemedText style={{ fontSize: 12, color: Colors.sway.bright }}>{c.label}</ThemedText>
          <ThemedText style={{ fontSize: 12, color: Colors.sway.bright, opacity: 0.6 }}>✕</ThemedText>
        </Pressable>
      ))}
      {chips.length >= 2 && (
        <Pressable onPress={onClearAll} className="active:opacity-80">
          <ThemedText style={{ fontSize: 12, color: Colors.sway.darkGrey, marginLeft: 4 }}>Clear all</ThemedText>
        </Pressable>
      )}
    </View>
  );
});

const groupByPatient = (items: MyAssignmentView[]): AssignmentSection[] => {
  const now = Date.now();
  const map = new Map<string, AssignmentSection>();
  const order: string[] = [];

  for (const item of items) {
    const pid = item.user._id;
    if (!map.has(pid)) {
      order.push(pid);
      map.set(pid, {
        title: item.user.name ?? item.user.username,
        patientId: pid,
        data: [],
        overdueCount: 0
      });
    }
    const group = map.get(pid)!;
    group.data.push(item);
    if (item.dueAt && new Date(item.dueAt).getTime() < now) {
      group.overdueCount += 1;
    }
  }

  return order.map((pid) => map.get(pid)!);
};

const AssignmentsListTherapist = ({
  items,
  totalItems,
  sort,
  onSortChange,
  filters,
  onOpenFilterDrawer,
  onClearFilter,
  onClearAllFilters,
  patientName,
  moduleName,
  isRefetching,
  isFetching,
  isPending,
  isFetchingNextPage,
  hasNextPage,
  fetchNextPage,
  refetch,
  isError
}: AssignmentsListTherapistProps) => {
  const [collapsedSections, setCollapsedSections] = useState<Set<string>>(new Set());
  const [menuOpen, setMenuOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const { mutate: removeAssignment } = useRemoveAssignment();

  const sections = useMemo(() => groupByPatient(items), [items]);

  const selectedAssignment = useMemo(() => items.find((a) => a._id === selectedId) ?? null, [items, selectedId]);

  const allExpanded = collapsedSections.size === 0;

  const toggleSection = useCallback((patientId: string) => {
    setCollapsedSections((prev) => {
      const next = new Set(prev);
      if (next.has(patientId)) next.delete(patientId);
      else next.add(patientId);
      return next;
    });
  }, []);

  const toggleAll = useCallback(() => {
    if (allExpanded) {
      setCollapsedSections(new Set(sections.map((s) => s.patientId)));
    } else {
      setCollapsedSections(new Set());
    }
  }, [allExpanded, sections]);

  const closeMenu = useCallback(() => {
    setMenuOpen(false);
    setSelectedId(null);
  }, []);

  const openMenu = useCallback((id: string) => {
    setSelectedId(id);
    setMenuOpen(true);
  }, []);

  const handleEdit = useCallback(() => {
    setMenuOpen(false);
    // Delay slightly to avoid z-index overlap between ActionMenu closing and modal opening
    setTimeout(() => setEditOpen(true), 150);
  }, []);

  const handleRemove = useCallback(() => {
    if (!selectedId) return;
    removeAssignment({ assignmentId: selectedId }, { onSuccess: closeMenu, onError: closeMenu });
  }, [removeAssignment, selectedId, closeMenu]);

  const closeEdit = useCallback(() => {
    setEditOpen(false);
    setSelectedId(null);
  }, []);

  const actions: ActionMenuItem[] = useMemo(
    () => [
      {
        icon: 'pencil-outline' as const,
        label: 'Edit assignment',
        onPress: handleEdit
      },
      {
        icon: 'delete-outline' as const,
        label: 'Remove assignment',
        onPress: handleRemove,
        variant: 'destructive' as const
      }
    ],
    [handleEdit, handleRemove]
  );

  // Map sections — collapsed ones get empty data arrays
  const filteredSections = useMemo(
    () =>
      sections.map((s) => ({
        ...s,
        data: collapsedSections.has(s.patientId) ? [] : s.data
      })),
    [sections, collapsedSections]
  );

  const renderItem = useCallback(
    ({ item }: SectionListRenderItemInfo<MyAssignmentView>) => <AssignmentCard item={item} onOpenMenu={openMenu} />,
    [openMenu]
  );

  const renderSectionHeader = useCallback(
    ({ section }: { section: SectionListData<MyAssignmentView, AssignmentSection> }) => (
      <PatientGroupHeader
        patientName={section.title}
        assignmentCount={sections.find((s) => s.patientId === section.patientId)?.data.length ?? 0}
        overdueCount={section.overdueCount}
        isExpanded={!collapsedSections.has(section.patientId)}
        onToggle={() => toggleSection(section.patientId)}
      />
    ),
    [sections, collapsedSections, toggleSection]
  );

  const renderSectionFooter = useCallback(
    ({ section }: { section: SectionListData<MyAssignmentView, AssignmentSection> }) => {
      if (collapsedSections.has(section.patientId)) return <View className="h-3" />;
      return <View className="mb-3 h-px" />;
    },
    [collapsedSections]
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

  return (
    <>
      {/* Header row */}
      <View className="flex-row items-center justify-between px-4 pt-2">
        <ThemedText type="small" style={{ color: Colors.sway.darkGrey, opacity: isFetching && !isPending ? 0.4 : 1 }}>
          {totalItems} {totalItems === 1 ? 'assignment' : 'assignments'}
        </ThemedText>
        <View className="flex-row items-center gap-1">
          <Pressable onPress={toggleAll} className="active:opacity-80">
            <ThemedText style={{ fontSize: 13, color: Colors.sway.bright }}>
              {allExpanded ? 'Collapse all' : 'Expand all'}
            </ThemedText>
          </Pressable>
          <IconButton
            icon="filter-variant"
            iconColor={Colors.sway.lightGrey}
            onPress={onOpenFilterDrawer}
            style={{ backgroundColor: Colors.sway.buttonBackgroundSolid }}
          />
        </View>
      </View>

      {/* Sort chips */}
      <SortChips value={sort} onChange={onSortChange} />

      {/* Active filter chips */}
      <ActiveFilterChips
        filters={filters}
        patientName={patientName}
        moduleName={moduleName}
        onClear={onClearFilter}
        onClearAll={onClearAllFilters}
      />

      {/* List */}
      <SectionList
        sections={filteredSections}
        keyExtractor={(item) => item._id}
        renderItem={renderItem}
        renderSectionHeader={renderSectionHeader}
        renderSectionFooter={renderSectionFooter}
        stickySectionHeadersEnabled={false}
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 80 }}
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

      {/* FAB */}
      <Link
        href={{
          pathname: '/assignments/add',
          params: { headerTitle: 'Create Assignment' }
        }}
        push
        style={{
          position: 'absolute',
          right: 16,
          bottom: 16
        }}
      >
        <FAB
          color={Colors.primary.charcoal}
          icon="plus-circle"
          size="medium"
          style={{
            elevation: 2,
            backgroundColor: Colors.primary.accent
          }}
        />
      </Link>

      {/* Action menu */}
      <ActionMenu
        visible={menuOpen}
        onDismiss={closeMenu}
        title={selectedAssignment?.module.title}
        subtitle={
          selectedAssignment
            ? `Assigned to ${selectedAssignment.user.name ?? selectedAssignment.user.username}`
            : undefined
        }
        actions={actions}
      />

      {/* Edit modal */}
      <EditAssignmentModal visible={editOpen} onDismiss={closeEdit} assignment={selectedAssignment} />
    </>
  );
};

export default AssignmentsListTherapist;
