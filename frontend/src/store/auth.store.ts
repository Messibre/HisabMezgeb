import { create } from 'zustand';
import type { Account } from '@/types';

interface AuthState {
  user: Account | null;
  setUser: (user: Account) => void;
  clearUser: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  setUser: (user) => set({ user }),
  clearUser: () => set({ user: null }),
}));
