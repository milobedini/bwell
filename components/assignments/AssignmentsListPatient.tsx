import { useCallback } from 'react';
import { FlatList, TouchableOpacity, View } from 'react-native';
import { clsx } from 'clsx';
import { useRouter } from 'expo-router';
import { AssignmentStatus, UserRole } from '@/types/types';
import { MyAssignmentView } from '@milobedini/shared-types';

import ThemedButton from '../ThemedButton';
import { ThemedText } from '../ThemedText';
import { DueChip, RecurrenceChip, TimeLeftChip } from '../ui/Chip';

type AssignmentsListPatientProps = {
  data: MyAssignmentView[];
  completed?: boolean;
};

const AssignmentsListPatient = ({ data, completed }: AssignmentsListPatientProps) => {
  const router = useRouter();

  const handleAssignmentPress = useCallback(
    (id: string, headerTitle: string) => {
      router.push({
        pathname: '/assignments/[id]',
        params: { id, headerTitle, user: UserRole.PATIENT }
      });
    },
    [router]
  );

  return (
    <FlatList
      data={data}
      keyExtractor={(item) => item._id}
      renderItem={({ item, index }) => {
        const bgColor = index % 2 === 0 ? '' : 'bg-sway-buttonBackground';
        return (
          <TouchableOpacity
            className={clsx('gap-1 p-4', bgColor)}
            onPress={() => handleAssignmentPress(item._id, item.module.title)}
          >
            <ThemedText type="smallTitle">{item.module.title}</ThemedText>
            <ThemedText>Assigned by {item.therapist.name}</ThemedText>
            {item.notes && <ThemedText type="italic">&quot;{item.notes}&quot;</ThemedText>}
            {item.recurrence && completed && <RecurrenceChip recurrence={item.recurrence} />}
            {completed && <DueChip completed dueAt={item.latestAttempt?.completedAt} />}
            {!completed && item.dueAt && (
              <View>
                <View className="flex-row flex-wrap gap-1">
                  <DueChip dueAt={item.dueAt} />
                  <TimeLeftChip dueAt={item.dueAt} />
                  {item.recurrence && !completed && <RecurrenceChip recurrence={item.recurrence} />}
                </View>
                <ThemedButton
                  title={item.status === AssignmentStatus.IN_PROGRESS ? 'Continue' : 'Start'}
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
  );
};

export default AssignmentsListPatient;
