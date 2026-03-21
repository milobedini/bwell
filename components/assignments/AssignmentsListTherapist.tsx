import { memo, useCallback, useState } from 'react';
import { FlatList, type ListRenderItemInfo, View } from 'react-native';
import { FAB, Menu } from 'react-native-paper';
import { clsx } from 'clsx';
import { Link } from 'expo-router';
import { Colors } from '@/constants/Colors';
import { Fonts } from '@/constants/Typography';
import { useRemoveAssignment } from '@/hooks/useAssignments';
import { dateString } from '@/utils/dates';
import type { MyAssignmentView } from '@milobedini/shared-types';
import MaterialCommunityIcons from '@react-native-vector-icons/material-design-icons';

import { ThemedText } from '../ThemedText';
import { DueChip, RecurrenceChip, TimeLeftChip } from '../ui/Chip';
import FabTrigger from '../ui/fab/FabTrigger';

type AssignmentsListTherapistProps = {
  data: MyAssignmentView[];
};

type AssignmentListItemTherapistProps = {
  item: MyAssignmentView;
  index: number;
  menuVisible: boolean;
  onOpenMenu: (id: string) => void;
  onCloseMenu: () => void;
  onRemove: (id: string) => void;
};

const AssignmentListItemTherapistBase = ({
  item,
  index,
  menuVisible,
  onOpenMenu,
  onCloseMenu,
  onRemove
}: AssignmentListItemTherapistProps) => {
  const bgColor = index % 2 === 0 ? '' : 'bg-sway-buttonBackground';

  return (
    <View className={clsx('gap-1 p-4', bgColor)}>
      <View className="flex-row items-center justify-between">
        <ThemedText type="smallTitle">{item.module.title}</ThemedText>
        <Menu
          visible={menuVisible}
          onDismiss={onCloseMenu}
          contentStyle={{ backgroundColor: Colors.sway.lightGrey, elevation: 2 }}
          anchor={<FabTrigger onPress={() => onOpenMenu(item._id)} icon="dots-horizontal" size="small" />}
        >
          <Menu.Item
            leadingIcon={() => <MaterialCommunityIcons name="delete" size={24} color={Colors.primary.error} />}
            onPress={() => onRemove(item._id)}
            title="Remove"
            titleStyle={{ color: Colors.primary.error, fontFamily: Fonts.Bold }}
          />
        </Menu>
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
  const [menuFor, setMenuFor] = useState<string | null>(null);

  const { mutate: removeAssignment } = useRemoveAssignment();

  const closeMenu = useCallback(() => setMenuFor(null), []);

  const handleRemoveAssignment = useCallback(
    (id: string) => {
      removeAssignment(
        { assignmentId: id },
        {
          onSuccess: () => {
            closeMenu();
          }
        }
      );
    },
    [removeAssignment, closeMenu]
  );

  const openMenu = useCallback((id: string) => setMenuFor(id), []);

  const renderItem = useCallback(
    ({ item, index }: ListRenderItemInfo<MyAssignmentView>) => (
      <AssignmentListItemTherapist
        item={item}
        index={index}
        menuVisible={menuFor === item._id}
        onOpenMenu={openMenu}
        onCloseMenu={closeMenu}
        onRemove={handleRemoveAssignment}
      />
    ),
    [menuFor, openMenu, closeMenu, handleRemoveAssignment]
  );

  return (
    <>
      <FlatList data={data} keyExtractor={(item) => item._id} renderItem={renderItem} />
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
