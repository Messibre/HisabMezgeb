import { describe, it, expect, vi, beforeEach, Mock } from 'vitest';
import { Request, Response, NextFunction } from 'express';
import authMiddleware from '../../src/middlewares/auth.middleware.js';
import { verifyAccessToken } from '../../src/utils/jwt.js';
import ApiError from '../../src/utils/ApiError.js';

vi.mock('../../src/utils/jwt.js', () => ({
  verifyAccessToken: vi.fn(),
}));

describe('Auth Middleware', () => {
  let req: Partial<Request> & { cookies?: Record<string, string>; accountId?: string };
  let res: Partial<Response>;
  let next: NextFunction;

  beforeEach(() => {
    req = { cookies: {} };
    res = {};
    next = vi.fn() as unknown as NextFunction;
    vi.clearAllMocks();
  });

  it('should attach accountId to request when valid access token is provided', () => {
    const mockPayload = { accountId: 'acc-123' };
    req.cookies = { access_token: 'valid-token' };
    (verifyAccessToken as Mock).mockReturnValue(mockPayload);

    authMiddleware(req as Request, res as Response, next);

    expect(verifyAccessToken).toHaveBeenCalledWith('valid-token');
    expect(req.accountId).toBe('acc-123');
    expect(next).toHaveBeenCalledWith();
  });

  it('should call next with 401 error when no access_token cookie exists', () => {
    req.cookies = {};
    authMiddleware(req as Request, res as Response, next);

    expect(verifyAccessToken).not.toHaveBeenCalled();
    const error = (next as Mock).mock.calls[0][0];
    expect(error).toBeInstanceOf(ApiError);
    expect(error.statusCode).toBe(401);
    expect(error.message).toBe('No token provided');
  });

  it('should call next with 401 when access_token is an empty string', () => {
    req.cookies = { access_token: '' };
    authMiddleware(req as Request, res as Response, next);

    const error = (next as Mock).mock.calls[0][0];
    expect(error).toBeInstanceOf(ApiError);
    expect(error.statusCode).toBe(401);
    expect(error.message).toBe('No token provided');
  });

  it('should call next with 401 when token verification throws', () => {
    req.cookies = { access_token: 'invalid' };
    (verifyAccessToken as Mock).mockImplementation(() => {
      throw new Error('jwt malformed');
    });

    authMiddleware(req as Request, res as Response, next);

    const error = (next as Mock).mock.calls[0][0];
    expect(error).toBeInstanceOf(ApiError);
    expect(error.statusCode).toBe(401);
    expect(error.message).toBe('Invalid or expired token');
  });

  it('should call next with 401 when token is expired', () => {
    req.cookies = { access_token: 'expired' };
    (verifyAccessToken as Mock).mockImplementation(() => {
      const err = new Error('jwt expired');
      err.name = 'TokenExpiredError';
      throw err;
    });

    authMiddleware(req as Request, res as Response, next);

    const error = (next as Mock).mock.calls[0][0];
    expect(error).toBeInstanceOf(ApiError);
    expect(error.statusCode).toBe(401);
    expect(error.message).toBe('Invalid or expired token');
  });

  it('should handle missing accountId in payload without crashing', () => {
    req.cookies = { access_token: 'valid-but-malformed' };
    (verifyAccessToken as Mock).mockReturnValue({}); // no accountId

    authMiddleware(req as Request, res as Response, next);

    expect(next).toHaveBeenCalledWith();
    expect(req.accountId).toBeUndefined();
  });

  it('should handle undefined cookies gracefully', () => {
    req.cookies = undefined;
    authMiddleware(req as Request, res as Response, next);

    const error = (next as Mock).mock.calls[0][0];
    expect(error).toBeInstanceOf(ApiError);
    expect(error.statusCode).toBe(401);
    expect(error.message).toBe('No token provided');
  });
});
