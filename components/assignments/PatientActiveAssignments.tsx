import { useViewMyAssignments } from '@/hooks/useAssignments';
import { AssignmentStatusSearchOptions } from '@/types/types';

import Container from '../Container';
import ErrorComponent, { ErrorTypes } from '../ErrorComponent';
import { LoadingIndicator } from '../LoadingScreen';
import { ThemedText } from '../ThemedText';

import AssignmentsListPatient from './AssignmentsListPatient';

const PatientActiveAssignments = () => {
  const { data, isPending, isError } = useViewMyAssignments({ status: AssignmentStatusSearchOptions.ACTIVE });

  if (isPending) return <LoadingIndicator marginBottom={0} />;
  if (isError) return <ErrorComponent errorType={ErrorTypes.GENERAL_ERROR} />;
  if (!data) return <ErrorComponent errorType={ErrorTypes.NO_CONTENT} />;

  return (
    <Container>
      {!!data.length ? (
        <AssignmentsListPatient data={data} />
      ) : (
        <ThemedText className="p-4">No active assignments...</ThemedText>
      )}
    </Container>
  );
};

export default PatientActiveAssignments;
