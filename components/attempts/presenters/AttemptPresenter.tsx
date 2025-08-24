import { isQuestionnaireAttempt } from '@/utils/types';
import type { AttemptAnswer, AttemptDetailResponseItem, DiaryEntryInput } from '@milobedini/shared-types';

import ActivityDiaryPresenter from './diary/ActivityDiaryPresenter';
import QuestionnairePresenter from './questionnaires/QuestionnairePresenter';

type BaseProps = {
  attempt: AttemptDetailResponseItem;
  mode: 'view' | 'edit';
  isSaving?: boolean;
  saved?: boolean;
  patientName?: string;

  // network actions provided by the screen:
  submitAttempt?(args?: { assignmentId?: string }): Promise<void>;
};

type QuestionnaireProps = BaseProps & {
  saveAnswers?(answers: AttemptAnswer[]): Promise<void>;
};

type DiaryProps = BaseProps & {
  saveDiary?(entries: DiaryEntryInput[], merge?: boolean): Promise<void>;
};

export type AttemptPresenterProps = QuestionnaireProps & DiaryProps;

export default function AttemptPresenter(props: AttemptPresenterProps) {
  const { attempt } = props;

  if (attempt.moduleType === 'questionnaire' && isQuestionnaireAttempt(attempt)) {
    return <QuestionnairePresenter {...props} />;
  }

  if (attempt.moduleType === 'activity_diary') {
    return <ActivityDiaryPresenter {...props} />;
  }

  // TODO: add presenters for 'psychoeducation' and 'exercise'
  return null;
}
