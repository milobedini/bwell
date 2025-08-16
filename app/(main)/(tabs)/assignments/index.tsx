import { View } from 'react-native';
import { clsx } from 'clsx';
import ErrorComponent, { ErrorTypes } from '@/components/ErrorComponent';
import { LoadingIndicator } from '@/components/LoadingScreen';
import ScrollContainer from '@/components/ScrollContainer';
import ScrollContentContainer from '@/components/ScrollContentContainer';
import { ThemedText } from '@/components/ThemedText';
import { useViewMyAssignments } from '@/hooks/useAssignments';

const AssignmentsHome = () => {
  // Todo - refactor to active and completed top tabs. This is active.
  const { data: patientData, isPending: patientPending, isError: patientError } = useViewMyAssignments();

  if (patientPending) return <LoadingIndicator marginBottom={0} />;

  if (patientError) return <ErrorComponent errorType={ErrorTypes.GENERAL_ERROR} />;

  if (!patientData || !patientData.length) return <ErrorComponent errorType={ErrorTypes.NO_CONTENT} />;

  return (
    <ScrollContainer noPadding>
      <ScrollContentContainer noPadding>
        {patientData.map((assignment, index) => {
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
        })}
      </ScrollContentContainer>
    </ScrollContainer>
  );
};

export default AssignmentsHome;
