import { Navigate, Outlet } from 'react-router-dom';
import { useAuthStore } from '@/store/auth.store';
import { ROUTES } from '@/constants';

export default function ProtectedRoute() {
  const user = useAuthStore((s) => s.user);
  return user ? <Outlet /> : <Navigate to={ROUTES.LOGIN} replace />;
}
