import { RouterProvider } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from '@/lib/queryClient';
import ErrorBoundary from '@/components/common/ErrorBoundary';
import router from '@/routes';
import { useSyncHtmlLang } from '@/hooks/useSyncHtmlLang';
import { useAuthBootstrap } from '@/hooks/useAuthBootstrap';
import { OfflineBanner } from '@/components/common/OfflineBanner';

function App() {
  useSyncHtmlLang();
  useAuthBootstrap();

  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <OfflineBanner />
        <RouterProvider router={router} />
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

export default App;
