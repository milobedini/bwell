import { useCallback, useMemo, useRef } from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import AttemptPresenter from '@/components/attempts/AttemptPresenter';
import Container from '@/components/Container';
import ErrorComponent, { ErrorTypes } from '@/components/ErrorComponent';
import { LoadingIndicator } from '@/components/LoadingScreen';
import { useGetMyAttemptDetail, useSaveModuleAttempt, useSubmitAttempt } from '@/hooks/useAttempts';
import { AttemptStatus, ModuleType } from '@/types/types';
import type { AttemptAnswer, AttemptDetailItem } from '@milobedini/shared-types';

import { ThemedText } from '../ThemedText';
import { renderErrorToast, renderSuccessToast } from '../toast/toastOptions';

const PatientAttemptDetail = () => {
  const { id, assignmentId } = useLocalSearchParams();
  const router = useRouter();
  const {
    mutate: saveModuleAttempt,
    isPending: savePending,
    isSuccess: saveSuccess
  } = useSaveModuleAttempt(id as string);
  const { mutate: submitModuleAttempt } = useSubmitAttempt(id as string);

  const { data, isPending, isError } = useGetMyAttemptDetail(id as string);

  // TODO - get assignment id somehow.
  const attempt = data?.attempt;

  const answersMap = useRef<Map<string, AttemptAnswer>>(new Map());

  if (attempt && answersMap.current.size === 0) {
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

      saveModuleAttempt(
        { answers: currentAnswersArray() },
        {
          onError: (err) => {
            renderErrorToast(err);
          }
        }
      );
    },
    [currentAnswersArray, saveModuleAttempt]
  );

  const handleSubmit = useCallback(() => {
    // last save to be safe
    saveModuleAttempt(
      { answers: currentAnswersArray() },
      {
        onError: (err) => {
          renderErrorToast(err);
        },
        onSuccess: () => {
          submitModuleAttempt(assignmentId ? { assignmentId: assignmentId as string } : {}, {
            onError: (err) => renderErrorToast(err),
            onSuccess: () => {
              renderSuccessToast('Successfully completed module');
              router.back();
            }
          });
        }
      }
    );
  }, [currentAnswersArray, saveModuleAttempt, submitModuleAttempt, router, assignmentId]);

  const mode = useMemo(() => {
    if (attempt?.status === AttemptStatus.STARTED) return 'edit';
    return 'view';
  }, [attempt?.status]);

  if (isPending) return <LoadingIndicator marginBottom={0} />;
  if (isError) return <ErrorComponent errorType={ErrorTypes.GENERAL_ERROR} />;

  if (!attempt || !data) return <ErrorComponent errorType={ErrorTypes.NO_CONTENT} />;

  if (attempt.moduleType !== ModuleType.QUESTIONNAIRE)
    return (
      <Container>
        <ThemedText className="p-4">Not a questionnaire - handle differently.</ThemedText>
      </Container>
    );

  return (
    <Container>
      <AttemptPresenter
        attempt={attempt}
        mode={mode}
        onAnswer={handleAnswer}
        onSubmit={handleSubmit}
        isSaving={savePending}
        saved={saveSuccess}
      />
    </Container>
  );
};

export default PatientAttemptDetail;
