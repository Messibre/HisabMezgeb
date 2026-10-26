import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Account } from '@/types';

export type AuthStatus = 'unknown' | 'authenticated' | 'unauthenticated';

interface AuthState {
  account: Account | null;
  status: AuthStatus;
  setAccount: (account: Account) => void;
  setStatus: (status: AuthStatus) => void;
  clearSession: () => void;
  // Backward compatibility alias
  user: Account | null;
  clearUser: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      account: null,
      user: null,
      status: 'unknown',
      setAccount: (account) => set({ account, user: account, status: 'authenticated' }),
      setStatus: (status) => set({ status }),
      clearSession: () => set({ account: null, user: null, status: 'unauthenticated' }),
      clearUser: () => set({ account: null, user: null, status: 'unauthenticated' }),
    }),
    {
      name: 'hisab-auth',
      partialize: (state) => ({ account: state.account }),
    }
  )
);
