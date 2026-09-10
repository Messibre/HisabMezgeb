import type { ReactNode } from 'react';
import { ArrowLeft, Menu } from 'lucide-react';

interface TopAppBarProps {
  title: string;
  showBack?: boolean;
  onBack?: () => void;
  showMenu?: boolean;
  onMenuClick?: () => void;
  rightAction?: ReactNode;
}

export default function TopAppBar({
  title,
  showBack = false,
  onBack,
  showMenu = false,
  onMenuClick,
  rightAction,
}: TopAppBarProps) {
  return (
    <header className="sticky top-0 z-40 w-full bg-background">
      <div className="mx-auto flex h-16 max-w-[600px] items-center justify-between px-6">
        <div className="flex w-12 items-center justify-start">
          {showBack && (
            <button
              type="button"
              onClick={onBack}
              aria-label="Go back"
              className="flex h-12 w-12 items-center justify-center rounded-full text-primary transition-transform hover:bg-surface-container-low active:scale-95"
            >
              <ArrowLeft className="h-6 w-6" />
            </button>
          )}
          {showMenu && !showBack && (
            <button
              type="button"
              onClick={onMenuClick}
              aria-label="Menu"
              className="flex h-12 w-12 items-center justify-center rounded-full text-primary transition-transform hover:bg-surface-container-low active:scale-95"
            >
              <Menu className="h-6 w-6" />
            </button>
          )}
        </div>
        <h1 className="text-[24px] font-bold leading-tight text-primary">{title}</h1>
        <div className="flex w-12 items-center justify-end">{rightAction}</div>
      </div>
    </header>
  );
}
