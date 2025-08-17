import { useViewMyAssignments } from '@/hooks/useAssignments';
import { AssignmentStatusSearchOptions } from '@/types/types';

import Container from '../Container';
import ErrorComponent, { ErrorTypes } from '../ErrorComponent';
import { LoadingIndicator } from '../LoadingScreen';

import AssignmentsListPatient from './AssignmentsListPatient';

const PatientCompletedAssignments = () => {
  const { data, isPending, isError } = useViewMyAssignments({ status: AssignmentStatusSearchOptions.COMPLETED });

  if (isPending) return <LoadingIndicator marginBottom={0} />;
  if (isError) return <ErrorComponent errorType={ErrorTypes.GENERAL_ERROR} />;
  if (!data || !data.length) return <ErrorComponent errorType={ErrorTypes.NO_CONTENT} />;

  return (
    <Container>
      <AssignmentsListPatient data={data} completed />
    </Container>
  );
};

export default PatientCompletedAssignments;
