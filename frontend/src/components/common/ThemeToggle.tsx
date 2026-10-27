import { Sun, Moon } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@/store/theme.store';

export interface ThemeToggleProps {
  className?: string;
}

export default function ThemeToggle({ className = '' }: ThemeToggleProps) {
  const { resolved, setMode } = useTheme();
  const { t } = useTranslation();

  const isDark = resolved === 'dark';

  const handleToggle = () => {
    // When toggling via header button, explicitly switch between light and dark
    setMode(isDark ? 'light' : 'dark');
  };

  return (
    <button
      type="button"
      onClick={handleToggle}
      aria-label={t('settings.toggleTheme', 'Toggle theme')}
      aria-pressed={isDark}
      className={`flex h-10 w-10 items-center justify-center rounded-full text-foreground hover:bg-muted focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring transition-colors ${className}`}
    >
      {isDark ? (
        <Sun className="h-5 w-5 text-primary" aria-hidden="true" />
      ) : (
        <Moon className="h-5 w-5 text-foreground" aria-hidden="true" />
      )}
    </button>
  );
}
