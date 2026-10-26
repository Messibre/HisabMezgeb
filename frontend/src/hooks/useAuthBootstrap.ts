import { useEffect } from 'react';
import { useAuthStore } from '@/store/auth.store';
import api from '@/lib/axios';
import type { Account } from '@/types';

export function useAuthBootstrap() {
  const { status, account, setAccount, setStatus, clearSession } = useAuthStore();

  useEffect(() => {
    if (status !== 'unknown') return;

    let isMounted = true;

    async function bootstrap() {
      try {
        const { data } = await api.post<Account>('/auth/refresh');
        if (isMounted) {
          setAccount(data);
        }
      } catch (err: unknown) {
        if (!isMounted) return;

        const error = err as { response?: { status?: number } };
        if (error.response?.status === 401) {
          clearSession();
        } else {
          // Network error or timeout: if persisted account exists, remain authenticated offline
          if (account) {
            setStatus('authenticated');
          } else {
            setStatus('unauthenticated');
          }
        }
      }
    }

    bootstrap();

    return () => {
      isMounted = false;
    };
  }, [status, account, setAccount, setStatus, clearSession]);
}
