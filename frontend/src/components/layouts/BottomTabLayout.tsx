import { NavLink, Outlet } from 'react-router-dom';
import { Home, ListPlus, Users, BarChart3, Settings } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { ROUTES } from '@/constants';
import { cn } from '@/lib/utils';

/**
 * The main mobile-first shell: a fixed bottom tab bar with 5 tabs, replacing
 * the template's original top-header DashboardLayout entirely (see section
 * 6.0 — no side menu, no hamburger, everything reachable from this bar).
 */
export default function BottomTabLayout() {
  const { t } = useTranslation();

  const TABS = [
    { to: ROUTES.HOME, label: t('nav.home'), icon: Home },
    { to: ROUTES.ENTRIES, label: t('nav.entries'), icon: ListPlus },
    { to: ROUTES.DEBTS, label: t('nav.debts'), icon: Users },
    { to: ROUTES.REPORTS, label: t('nav.reports'), icon: BarChart3 },
    { to: ROUTES.SETTINGS, label: t('nav.settings'), icon: Settings },
  ] as const;

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <main className="flex-1 overflow-y-auto pb-20">
        <Outlet />
      </main>

      <nav className="fixed bottom-0 left-0 right-0 border-t border-border bg-background">
        <ul className="flex justify-around items-stretch">
          {TABS.map(({ to, label, icon: Icon }) => (
            <li key={to} className="flex-1">
              <NavLink
                to={to}
                end={to === ROUTES.HOME}
                className={({ isActive }) =>
                  cn(
                    'flex flex-col items-center justify-center gap-1 py-2 min-h-[56px] text-xs',
                    isActive ? 'text-primary font-medium' : 'text-muted-foreground'
                  )
                }
              >
                <Icon className="h-6 w-6" />
                <span>{label}</span>
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>
    </div>
  );
}
