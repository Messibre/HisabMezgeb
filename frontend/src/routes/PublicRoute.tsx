import { Navigate, Outlet } from 'react-router-dom';
import { useAuthStore } from '@/store/auth.store';
import { ROUTES } from '@/constants';

export default function PublicRoute() {
  const status = useAuthStore((s) => s.status);

  if (status === 'unknown') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background" role="status">
        <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return status === 'authenticated' ? <Navigate to={ROUTES.HOME} replace /> : <Outlet />;
}
