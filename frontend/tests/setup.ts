import '@testing-library/jest-dom';
import i18n from '@/lib/i18n';
import { cleanup } from '@testing-library/react';
import { afterEach } from 'vitest';
import type { AxeMatchers } from 'vitest-axe';

declare module 'vitest' {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-empty-object-type, @typescript-eslint/no-unused-vars
  interface Assertion<T = any> extends AxeMatchers {}
  // eslint-disable-next-line @typescript-eslint/no-empty-object-type
  interface AsymmetricMatchersContaining extends AxeMatchers {}
}

// Existing fixtures assert English text; the app itself defaults to Amharic.
await i18n.changeLanguage('en');

// @ts-expect-error flag for React act environment in tests
globalThis.IS_REACT_ACT_ENVIRONMENT = true;

afterEach(async () => {
  cleanup();
  if (i18n.language !== 'en') await i18n.changeLanguage('en');
});
