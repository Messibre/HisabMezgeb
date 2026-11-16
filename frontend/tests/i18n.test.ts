import { describe, it, expect } from 'vitest';
import en from '@/locales/en.json';
import am from '@/locales/am.json';
import ti from '@/locales/ti.json';
import { resolveInitialLanguage, LANGUAGE_STORAGE_KEY } from '@/lib/language';
import { setAppLanguage } from '@/lib/i18n';
import fs from 'fs';
import path from 'path';

const flatKeys = (obj: object, prefix = ''): string[] =>
  Object.entries(obj).flatMap(([k, v]) =>
    v && typeof v === 'object' ? flatKeys(v, `${prefix}${k}.`) : [`${prefix}${k}`]
  );

describe('language choice', () => {
  it('no stored language + English device = Amharic', () => {
    expect(resolveInitialLanguage(null, ['en-US', 'en'])).toBe('am');
  });

  it('a Tigrigna device = Tigrigna', () => {
    expect(resolveInitialLanguage(null, ['ti-ER'])).toBe('ti');
  });

  it('an Amharic device = Amharic', () => {
    expect(resolveInitialLanguage(undefined, ['am-ET'])).toBe('am');
  });

  it('a stored choice wins over the device, including English', () => {
    expect(resolveInitialLanguage('en', ['am-ET'])).toBe('en');
    expect(resolveInitialLanguage('ti', ['en-US'])).toBe('ti');
  });

  it('ignores a stored value that is not supported', () => {
    expect(resolveInitialLanguage('fr', ['en-US'])).toBe('am');
  });

  it('an explicit choice is stored on the device (and nothing clears it on logout)', async () => {
    await setAppLanguage('ti');
    expect(localStorage.getItem(LANGUAGE_STORAGE_KEY)).toBe('ti');
    await setAppLanguage('en');
    expect(localStorage.getItem(LANGUAGE_STORAGE_KEY)).toBe('en');
  });

  it('index.html sets lang before first paint with the same rules', () => {
    const html = fs.readFileSync(path.resolve(__dirname, '../index.html'), 'utf8');
    expect(html).toMatch(/<html lang="am">/);
    expect(html).toContain("localStorage.getItem('hisabMezgebLanguage')");
    expect(html).toMatch(/base === 'ti' \|\| base === 'am'/);
  });
});

describe('locale key parity', () => {
  const enKeys = new Set(flatKeys(en));

  it.each([
    ['am', am],
    ['ti', ti],
  ] as const)('%s has exactly the same keys as en', (_lang, locale) => {
    const keys = new Set(flatKeys(locale));
    expect([...enKeys].filter((k) => !keys.has(k))).toEqual([]);
    expect([...keys].filter((k) => !enKeys.has(k))).toEqual([]);
  });
});
