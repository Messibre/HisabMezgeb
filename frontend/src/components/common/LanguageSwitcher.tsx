import React, { useRef } from 'react';
import { useTranslation } from 'react-i18next';

const LANGUAGES = [
  { code: 'en', nativeLabel: 'English', label: 'English' },
  { code: 'am', nativeLabel: 'አማርኛ', label: 'Amharic' },
  { code: 'ti', nativeLabel: 'ትግርኛ', label: 'Tigrigna' },
] as const;

export interface LanguageSwitcherProps {
  className?: string;
}

export default function LanguageSwitcher({ className = '' }: LanguageSwitcherProps) {
  const { i18n, t } = useTranslation();
  const currentLang = i18n.language?.startsWith('am')
    ? 'am'
    : i18n.language?.startsWith('ti')
      ? 'ti'
      : 'en';
  const groupRef = useRef<HTMLDivElement>(null);

  const handleSelect = (code: string) => {
    i18n.changeLanguage(code);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLButtonElement>, currentIndex: number) => {
    let nextIndex = -1;
    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
      nextIndex = (currentIndex + 1) % LANGUAGES.length;
    } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
      nextIndex = (currentIndex - 1 + LANGUAGES.length) % LANGUAGES.length;
    }

    if (nextIndex !== -1) {
      e.preventDefault();
      const nextLang = LANGUAGES[nextIndex];
      handleSelect(nextLang.code);
      const buttons = groupRef.current?.querySelectorAll<HTMLButtonElement>('[role="radio"]');
      buttons?.[nextIndex]?.focus();
    }
  };

  return (
    <div
      ref={groupRef}
      role="radiogroup"
      aria-label={t('landing.header.language', 'Language')}
      className={`inline-flex items-center rounded-lg bg-surface-container-high/60 p-0.5 border border-border/50 text-xs font-medium ${className}`}
    >
      {LANGUAGES.map((lang, index) => {
        const isSelected = currentLang === lang.code;
        return (
          <button
            key={lang.code}
            type="button"
            role="radio"
            aria-checked={isSelected}
            tabIndex={isSelected ? 0 : -1}
            onClick={() => handleSelect(lang.code)}
            onKeyDown={(e) => handleKeyDown(e, index)}
            className={`min-h-[44px] min-w-[44px] px-2 py-1.5 rounded-md transition-all text-xs font-medium focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-primary flex items-center justify-center ${
              isSelected
                ? 'bg-primary text-primary-foreground shadow-xs font-semibold'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted/40'
            }`}
          >
            {lang.nativeLabel}
          </button>
        );
      })}
    </div>
  );
}
