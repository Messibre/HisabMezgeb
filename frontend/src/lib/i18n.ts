import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import en from '@/locales/en.json';
import am from '@/locales/am.json';
import ti from '@/locales/ti.json';

/**
 * i18n setup for Hisab Mezgeb — English, Amharic, Tigrigna.
 *
 * Resources are bundled directly (not lazy-fetched) since the app is small
 * and this avoids a network request just to switch language, which matters
 * for the offline-first goals in section 6.6.
 *
 * Language detection/persistence: for now this uses i18next's own
 * localStorage caching (see `detection.caches` below) since the backend's
 * AppSettings.language field and /settings endpoint don't exist yet ([4.
 * Database & ER Diagram] / [5. API Specification] section 5.2). Once those
 * are built, replace the localStorage-based persistence with a real
 * useSettings()/useUpdateSettings() call on login and on language change,
 * per section 6.7 — the localStorage fallback can stay as a pre-login
 * default (e.g. for the Login/Register screens themselves).
 */
i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      en: { translation: en },
      am: { translation: am },
      ti: { translation: ti },
    },
    fallbackLng: 'en',
    supportedLngs: ['en', 'am', 'ti'],
    detection: {
      order: ['localStorage', 'navigator'],
      caches: ['localStorage'],
      lookupLocalStorage: 'hisabMezgebLanguage',
    },
    interpolation: {
      escapeValue: false, // React already escapes output
    },
  });

export default i18n;
