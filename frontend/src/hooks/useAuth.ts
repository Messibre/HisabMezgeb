import { useAuthStore } from '@/store/auth.store';
import { useNavigate } from 'react-router-dom';
import api from '@/lib/axios';
import { ROUTES } from '@/constants';
import type { LoginCredentials, RegisterPayload, Account } from '@/types';

export function useAuth() {
  const { token, user, setAuth, clearAuth } = useAuthStore();
  const navigate = useNavigate();

  const login = async (credentials: LoginCredentials) => {
    const { data } = await api.post<{ token: string } & Account>('/auth/login', credentials);
    setAuth(data.token, data);
    navigate(ROUTES.HOME);
  };

  const register = async (payload: RegisterPayload) => {
    const { data } = await api.post<{ token: string } & Account>('/auth/register', payload);
    setAuth(data.token, data);
    navigate(ROUTES.HOME);
  };

  const logout = () => {
    clearAuth();
    navigate(ROUTES.LOGIN);
  };

  return { user, token, isAuthenticated: !!token, login, register, logout };
}
