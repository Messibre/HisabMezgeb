import { useAuthStore } from '@/store/auth.store';
import { useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import api from '@/lib/axios';
import { ROUTES } from '@/constants';
import type { LoginCredentials, RegisterPayload, Account } from '@/types';

export function useAuth() {
  const { account, status, setAccount, clearSession } = useAuthStore();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const login = async (credentials: LoginCredentials) => {
    queryClient.clear();
    const { data } = await api.post<Account>('/auth/login', credentials);
    setAccount(data);
    navigate(ROUTES.HOME);
  };

  const register = async (payload: RegisterPayload) => {
    queryClient.clear();
    const { data } = await api.post<Account>('/auth/register', payload);
    setAccount(data);
    navigate(ROUTES.HOME);
  };

  const logout = async () => {
    try {
      await api.post('/auth/logout');
    } catch {
      // Ignore network failures on logout; clear local state regardless
    }
    queryClient.clear();
    clearSession();
    navigate(ROUTES.LOGIN);
  };

  return {
    account,
    user: account,
    status,
    isAuthenticated: status === 'authenticated',
    login,
    register,
    logout,
  };
}
