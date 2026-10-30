import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import '@/styles/globals.css';
import '@/lib/i18n';
import { reportError } from '@/lib/errors';
import App from './App.tsx';

if (typeof window !== 'undefined') {
  window.addEventListener('error', (event) => {
    reportError(event.error || event.message, {
      filename: event.filename,
      lineno: event.lineno,
    });
  });

  window.addEventListener('unhandledrejection', (event) => {
    reportError(event.reason, { type: 'unhandledrejection' });
  });

  // ── Development same-site check ──
  // Warn if VITE_API_URL is on a different origin than the page.
  // In production the frontend and API are already on different domains,
  // but in development this can cause CORS/cookie issues during testing.
  if (import.meta.env.DEV && import.meta.env.VITE_API_URL) {
    try {
      const apiOrigin = new URL(import.meta.env.VITE_API_URL).origin;
      if (apiOrigin !== window.location.origin) {
        console.warn(
          `[PWA] VITE_API_URL (${import.meta.env.VITE_API_URL}) is on a different origin ` +
            `than the page (${window.location.origin}). ` +
            `Service worker caching and cookie handling may behave differently in production.`
        );
      }
    } catch {
      // Invalid URL — env validation will catch this
    }
  }
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
