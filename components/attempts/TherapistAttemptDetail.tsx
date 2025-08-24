import { useLocalSearchParams } from 'expo-router';
import AttemptPresenter from '@/components/attempts/presenters/AttemptPresenter';
import Container from '@/components/Container';
import ErrorComponent, { ErrorTypes } from '@/components/ErrorComponent';
import { LoadingIndicator } from '@/components/LoadingScreen';
import { useTherapistGetAttemptDetail } from '@/hooks/useAttempts';

const TherapistAttemptDetail = () => {
  const { id } = useLocalSearchParams();

  const { data, isPending, isError } = useTherapistGetAttemptDetail(id as string);

  const attempt = data?.attempt;
  const patientName = attempt?.patient?.name;

  if (isPending) return <LoadingIndicator marginBottom={0} />;
  if (isError) return <ErrorComponent errorType={ErrorTypes.GENERAL_ERROR} />;

  if (!attempt || !data) return <ErrorComponent errorType={ErrorTypes.NO_CONTENT} />;

  return (
    <Container>
      <AttemptPresenter attempt={attempt} mode="view" patientName={patientName} />
    </Container>
  );
};

export default TherapistAttemptDetail;
