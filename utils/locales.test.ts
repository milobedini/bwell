import * as Localization from 'expo-localization';

import { DATE_LOCALE_FALLBACK, getDeviceDatesLocaleKey, registerDatesTranslations } from './locales';

jest.mock('react-native-paper-dates', () => {
  const stub = { save: 'Save', close: 'Close' };
  return {
    en: stub,
    enGB: stub,
    fr: stub,
    de: stub,
    es: stub,
    it: stub,
    nl: stub,
    pt: stub,
    zh: stub,
    registerTranslation: jest.fn()
  };
});

jest.mock('expo-localization', () => ({
  getLocales: jest.fn()
}));

const { registerTranslation } = require('react-native-paper-dates');

describe('registerDatesTranslations', () => {
  it('returns a set of registered locale keys', () => {
    const available = registerDatesTranslations();
    expect(available).toBeInstanceOf(Set);
    expect(available.has('en')).toBe(true);
    expect(available.has('en-GB')).toBe(true);
    expect(available.has('fr')).toBe(true);
    expect(available.has('zh-CN')).toBe(true);
  });

  it('calls registerTranslation for each entry', () => {
    registerTranslation.mockClear();

    const available = registerDatesTranslations();
    expect(registerTranslation).toHaveBeenCalledTimes(available.size);
  });
});

describe('getDeviceDatesLocaleKey', () => {
  const available = new Set(['en', 'en-GB', 'en-US', 'fr', 'de', 'es', 'pt', 'pt-BR', 'zh', 'zh-CN']);

  it('returns exact tag when available', () => {
    (Localization.getLocales as jest.Mock).mockReturnValue([{ languageTag: 'en-GB' }]);
    expect(getDeviceDatesLocaleKey(available)).toBe('en-GB');
  });

  it('falls back to base language when exact tag is not available', () => {
    (Localization.getLocales as jest.Mock).mockReturnValue([{ languageTag: 'fr-FR' }]);
    expect(getDeviceDatesLocaleKey(available)).toBe('fr');
  });

  it('returns fallback when neither tag nor base is available', () => {
    (Localization.getLocales as jest.Mock).mockReturnValue([{ languageTag: 'ja-JP' }]);
    expect(getDeviceDatesLocaleKey(available)).toBe(DATE_LOCALE_FALLBACK);
  });

  it('returns fallback when getLocales returns empty', () => {
    (Localization.getLocales as jest.Mock).mockReturnValue([]);
    expect(getDeviceDatesLocaleKey(available)).toBe(DATE_LOCALE_FALLBACK);
  });

  it('normalises underscore locale tags to hyphens', () => {
    (Localization.getLocales as jest.Mock).mockReturnValue([{ languageTag: 'pt_BR' }]);
    expect(getDeviceDatesLocaleKey(available)).toBe('pt-BR');
  });
});
