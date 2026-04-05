import { useRouter } from 'expo-router';
import Container from '@/components/Container';
import EmptyState from '@/components/ui/EmptyState';
import { isDiaryAttempt, isFiveAreasAttempt, isQuestionnaireAttempt, isReadingAttempt } from '@/utils/types';
import type { AttemptDetailResponseItem } from '@milobedini/shared-types';

import ActivityDiaryPresenter from './diary/ActivityDiaryPresenter';
import FiveAreasPresenter from './five-areas/FiveAreasPresenter';
import QuestionnairePresenter from './questionnaires/QuestionnairePresenter';
import ReadingPresenter from './reading/ReadingPresenter';

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

  if (isReadingAttempt(attempt)) {
    return <ReadingPresenter attempt={attempt} mode={mode} patientName={patientName} />;
  }

  if (isFiveAreasAttempt(attempt)) {
    return <FiveAreasPresenter attempt={attempt} mode={mode} patientName={patientName} />;
  }

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
