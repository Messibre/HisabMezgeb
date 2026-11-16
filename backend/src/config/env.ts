import { z } from 'zod';
import dotenv from 'dotenv';

dotenv.config();

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.string().default('3000'),
  DATABASE_URL: z.string(),
  JWT_ACCESS_SECRET: z.string(),
  JWT_ACCESS_EXPIRES_IN: z.string().default('15m'),
  JWT_REFRESH_SECRET: z.string(),
  JWT_REFRESH_EXPIRES_IN: z.string().default('30d'),
  BCRYPT_SALT_ROUNDS: z.string().default('10'),
  CLIENT_URL: z.string().default('http://localhost:5173'),
});

/**
 * Production must not start with settings that are only safe on a laptop:
 * CORS with credentials needs one exact origin, and the JWT secrets must be
 * long, random and different from each other.
 */
export const checkProductionEnv = (e: z.infer<typeof envSchema>): string[] => {
  if (e.NODE_ENV !== 'production') return [];
  const problems: string[] = [];
  if (e.CLIENT_URL === '*' || !/^https:\/\/[^*\s]+$/.test(e.CLIENT_URL)) {
    problems.push('CLIENT_URL must be the exact https:// origin of the frontend');
  }
  if (e.JWT_ACCESS_SECRET.length < 32) problems.push('JWT_ACCESS_SECRET must be at least 32 characters');
  if (e.JWT_REFRESH_SECRET.length < 32) problems.push('JWT_REFRESH_SECRET must be at least 32 characters');
  if (e.JWT_ACCESS_SECRET === e.JWT_REFRESH_SECRET) {
    problems.push('JWT_ACCESS_SECRET and JWT_REFRESH_SECRET must be different');
  }
  return problems;
};

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('Invalid environment variables:', parsed.error.flatten().fieldErrors);
  process.exit(1);
}

const productionProblems = checkProductionEnv(parsed.data);
if (productionProblems.length > 0) {
  // Warn instead of exiting so a live deploy never goes down over this; fix the values on the host.
  console.error('UNSAFE PRODUCTION CONFIGURATION:', productionProblems);
}

export const env = parsed.data;
