import { lazy, Suspense } from 'react';
import { createBrowserRouter } from 'react-router-dom';
import ProtectedRoute from './ProtectedRoute';
import PublicRoute from './PublicRoute';
import BottomTabLayout from '@/components/layouts/BottomTabLayout';
import AuthLayout from '@/components/layouts/AuthLayout';
import { ROUTES } from '@/constants';

const LoginPage = lazy(() => import('@/pages/auth/LoginPage'));
const RegisterPage = lazy(() => import('@/pages/auth/RegisterPage'));
const HomePage = lazy(() => import('@/pages/home/HomePage'));
const EntriesPage = lazy(() => import('@/pages/entries/EntriesPage'));
const DebtsListPage = lazy(() => import('@/pages/debts/DebtsListPage'));
const DebtCustomerDetailPage = lazy(() => import('@/pages/debts/DebtCustomerDetailPage'));
const ReportsPage = lazy(() => import('@/pages/reports/ReportsPage'));
const SettingsPage = lazy(() => import('@/pages/settings/SettingsPage'));
const NotFoundPage = lazy(() => import('@/pages/NotFoundPage'));

function PageLoader() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <p className="text-muted-foreground text-sm">Loading...</p>
    </div>
  );
}

// Wrap each lazy element so Suspense boundaries stay per-page,
// matching the granularity your original Suspense had.
const withSuspense = (element: React.ReactNode) => (
  <Suspense fallback={<PageLoader />}>{element}</Suspense>
);

const router = createBrowserRouter([
  {
    element: <PublicRoute />,
    children: [
      {
        element: <AuthLayout />,
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
        children: [
          { path: ROUTES.HOME, element: withSuspense(<HomePage />) },
          { path: ROUTES.ENTRIES, element: withSuspense(<EntriesPage />) },
          { path: ROUTES.DEBTS, element: withSuspense(<DebtsListPage />) },
          {
            path: ROUTES.DEBT_CUSTOMER_DETAIL,
            element: withSuspense(<DebtCustomerDetailPage />),
          },
          { path: ROUTES.REPORTS, element: withSuspense(<ReportsPage />) },
          { path: ROUTES.SETTINGS, element: withSuspense(<SettingsPage />) },
        ],
      },
    ],
  },
  { path: '*', element: withSuspense(<NotFoundPage />) },
]);

export default router;
