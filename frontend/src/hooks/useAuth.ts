import { useAuthStore } from '@/store/auth.store';
import { useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import api from '@/lib/axios';
import { ROUTES } from '@/constants';
import type { LoginCredentials, RegisterPayload, Account } from '@/types';

export function useAuth() {
  const { user, setUser, clearUser } = useAuthStore();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const login = async (credentials: LoginCredentials) => {
    // Wipe any cached data from a previous session before the new one starts.
    // This is defensive — logout already clears the cache, but if the app
    // was force-closed or the user navigated directly to /login, this
    // guarantees a clean slate.
    queryClient.clear();

    const { data } = await api.post<Account>('/auth/login', credentials);
    setUser(data);
    navigate(ROUTES.HOME);
  };

  const register = async (payload: RegisterPayload) => {
    queryClient.clear();

    const { data } = await api.post<Account>('/auth/register', payload);
    setUser(data);
    navigate(ROUTES.HOME);
  };

  const logout = async () => {
    try {
      await api.post('/auth/logout');
    } catch {
      // ignore — we clear local state regardless
    }

    // Wipe the entire TanStack Query cache before clearing the user.
    // Without this, cached data from the previous session would remain in
    // memory and could be shown to the next user on the same device.
    queryClient.clear();
    clearUser();
    navigate(ROUTES.LOGIN);
  };

  return { user, isAuthenticated: !!user, login, register, logout };
}
