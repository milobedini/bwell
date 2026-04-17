import type {
  AttemptDetail,
  AttemptDetailResponseItem,
  DiaryDetail,
  GeneralGoalsData,
  WeeklyGoalsData
} from '@milobedini/shared-types';

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

export function isGeneralGoalsAttempt(
  a: AttemptDetailResponseItem
): a is AttemptDetailResponseItem & { generalGoals: GeneralGoalsData } {
  return a.moduleType === 'general_goals' && !!a.generalGoals;
}

export function isWeeklyGoalsAttempt(
  a: AttemptDetailResponseItem
): a is AttemptDetailResponseItem & { weeklyGoals: WeeklyGoalsData } {
  return a.moduleType === 'weekly_goals' && !!a.weeklyGoals;
}
