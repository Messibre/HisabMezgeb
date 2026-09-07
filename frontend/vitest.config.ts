import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: { '@': path.resolve(__dirname, './src') },
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './tests/setup.ts',
    pool: 'forks', // Use forks instead of threads (more stable on Windows)
    isolate: false, // Disable isolation to speed up startup
    maxWorkers: 1, // Limit to one worker
    testTimeout: 30000,
    hookTimeout: 30000,
    teardownTimeout: 30000,
  },
});
