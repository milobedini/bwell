import { useCallback } from 'react';
import { FlatList, TouchableOpacity, View } from 'react-native';
import { FAB } from 'react-native-paper';
import { clsx } from 'clsx';
import { useRouter } from 'expo-router';
import { Colors } from '@/constants/Colors';
import { AssignmentStatus, UserRole } from '@/types/types';
import { MyAssignmentView } from '@milobedini/shared-types';

import ThemedButton from '../ThemedButton';
import { ThemedText } from '../ThemedText';
import { DueChip, RecurrenceChip, TimeLeftChip } from '../ui/Chip';

type AssignmentsListTherapistProps = {
  data: MyAssignmentView[];
};

const AssignmentsListTherapist = ({ data }: AssignmentsListTherapistProps) => {
  const router = useRouter();

  const handleAssignmentPress = useCallback(
    // To go to attempts/latest attempt
    (id: string, headerTitle: string) => {
      router.push({
        pathname: '/assignments/[id]',
        params: { id, headerTitle, user: UserRole.THERAPIST }
      });
    },
    [router]
  );

  const handleAddAssignmentPress = useCallback(() => {
    router.push({
      pathname: '/assignments/add',
      params: { headerTitle: 'Create Assignment' }
    });
  }, [router]);

  return (
    <>
      <FlatList
        data={data}
        keyExtractor={(item) => item._id}
        renderItem={({ item, index }) => {
          const bgColor = index % 2 === 0 ? '' : 'bg-sway-buttonBackground';
          const created = new Date(item.createdAt as string);

          return (
            <TouchableOpacity
              onPress={() => handleAssignmentPress(item._id, `${item.user.name}: ${item.module.title}`)}
              className={clsx('gap-1 p-4', bgColor)}
            >
              <ThemedText type="smallTitle">{item.module.title}</ThemedText>
              <ThemedText>
                Assigned to {item.user.name ?? item.user.username} on {created.toLocaleDateString()}
              </ThemedText>
              {item.notes && <ThemedText type="italic">&quot;{item.notes}&quot;</ThemedText>}
              {item.dueAt && (
                <View>
                  <View className="flex-row flex-wrap gap-1">
                    <DueChip dueAt={item.dueAt} />
                    <TimeLeftChip dueAt={item.dueAt} />
                    {item.recurrence && <RecurrenceChip recurrence={item.recurrence} />}
                  </View>
                  <ThemedButton
                    title={item.status === AssignmentStatus.IN_PROGRESS ? 'View' : 'Review'}
                    compact
                    className="mt-4 w-1/3"
                    onPress={() => {}}
                  />
                </View>
              )}
            </TouchableOpacity>
          );
        }}
      />
      <FAB
        color={Colors.primary.charcoal}
        icon="plus-circle"
        size="medium"
        style={{
          position: 'absolute',
          right: 16,
          bottom: 16,
          elevation: 2,
          backgroundColor: Colors.primary.accent
        }}
        onPress={handleAddAssignmentPress}
      />
    </>
  );
};

export default AssignmentsListTherapist;
