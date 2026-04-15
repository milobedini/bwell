import { getModuleDisplayTitle, getModuleIcon } from './moduleIcons';

describe('getModuleIcon', () => {
  it('returns clipboard icon for questionnaire', () => {
    expect(getModuleIcon('questionnaire')).toBe('clipboard-text-outline');
  });

  it('returns calendar icon for activity_diary', () => {
    expect(getModuleIcon('activity_diary')).toBe('calendar-week');
  });

  it('returns book icon for reading', () => {
    expect(getModuleIcon('reading')).toBe('book-open-outline');
  });

  it('returns brain icon for five_areas_model', () => {
    expect(getModuleIcon('five_areas_model')).toBe('brain');
  });

  it('returns fallback icon for unknown module type', () => {
    expect(getModuleIcon('unknown')).toBe('file-document-outline');
  });

  it('returns fallback icon for undefined', () => {
    expect(getModuleIcon(undefined)).toBe('file-document-outline');
  });

  it('returns fallback icon for empty string', () => {
    expect(getModuleIcon('')).toBe('file-document-outline');
  });

  it('returns bullseye-arrow icon for general_goals', () => {
    expect(getModuleIcon('general_goals')).toBe('bullseye-arrow');
  });
});

describe('getModuleDisplayTitle', () => {
  it('returns original title for non-general_goals module', () => {
    expect(getModuleDisplayTitle('PHQ-9', 'questionnaire', 3)).toBe('PHQ-9');
  });

  it('returns original title for general_goals with iteration 1', () => {
    expect(getModuleDisplayTitle('General Goals', 'general_goals', 1)).toBe('General Goals');
  });

  it('returns original title for general_goals with undefined iteration', () => {
    expect(getModuleDisplayTitle('General Goals', 'general_goals', undefined)).toBe('General Goals');
  });

  it('appends (Check-in) for general_goals with iteration > 1', () => {
    expect(getModuleDisplayTitle('General Goals', 'general_goals', 2)).toBe('General Goals (Check-in)');
  });

  it('appends (Check-in) for general_goals with iteration 5', () => {
    expect(getModuleDisplayTitle('General Goals', 'general_goals', 5)).toBe('General Goals (Check-in)');
  });
});
