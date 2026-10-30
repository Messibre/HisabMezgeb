import '@testing-library/jest-dom';
import '@/lib/i18n';
import { cleanup } from '@testing-library/react';
import { afterEach } from 'vitest';
import type { AxeMatchers } from 'vitest-axe';

declare module 'vitest' {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-empty-object-type, @typescript-eslint/no-unused-vars
  interface Assertion<T = any> extends AxeMatchers {}
  // eslint-disable-next-line @typescript-eslint/no-empty-object-type
  interface AsymmetricMatchersContaining extends AxeMatchers {}
}

// @ts-expect-error flag for React act environment in tests
globalThis.IS_REACT_ACT_ENVIRONMENT = true;

afterEach(() => {
  cleanup();
});
