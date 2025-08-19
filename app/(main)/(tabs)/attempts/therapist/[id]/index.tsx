import { useCallback, useMemo, useRef } from 'react';
import { useLocalSearchParams } from 'expo-router';
import AttemptPresenter from '@/components/attempts/AttemptPresenter';
import Container from '@/components/Container';
import ErrorComponent, { ErrorTypes } from '@/components/ErrorComponent';
import { LoadingIndicator } from '@/components/LoadingScreen';
import { useSaveModuleAttempt, useSubmitAttempt, useTherapistGetAttemptDetail } from '@/hooks/useAttempts';
import { AttemptStatus } from '@/types/types';
import type { AttemptAnswer, AttemptDetailItem } from '@milobedini/shared-types';

const AttemptTherapistDetail = () => {
  const { id } = useLocalSearchParams();
  const { mutate: saveModuleAttempt } = useSaveModuleAttempt(id as string);
  const { mutate: submitModuleAttempt } = useSubmitAttempt(id as string);

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

  const currentAnswersArray = useCallback(() => Array.from(answersMap.current.values()), []);

  const handleAnswer = useCallback(
    (a: AttemptAnswer) => {
      // Update local map
      answersMap.current.set(a.question, a);

      // Save full set
      try {
        saveModuleAttempt({ answers: currentAnswersArray() });
      } catch (e) {
        // optional toast/alert
        console.warn('Save failed', e);
      }
    },
    [currentAnswersArray, saveModuleAttempt]
  );

  const handleSubmit = useCallback(() => {
    console.log(currentAnswersArray());
    // last save to be safe
    saveModuleAttempt(
      { answers: currentAnswersArray() },
      {
        onError: (err) => {
          console.log(err);
        },
        onSuccess: (res) => {
          console.log(res);
        }
      }
    );
    // submit (send assignmentId if you have one)
    submitModuleAttempt(
      // assignmentId ? { assignmentId } : {}
      {}
    );

    console.log('Submitted', 'Your answers have been submitted.');
    // router.back(); // or navigate wherever you want
  }, [currentAnswersArray, saveModuleAttempt, submitModuleAttempt]);

  const mode = useMemo(() => {
    if (attempt?.status === AttemptStatus.SUBMITTED) return 'view';
    return 'edit';
  }, [attempt?.status]);

  if (isPending) return <LoadingIndicator marginBottom={0} />;
  if (isError) return <ErrorComponent errorType={ErrorTypes.GENERAL_ERROR} />;

  if (!attempt || !data) return <ErrorComponent errorType={ErrorTypes.NO_CONTENT} />;

  return (
    <Container>
      <AttemptPresenter attempt={attempt} mode={mode} onAnswer={handleAnswer} onSubmit={handleSubmit} />
    </Container>
  );
};

export default AttemptTherapistDetail;
