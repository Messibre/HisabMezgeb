import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { StrictMode } from 'react';
import { render, act } from '@testing-library/react';
import type { AxiosError, AxiosResponse, InternalAxiosRequestConfig } from 'axios';
import api, { executeRefresh, handleResponseError, resetRefreshPromise } from '@/lib/axios';
import { useAuthBootstrap } from '@/hooks/useAuthBootstrap';
import { useAuthStore } from '@/store/auth.store';

const ACCOUNT = { id: 'acc_1', phoneNumber: '0911223344', shopName: 'Shop', createdAt: '' };

let refreshCalls = 0;

function Bootstrap() {
  useAuthBootstrap();
  return null;
}

const unauthorized = (url: string) => {
  const config = { url, headers: {} } as InternalAxiosRequestConfig;
  return {
    config,
    response: { status: 401, data: {}, statusText: 'Unauthorized', headers: {}, config },
    isAxiosError: true,
    name: 'AxiosError',
    message: 'Unauthorized',
  } as AxiosError;
};

describe('/auth/refresh call count', () => {
  beforeEach(() => {
    refreshCalls = 0;
    resetRefreshPromise();
    localStorage.removeItem('hisab-refreshed-at');
    vi.spyOn(api, 'post').mockImplementation(async (url: string) => {
      if (url === '/auth/refresh') {
        refreshCalls++;
        await new Promise((r) => setTimeout(r, 5));
        return { status: 200, data: ACCOUNT } as AxiosResponse;
      }
      throw new Error(`unexpected POST ${url}`);
    });
    // Retried requests after a refresh succeed.
    vi.spyOn(api, 'request').mockResolvedValue({ status: 200, data: {} } as AxiosResponse);
  });

  afterEach(() => {
    vi.restoreAllMocks();
    useAuthStore.setState({ account: null, status: 'unknown' });
  });

  it('no saved account on this device (landing, login, register): 0 calls', async () => {
    useAuthStore.setState({ account: null, status: 'unknown' });
    render(
      <StrictMode>
        <Bootstrap />
      </StrictMode>
    );
    await act(() => new Promise((r) => setTimeout(r, 30)));
    expect(refreshCalls).toBe(0);
    expect(useAuthStore.getState().status).toBe('unauthenticated');
  });

  it('opening the app with a saved account, in StrictMode: exactly 1 call', async () => {
    useAuthStore.setState({ account: ACCOUNT, status: 'unknown' });
    render(
      <StrictMode>
        <Bootstrap />
      </StrictMode>
    );
    await act(() => new Promise((r) => setTimeout(r, 30)));
    expect(refreshCalls).toBe(1);
    expect(useAuthStore.getState().status).toBe('authenticated');
  });

  it('five screens failing with 401 at the same time share 1 call', async () => {
    useAuthStore.setState({ account: ACCOUNT, status: 'authenticated' });
    await Promise.allSettled(
      ['/income', '/expenses', '/funding', '/debt-customers', '/reports/summary'].map((u) =>
        handleResponseError(unauthorized(u))
      )
    );
    expect(refreshCalls).toBe(1);
  });

  it('20 minutes idle: nothing polls /auth/refresh', async () => {
    vi.useFakeTimers();
    try {
      useAuthStore.setState({ account: ACCOUNT, status: 'authenticated' });
      await act(async () => {
        vi.advanceTimersByTime(20 * 60 * 1000);
      });
      expect(refreshCalls).toBe(0);
    } finally {
      vi.useRealTimers();
    }
  });

  it('a second tab that gets the lock right after another tab refreshed reuses it: 1 call', async () => {
    useAuthStore.setState({ account: ACCOUNT, status: 'authenticated' });
    // Minimal Web Locks API: one holder at a time.
    let chain = Promise.resolve<unknown>(undefined);
    const locks = {
      request: (_name: string, cb: () => Promise<unknown>) => {
        const run = chain.then(cb);
        chain = run.catch(() => undefined);
        return run;
      },
    };
    Object.defineProperty(navigator, 'locks', { configurable: true, value: locks });
    try {
      await executeRefresh(); // tab A
      resetRefreshPromise(); // tab B has its own in-memory state
      await executeRefresh(); // tab B, a moment later
      expect(refreshCalls).toBe(1);
    } finally {
      Object.defineProperty(navigator, 'locks', { configurable: true, value: undefined });
    }
  });

  it('after logout: a 401 does not trigger a refresh loop for /auth/* calls', async () => {
    useAuthStore.setState({ account: null, status: 'unauthenticated' });
    await handleResponseError(unauthorized('/auth/login')).catch(() => {});
    expect(refreshCalls).toBe(0);
  });
});
