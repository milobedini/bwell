import { useMemo } from 'react';
import { useLocalSearchParams } from 'expo-router';
import AttemptPresenter from '@/components/attempts/AttemptPresenter';
import Container from '@/components/Container';
import ErrorComponent, { ErrorTypes } from '@/components/ErrorComponent';
import { LoadingIndicator } from '@/components/LoadingScreen';
import { useTherapistGetAttemptDetail } from '@/hooks/useAttempts';
import { AttemptStatus } from '@/types/types';

const AttemptTherapistDetail = () => {
  const { id } = useLocalSearchParams();
  const { data, isPending, isError } = useTherapistGetAttemptDetail(id as string);
  const attempt = data?.attempt;
  const mode = useMemo(() => {
    if (attempt?.status === AttemptStatus.SUBMITTED) return 'view';
    return 'edit';
  }, [attempt?.status]);

  if (isPending) return <LoadingIndicator marginBottom={0} />;
  if (isError) return <ErrorComponent errorType={ErrorTypes.GENERAL_ERROR} />;

  if (!attempt || !data) return <ErrorComponent errorType={ErrorTypes.NO_CONTENT} />;

  return (
    <Container>
      <AttemptPresenter attempt={attempt} mode={mode} />
    </Container>
  );
};

export default AttemptTherapistDetail;
