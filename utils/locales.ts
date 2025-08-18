// src/i18n/datesLocale.ts
import { de, en, enGB, es, fr, it, nl, pt, registerTranslation, zh } from 'react-native-paper-dates';
import * as Localization from 'expo-localization';

/** Fallback when no matching translation is registered */
export const DATE_LOCALE_FALLBACK = 'en-GB';

/** Type of the translation object expected by `registerTranslation` */
type DatesTranslation = Parameters<typeof registerTranslation>[1];

/**
 * Register all supported translations once at app start.
 * Returns a Set of available locale keys for quick membership checks.
 */
export function registerDatesTranslations(): ReadonlySet<string> {
  const entries: Record<string, DatesTranslation> = {
    // base languages
    en,
    fr,
    de,
    es,
    it,
    nl,
    pt,
    zh, // generic Chinese fallback

    // common region tags
    'en-GB': enGB,
    'en-US': en,
    'pt-BR': pt,
    'zh-CN': zh
  };

  for (const [key, translation] of Object.entries(entries)) {
    registerTranslation(key, translation);
  }

  // Return as ReadonlySet to signal immutability to callers
  return new Set(Object.keys(entries));
}

/**
 * Pick the best locale key for the current device from the registered set.
 */
export function getDeviceDatesLocaleKey(available: ReadonlySet<string>): string {
  // Example outputs: "en-GB", "en-US", "fr-FR"
  const tag = (Localization.getLocales?.()[0]?.languageTag ?? DATE_LOCALE_FALLBACK).replace('_', '-');
  const base = tag.split('-')[0];

  if (available.has(tag)) return tag;
  if (available.has(base)) return base;
  return DATE_LOCALE_FALLBACK;
}
