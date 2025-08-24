import type { AttemptDetail, AttemptDetailResponseItem, DiaryDetail } from '@milobedini/shared-types';

export function isQuestionnaireAttempt(
  a: AttemptDetailResponseItem
): a is AttemptDetailResponseItem & { detail: AttemptDetail } {
  return a.moduleType === 'questionnaire' && !!a.detail;
}

export function isDiaryAttempt(a: AttemptDetailResponseItem): a is AttemptDetailResponseItem & { diary: DiaryDetail } {
  return a.moduleType === 'activity_diary' && !!a.diary;
}
