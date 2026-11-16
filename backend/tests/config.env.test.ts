import { describe, it, expect, vi } from 'vitest';

vi.unmock('../src/config/env.js');

describe('checkProductionEnv', async () => {
  process.env.DATABASE_URL ??= 'postgresql://x';
  process.env.JWT_ACCESS_SECRET ??= 'a';
  process.env.JWT_REFRESH_SECRET ??= 'b';
  const { checkProductionEnv } = await import('../src/config/env.js');
  const base = {
    NODE_ENV: 'production' as const,
    PORT: '3000',
    DATABASE_URL: 'postgresql://x',
    JWT_ACCESS_SECRET: 'a'.repeat(40),
    JWT_ACCESS_EXPIRES_IN: '15m',
    JWT_REFRESH_SECRET: 'b'.repeat(40),
    JWT_REFRESH_EXPIRES_IN: '30d',
    BCRYPT_SALT_ROUNDS: '10',
    CLIENT_URL: 'https://hisab.example.com',
  };

  it('accepts a safe production config', () => {
    expect(checkProductionEnv(base)).toEqual([]);
  });

  it('flags a wildcard or http CORS origin', () => {
    expect(checkProductionEnv({ ...base, CLIENT_URL: '*' })).toHaveLength(1);
    expect(checkProductionEnv({ ...base, CLIENT_URL: 'http://hisab.example.com' })).toHaveLength(1);
  });

  it('flags short or identical JWT secrets', () => {
    expect(checkProductionEnv({ ...base, JWT_ACCESS_SECRET: 'short' })).toHaveLength(1);
    expect(checkProductionEnv({ ...base, JWT_REFRESH_SECRET: base.JWT_ACCESS_SECRET })).toHaveLength(1);
  });

  it('ignores development', () => {
    expect(checkProductionEnv({ ...base, NODE_ENV: 'development', CLIENT_URL: '*' })).toEqual([]);
  });
});
