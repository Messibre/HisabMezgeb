import { NavLink, Outlet } from 'react-router-dom';
import { Home, Receipt, Users, BarChart3, Settings } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { ROUTES } from '@/constants';

const TABS = [
  { to: ROUTES.HOME, icon: Home, labelKey: 'nav.home' },
  { to: ROUTES.ENTRIES, icon: Receipt, labelKey: 'nav.entries' },
  { to: ROUTES.DEBTS, icon: Users, labelKey: 'nav.debts' },
  { to: ROUTES.REPORTS, icon: BarChart3, labelKey: 'nav.reports' },
  { to: ROUTES.SETTINGS, icon: Settings, labelKey: 'nav.settings' },
] as const;

export default function BottomTabLayout() {
  const { t } = useTranslation();

  return (
    <div className="relative mx-auto flex min-h-screen w-full max-w-md flex-col bg-background">
      <main id="main" tabIndex={-1} className="flex-1 pb-[calc(76px+env(safe-area-inset-bottom,0px)+16px)] focus:outline-none">
        <Outlet />
      </main>

      <nav
        aria-label="Bottom Navigation"
        className="fixed bottom-0 left-1/2 z-50 flex h-[calc(76px+env(safe-area-inset-bottom,0px))] w-full max-w-md -translate-x-1/2 items-center justify-around border-t border-border bg-card/95 px-1.5 pb-[env(safe-area-inset-bottom,0px)] shadow-[0_-4px_20px_rgba(0,0,0,0.05)] backdrop-blur"
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
