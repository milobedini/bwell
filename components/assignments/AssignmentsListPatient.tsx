import { FlatList, View } from 'react-native';
import { clsx } from 'clsx';
import { useViewMyAssignments } from '@/hooks/useAssignments';

import ErrorComponent, { ErrorTypes } from '../ErrorComponent';
import { LoadingIndicator } from '../LoadingScreen';
import { ThemedText } from '../ThemedText';

const AssignmentsListPatient = () => {
  // Refactor to take the data from the relevant top tab.
  const { data, isPending, isError } = useViewMyAssignments();

  if (isPending) return <LoadingIndicator marginBottom={0} />;
  if (isError) return <ErrorComponent errorType={ErrorTypes.GENERAL_ERROR} />;
  if (!data || !data.length) return <ErrorComponent errorType={ErrorTypes.NO_CONTENT} />;

  return (
    <FlatList
      data={data}
      keyExtractor={(item) => item._id}
      renderItem={({ item, index }) => {
        const bgColor = index % 2 === 0 ? '' : 'bg-sway-buttonBackground';
        const due = new Date(item.dueAt as string);
        const hoursLeft = (+due - Date.now()) / 36e5;
        const dueLabel = hoursLeft <= 0 ? 'Overdue' : hoursLeft <= 48 ? 'Due soon' : `Due ${due.toLocaleDateString()}`;

        return (
          <View className={clsx('gap-1 p-4', bgColor)}>
            <ThemedText type="smallTitle">{item.module.title}</ThemedText>
            <ThemedText>Assigned by {item.therapist.name}</ThemedText>
            <ThemedText>{dueLabel}</ThemedText>
          </View>
        );
      }}
    />
  );
};

export default AssignmentsListPatient;
