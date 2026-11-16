import { useEffect } from 'react';
import { useAuthStore } from '@/store/auth.store';
import { executeRefresh } from '@/lib/axios';

export function useAuthBootstrap() {
  const { status, account, setAccount, setStatus, clearSession } = useAuthStore();

  useEffect(() => {
    if (status !== 'unknown') return;

    // Only call /auth/refresh when a persisted account exists on this device
    if (!account) {
      setStatus('unauthenticated');
      return;
    }

    let isMounted = true;

    async function bootstrap() {
      try {
        // Shared single-flight refresh: StrictMode's double effect and any 401
        // handled at the same time all wait for this one request.
        const data = await executeRefresh();
        if (isMounted) {
          setAccount(data);
        }
      } catch (err: unknown) {
        if (!isMounted) return;

        const error = err as { response?: { status?: number } };
        if (error.response?.status === 401 || error.response?.status === 403) {
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
