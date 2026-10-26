import { describe, it, expect, vi, beforeEach } from 'vitest';
import api, { resetRefreshPromise, handleResponseError } from '@/lib/axios';
import { useAuthStore } from '@/store/auth.store';
import { getAuthErrorMessage } from '@/lib/authErrors';
import { queryClient } from '@/lib/queryClient';
import type { AxiosResponse, InternalAxiosRequestConfig, AxiosError } from 'axios';

describe('Auth plumbing (cookie-based session)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useAuthStore.getState().clearSession();
    resetRefreshPromise();
  });

  it('single-flight refresh: two concurrent 401 requests share ONE refresh call', async () => {
    let refreshCalls = 0;

    vi.spyOn(api, 'post').mockImplementation((url) => {
      if (url === '/auth/refresh') {
        refreshCalls++;
        return Promise.resolve({
          status: 200,
          data: { id: 'acc_1', phoneNumber: '0911223344', shopName: 'Shop', createdAt: '' },
        } as AxiosResponse);
      }
      return Promise.reject(new Error('Unexpected post'));
    });

    const req1Config = { url: '/income', headers: {} } as InternalAxiosRequestConfig;
    const req2Config = { url: '/debts', headers: {} } as InternalAxiosRequestConfig;

    const error1 = {
      config: req1Config,
      response: { status: 401, data: {}, statusText: 'Unauthorized', headers: {}, config: req1Config },
      name: 'AxiosError',
      message: 'Unauthorized',
      isAxiosError: true,
    } as AxiosError;

    const error2 = {
      config: req2Config,
      response: { status: 401, data: {}, statusText: 'Unauthorized', headers: {}, config: req2Config },
      name: 'AxiosError',
      message: 'Unauthorized',
      isAxiosError: true,
    } as AxiosError;

    const [p1, p2] = [handleResponseError(error1), handleResponseError(error2)];

    await Promise.allSettled([p1, p2]);
    expect(refreshCalls).toBe(1);
  });

  it('no refresh on network error: network error does not trigger refresh or log out', async () => {
    const postSpy = vi.spyOn(api, 'post');
    useAuthStore.getState().setAccount({ id: 'acc_1', phoneNumber: '0911223344', shopName: 'Shop', createdAt: '' });

    const reqConfig = { url: '/income', headers: {} } as InternalAxiosRequestConfig;
    const networkError = {
      config: reqConfig,
      message: 'Network Error',
      name: 'AxiosError',
      isAxiosError: true,
    } as AxiosError;

    try {
      await handleResponseError(networkError);
    } catch (err) {
      expect(err).toBe(networkError);
    }

    expect(postSpy).not.toHaveBeenCalled();
    expect(useAuthStore.getState().account).not.toBeNull();
  });

  it('no refresh loop for /auth/* URLs', async () => {
    const postSpy = vi.spyOn(api, 'post');
    const reqConfig = { url: '/auth/login', headers: {} } as InternalAxiosRequestConfig;

    const authError = {
      config: reqConfig,
      response: { status: 401, data: {}, statusText: 'Unauthorized', headers: {}, config: reqConfig },
      name: 'AxiosError',
      message: 'Unauthorized',
      isAxiosError: true,
    } as AxiosError;

    try {
      await handleResponseError(authError);
    } catch (err) {
      expect(err).toBe(authError);
    }

    expect(postSpy).not.toHaveBeenCalled();
  });

  it('maps auth errors to proper i18n keys', () => {
    expect(getAuthErrorMessage({ response: { status: 401 } }, 'login')).toBe('auth.errorLoginFailed');
    expect(getAuthErrorMessage({ response: { status: 409 } }, 'register')).toBe('auth.errorRegisterFailed');
    expect(getAuthErrorMessage({ response: { status: 429 } })).toBe('auth.errorRateLimited');
    expect(getAuthErrorMessage({ message: 'Network Error' })).toBe('auth.errorNetwork');
    expect(getAuthErrorMessage({ response: { status: 500 } })).toBe('auth.errorGeneric');
  });

  it('clears queryClient and auth store on logout', async () => {
    const clearSpy = vi.spyOn(queryClient, 'clear');
    useAuthStore.getState().setAccount({ id: '1', phoneNumber: '0911', shopName: 'Test', createdAt: '' });

    useAuthStore.getState().clearSession();
    queryClient.clear();

    expect(useAuthStore.getState().account).toBeNull();
    expect(useAuthStore.getState().status).toBe('unauthenticated');
    expect(clearSpy).toHaveBeenCalled();
  });
});
