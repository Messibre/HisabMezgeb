import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes — data stays fresh
      refetchOnWindowFocus: true,
      refetchOnReconnect: true,
      retry: (failureCount, error: any) => {
        // Retry queries up to 2 times ONLY for network errors and 5xx with backoff. Never for 4xx.
        if (failureCount >= 2) return false;

        const status = error?.response?.status;
        if (typeof status === 'number' && status >= 400 && status < 500) {
          return false;
        }

        return true;
      },
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    },
    mutations: {
      retry: false, // Never retry mutations automatically
    },
  },
});
