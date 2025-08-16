import { View } from 'react-native';
import { clsx } from 'clsx';
import { useViewMyAssignments } from '@/hooks/useAssignments';

import ErrorComponent, { ErrorTypes } from '../ErrorComponent';
import { LoadingIndicator } from '../LoadingScreen';
import { ThemedText } from '../ThemedText';

const AssignmentsListPatient = () => {
  const { data, isPending, isError } = useViewMyAssignments();

  if (isPending) return <LoadingIndicator marginBottom={0} />;

  if (isError) return <ErrorComponent errorType={ErrorTypes.GENERAL_ERROR} />;

  if (!data || !data.length) return <ErrorComponent errorType={ErrorTypes.NO_CONTENT} />;

  data.map((assignment, index) => {
    const bgColor = index % 2 === 0 ? '' : 'bg-sway-buttonBackground';
    const due = new Date(assignment.dueAt as string);
    const msLeft = +due - Date.now();
    const hoursLeft = msLeft / 36e5;
    let dueLabel = `Due ${due.toLocaleDateString()}`;

    if (hoursLeft <= 0) {
      dueLabel = 'Overdue';
    } else if (hoursLeft <= 48) {
      dueLabel = 'Due soon';
    }

    return (
      <View key={assignment._id} className={clsx('gap-1 p-4', bgColor)}>
        <ThemedText type="smallTitle">{assignment.module.title}</ThemedText>
        <ThemedText>Assigned by {assignment.therapist.name}</ThemedText>
        <ThemedText>{dueLabel}</ThemedText>
      </View>
    );
  });
};

export default AssignmentsListPatient;
