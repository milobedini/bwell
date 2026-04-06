import { getModuleIcon } from './moduleIcons';

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
});
