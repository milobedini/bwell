import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
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
import { filterChipStyle, filterChipTextStyle } from '@/utils/chipStyles';
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
  assignmentCount: number;
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
      <ThemedText
        type="small"
        style={{ fontSize: 12, color: Colors.sway.darkGrey, textTransform: 'uppercase', letterSpacing: 1 }}
      >
        Sort:
      </ThemedText>
      {SORT_OPTIONS.map((opt) => (
        <Chip
          key={opt.value}
          selected={value === opt.value}
          onPress={() => onChange(opt.value)}
          compact
          style={filterChipStyle(value === opt.value)}
          textStyle={filterChipTextStyle(value === opt.value)}
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
  const urgencyLabels: Record<string, string> = {
    overdue: 'Overdue',
    due_soon: 'Due Soon',
    on_track: 'On Track',
    no_due_date: 'No Due Date'
  };

  const chips = [
    filters.patientId && patientName ? { key: 'patientId' as const, label: `Patient: ${patientName}` } : null,
    filters.moduleId && moduleName ? { key: 'moduleId' as const, label: `Module: ${moduleName}` } : null,
    filters.status
      ? { key: 'status' as const, label: `Status: ${filters.status === 'in_progress' ? 'In Progress' : 'Assigned'}` }
      : null,
    filters.urgency ? { key: 'urgency' as const, label: `Urgency: ${urgencyLabels[filters.urgency]}` } : null
  ].filter((c): c is { key: keyof AssignmentFilterValues; label: string } => c !== null);

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
        assignmentCount: 0,
        overdueCount: 0
      });
    }
    const group = map.get(pid)!;
    group.data.push(item);
    group.assignmentCount += 1;
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
  const [allCollapsed, setAllCollapsed] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [editAssignment, setEditAssignment] = useState<MyAssignmentView | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const { mutate: removeAssignment } = useRemoveAssignment();

  const itemsRef = useRef(items);
  itemsRef.current = items;

  const sections = useMemo(() => groupByPatient(items), [items]);

  const selectedAssignment = useMemo(() => items.find((a) => a._id === selectedId) ?? null, [items, selectedId]);

  const allExpanded = !allCollapsed && collapsedSections.size === 0;

  const isSectionCollapsed = useCallback(
    (patientId: string) => allCollapsed || collapsedSections.has(patientId),
    [allCollapsed, collapsedSections]
  );

  const toggleSection = useCallback(
    (patientId: string) => {
      if (allCollapsed) {
        // Transition from allCollapsed to per-section: collapse all except the toggled one
        setAllCollapsed(false);
        setCollapsedSections(new Set(sections.map((s) => s.patientId).filter((id) => id !== patientId)));
      } else {
        setCollapsedSections((prev) => {
          const next = new Set(prev);
          if (next.has(patientId)) next.delete(patientId);
          else next.add(patientId);
          return next;
        });
      }
    },
    [allCollapsed, sections]
  );

  const toggleAll = useCallback(() => {
    if (allExpanded) {
      setAllCollapsed(true);
      setCollapsedSections(new Set());
    } else {
      setAllCollapsed(false);
      setCollapsedSections(new Set());
    }
  }, [allExpanded]);

  const closeMenu = useCallback(() => {
    setMenuOpen(false);
    setSelectedId(null);
  }, []);

  const openMenu = useCallback((id: string) => {
    setSelectedId(id);
    setMenuOpen(true);
  }, []);

  const handleEdit = useCallback(() => {
    // Capture assignment before menu dismiss clears selectedId
    const assignment = items.find((a) => a._id === selectedId) ?? null;
    setEditAssignment(assignment);
  }, [items, selectedId]);

  const handleRemove = useCallback(() => {
    if (!selectedId) return;
    removeAssignment({ assignmentId: selectedId }, { onSuccess: closeMenu, onError: closeMenu });
  }, [removeAssignment, selectedId, closeMenu]);

  const closeEdit = useCallback(() => {
    setEditAssignment(null);
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
        variant: 'destructive' as const,
        confirmTitle: 'Remove assignment?',
        confirmDescription: 'This will permanently delete the assignment and any associated progress.',
        confirmLabel: 'Remove'
      }
    ],
    [handleEdit, handleRemove]
  );

  // Map sections — collapsed ones get empty data arrays
  const filteredSections = useMemo(
    () =>
      sections.map((s) => ({
        ...s,
        data: isSectionCollapsed(s.patientId) ? [] : s.data
      })),
    [sections, isSectionCollapsed]
  );

  const renderItem = useCallback(
    ({ item }: SectionListRenderItemInfo<MyAssignmentView>) => (
      <View className="bg-chip-darkCard pt-2">
        <AssignmentCard item={item} onOpenMenu={openMenu} />
      </View>
    ),
    [openMenu]
  );

  const renderSectionHeader = useCallback(
    ({ section }: { section: SectionListData<MyAssignmentView, AssignmentSection> }) => (
      <PatientGroupHeader
        patientName={section.title}
        assignmentCount={section.assignmentCount}
        overdueCount={section.overdueCount}
        isExpanded={!isSectionCollapsed(section.patientId)}
        onToggle={() => toggleSection(section.patientId)}
      />
    ),
    [isSectionCollapsed, toggleSection]
  );

  const renderSectionFooter = useCallback(
    ({ section }: { section: SectionListData<MyAssignmentView, AssignmentSection> }) => {
      if (isSectionCollapsed(section.patientId)) return <View className="mb-3 rounded-b-xl bg-chip-darkCard pb-1" />;
      return <View className="mb-3 rounded-b-xl bg-chip-darkCard pb-2" />;
    },
    [isSectionCollapsed]
  );

  const keyExtractor = useCallback((item: MyAssignmentView) => item._id, []);

  const handleEndReached = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage) fetchNextPage();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  useEffect(() => {
    if (isError && itemsRef.current.length > 0) {
      toast.error('Failed to refresh', {
        duration: TOAST_DURATIONS.error,
        styles: TOAST_STYLES.error
      });
    }
  }, [isError]);

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
        keyExtractor={keyExtractor}
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
      <EditAssignmentModal visible={!!editAssignment} onDismiss={closeEdit} assignment={editAssignment} />
    </>
  );
};

export default AssignmentsListTherapist;
