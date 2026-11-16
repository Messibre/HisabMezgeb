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
import { PWAUpdateBanner } from '@/components/common/PWAUpdateBanner';
import SaveConfirmation from '@/components/common/SaveConfirmation';

/**
 * Whether to enable PWA features.
 * Disabled inside Capacitor native shells and in development mode.
 */
const enablePWA =
  typeof window !== 'undefined' &&
  !('Capacitor' in window) &&
  import.meta.env.PROD;

function App() {
  useSyncHtmlLang();
  useAuthBootstrap();
  useTheme();

  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <OfflineBanner />
        <Toaster />
        <SaveConfirmation />
        {enablePWA && <PWAUpdateBanner />}
        <RouterProvider router={router} />
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

export default App;
