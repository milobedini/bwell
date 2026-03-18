import { useRouter } from 'expo-router';
import { useViewTherapistOutstandingAssignments } from '@/hooks/useAssignments';

import ContentContainer from '../ContentContainer';
import ErrorComponent, { ErrorTypes } from '../ErrorComponent';
import { LoadingIndicator } from '../LoadingScreen';
import EmptyState from '../ui/EmptyState';

import AssignmentsListTherapist from './AssignmentsListTherapist';

const TherapistActiveAssignments = () => {
  const router = useRouter();
  const { data, isPending, isError } = useViewTherapistOutstandingAssignments();

  if (isPending) return <LoadingIndicator marginBottom={0} />;
  if (isError) return <ErrorComponent errorType={ErrorTypes.GENERAL_ERROR} />;
  if (!data) return <ErrorComponent errorType={ErrorTypes.NO_CONTENT} />;

  return (
    <ContentContainer>
      {!data.length && (
        <EmptyState
          icon="clipboard-text-outline"
          title="No active assignments"
          action={{
            label: 'Create assignment',
            onPress: () => router.push({ pathname: '/assignments/add', params: { headerTitle: 'Create Assignment' } })
          }}
        />
      )}
      <AssignmentsListTherapist data={data} />
    </ContentContainer>
  );
};

export default TherapistActiveAssignments;
