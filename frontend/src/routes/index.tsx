import { lazy, Suspense } from 'react';
import { createBrowserRouter } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import ProtectedRoute from './ProtectedRoute';
import PublicRoute from './PublicRoute';
import BottomTabLayout from '@/components/layouts/BottomTabLayout';
import AuthLayout from '@/components/layouts/AuthLayout';
import { ROUTES } from '@/constants';

import RouteErrorElement from '@/components/common/RouteErrorElement';
import RootLayout from '@/components/layouts/RootLayout';

const LoginPage = lazy(() => import('@/pages/auth/LoginPage'));
const RegisterPage = lazy(() => import('@/pages/auth/RegisterPage'));
const LandingPage = lazy(() => import('@/pages/landing/LandingPage'));
const HomePage = lazy(() => import('@/pages/home/HomePage'));
const EntriesPage = lazy(() => import('@/pages/entries/EntriesPage'));
const DebtsLayout = lazy(() => import('@/pages/debts/DebtsLayout'));
const ReportsPage = lazy(() => import('@/pages/reports/ReportsPage'));
const SettingsPage = lazy(() => import('@/pages/settings/SettingsPage'));
const NotFoundPage = lazy(() => import('@/pages/NotFoundPage'));

function PageLoader() {
  const { t } = useTranslation();
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <p className="text-muted-foreground text-sm">{t('common.loading')}</p>
    </div>
  );
}

// Wrap each lazy element so Suspense boundaries stay per-page.
const withSuspense = (element: React.ReactNode) => (
  <Suspense fallback={<PageLoader />}>{element}</Suspense>
);

const router = createBrowserRouter([
  {
    element: <RootLayout />,
    errorElement: <RouteErrorElement />,
    children: [
      { path: ROUTES.LANDING, element: withSuspense(<LandingPage />) },
      {
        element: <PublicRoute />,
        children: [
          {
            element: <AuthLayout />,
            errorElement: <RouteErrorElement />,
            children: [
              { path: ROUTES.LOGIN, element: withSuspense(<LoginPage />) },
              { path: ROUTES.REGISTER, element: withSuspense(<RegisterPage />) },
            ],
          },
        ],
      },
      {
        element: <ProtectedRoute />,
        children: [
          {
            element: <BottomTabLayout />,
            errorElement: <RouteErrorElement />,
            children: [
              { path: ROUTES.HOME, element: withSuspense(<HomePage />) },
              { path: ROUTES.ENTRIES, element: withSuspense(<EntriesPage />) },
              { path: ROUTES.DEBTS, element: withSuspense(<DebtsLayout />) },
              {
                path: ROUTES.DEBT_CUSTOMER_DETAIL,
                element: withSuspense(<DebtsLayout />),
              },
              { path: ROUTES.REPORTS, element: withSuspense(<ReportsPage />) },
              { path: ROUTES.SETTINGS, element: withSuspense(<SettingsPage />) },
              { path: '*', element: withSuspense(<NotFoundPage insideLayout={true} />) },
            ],
          },
        ],
      },
      { path: '*', element: withSuspense(<NotFoundPage insideLayout={false} />) },
    ],
  },
]);

export default router;
