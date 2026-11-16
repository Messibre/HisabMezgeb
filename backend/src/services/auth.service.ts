import bcrypt from 'bcrypt';
import { Prisma } from '@prisma/client';
import { prisma } from '../config/db.js';
import { env } from '../config/env.js';
import ApiError from '../utils/ApiError.js';
import { HTTP_STATUS, ERROR_CODES } from '../constants/index.js';
import { normalizePhone } from '../utils/phoneNormalizer.js';
import {
  generateAccessToken,
  generateRefreshToken,
  hashToken,
  verifyRefreshToken,
} from '../utils/jwt.js';
import logger from '../utils/logger.js';
import { SAFE_ACCOUNT_SELECT, SafeAccount } from '../types/index.js';

type AccountWithSafeFields = Prisma.AccountGetPayload<{
  select: typeof SAFE_ACCOUNT_SELECT;
}>;

function toSafeAccount(account: AccountWithSafeFields): SafeAccount {
  return {
    id: account.id,
    phoneNumber: account.phoneNumber,
    shopName: account.shopName,
    createdAt: account.createdAt,
    updatedAt: account.updatedAt,
  };
}

function parseDuration(duration: string): number {
  const match = duration.match(/^(\d+)([mhd])$/);
  if (!match) {
    throw new Error(
      `Invalid duration format: "${duration}". Expected format: <number> + unit (m, h, d) e.g. "30d", "15m", "1h"`,
    );
  }

  const value = parseInt(match[1], 10);
  const unit = match[2];

  switch (unit) {
    case 'm':
      return value * 60 * 1000;
    case 'h':
      return value * 60 * 60 * 1000;
    case 'd':
      return value * 24 * 60 * 60 * 1000;
    default:
      throw new Error(`Unsupported duration unit: "${unit}"`);
  }
}

async function issueAndStoreRefreshToken(
  accountId: string,
): Promise<{ refreshToken: string; hashedRefreshToken: string; expiresAt: Date }> {
  const refreshToken = generateRefreshToken({ accountId });
  const hashedRefreshToken = hashToken(refreshToken);
  const expiresAt = new Date(Date.now() + parseDuration(env.JWT_REFRESH_EXPIRES_IN));

  await prisma.refreshToken.create({
    data: {
      accountId,
      token: hashedRefreshToken,
      expiresAt,
      revokedAt: null,
    },
  });

  return { refreshToken, hashedRefreshToken, expiresAt };
}

function isUniqueConstraintError(error: unknown): boolean {
  return error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002';
}

function isRecordNotFoundError(error: unknown): boolean {
  return error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025';
}

const DEFAULT_CATEGORIES = [
  { name: 'Cost of Goods', group: 'business' },
  { name: 'Equb', group: 'business' },
  { name: 'Home Necessities', group: 'personal' },
  { name: 'Debt payment', group: 'personal' },
];

export const registerAccount = async (phoneNumber: string, password: string, shopName?: string) => {
  const normalizedPhone = normalizePhone(phoneNumber);
  const saltRounds = parseInt(env.BCRYPT_SALT_ROUNDS, 10);
  const hashedPassword = await bcrypt.hash(password, saltRounds);

  let account: AccountWithSafeFields;

  try {
    account = await prisma.$transaction(
      async (tx) => {
        const newAccount = await tx.account.create({
          data: {
            phoneNumber: normalizedPhone,
            password: hashedPassword,
            shopName: shopName ?? null,
          },
          select: SAFE_ACCOUNT_SELECT, // Password never returned
        });
        await tx.appSettings.create({
          data: {
            accountId: newAccount.id,
            language: 'en',
            notificationsEnabled: true,
          },
        });

        await tx.expenseCategory.createMany({
          data: DEFAULT_CATEGORIES.map((cat) => ({
            accountId: newAccount.id,
            name: cat.name,
            group: cat.group,
            isActive: true,
          })),
        });

        return newAccount;
      },
      { timeout: 15000, maxWait: 10000 },
    );
  } catch (error: unknown) {
    if (
      typeof error === 'object' &&
      error !== null &&
      'code' in error &&
      (error as any).code === 'P2002'
    ) {
      throw new ApiError(HTTP_STATUS.CONFLICT, 'This phone number is already registered', [], ERROR_CODES.PHONE_ALREADY_REGISTERED);
    }
    throw error;
  }

  const accountId = account.id;
  const accessToken = generateAccessToken({ accountId });
  const { refreshToken } = await issueAndStoreRefreshToken(accountId);

  return {
    account: toSafeAccount(account),
    accessToken,
    refreshToken,
  };
};

export const loginAccount = async (phoneNumber: string, password: string) => {
  const normalizedPhone = normalizePhone(phoneNumber);

  const account = await prisma.account.findUnique({
    where: { phoneNumber: normalizedPhone },
    select: SAFE_ACCOUNT_SELECT,
  });

  const accountWithPassword = await prisma.account.findUnique({
    where: { phoneNumber: normalizedPhone },
    select: { id: true, password: true },
  });

  if (!account || !accountWithPassword) {
    throw new ApiError(HTTP_STATUS.UNAUTHORIZED, 'Incorrect phone number or password', [], ERROR_CODES.INVALID_CREDENTIALS);
  }

  const isPasswordValid = await bcrypt.compare(password, accountWithPassword.password);
  if (!isPasswordValid) {
    throw new ApiError(HTTP_STATUS.UNAUTHORIZED, 'Incorrect phone number or password', [], ERROR_CODES.INVALID_CREDENTIALS);
  }

  const accountId = account.id;
  const accessToken = generateAccessToken({ accountId });
  const { refreshToken } = await issueAndStoreRefreshToken(accountId);

  return {
    account: toSafeAccount(account),
    accessToken,
    refreshToken,
  };
};

/**
 * How long a just-rotated refresh token is still accepted. Two tabs, or a slow
 * retry, can send the previous cookie right after another request rotated it.
 */
export const REFRESH_GRACE_MS = 30 * 1000;

const invalidRefresh = () =>
  new ApiError(HTTP_STATUS.UNAUTHORIZED, 'Invalid or expired refresh token', [], ERROR_CODES.SESSION_EXPIRED);

/**
 * Sliding session: every refresh replaces the refresh token with a new one valid
 * for another JWT_REFRESH_EXPIRES_IN, so a daily user is never logged out.
 * Returns `refreshToken` only when a new one was issued.
 */
export const refreshAccessToken = async (
  refreshToken: string,
): Promise<{ account: SafeAccount; accessToken: string; refreshToken?: string }> => {
  let payload: { accountId: string };
  try {
    payload = verifyRefreshToken(refreshToken) as { accountId: string };
  } catch {
    throw invalidRefresh();
  }

  const { accountId } = payload;
  const hashedToken = hashToken(refreshToken);

  const storedToken = await prisma.refreshToken.findFirst({
    where: {
      accountId,
      token: hashedToken,
      expiresAt: { gt: new Date() },
    },
    include: {
      account: {
        select: SAFE_ACCOUNT_SELECT,
      },
    },
  });

  if (!storedToken) {
    throw invalidRefresh();
  }

  const account = toSafeAccount(storedToken.account);

  if (storedToken.revokedAt) {
    const age = Date.now() - storedToken.revokedAt.getTime();
    if (age <= REFRESH_GRACE_MS) {
      // Rotated a moment ago by a parallel request: the browser already has the new cookie.
      return { account, accessToken: generateAccessToken({ accountId }) };
    }
    logger.warn({ accountId, tokenId: storedToken.id }, 'Rejected reuse of a revoked refresh token');
    throw invalidRefresh();
  }

  // Only the request that actually revokes the old token issues the replacement.
  const { count } = await prisma.refreshToken.updateMany({
    where: { id: storedToken.id, revokedAt: null },
    data: { revokedAt: new Date() },
  });

  if (count === 0) {
    return { account, accessToken: generateAccessToken({ accountId }) };
  }

  const { refreshToken: newRefreshToken } = await issueAndStoreRefreshToken(accountId);

  return {
    account,
    accessToken: generateAccessToken({ accountId }),
    refreshToken: newRefreshToken,
  };
};

export const logoutAccount = async (refreshToken: string) => {
  const hashedToken = hashToken(refreshToken);
  try {
    await prisma.refreshToken.updateMany({
      where: {
        token: hashedToken,
        revokedAt: null,
      },
      data: { revokedAt: new Date() },
    });
  } catch (error) {
    // Ignore: the client is logging out anyway.
    logger.debug({ error }, 'Logout: failed to revoke refresh token (may already be revoked)');
  }
};

export const changePassword = async (
  accountId: string,
  currentPassword: string,
  newPassword: string,
) => {
  const account = await prisma.account.findUnique({
    where: { id: accountId },
    select: { password: true },
  });

  if (!account) {
    throw new ApiError(HTTP_STATUS.NOT_FOUND, 'Account not found', [], ERROR_CODES.RECORD_NOT_FOUND);
  }

  const isPasswordValid = await bcrypt.compare(currentPassword, account.password);
  if (!isPasswordValid) {
    throw new ApiError(HTTP_STATUS.UNAUTHORIZED, 'Current password is incorrect', [], ERROR_CODES.INVALID_CREDENTIALS);
  }

  const saltRounds = parseInt(env.BCRYPT_SALT_ROUNDS, 10);
  const hashedNewPassword = await bcrypt.hash(newPassword, saltRounds);

  try {
    await prisma.$transaction(async (tx) => {
      await tx.account.update({
        where: { id: accountId },
        data: { password: hashedNewPassword },
      });

      // Revoke all active refresh tokens (force re-login everywhere)
      await tx.refreshToken.updateMany({
        where: {
          accountId,
          revokedAt: null,
        },
        data: { revokedAt: new Date() },
      });
    });
  } catch (error: unknown) {
    if (isRecordNotFoundError(error)) {
      throw new ApiError(HTTP_STATUS.NOT_FOUND, 'Account not found', [], ERROR_CODES.RECORD_NOT_FOUND);
    }
    logger.error({ error, accountId }, 'Password change failed with unexpected error');
    throw error;
  }
};
