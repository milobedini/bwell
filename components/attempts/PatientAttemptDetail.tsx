import { useCallback, useMemo } from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import AttemptPresenter from '@/components/attempts/presenters/AttemptPresenter';
import Container from '@/components/Container';
import ErrorComponent, { ErrorTypes } from '@/components/ErrorComponent';
import { LoadingIndicator } from '@/components/LoadingScreen';
import { renderErrorToast, renderSuccessToast } from '@/components/toast/toastOptions';
import { useGetMyAttemptDetail, useSaveModuleAttempt, useSubmitAttempt } from '@/hooks/useAttempts';
import { AttemptStatus } from '@/types/types'; // if your enum doesn't include diary yet, keep using string checks in presenter
import type { AttemptAnswer, DiaryEntryInput } from '@milobedini/shared-types';

const PatientAttemptDetail = () => {
  const { id, assignmentId } = useLocalSearchParams<{ id: string; assignmentId?: string }>();
  const router = useRouter();

  const { data, isPending, isError } = useGetMyAttemptDetail(id as string);
  const attempt = data?.attempt;

  const { mutateAsync: saveAttempt, isPending: isSaving, isSuccess: saved } = useSaveModuleAttempt(id as string);
  const { mutateAsync: submitAttempt } = useSubmitAttempt(id as string);

  const saveAnswers = useCallback(
    async (answers: AttemptAnswer[]) => {
      try {
        await saveAttempt({ answers });
      } catch (err) {
        renderErrorToast(err);
        throw err;
      }
    },
    [saveAttempt]
  );

  const saveDiary = useCallback(
    async (entries: DiaryEntryInput[], merge?: boolean) => {
      try {
        await saveAttempt({ diaryEntries: entries, merge });
      } catch (err) {
        renderErrorToast(err);
        throw err;
      }
    },
    [saveAttempt]
  );

  const submit = useCallback(
    async (args?: { assignmentId?: string }) => {
      try {
        await submitAttempt(args ?? (assignmentId ? { assignmentId: String(assignmentId) } : {}));
        renderSuccessToast('Successfully completed module');
        router.back();
      } catch (err) {
        renderErrorToast(err);
        throw err;
      }
    },
    [submitAttempt, assignmentId, router]
  );

  const mode = useMemo<'view' | 'edit'>(() => {
    if (attempt?.status === AttemptStatus.STARTED) return 'edit';
    return 'view';
  }, [attempt?.status]);

  if (isPending) return <LoadingIndicator marginBottom={0} />;
  if (isError) return <ErrorComponent errorType={ErrorTypes.GENERAL_ERROR} />;
  if (!attempt || !data) return <ErrorComponent errorType={ErrorTypes.NO_CONTENT} />;

  return (
    <Container>
      <AttemptPresenter
        attempt={attempt}
        mode={mode}
        // Questionnaire path:
        saveAnswers={saveAnswers}
        // Diary path:
        saveDiary={saveDiary}
        // Common:
        submitAttempt={submit}
        isSaving={isSaving}
        saved={saved}
      />
    </Container>
  );
};

export default PatientAttemptDetail;
