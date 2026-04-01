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
  attemptIdParam?: string;
};

const PracticeItemDetail = ({ assignmentId, attemptIdParam }: PracticeItemDetailProps) => {
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

  // Use param directly (e.g. from Journey tab) or resolve from practice data
  const resolvedAttemptId = attemptIdParam ?? existingAttemptId ?? startedAttemptId ?? '';

  const { data: attemptData, isPending: isAttemptPending } = useGetMyAttemptDetail(resolvedAttemptId);

  const mode = useMemo<'view' | 'edit'>(() => {
    if (attemptData?.attempt?.status === AttemptStatus.STARTED) return 'edit';
    return 'view';
  }, [attemptData?.attempt?.status]);

  // When attemptIdParam is provided, skip waiting for practice data lookup
  const isLookingUpItem = !attemptIdParam && (isPracticePending || (item && !resolvedAttemptId));

  if (isLookingUpItem || (resolvedAttemptId && isAttemptPending)) {
    return <LoadingIndicator marginBottom={0} />;
  }

  if (!attemptIdParam && !item) {
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
