import { memo, useCallback, useMemo, useState } from 'react';
import { FlatList, type ListRenderItemInfo, TouchableOpacity, View } from 'react-native';
import { FAB } from 'react-native-paper';
import { Link } from 'expo-router';
import type { ActionMenuItem } from '@/components/ui/ActionMenu';
import ActionMenu from '@/components/ui/ActionMenu';
import { Colors } from '@/constants/Colors';
import { useRemoveAssignment } from '@/hooks/useAssignments';
import { dateString } from '@/utils/dates';
import type { MyAssignmentView } from '@milobedini/shared-types';
import Icon from '@react-native-vector-icons/material-design-icons';

import { ThemedText } from '../ThemedText';
import { DueChip, RecurrenceChip, TimeLeftChip } from '../ui/Chip';

type AssignmentsListTherapistProps = {
  data: MyAssignmentView[];
};

type AssignmentListItemTherapistProps = {
  item: MyAssignmentView;
  index: number;
  onOpenMenu: (id: string) => void;
};

const AssignmentListItemTherapistBase = ({ item, index, onOpenMenu }: AssignmentListItemTherapistProps) => {
  const bgColor = index % 2 === 0 ? '' : 'bg-sway-buttonBackground';
  const handlePress = useCallback(() => onOpenMenu(item._id), [onOpenMenu, item._id]);

  return (
    <View className={`gap-1 p-4 ${bgColor}`}>
      <View className="flex-row items-center justify-between">
        <ThemedText type="smallTitle">{item.module.title}</ThemedText>
        <TouchableOpacity
          onPress={handlePress}
          className="h-9 w-9 items-center justify-center rounded-lg active:opacity-70"
          style={{ backgroundColor: Colors.chip.darkCardAlt }}
          hitSlop={8}
        >
          <Icon name="dots-vertical" size={18} color={Colors.sway.darkGrey} />
        </TouchableOpacity>
      </View>
      <ThemedText>
        Assigned to {item.user.name ?? item.user.username} on {dateString(item.createdAt)}
      </ThemedText>
      {item.notes && <ThemedText type="italic">&quot;{item.notes}&quot;</ThemedText>}

      <View>
        <View className="flex-row flex-wrap gap-1">
          <DueChip dueAt={item.dueAt} />
          {item.dueAt && <TimeLeftChip dueAt={item.dueAt} />}
          {item.recurrence && <RecurrenceChip recurrence={item.recurrence} />}
        </View>
      </View>
    </View>
  );
};

const AssignmentListItemTherapist = memo(AssignmentListItemTherapistBase);

const AssignmentsListTherapist = ({ data }: AssignmentsListTherapistProps) => {
  const [menuOpen, setMenuOpen] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const { mutate: removeAssignment } = useRemoveAssignment();

  const selectedAssignment = useMemo(() => data.find((a) => a._id === selectedId), [data, selectedId]);

  const closeMenu = useCallback(() => {
    setMenuOpen(false);
    setSelectedId(null);
  }, []);

  const handleRemoveAssignment = useCallback(() => {
    if (!selectedId) return;
    removeAssignment({ assignmentId: selectedId }, { onSuccess: closeMenu, onError: closeMenu });
  }, [removeAssignment, selectedId, closeMenu]);

  const openMenu = useCallback((id: string) => {
    setSelectedId(id);
    setMenuOpen(true);
  }, []);

  const actions: ActionMenuItem[] = useMemo(
    () => [
      {
        icon: 'delete-outline',
        label: 'Remove assignment',
        onPress: handleRemoveAssignment,
        variant: 'destructive' as const
      }
    ],
    [handleRemoveAssignment]
  );

  const keyExtractor = useCallback((item: MyAssignmentView) => item._id, []);

  const renderItem = useCallback(
    ({ item, index }: ListRenderItemInfo<MyAssignmentView>) => (
      <AssignmentListItemTherapist item={item} index={index} onOpenMenu={openMenu} />
    ),
    [openMenu]
  );

  return (
    <>
      <FlatList data={data} keyExtractor={keyExtractor} renderItem={renderItem} />

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
    </>
  );
};

export default AssignmentsListTherapist;
