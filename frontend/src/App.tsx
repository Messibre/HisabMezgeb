import { RouterProvider } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from '@/lib/queryClient';
import ErrorBoundary from '@/components/common/ErrorBoundary';
import router from '@/routes';
import { useSyncHtmlLang } from '@/hooks/useSyncHtmlLang';
import { useAuthBootstrap } from '@/hooks/useAuthBootstrap';
import { useTheme } from '@/store/theme.store';
import { OfflineBanner } from '@/components/common/OfflineBanner';
import Toaster from '@/components/common/Toaster';

function App() {
  useSyncHtmlLang();
  useAuthBootstrap();
  useTheme();

  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <OfflineBanner />
        <Toaster />
        <RouterProvider router={router} />
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

export default App;
