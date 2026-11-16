import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import en from '@/locales/en.json';
import am from '@/locales/am.json';
import ti from '@/locales/ti.json';
import {
  SUPPORTED_LANGUAGES,
  readStoredLanguage,
  resolveInitialLanguage,
  storeLanguage,
} from '@/lib/language';

/**
 * English, Amharic, Tigrigna. Amharic is the default (see resolveInitialLanguage).
 * Resources are bundled so switching language needs no network request.
 * English stays the fallback for a missing KEY so the screen is never blank;
 * the key-parity test fails when a key is missing in am or ti.
 */
const deviceLanguages =
  typeof navigator !== 'undefined' ? (navigator.languages ?? [navigator.language]) : [];

i18n.use(initReactI18next).init({
  resources: {
    en: { translation: en },
    am: { translation: am },
    ti: { translation: ti },
  },
  lng: resolveInitialLanguage(readStoredLanguage(), deviceLanguages),
  fallbackLng: 'en',
  supportedLngs: [...SUPPORTED_LANGUAGES],
  interpolation: {
    escapeValue: false, // React already escapes output
  },
  saveMissing: import.meta.env.DEV,
  missingKeyHandler: (lngs, _ns, key) => {
    if (import.meta.env.DEV) console.warn(`[i18n] missing key "${key}" for ${lngs.join(', ')}`);
  },
});

/** Switches language on an explicit user choice and remembers it on this device (kept after logout). */
export function setAppLanguage(lang: string) {
  storeLanguage(lang);
  return i18n.changeLanguage(lang);
}

export default i18n;
