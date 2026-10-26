import { Toaster as SonnerToaster } from 'sonner';

export default function Toaster() {
  return (
    <SonnerToaster
      position="top-center"
      richColors
      toastOptions={{
        className:
          'rounded-2xl font-sans border border-border/40 bg-card text-foreground shadow-lg',
      }}
    />
  );
}
