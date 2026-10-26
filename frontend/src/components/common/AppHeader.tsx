import React from 'react';
import { ArrowLeft } from 'lucide-react';

export interface AppHeaderProps {
  title?: string;
  onBack?: () => void;
  rightAction?: React.ReactNode;
  className?: string;
}

export default function AppHeader({
  title,
  onBack,
  rightAction,
  className = '',
}: AppHeaderProps) {
  return (
    <header
      className={`sticky top-0 z-40 flex h-[var(--header-height,64px)] w-full items-center justify-between border-b border-border/40 bg-background/95 px-3 backdrop-blur supports-[backdrop-filter]:bg-background/60 ${className}`}
    >
      <div className="flex min-w-[48px] items-center justify-start">
        {onBack && (
          <button
            type="button"
            onClick={onBack}
            aria-label="Back"
            className="flex h-12 w-12 items-center justify-center rounded-full text-foreground transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <ArrowLeft className="h-6 w-6" />
          </button>
        )}
      </div>

      <div className="flex flex-1 items-center justify-center text-center">
        {title ? (
          <h1 className="text-lg font-bold text-foreground truncate">{title}</h1>
        ) : (
          <h1 className="text-xl font-bold tracking-tight text-primary">
            Hisab Mezgeb
          </h1>
        )}
      </div>

      <div className="flex min-w-[48px] items-center justify-end">
        {rightAction || null}
      </div>
    </header>
  );
}
