import { useCallback, useState } from 'react';
import { FlatList, View } from 'react-native';
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
import { renderErrorToast, renderSuccessToast } from '../toast/toastOptions';
import { DueChip, RecurrenceChip, TimeLeftChip } from '../ui/Chip';
import FabTrigger from '../ui/fab/FabTrigger';

type AssignmentsListTherapistProps = {
  data: MyAssignmentView[];
};

const AssignmentsListTherapist = ({ data }: AssignmentsListTherapistProps) => {
  const [menuFor, setMenuFor] = useState<string | null>(null);

  const { mutate: removeAssignment } = useRemoveAssignment();

  const closeMenu = useCallback(() => setMenuFor(null), []);

  const handleRemoveAssignment = useCallback(
    (id: string) => {
      removeAssignment(
        { assignmentId: id },
        {
          onError: (err) => renderErrorToast(err),
          onSuccess: (res) => {
            renderSuccessToast(res?.message || '');
            closeMenu();
          }
        }
      );
    },
    [removeAssignment, closeMenu]
  );

  return (
    <>
      <FlatList
        data={data}
        keyExtractor={(item) => item._id}
        renderItem={({ item, index }) => {
          const bgColor = index % 2 === 0 ? '' : 'bg-sway-buttonBackground';
          const menuVisible = menuFor === item._id;

          return (
            <View className={clsx('gap-1 p-4', bgColor)}>
              <View className="flex-row items-center justify-between">
                <ThemedText type="smallTitle">{item.module.title}</ThemedText>
                <Menu
                  visible={menuVisible}
                  onDismiss={closeMenu}
                  contentStyle={{ backgroundColor: Colors.sway.lightGrey, elevation: 2 }}
                  anchor={<FabTrigger onPress={() => setMenuFor(item._id)} icon="dots-horizontal" size="small" />}
                >
                  <Menu.Item
                    leadingIcon={() => <MaterialCommunityIcons name="delete" size={24} color={Colors.primary.error} />}
                    onPress={() => handleRemoveAssignment(item._id)}
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
        }}
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
