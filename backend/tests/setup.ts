import { vi } from 'vitest';

// Mock environment variables
vi.mock('../src/config/env.js', () => ({
  env: {
    NODE_ENV: 'test',
    PORT: '3000',
    DATABASE_URL: 'postgresql://test:test@localhost:5432/test',
    JWT_ACCESS_SECRET: 'test-access-secret',
    JWT_ACCESS_EXPIRES_IN: '15m',
    JWT_REFRESH_SECRET: 'test-refresh-secret',
    JWT_REFRESH_EXPIRES_IN: '30d',
    BCRYPT_SALT_ROUNDS: '10',
    CLIENT_URL: 'http://localhost:5173',
  },
}));
