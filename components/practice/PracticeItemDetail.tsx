import { useEffect, useMemo, useState } from 'react';
import { View } from 'react-native';
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
  const startAttempt = useStartModuleAttempt();

  // Track the attemptId once we have it (either from existing or from mutation)
  const [resolvedAttemptId, setResolvedAttemptId] = useState<string | undefined>();

  // Find the practice item across all buckets
  const item = useMemo(() => {
    if (!practiceData) return undefined;
    return (
      practiceData.today.find((i) => i.assignmentId === assignmentId) ??
      practiceData.thisWeek.find((i) => i.assignmentId === assignmentId) ??
      practiceData.upcoming.find((i) => i.assignmentId === assignmentId) ??
      practiceData.recentlyCompleted.find((i) => i.assignmentId === assignmentId)
    );
  }, [practiceData, assignmentId]);

  // If item has an existing attempt, use it
  useEffect(() => {
    if (!item) return;
    if (item.latestAttempt?.attemptId) {
      setResolvedAttemptId(item.latestAttempt.attemptId);
      return;
    }
    // Auto-start for not_started items
    if (item.status === 'not_started' && !startAttempt.isPending && !resolvedAttemptId) {
      startAttempt.mutate(
        { moduleId: item.moduleId, assignmentId: item.assignmentId },
        {
          onSuccess: (res) => setResolvedAttemptId(res.attempt._id)
        }
      );
    }
  }, [item, startAttempt, resolvedAttemptId]);

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

  return (
    <View className="flex-1">
      <AttemptPresenter attempt={attemptData.attempt} mode={mode} />
    </View>
  );
};

export default PracticeItemDetail;
