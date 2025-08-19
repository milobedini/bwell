import { useLocalSearchParams } from 'expo-router';
import Container from '@/components/Container';
import ErrorComponent, { ErrorTypes } from '@/components/ErrorComponent';
import { LoadingIndicator } from '@/components/LoadingScreen';
import { ThemedText } from '@/components/ThemedText';
import { useTherapistGetAttemptDetail } from '@/hooks/useAttempts';

const AttemptTherapistDetail = () => {
  const { id } = useLocalSearchParams();
  const { data, isPending, isError } = useTherapistGetAttemptDetail(id as string);

  if (isPending) return <LoadingIndicator marginBottom={0} />;
  if (isError) return <ErrorComponent errorType={ErrorTypes.GENERAL_ERROR} />;

  const { attempt } = data;

  if (!attempt || !data) return <ErrorComponent errorType={ErrorTypes.NO_CONTENT} />;

  return (
    <Container>
      <ThemedText>Attempt Therapist Detail</ThemedText>
      <ThemedText>{attempt.moduleSnapshot?.title}</ThemedText>
    </Container>
  );
};

export default AttemptTherapistDetail;
