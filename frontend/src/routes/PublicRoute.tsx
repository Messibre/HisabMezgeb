import { Navigate, Outlet } from 'react-router-dom';
import { useAuthStore } from '@/store/auth.store';
import { ROUTES } from '@/constants';

export default function PublicRoute() {
  const user = useAuthStore((s) => s.user);
  return user ? <Navigate to={ROUTES.HOME} replace /> : <Outlet />;
}
