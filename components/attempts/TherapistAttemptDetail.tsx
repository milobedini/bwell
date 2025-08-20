import { useRef } from 'react';
import { useLocalSearchParams } from 'expo-router';
import AttemptPresenter from '@/components/attempts/AttemptPresenter';
import Container from '@/components/Container';
import ErrorComponent, { ErrorTypes } from '@/components/ErrorComponent';
import { LoadingIndicator } from '@/components/LoadingScreen';
import { useTherapistGetAttemptDetail } from '@/hooks/useAttempts';
import type { AttemptAnswer, AttemptDetailItem } from '@milobedini/shared-types';

const TherapistAttemptDetail = () => {
  const { id } = useLocalSearchParams();

  const { data, isPending, isError } = useTherapistGetAttemptDetail(id as string);

  const attempt = data?.attempt;

  const answersMap = useRef<Map<string, AttemptAnswer>>(new Map());

  if (attempt && answersMap.current.size === 0) {
    // Preload any existing selections from detail.items
    attempt.detail.items.forEach((it: AttemptDetailItem) => {
      if (it.chosenScore != null) {
        answersMap.current.set(it.questionId, {
          question: it.questionId,
          chosenScore: it.chosenScore ?? 0,
          chosenIndex: it.chosenIndex ?? undefined,
          chosenText: it.chosenText ?? undefined
        });
      }
    });
  }

  if (isPending) return <LoadingIndicator marginBottom={0} />;
  if (isError) return <ErrorComponent errorType={ErrorTypes.GENERAL_ERROR} />;

  if (!attempt || !data) return <ErrorComponent errorType={ErrorTypes.NO_CONTENT} />;

  return (
    <Container>
      <AttemptPresenter attempt={attempt} mode="view" />
    </Container>
  );
};

export default TherapistAttemptDetail;
