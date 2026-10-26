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
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
