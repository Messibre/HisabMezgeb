import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';

/**
 * Keeps <html lang="..."> in sync with the active i18n language.
 * This matters for two things: (1) screen readers announcing the page in
 * the right language, and (2) the Ge'ez-script font fallback rule in
 * globals.css, which targets html[lang="am"] / html[lang="ti"].
 */
export function useSyncHtmlLang() {
  const { i18n } = useTranslation();

  useEffect(() => {
    document.documentElement.lang = i18n.language;

    const handleLanguageChanged = (lng: string) => {
      document.documentElement.lang = lng;
    };

    i18n.on('languageChanged', handleLanguageChanged);
    return () => {
      i18n.off('languageChanged', handleLanguageChanged);
    };
  }, [i18n]);
}
