import { View } from 'react-native';
import { Link } from 'expo-router';
import { useViewTherapistOutstandingAssignments } from '@/hooks/useAssignments';

import Container from '../Container';
import ErrorComponent, { ErrorTypes } from '../ErrorComponent';
import { LoadingIndicator } from '../LoadingScreen';
import { PrimaryButton } from '../ThemedButton';
import { ThemedText } from '../ThemedText';

import AssignmentsListTherapist from './AssignmentsListTherapist';

const TherapistActiveAssignments = () => {
  const { data, isPending, isError } = useViewTherapistOutstandingAssignments();

  if (isPending) return <LoadingIndicator marginBottom={0} />;
  if (isError) return <ErrorComponent errorType={ErrorTypes.GENERAL_ERROR} />;
  if (!data) return <ErrorComponent errorType={ErrorTypes.NO_CONTENT} />;

  return (
    <Container>
      {!data.length && (
        <View>
          <ThemedText className="mt-2 px-4 text-center">You have no active assignments currently...</ThemedText>
          <Link asChild href={{ pathname: '/assignments/add', params: { headerTitle: 'Create Assignment' } }} push>
            <PrimaryButton title="Create assignment" logo />
          </Link>
        </View>
      )}
      <AssignmentsListTherapist data={data} />
    </Container>
  );
};

export default TherapistActiveAssignments;
