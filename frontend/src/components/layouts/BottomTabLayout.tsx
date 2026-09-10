import { NavLink, Outlet } from 'react-router-dom';
import { Home, ClipboardList, Wallet, BarChart3, Settings } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { ROUTES } from '@/constants';

const TABS = [
  { to: ROUTES.HOME, icon: Home, labelKey: 'nav.home' },
  { to: ROUTES.ENTRIES, icon: ClipboardList, labelKey: 'nav.entries' },
  { to: ROUTES.DEBTS, icon: Wallet, labelKey: 'nav.debts' },
  { to: ROUTES.REPORTS, icon: BarChart3, labelKey: 'nav.reports' },
  { to: ROUTES.SETTINGS, icon: Settings, labelKey: 'nav.settings' },
] as const;

export default function BottomTabLayout() {
  const { t } = useTranslation();

  return (
    <div className="relative mx-auto flex min-h-screen w-full max-w-[600px] flex-col bg-background">
      <main className="flex-1 pb-24">
        <Outlet />
      </main>

      <nav className="fixed bottom-0 left-1/2 z-50 flex h-[76px] w-full max-w-[600px] -translate-x-1/2 items-center justify-around rounded-t-lg bg-surface-container-lowest px-4 shadow-[0_-4px_20px_rgba(0,0,0,0.05)]">
        {TABS.map(({ to, icon: Icon, labelKey }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `flex min-h-[48px] min-w-[64px] flex-col items-center justify-center gap-1 rounded-xl px-3 py-2 transition-all duration-200 ${
                isActive
                  ? 'bg-secondary-container text-on-secondary-container'
                  : 'text-outline hover:bg-surface-container-low'
              }`
            }
          >
            <Icon className="h-6 w-6" />
            <span className="text-[12px] font-semibold leading-tight">{t(labelKey)}</span>
          </NavLink>
        ))}
      </nav>
    </div>
  );
}
