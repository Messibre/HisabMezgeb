import { describe, it, expect, vi, beforeEach, Mock } from 'vitest';
import { Request, Response, NextFunction } from 'express';
import {
  register,
  login,
  refresh,
  logout,
  changePassword,
} from '../../src/controllers/auth.controller.js';
import * as authService from '../../src/services/auth.service.js';
import ApiError from '../../src/utils/ApiError.js';

vi.mock('../../src/services/auth.service.js', () => ({
  registerAccount: vi.fn(),
  loginAccount: vi.fn(),
  refreshAccessToken: vi.fn(),
  logoutAccount: vi.fn(),
  changePassword: vi.fn(),
}));

describe('Auth Controller', () => {
  let req: Partial<Request> & { accountId?: string; cookies?: Record<string, string> };
  let res: Partial<Response>;
  let next: NextFunction;

  beforeEach(() => {
    req = {
      body: {},
      cookies: {},
      accountId: 'acc-123',
    };
    res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn().mockReturnThis(),
      cookie: vi.fn().mockReturnThis(),
      clearCookie: vi.fn().mockReturnThis(),
    };
    next = vi.fn() as unknown as NextFunction;
    vi.clearAllMocks();
  });

  describe('register', () => {
    const mockAccount = {
      id: 'acc-123',
      phoneNumber: '+251911223344',
      shopName: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    it('should register and set both cookies', async () => {
      req.body = { phoneNumber: '0911223344', password: 'pass123', shopName: 'Shop' };
      (authService.registerAccount as Mock).mockResolvedValue({
        account: mockAccount,
        accessToken: 'access',
        refreshToken: 'refresh',
      });

      await register(req as Request, res as Response, next);

      expect(authService.registerAccount).toHaveBeenCalledWith('0911223344', 'pass123', 'Shop');
      expect(res.cookie).toHaveBeenCalledWith(
        'access_token',
        'access',
        expect.objectContaining({ maxAge: 15 * 60 * 1000 }),
      );
      expect(res.cookie).toHaveBeenCalledWith(
        'refresh_token',
        'refresh',
        expect.objectContaining({ maxAge: 30 * 24 * 60 * 60 * 1000 }),
      );
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          statusCode: 201,
          success: true,
          message: 'Account registered',
          data: mockAccount,
        }),
      );
    });

    it('should pass errors to next', async () => {
      const error = new ApiError(409, 'Duplicate');
      (authService.registerAccount as Mock).mockRejectedValue(error);
      req.body = { phoneNumber: '0911223344', password: 'pass123' };

      await register(req as Request, res as Response, next);

      expect(next).toHaveBeenCalledWith(error);
    });
  });

  describe('login', () => {
    const mockAccount = {
      id: 'acc-123',
      phoneNumber: '+251911223344',
      shopName: 'My Shop',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    it('should login and set cookies', async () => {
      req.body = { phoneNumber: '0911223344', password: 'pass123' };
      (authService.loginAccount as Mock).mockResolvedValue({
        account: mockAccount,
        accessToken: 'access',
        refreshToken: 'refresh',
      });

      await login(req as Request, res as Response, next);

      expect(authService.loginAccount).toHaveBeenCalledWith('0911223344', 'pass123');
      expect(res.cookie).toHaveBeenCalledTimes(2);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          statusCode: 200,
          message: 'Logged in',
          data: mockAccount,
        }),
      );
    });

    it('should pass errors to next', async () => {
      const error = new ApiError(401, 'Invalid');
      (authService.loginAccount as Mock).mockRejectedValue(error);
      req.body = { phoneNumber: '0911223344', password: 'wrong' };

      await login(req as Request, res as Response, next);

      expect(next).toHaveBeenCalledWith(error);
    });
  });

  describe('refresh', () => {
    const mockAccount = {
      id: 'acc-123',
      phoneNumber: '+251911223344',
      shopName: 'My Shop',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    it('should refresh access token using cookie', async () => {
      req.cookies = { refresh_token: 'valid-refresh' };
      (authService.refreshAccessToken as Mock).mockResolvedValue({
        account: mockAccount,
        accessToken: 'new-access',
      });

      await refresh(req as Request, res as Response, next);

      expect(authService.refreshAccessToken).toHaveBeenCalledWith('valid-refresh');
      expect(res.cookie).toHaveBeenCalledWith(
        'access_token',
        'new-access',
        expect.objectContaining({ maxAge: 15 * 60 * 1000 }),
      );
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          statusCode: 200,
          message: 'Access token refreshed',
          data: mockAccount,
        }),
      );
    });

    it('should throw 401 if no refresh token cookie', async () => {
      req.cookies = {};
      await refresh(req as Request, res as Response, next);

      const error = (next as Mock).mock.calls[0][0];
      expect(error).toBeInstanceOf(ApiError);
      expect(error.statusCode).toBe(401);
      expect(error.message).toBe('No refresh token provided');
    });
  });

  describe('logout', () => {
    it('should clear cookies and revoke refresh token', async () => {
      req.cookies = { refresh_token: 'valid-refresh' };
      (authService.logoutAccount as Mock).mockResolvedValue(undefined);

      await logout(req as Request, res as Response, next);

      expect(authService.logoutAccount).toHaveBeenCalledWith('valid-refresh');
      expect(res.clearCookie).toHaveBeenCalledTimes(2);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          statusCode: 200,
          message: 'Logged out successfully',
          data: null,
        }),
      );
    });

    it('should clear cookies even if revocation fails', async () => {
      req.cookies = { refresh_token: 'valid-refresh' };
      (authService.logoutAccount as Mock).mockRejectedValue(new Error('DB error'));

      await logout(req as Request, res as Response, next);

      expect(res.clearCookie).toHaveBeenCalledTimes(2);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(next).not.toHaveBeenCalledWith(expect.any(Error));
    });

    it('should handle missing refresh token cookie', async () => {
      req.cookies = {};

      await logout(req as Request, res as Response, next);

      expect(authService.logoutAccount).not.toHaveBeenCalled();
      expect(res.clearCookie).toHaveBeenCalledTimes(2);
      expect(res.status).toHaveBeenCalledWith(200);
    });
  });

  describe('changePassword', () => {
    it('should change password and clear cookies', async () => {
      req.body = { currentPassword: 'old', newPassword: 'new' };
      req.accountId = 'acc-123';
      (authService.changePassword as Mock).mockResolvedValue(undefined);

      await changePassword(req as Request, res as Response, next);

      expect(authService.changePassword).toHaveBeenCalledWith('acc-123', 'old', 'new');
      expect(res.clearCookie).toHaveBeenCalledTimes(2);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          statusCode: 200,
          message: 'Password updated',
          data: null,
        }),
      );
    });

    it('should pass errors to next', async () => {
      const error = new ApiError(401, 'Current password is incorrect');
      (authService.changePassword as Mock).mockRejectedValue(error);
      req.body = { currentPassword: 'wrong', newPassword: 'new' };

      await changePassword(req as Request, res as Response, next);

      expect(next).toHaveBeenCalledWith(error);
    });
  });
});
