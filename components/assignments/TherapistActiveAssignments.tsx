import { useViewTherapistOutstandingAssignments } from '@/hooks/useAssignments';

import Container from '../Container';
import ErrorComponent, { ErrorTypes } from '../ErrorComponent';
import { LoadingIndicator } from '../LoadingScreen';

import AssignmentsListTherapist from './AssignmentsListTherapist';

const TherapistActiveAssignments = () => {
  const { data, isPending, isError } = useViewTherapistOutstandingAssignments();

  if (isPending) return <LoadingIndicator marginBottom={0} />;
  if (isError) return <ErrorComponent errorType={ErrorTypes.GENERAL_ERROR} />;
  if (!data || !data.length) return <ErrorComponent errorType={ErrorTypes.NO_CONTENT} />;

  return (
    <Container>
      <AssignmentsListTherapist data={data} />
    </Container>
  );
};

export default TherapistActiveAssignments;
