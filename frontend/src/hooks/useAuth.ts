import { useAuthStore } from '@/store/auth.store';
import { useNavigate } from 'react-router-dom';
import api from '@/lib/axios';
import { ROUTES } from '@/constants';
import type { LoginCredentials, RegisterPayload, Account } from '@/types';

export function useAuth() {
  const { user, setUser, clearUser } = useAuthStore();
  const navigate = useNavigate();

  const login = async (credentials: LoginCredentials) => {
    const { data } = await api.post<Account>('/auth/login', credentials);
    setUser(data);
    navigate(ROUTES.HOME);
  };

  const register = async (payload: RegisterPayload) => {
    const { data } = await api.post<Account>('/auth/register', payload);
    setUser(data);
    navigate(ROUTES.HOME);
  };

  const logout = async () => {
    try {
      await api.post('/auth/logout');
    } catch {
      // ignore —  clear user regardless
    }
    clearUser();
    navigate(ROUTES.LOGIN);
  };

  return { user, isAuthenticated: !!user, login, register, logout };
}
