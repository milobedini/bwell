import type { AttemptDetail, AttemptDetailResponseItem, DiaryDetail, FiveAreasData } from '@milobedini/shared-types';

export function isQuestionnaireAttempt(
  a: AttemptDetailResponseItem
): a is AttemptDetailResponseItem & { detail: AttemptDetail } {
  return a.moduleType === 'questionnaire' && !!a.detail;
}

export function isDiaryAttempt(a: AttemptDetailResponseItem): a is AttemptDetailResponseItem & { diary: DiaryDetail } {
  return a.moduleType === 'activity_diary' && !!a.diary;
}

export function isReadingAttempt(a: AttemptDetailResponseItem): a is AttemptDetailResponseItem & {
  moduleType: 'reading';
  moduleSnapshot: NonNullable<AttemptDetailResponseItem['moduleSnapshot']>;
} {
  return a.moduleType === 'reading' && !!a.moduleSnapshot;
}

export function isFiveAreasAttempt(
  a: AttemptDetailResponseItem
): a is AttemptDetailResponseItem & { fiveAreas?: FiveAreasData } {
  return a.moduleType === 'five_areas_model';
}
