import { NavLink, Outlet } from 'react-router-dom';
import { Home, Receipt, Users, BarChart3, Settings, Wallet } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { ROUTES } from '@/constants';
import { useCalendar } from '@/store/calendar.store';
import LanguageSwitcher from '@/components/common/LanguageSwitcher';
import ThemeToggle from '@/components/common/ThemeToggle';

const TABS = [
  { to: ROUTES.HOME, icon: Home, labelKey: 'nav.home' },
  { to: ROUTES.ENTRIES, icon: Receipt, labelKey: 'nav.entries' },
  { to: ROUTES.DEBTS, icon: Users, labelKey: 'nav.debts' },
  { to: ROUTES.REPORTS, icon: BarChart3, labelKey: 'nav.reports' },
  { to: ROUTES.SETTINGS, icon: Settings, labelKey: 'nav.settings' },
] as const;

/**
 * Phones and tablets: bottom tab bar. 1024px and up: a left sidebar with the same
 * five destinations instead. Only one navigation is visible at a time.
 */
export default function BottomTabLayout() {
  const { t } = useTranslation();
  // Re-mount the page when the calendar setting changes so every date re-renders.
  const calendar = useCalendar();

  return (
    <div className="relative mx-auto flex min-h-screen w-full max-w-md flex-col bg-background sm:max-w-none lg:flex-row">
      <aside
        aria-label={t('nav.sidebar', 'Main navigation')}
        className="sticky top-0 hidden h-dvh w-64 shrink-0 flex-col border-r border-border bg-card px-4 py-6 lg:flex"
      >
        <div className="mb-8 flex items-center gap-3 px-2">
          <span className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground" aria-hidden="true">
            <Wallet className="h-5 w-5" />
          </span>
          <span className="text-lg font-bold tracking-tight text-foreground">{t('brand.name')}</span>
        </div>

        <nav className="flex flex-col gap-1">
          {TABS.map(({ to, icon: Icon, labelKey }) => (
            <NavLink
              key={to}
              to={to}
              end={to === ROUTES.HOME}
              className={({ isActive }) =>
                `flex h-12 items-center gap-3 rounded-xl px-3 text-sm transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                  isActive
                    ? 'bg-secondary-container text-on-secondary-container font-semibold'
                    : 'text-on-surface-variant hover:bg-muted/60 hover:text-foreground'
                }`
              }
            >
              <Icon className="h-5 w-5 shrink-0" aria-hidden="true" />
              <span>{t(labelKey)}</span>
            </NavLink>
          ))}
        </nav>

        <div className="mt-auto flex flex-col gap-3 px-2">
          <LanguageSwitcher />
          <ThemeToggle />
        </div>
      </aside>

      <main
        id="main"
        tabIndex={-1}
        className="flex-1 min-w-0 pb-[calc(76px+env(safe-area-inset-bottom,0px)+16px)] focus:outline-none lg:pb-10"
      >
        <Outlet key={calendar} />
      </main>

      <nav
        aria-label="Bottom Navigation"
        className="fixed bottom-0 left-1/2 z-50 flex h-[calc(76px+env(safe-area-inset-bottom,0px))] w-full max-w-md -translate-x-1/2 items-center justify-around border-t border-border bg-card/95 px-1.5 pb-[env(safe-area-inset-bottom,0px)] shadow-[0_-4px_20px_rgba(0,0,0,0.05)] backdrop-blur sm:max-w-2xl lg:hidden"
      >
        {TABS.map(({ to, icon: Icon, labelKey }) => (
          <NavLink
            key={to}
            to={to}
            end={to === ROUTES.HOME}
            className={({ isActive }) =>
              `flex flex-1 min-w-0 min-h-[48px] flex-col items-center justify-center gap-1 rounded-xl px-0.5 py-1.5 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                isActive
                  ? 'bg-secondary-container text-on-secondary-container font-semibold'
                  : 'text-outline hover:text-foreground hover:bg-muted/50'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <Icon className="h-5 w-5 shrink-0" aria-hidden="true" />
                <span
                  className={`w-full truncate text-center text-[10px] sm:text-[11px] leading-tight ${
                    isActive ? 'font-semibold' : 'font-normal'
                  }`}
                >
                  {t(labelKey)}
                </span>
              </>
            )}
          </NavLink>
        ))}
      </nav>
    </div>
  );
}
