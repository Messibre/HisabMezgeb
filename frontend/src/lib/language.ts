export const SUPPORTED_LANGUAGES = ['am', 'ti', 'en'] as const;
export type AppLanguage = (typeof SUPPORTED_LANGUAGES)[number];

export const DEFAULT_LANGUAGE: AppLanguage = 'am';
export const LANGUAGE_STORAGE_KEY = 'hisabMezgebLanguage';

const isSupported = (value: unknown): value is AppLanguage =>
  typeof value === 'string' && (SUPPORTED_LANGUAGES as readonly string[]).includes(value);

/**
 * Language choice, in this order:
 * 1. what this device saved before (kept across logout),
 * 2. the device language when it is Tigrigna or Amharic,
 * 3. Amharic — also on an English phone.
 *
 * index.html repeats these rules in an inline script to set <html lang> before
 * first paint; keep the two in sync.
 */
export function resolveInitialLanguage(
  stored: string | null | undefined,
  deviceLanguages: readonly string[] = [],
): AppLanguage {
  if (isSupported(stored)) return stored;
  for (const lang of deviceLanguages) {
    const base = lang.toLowerCase().split('-')[0];
    if (base === 'ti' || base === 'am') return base;
  }
  return DEFAULT_LANGUAGE;
}

export function readStoredLanguage(): string | null {
  try {
    return localStorage.getItem(LANGUAGE_STORAGE_KEY);
  } catch {
    return null;
  }
}

export function storeLanguage(lang: string) {
  if (!isSupported(lang)) return;
  try {
    localStorage.setItem(LANGUAGE_STORAGE_KEY, lang);
  } catch {
    // Storage unavailable (private mode): the choice lasts for this visit only.
  }
}
