import { useRouter } from 'expo-router';
import Container from '@/components/Container';
import EmptyState from '@/components/ui/EmptyState';
import { isDiaryAttempt, isQuestionnaireAttempt } from '@/utils/types';
import { AttemptDetailResponseItem } from '@milobedini/shared-types';

import ActivityDiaryPresenter from './diary/ActivityDiaryPresenter';
import QuestionnairePresenter from './questionnaires/QuestionnairePresenter';

export type AttemptPresenterProps = {
  attempt: AttemptDetailResponseItem;
  mode: 'view' | 'edit';
  patientName?: string;
};

const AttemptPresenter = ({ attempt, mode, patientName }: AttemptPresenterProps) => {
  const router = useRouter();

  if (attempt.moduleType === 'questionnaire' && isQuestionnaireAttempt(attempt) && attempt.detail) {
    return <QuestionnairePresenter attempt={attempt} mode={mode} patientName={patientName} detail={attempt.detail} />;
  }

  if (attempt.moduleType === 'activity_diary' && isDiaryAttempt(attempt)) {
    return <ActivityDiaryPresenter attempt={attempt} mode={mode} patientName={patientName} />;
  }

  // TODO: add presenters for 'psychoeducation' and 'exercise'
  return (
    <Container>
      <EmptyState
        icon="puzzle-outline"
        title="Not available yet"
        action={{ label: 'Go back', onPress: () => router.back() }}
      />
    </Container>
  );
};

export default AttemptPresenter;
