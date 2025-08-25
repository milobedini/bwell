import { useMemo } from 'react';
import { useLocalSearchParams } from 'expo-router';
import AttemptPresenter from '@/components/attempts/presenters/AttemptPresenter';
import Container from '@/components/Container';
import ErrorComponent, { ErrorTypes } from '@/components/ErrorComponent';
import { LoadingIndicator } from '@/components/LoadingScreen';
import { useGetMyAttemptDetail } from '@/hooks/useAttempts';
import { AttemptStatus } from '@/types/types'; // if your enum doesn't include diary yet, keep using string checks in presenter

const PatientAttemptDetail = () => {
  const { id } = useLocalSearchParams<{ id: string; assignmentId?: string }>();

  const { data, isPending, isError } = useGetMyAttemptDetail(id as string);
  const attempt = data?.attempt;

  const mode = useMemo<'view' | 'edit'>(() => {
    if (attempt?.status === AttemptStatus.STARTED) return 'edit';
    return 'view';
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

export default PatientAttemptDetail;
