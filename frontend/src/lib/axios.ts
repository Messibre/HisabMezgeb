import axios, { AxiosError, type InternalAxiosRequestConfig } from 'axios';
import { env } from '@/config/env';
import type { ApiResponse, Account } from '@/types';
import { useAuthStore } from '@/store/auth.store';
import { queryClient } from '@/lib/queryClient';

const api = axios.create({
  baseURL: env.VITE_API_URL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 15000, // 15 seconds timeout gives 'timeout' error kind
  withCredentials: true,
});

let refreshPromise: Promise<Account> | null = null;

const REFRESH_LOCK = 'hisab-auth-refresh';
const REFRESHED_AT_KEY = 'hisab-refreshed-at';
/** Another tab refreshed this recently: the shared cookies are already fresh. */
const RECENT_REFRESH_MS = 10_000;

export function resetRefreshPromise() {
  refreshPromise = null;
}

function refreshedRecently(): boolean {
  try {
    const at = Number(localStorage.getItem(REFRESHED_AT_KEY));
    return Number.isFinite(at) && Date.now() - at < RECENT_REFRESH_MS;
  } catch {
    return false;
  }
}

function markRefreshed() {
  try {
    localStorage.setItem(REFRESHED_AT_KEY, String(Date.now()));
  } catch {
    // Storage unavailable: the server's grace window still covers a parallel refresh.
  }
}

async function postRefresh(): Promise<Account> {
  const res = await api.post<Account>('/auth/refresh', {}, { withCredentials: true });
  markRefreshed();
  useAuthStore.getState().setAccount(res.data);
  return res.data;
}

/**
 * One refresh at a time: requests in this tab share one promise, and tabs take
 * turns through the Web Locks API. A tab that gets the lock right after another
 * tab refreshed reuses that result instead of calling the server again.
 */
async function refreshAcrossTabs(): Promise<Account> {
  const locks = typeof navigator !== 'undefined' ? navigator.locks : undefined;
  if (!locks?.request) return postRefresh();

  return locks.request(REFRESH_LOCK, async () => {
    const account = useAuthStore.getState().account;
    if (account && refreshedRecently()) return account;
    return postRefresh();
  });
}

export async function executeRefresh(): Promise<Account> {
  if (!refreshPromise) {
    refreshPromise = refreshAcrossTabs().finally(() => {
      refreshPromise = null;
    });
  }
  return refreshPromise;
}

function isSessionRejected(error: unknown): boolean {
  const status = (error as AxiosError | undefined)?.response?.status;
  return status === 401 || status === 403;
}

export async function handleResponseError(error: AxiosError) {
  const originalRequest = error.config as (InternalAxiosRequestConfig & { _retry?: boolean }) | undefined;

  // A network error (no response at all) must NEVER log the user out and must NEVER trigger a refresh
  if (!error.response) {
    return Promise.reject(error);
  }

  const status = error.response.status;
  const url = originalRequest?.url || '';

  const isAuthRoute =
    url.includes('/auth/login') ||
    url.includes('/auth/register') ||
    url.includes('/auth/refresh');

  if (status === 401) {
    if (isAuthRoute) {
      if (url.includes('/auth/refresh')) {
        // The refresh token itself was rejected: the session is over.
        useAuthStore.getState().clearSession();
        queryClient.clear();
      }
      return Promise.reject(error);
    }

    if (originalRequest && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        await executeRefresh();
        return api(originalRequest);
      } catch (refreshErr) {
        // Only a definite "session is gone" answer logs out. A 429, 5xx, timeout or
        // offline refresh keeps the session; the original request just fails as usual.
        if (isSessionRejected(refreshErr)) {
          useAuthStore.getState().clearSession();
          queryClient.clear();
        }
        return Promise.reject(refreshErr);
      }
    }
  }

  return Promise.reject(error);
}

api.interceptors.response.use(
  (response) => {
    const body = response.data as ApiResponse<unknown>;
    if (body && typeof body === 'object' && 'data' in body) {
      response.data = body.data;
    }
    return response;
  },
  handleResponseError
);

export default api;
