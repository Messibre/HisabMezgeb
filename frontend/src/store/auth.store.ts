import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Account } from '@/types';

interface AuthState {
  token: string | null;
  user: Account | null;
  setAuth: (token: string, user: Account) => void;
  clearAuth: () => void;
}

/**
 * SECURITY NOTE: this store persists to localStorage (via the `persist`
 * middleware below), which means the auth token is readable by any JS
 * running on the page — including injected scripts if the app is ever
 * vulnerable to XSS. This matches the documented template pattern (simple,
 * works well for an SPA behind auth) and is a deliberate choice for
 * Hisab Mezgeb too — a two-person shared-login family app doesn't carry
 * the complexity budget for httpOnly cookies + CSRF handling. If stricter
 * security is ever needed, the alternative is httpOnly cookies set by the
 * backend, with the token never touching client-side JS at all.
 */
export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      user: null,
      setAuth: (token, user) => set({ token, user }),
      clearAuth: () => set({ token: null, user: null }),
    }),
    { name: 'auth-storage' }
  )
);
