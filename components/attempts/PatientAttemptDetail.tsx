import { useMemo } from 'react';
import { View } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import AttemptPresenter from '@/components/attempts/presenters/AttemptPresenter';
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
    <View className="flex-1">
      <AttemptPresenter attempt={attempt} mode={mode} />
    </View>
  );
};

export default PatientAttemptDetail;
