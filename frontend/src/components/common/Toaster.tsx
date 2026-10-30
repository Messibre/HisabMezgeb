import { Toaster as SonnerToaster } from 'sonner';
import { useTheme } from '@/store/theme.store';

export default function Toaster() {
  const { resolved } = useTheme();

  return (
    <SonnerToaster
      theme={resolved}
      position="top-center"
      duration={5000}
      closeButton
      richColors
      toastOptions={{
        className:
          'rounded-2xl font-sans border border-border bg-card text-foreground shadow-lg dark:shadow-none dark:border-border',
      }}
    />
  );
}
