import { useEffect, useMemo, useState } from 'react';
import AttemptPresenter from '@/components/attempts/presenters/AttemptPresenter';
import ContentContainer from '@/components/ContentContainer';
import ErrorComponent, { ErrorTypes } from '@/components/ErrorComponent';
import { LoadingIndicator } from '@/components/LoadingScreen';
import { useGetMyAttemptDetail, useStartModuleAttempt } from '@/hooks/useAttempts';
import { useMyPractice } from '@/hooks/usePractice';
import { AttemptStatus } from '@/types/types';

import { ThemedText } from '../ThemedText';

type PracticeItemDetailProps = {
  assignmentId: string;
};

const PracticeItemDetail = ({ assignmentId }: PracticeItemDetailProps) => {
  const { data: practiceData, isPending: isPracticePending } = useMyPractice();
  const { mutate: startAttempt, isPending: isStarting } = useStartModuleAttempt();

  const [startedAttemptId, setStartedAttemptId] = useState<string | undefined>();

  const item = useMemo(() => {
    if (!practiceData) return undefined;
    return (
      practiceData.today.find((i) => i.assignmentId === assignmentId) ??
      practiceData.thisWeek.find((i) => i.assignmentId === assignmentId) ??
      practiceData.upcoming.find((i) => i.assignmentId === assignmentId) ??
      practiceData.recentlyCompleted.find((i) => i.assignmentId === assignmentId)
    );
  }, [practiceData, assignmentId]);

  const existingAttemptId = item?.latestAttempt?.attemptId;

  useEffect(() => {
    if (!item || existingAttemptId || startedAttemptId || item.status !== 'not_started' || isStarting) return;
    startAttempt(
      { moduleId: item.moduleId, assignmentId: item.assignmentId },
      { onSuccess: (res) => setStartedAttemptId(res.attempt._id) }
    );
  }, [item, existingAttemptId, startedAttemptId, isStarting, startAttempt]);

  const resolvedAttemptId = existingAttemptId ?? startedAttemptId;

  const { data: attemptData, isPending: isAttemptPending } = useGetMyAttemptDetail(resolvedAttemptId ?? '');

  const mode = useMemo<'view' | 'edit'>(() => {
    if (attemptData?.attempt?.status === AttemptStatus.STARTED) return 'edit';
    return 'view';
  }, [attemptData?.attempt?.status]);

  if (isPracticePending || (item && !resolvedAttemptId) || (resolvedAttemptId && isAttemptPending)) {
    return <LoadingIndicator marginBottom={0} />;
  }

  if (!item) {
    return (
      <ContentContainer centered>
        <ThemedText type="default">Practice item not found.</ThemedText>
      </ContentContainer>
    );
  }

  if (!attemptData?.attempt) {
    return <ErrorComponent errorType={ErrorTypes.NO_CONTENT} />;
  }

  return <AttemptPresenter attempt={attemptData.attempt} mode={mode} />;
};

export default PracticeItemDetail;
