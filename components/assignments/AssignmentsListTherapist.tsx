import { FlatList, View } from 'react-native';
import { FAB } from 'react-native-paper';
import { clsx } from 'clsx';
import { Link } from 'expo-router';
import { Colors } from '@/constants/Colors';
import { dateString } from '@/utils/dates';
import type { MyAssignmentView } from '@milobedini/shared-types';

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
          return (
            <View className={clsx('gap-1 p-4', bgColor)}>
              <ThemedText type="smallTitle">{item.module.title}</ThemedText>
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
