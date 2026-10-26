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

export function resetRefreshPromise() {
  refreshPromise = null;
}

export async function executeRefresh(): Promise<Account> {
  if (!refreshPromise) {
    refreshPromise = api
      .post<Account>('/auth/refresh', {}, { withCredentials: true })
      .then((res) => {
        const account = res.data;
        useAuthStore.getState().setAccount(account);
        return account;
      })
      .finally(() => {
        refreshPromise = null;
      });
  }
  return refreshPromise;
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
        // Session expired: Clear auth session, but do NOT wipe unsynced offline entries.
        // When the offline queue exists, it must survive a logout caused by an expired session.
        useAuthStore.getState().clearSession();
        queryClient.clear();
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
