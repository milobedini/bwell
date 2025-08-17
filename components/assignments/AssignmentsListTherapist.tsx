import { useCallback } from 'react';
import { FlatList, TouchableOpacity } from 'react-native';
import { clsx } from 'clsx';
import { useRouter } from 'expo-router';
import { UserRole } from '@/types/types';
import { MyAssignmentView } from '@milobedini/shared-types';

import { ThemedText } from '../ThemedText';

type AssignmentsListTherapistProps = {
  data: MyAssignmentView[];
};

const AssignmentsListTherapist = ({ data }: AssignmentsListTherapistProps) => {
  const router = useRouter();

  const handleAssignmentPress = useCallback(
    (id: string, headerTitle: string) => {
      router.push({
        pathname: '/assignments/[id]',
        params: { id, headerTitle, user: UserRole.THERAPIST }
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
        const due = new Date(item.dueAt as string);
        const created = new Date(item.createdAt as string);
        const hoursLeft = (+due - Date.now()) / 36e5;
        const dueLabel = hoursLeft <= 0 ? 'Overdue' : hoursLeft <= 48 ? 'Due soon' : `Due ${due.toLocaleDateString()}`;

        return (
          <TouchableOpacity
            onPress={() => handleAssignmentPress(item._id, `${item.user.name}: ${item.module.title}`)}
            className={clsx('gap-1 p-4', bgColor)}
          >
            <ThemedText type="smallTitle">{item.module.title}</ThemedText>
            <ThemedText>
              Assigned to {item.user.name ?? item.user.username} on {created.toLocaleDateString()}
            </ThemedText>
            <ThemedText>{dueLabel}</ThemedText>
          </TouchableOpacity>
        );
      }}
    />
  );
};

export default AssignmentsListTherapist;
