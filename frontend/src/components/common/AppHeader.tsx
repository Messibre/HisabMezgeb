import React, { useEffect, useState } from 'react';
import { ArrowLeft } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export interface AppHeaderProps {
  title?: string;
  headingTag?: 'h1' | 'h2' | 'span';
  onBack?: () => void;
  rightAction?: React.ReactNode;
  className?: string;
}

export default function AppHeader({
  title,
  headingTag = 'h1',
  onBack,
  rightAction,
  className = '',
}: AppHeaderProps) {
  const { t } = useTranslation();
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 4);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const TitleTag = headingTag;

  return (
    <header
      className={`sticky top-0 z-40 flex h-[var(--header-height,64px)] w-full items-center justify-between bg-background/95 px-3 backdrop-blur supports-[backdrop-filter]:bg-background/80 transition-[border-color,box-shadow] duration-150 ${
        isScrolled
          ? 'border-b border-border shadow-xs'
          : 'border-b border-transparent shadow-none'
      } ${className}`}
    >
      <div className="flex min-w-[48px] items-center justify-start">
        {onBack && (
          <button
            type="button"
            onClick={onBack}
            aria-label={t('common.back', 'Back')}
            className="flex h-12 w-12 items-center justify-center rounded-full text-foreground transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <ArrowLeft className="h-6 w-6" aria-hidden="true" />
          </button>
        )}
      </div>

      <div className="flex flex-1 items-center justify-center text-center">
        {title ? (
          <TitleTag className="text-lg font-bold text-foreground truncate">{title}</TitleTag>
        ) : (
          <span className="text-xl font-bold tracking-tight text-primary">
            Hisab Mezgeb
          </span>
        )}
      </div>

      <div className="flex min-w-[48px] items-center justify-end">
        {rightAction || null}
      </div>
    </header>
  );
}
