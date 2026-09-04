import { describe, it, expect, vi, beforeEach, Mock } from 'vitest';
import bcrypt from 'bcrypt';
import { prisma } from '../../src/config/db.js';
import {
  registerAccount,
  loginAccount,
  refreshAccessToken,
  logoutAccount,
  changePassword,
} from '../../src/services/auth.service.js';
import ApiError from '../../src/utils/ApiError.js';
import {
  generateAccessToken,
  generateRefreshToken,
  hashToken,
  verifyRefreshToken,
} from '../../src/utils/jwt.js';
import { normalizePhone } from '../../src/utils/phoneNormalizer.js';

vi.mock('bcrypt');
vi.mock('../../src/config/db.js', () => ({
  prisma: {
    account: {
      create: vi.fn(),
      findUnique: vi.fn(),
      update: vi.fn(),
    },
    appSettings: { create: vi.fn() },
    expenseCategory: { createMany: vi.fn() },
    refreshToken: {
      create: vi.fn(),
      findFirst: vi.fn(),
      updateMany: vi.fn(),
    },
    $transaction: vi.fn(),
  },
}));
vi.mock('../../src/utils/jwt.js', () => ({
  generateAccessToken: vi.fn(),
  generateRefreshToken: vi.fn(),
  hashToken: vi.fn(),
  verifyRefreshToken: vi.fn(),
}));
vi.mock('../../src/utils/phoneNormalizer.js', () => ({
  normalizePhone: vi.fn(),
}));
vi.mock('crypto', () => ({
  randomUUID: vi.fn(() => 'mock-uuid'),
  createHash: vi.fn(() => ({
    update: vi.fn(() => ({
      digest: vi.fn(() => 'hashed-token'),
    })),
  })),
}));

describe('Auth Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('registerAccount', () => {
    const mockAccount = {
      id: 'acc-123',
      phoneNumber: '+251911223344',
      shopName: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    it('should create account, settings, categories, refresh token and return safe account + tokens', async () => {
      (normalizePhone as Mock).mockReturnValue('+251911223344');
      (bcrypt.hash as Mock).mockResolvedValue('hashed-pw');
      (prisma.$transaction as Mock).mockImplementation(async (cb: any) => {
        const tx = {
          account: { create: vi.fn().mockResolvedValue(mockAccount) },
          appSettings: { create: vi.fn().mockResolvedValue({}) },
          expenseCategory: { createMany: vi.fn().mockResolvedValue({}) },
          refreshToken: { create: vi.fn().mockResolvedValue({}) },
        };
        return cb(tx);
      });
      (generateAccessToken as Mock).mockReturnValue('access-token');
      (generateRefreshToken as Mock).mockReturnValue('refresh-token');
      (hashToken as Mock).mockReturnValue('hashed-refresh');

      const result = await registerAccount('0911223344', 'password123', 'My Shop');

      expect(result.account).toEqual({
        id: mockAccount.id,
        phoneNumber: mockAccount.phoneNumber,
        shopName: mockAccount.shopName,
        createdAt: mockAccount.createdAt,
        updatedAt: mockAccount.updatedAt,
      });
      expect(result.accessToken).toBe('access-token');
      expect(result.refreshToken).toBe('refresh-token');
      expect(bcrypt.hash).toHaveBeenCalledWith('password123', 10);
    });

    it('should throw ApiError 409 if phone number already exists (unique constraint)', async () => {
      (normalizePhone as Mock).mockReturnValue('+251911223344');
      (bcrypt.hash as Mock).mockResolvedValue('hashed-pw');
      (prisma.$transaction as Mock).mockRejectedValue({
        code: 'P2002',
        meta: { target: ['phoneNumber'] },
      });

      await expect(registerAccount('0911223344', 'password123')).rejects.toThrow(ApiError);
      await expect(registerAccount('0911223344', 'password123')).rejects.toMatchObject({
        statusCode: 409,
        message: 'This phone number is already registered',
      });
    });

    it('should throw original error if it is not a unique constraint violation', async () => {
      (normalizePhone as Mock).mockReturnValue('+251911223344');
      (bcrypt.hash as Mock).mockResolvedValue('hashed-pw');
      const dbError = new Error('Some DB error');
      (prisma.$transaction as Mock).mockRejectedValue(dbError);

      await expect(registerAccount('0911223344', 'password123')).rejects.toThrow(dbError);
    });
  });

  describe('loginAccount', () => {
    const mockAccount = {
      id: 'acc-123',
      phoneNumber: '+251911223344',
      shopName: 'My Shop',
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    const mockAccountWithPassword = {
      id: 'acc-123',
      password: 'hashed-pw',
    };

    it('should return safe account + tokens on valid credentials', async () => {
      (normalizePhone as Mock).mockReturnValue('+251911223344');
      (prisma.account.findUnique as Mock)
        .mockResolvedValueOnce(mockAccount)
        .mockResolvedValueOnce(mockAccountWithPassword);
      (bcrypt.compare as Mock).mockResolvedValue(true);
      (generateAccessToken as Mock).mockReturnValue('access-token');
      (generateRefreshToken as Mock).mockReturnValue('refresh-token');
      (hashToken as Mock).mockReturnValue('hashed-refresh');
      (prisma.refreshToken.create as Mock).mockResolvedValue({});

      const result = await loginAccount('0911223344', 'password123');

      expect(result.account).toEqual(mockAccount);
      expect(result.accessToken).toBe('access-token');
      expect(result.refreshToken).toBe('refresh-token');
      expect(prisma.refreshToken.create).toHaveBeenCalled();
    });

    it('should throw 401 with generic message when account not found', async () => {
      (normalizePhone as Mock).mockReturnValue('+251911223344');
      (prisma.account.findUnique as Mock).mockResolvedValue(null);

      await expect(loginAccount('0911223344', 'password123')).rejects.toMatchObject({
        statusCode: 401,
        message: 'Incorrect phone number or password',
      });
    });

    it('should throw 401 with generic message when password is incorrect', async () => {
      (normalizePhone as Mock).mockReturnValue('+251911223344');
      (prisma.account.findUnique as Mock)
        .mockResolvedValueOnce(mockAccount)
        .mockResolvedValueOnce(mockAccountWithPassword);
      (bcrypt.compare as Mock).mockResolvedValue(false);

      await expect(loginAccount('0911223344', 'wrong')).rejects.toMatchObject({
        statusCode: 401,
        message: 'Incorrect phone number or password',
      });
    });

    it('should not leak whether account exists or password is wrong (identical error messages)', async () => {
      // Account missing
      (normalizePhone as Mock).mockReturnValue('+251911223344');
      (prisma.account.findUnique as Mock).mockResolvedValue(null);

      try {
        await loginAccount('0911223344', 'password123');
      } catch (e: any) {
        expect(e.message).toBe('Incorrect phone number or password');
      }

      // Password wrong
      vi.clearAllMocks();
      (normalizePhone as Mock).mockReturnValue('+251911223344');
      (prisma.account.findUnique as Mock)
        .mockResolvedValueOnce(mockAccount)
        .mockResolvedValueOnce(mockAccountWithPassword);
      (bcrypt.compare as Mock).mockResolvedValue(false);

      try {
        await loginAccount('0911223344', 'wrong');
      } catch (e: any) {
        expect(e.message).toBe('Incorrect phone number or password');
      }
    });
  });

  describe('refreshAccessToken', () => {
    const mockAccount = {
      id: 'acc-123',
      phoneNumber: '+251911223344',
      shopName: 'My Shop',
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    const future = new Date(Date.now() + 3600000);

    it('should return new access token when refresh token is valid', async () => {
      (verifyRefreshToken as Mock).mockReturnValue({ accountId: 'acc-123' });
      (hashToken as Mock).mockReturnValue('hashed-refresh');
      (prisma.refreshToken.findFirst as Mock).mockResolvedValue({
        id: 'rt-1',
        account: mockAccount,
        expiresAt: future,
        revokedAt: null,
      });
      (generateAccessToken as Mock).mockReturnValue('new-access-token');

      const result = await refreshAccessToken('valid-refresh');

      expect(result.account).toEqual(mockAccount);
      expect(result.accessToken).toBe('new-access-token');
    });

    it('should throw 401 if refresh token JWT verification fails', async () => {
      (verifyRefreshToken as Mock).mockImplementation(() => {
        throw new Error('invalid');
      });

      await expect(refreshAccessToken('invalid')).rejects.toMatchObject({
        statusCode: 401,
        message: 'Invalid or expired refresh token',
      });
    });

    it('should throw 401 if refresh token is not found in DB (revoked or never existed)', async () => {
      (verifyRefreshToken as Mock).mockReturnValue({ accountId: 'acc-123' });
      (hashToken as Mock).mockReturnValue('hashed-refresh');
      (prisma.refreshToken.findFirst as Mock).mockResolvedValue(null);

      await expect(refreshAccessToken('valid-but-revoked')).rejects.toMatchObject({
        statusCode: 401,
        message: 'Invalid or expired refresh token',
      });
    });

    it('should throw 401 if refresh token is expired', async () => {
      (verifyRefreshToken as Mock).mockReturnValue({ accountId: 'acc-123' });
      (hashToken as Mock).mockReturnValue('hashed-refresh');
      (prisma.refreshToken.findFirst as Mock).mockResolvedValue(null);

      await expect(refreshAccessToken('expired')).rejects.toMatchObject({
        statusCode: 401,
        message: 'Invalid or expired refresh token',
      });
    });

    it('should throw 401 if refresh token is revoked', async () => {
      (verifyRefreshToken as Mock).mockReturnValue({ accountId: 'acc-123' });
      (hashToken as Mock).mockReturnValue('hashed-refresh');
      (prisma.refreshToken.findFirst as Mock).mockResolvedValue(null);

      await expect(refreshAccessToken('revoked')).rejects.toMatchObject({
        statusCode: 401,
        message: 'Invalid or expired refresh token',
      });
    });
  });

  describe('logoutAccount', () => {
    it('should revoke the given refresh token', async () => {
      (hashToken as Mock).mockReturnValue('hashed-refresh');
      (prisma.refreshToken.updateMany as Mock).mockResolvedValue({ count: 1 });

      await logoutAccount('valid-refresh');

      expect(prisma.refreshToken.updateMany).toHaveBeenCalledWith({
        where: { token: 'hashed-refresh', revokedAt: null },
        data: { revokedAt: expect.any(Date) },
      });
    });

    it('should not throw if token not found', async () => {
      (hashToken as Mock).mockReturnValue('hashed-refresh');
      (prisma.refreshToken.updateMany as Mock).mockResolvedValue({ count: 0 });

      await expect(logoutAccount('unknown')).resolves.not.toThrow();
    });

    it('should not throw on database error (best-effort)', async () => {
      (hashToken as Mock).mockReturnValue('hashed-refresh');
      (prisma.refreshToken.updateMany as Mock).mockRejectedValue(new Error('DB down'));

      await expect(logoutAccount('any')).resolves.not.toThrow();
    });
  });

  describe('changePassword', () => {
    it('should update password and revoke all refresh tokens', async () => {
      const mockAccount = { password: 'old-hashed' };
      (prisma.account.findUnique as Mock).mockResolvedValue(mockAccount);
      (bcrypt.compare as Mock).mockResolvedValue(true);
      (bcrypt.hash as Mock).mockResolvedValue('new-hashed');
      (prisma.$transaction as Mock).mockImplementation(async (cb: any) => {
        const tx = {
          account: { update: vi.fn().mockResolvedValue({}) },
          refreshToken: { updateMany: vi.fn().mockResolvedValue({ count: 2 }) },
        };
        return cb(tx);
      });

      await changePassword('acc-123', 'oldPass', 'newPass');

      expect(prisma.account.findUnique).toHaveBeenCalledWith({
        where: { id: 'acc-123' },
        select: { password: true },
      });
      expect(bcrypt.hash).toHaveBeenCalledWith('newPass', 10);
      expect(prisma.$transaction).toHaveBeenCalled();
    });

    it('should throw 401 if current password is incorrect', async () => {
      (prisma.account.findUnique as Mock).mockResolvedValue({ password: 'old-hashed' });
      (bcrypt.compare as Mock).mockResolvedValue(false);

      await expect(changePassword('acc-123', 'wrong', 'newPass')).rejects.toMatchObject({
        statusCode: 401,
        message: 'Current password is incorrect',
      });
    });

    it('should throw 404 if account not found', async () => {
      (prisma.account.findUnique as Mock).mockResolvedValue(null);

      await expect(changePassword('non-existent', 'old', 'new')).rejects.toMatchObject({
        statusCode: 404,
        message: 'Account not found',
      });
    });

    it('should propagate other database errors', async () => {
      (prisma.account.findUnique as Mock).mockResolvedValue({ password: 'old-hashed' });
      (bcrypt.compare as Mock).mockResolvedValue(true);
      (bcrypt.hash as Mock).mockResolvedValue('new-hashed');
      (prisma.$transaction as Mock).mockRejectedValue(new Error('DB error'));

      await expect(changePassword('acc-123', 'old', 'new')).rejects.toThrow('DB error');
    });
  });
});
