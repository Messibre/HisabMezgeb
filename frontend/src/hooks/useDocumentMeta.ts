import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';

export interface UseDocumentMetaOptions {
  titleKey?: string;
  descriptionKey?: string;
  noindex?: boolean;
  titleParams?: Record<string, unknown>;
  descriptionParams?: Record<string, unknown>;
  fallbackTitle?: string;
  fallbackDescription?: string;
}

const DEFAULT_TITLE = 'Hisab Mezgeb - Simple Money & Debt Tracker';
const APP_NAME = 'Hisab Mezgeb';

export function useDocumentMeta({
  titleKey,
  descriptionKey,
  noindex,
  titleParams,
  descriptionParams,
  fallbackTitle,
  fallbackDescription,
}: UseDocumentMetaOptions) {
  const { t, i18n } = useTranslation();
  const titleParamsKey = JSON.stringify(titleParams);
  const descriptionParamsKey = JSON.stringify(descriptionParams);

  useEffect(() => {
    // 1. Update document.title
    if (titleKey) {
      const translated = t(titleKey, titleParams);
      if (translated && translated !== titleKey) {
        document.title = translated.includes(APP_NAME) ? translated : `${translated} - ${APP_NAME}`;
      } else if (fallbackTitle) {
        document.title = fallbackTitle.includes(APP_NAME)
          ? fallbackTitle
          : `${fallbackTitle} - ${APP_NAME}`;
      } else {
        document.title = DEFAULT_TITLE;
      }
    } else if (fallbackTitle) {
      document.title = fallbackTitle.includes(APP_NAME)
        ? fallbackTitle
        : `${fallbackTitle} - ${APP_NAME}`;
    } else {
      document.title = DEFAULT_TITLE;
    }

    // 2. Update meta[name="description"] if descriptionKey or fallbackDescription is provided
    let previousDescription: string | null = null;
    let descriptionMeta = document.querySelector('meta[name="description"]');

    if (descriptionKey || fallbackDescription) {
      const translatedDesc = descriptionKey ? t(descriptionKey, descriptionParams) : undefined;
      const descContent =
        translatedDesc && translatedDesc !== descriptionKey ? translatedDesc : fallbackDescription;

      if (descContent) {
        if (!descriptionMeta) {
          descriptionMeta = document.createElement('meta');
          descriptionMeta.setAttribute('name', 'description');
          document.head.appendChild(descriptionMeta);
        } else {
          previousDescription = descriptionMeta.getAttribute('content');
        }
        descriptionMeta.setAttribute('content', descContent);
      }
    }

    // 3. Handle noindex for robots meta
    let robotsMeta = document.querySelector('meta[name="robots"]');
    const createdRobots = !robotsMeta;

    if (noindex) {
      if (!robotsMeta) {
        robotsMeta = document.createElement('meta');
        robotsMeta.setAttribute('name', 'robots');
        document.head.appendChild(robotsMeta);
      }
      robotsMeta.setAttribute('content', 'noindex, nofollow');
    } else if (robotsMeta && noindex === false) {
      robotsMeta.parentNode?.removeChild(robotsMeta);
      robotsMeta = null;
    }

    return () => {
      // Cleanup robots meta if created by this hook
      if (noindex && robotsMeta) {
        if (createdRobots) {
          robotsMeta.parentNode?.removeChild(robotsMeta);
        }
      }
      if (previousDescription !== null && descriptionMeta) {
        descriptionMeta.setAttribute('content', previousDescription);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    t,
    i18n.language,
    titleKey,
    descriptionKey,
    noindex,
    fallbackTitle,
    fallbackDescription,
    titleParamsKey,
    descriptionParamsKey,
  ]);
}
