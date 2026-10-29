import '@testing-library/jest-dom';
import '@/lib/i18n';
import { cleanup } from '@testing-library/react';
import { afterEach } from 'vitest';

// @ts-expect-error flag for React act environment in tests
globalThis.IS_REACT_ACT_ENVIRONMENT = true;

afterEach(() => {
  cleanup();
});
