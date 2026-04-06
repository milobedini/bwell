import type { AttemptDetailResponseItem } from '@milobedini/shared-types';

import { isDiaryAttempt, isQuestionnaireAttempt, isReadingAttempt } from './types';

const baseAttempt = {
  _id: '1',
  module: 'm1',
  patient: 'p1',
  status: 'submitted'
} as unknown as AttemptDetailResponseItem;

describe('isQuestionnaireAttempt', () => {
  it('returns true for questionnaire with detail', () => {
    const a = {
      ...baseAttempt,
      moduleType: 'questionnaire',
      detail: { score: 10 }
    } as unknown as AttemptDetailResponseItem;
    expect(isQuestionnaireAttempt(a)).toBe(true);
  });

  it('returns false for questionnaire without detail', () => {
    const a = { ...baseAttempt, moduleType: 'questionnaire', detail: null } as unknown as AttemptDetailResponseItem;
    expect(isQuestionnaireAttempt(a)).toBe(false);
  });

  it('returns false for non-questionnaire type', () => {
    const a = { ...baseAttempt, moduleType: 'reading', detail: { score: 10 } } as unknown as AttemptDetailResponseItem;
    expect(isQuestionnaireAttempt(a)).toBe(false);
  });
});

describe('isDiaryAttempt', () => {
  it('returns true for activity_diary with diary', () => {
    const a = {
      ...baseAttempt,
      moduleType: 'activity_diary',
      diary: { slots: [] }
    } as unknown as AttemptDetailResponseItem;
    expect(isDiaryAttempt(a)).toBe(true);
  });

  it('returns false for activity_diary without diary', () => {
    const a = { ...baseAttempt, moduleType: 'activity_diary', diary: null } as unknown as AttemptDetailResponseItem;
    expect(isDiaryAttempt(a)).toBe(false);
  });

  it('returns false for non-diary type', () => {
    const a = {
      ...baseAttempt,
      moduleType: 'questionnaire',
      diary: { slots: [] }
    } as unknown as AttemptDetailResponseItem;
    expect(isDiaryAttempt(a)).toBe(false);
  });
});

describe('isReadingAttempt', () => {
  it('returns true for reading with moduleSnapshot', () => {
    const a = {
      ...baseAttempt,
      moduleType: 'reading',
      moduleSnapshot: { title: 'Test' }
    } as unknown as AttemptDetailResponseItem;
    expect(isReadingAttempt(a)).toBe(true);
  });

  it('returns false for reading without moduleSnapshot', () => {
    const a = { ...baseAttempt, moduleType: 'reading', moduleSnapshot: null } as unknown as AttemptDetailResponseItem;
    expect(isReadingAttempt(a)).toBe(false);
  });

  it('returns false for non-reading type', () => {
    const a = {
      ...baseAttempt,
      moduleType: 'questionnaire',
      moduleSnapshot: { title: 'Test' }
    } as unknown as AttemptDetailResponseItem;
    expect(isReadingAttempt(a)).toBe(false);
  });
});
