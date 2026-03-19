import { useViewMyAssignments } from '@/hooks/useAssignments';
import { AssignmentStatusSearchOptions } from '@/types/types';

import ContentContainer from '../ContentContainer';
import ErrorComponent, { ErrorTypes } from '../ErrorComponent';
import { LoadingIndicator } from '../LoadingScreen';
import EmptyState from '../ui/EmptyState';

import AssignmentsListPatient from './AssignmentsListPatient';

const PatientActiveAssignments = () => {
  const { data, isPending, isError } = useViewMyAssignments({ status: AssignmentStatusSearchOptions.ACTIVE });

  if (isPending) return <LoadingIndicator marginBottom={0} />;
  if (isError) return <ErrorComponent errorType={ErrorTypes.GENERAL_ERROR} />;
  if (!data) return <ErrorComponent errorType={ErrorTypes.NO_CONTENT} />;

  return (
    <ContentContainer padded={false}>
      {!!data.length ? (
        <AssignmentsListPatient data={data} />
      ) : (
        <EmptyState icon="clipboard-text-outline" title="No active assignments" />
      )}
    </ContentContainer>
  );
};

export default PatientActiveAssignments;
