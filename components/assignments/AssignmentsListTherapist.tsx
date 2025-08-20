import { FlatList, TouchableOpacity, View } from 'react-native';
import { FAB } from 'react-native-paper';
import { clsx } from 'clsx';
import { Link } from 'expo-router';
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
  return (
    <>
      <FlatList
        data={data}
        keyExtractor={(item) => item._id}
        renderItem={({ item, index }) => {
          const bgColor = index % 2 === 0 ? '' : 'bg-sway-buttonBackground';
          const created = new Date(item.createdAt as string);

          return (
            <Link
              asChild
              push
              href={{
                pathname: '/assignments/[id]',
                params: {
                  id: item._id,
                  headerTitle: `${item.user.name}: ${item.module.title}`,
                  user: UserRole.THERAPIST
                }
              }}
            >
              <TouchableOpacity className={clsx('gap-1 p-4', bgColor)}>
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
            </Link>
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
