import { Navigate, Outlet } from 'react-router-dom';
import { useAuthStore } from '@/store/auth.store';
import { ROUTES } from '@/constants';

export default function ProtectedRoute() {
  const status = useAuthStore((s) => s.status);
  const hasSavedAccount = useAuthStore((s) => s.account !== null);

  // With a saved account the page renders while the session check runs, so its data
  // requests start at the same time instead of after /auth/refresh. A request that
  // gets a 401 waits for that same refresh; if the session is gone, status becomes
  // 'unauthenticated' and this redirects to login.
  if (status === 'unknown' && !hasSavedAccount) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background" role="status">
        <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return status === 'unauthenticated' ? <Navigate to={ROUTES.LOGIN} replace /> : <Outlet />;
}
