import { Request, Response, NextFunction } from 'express';
import rateLimit, { ipKeyGenerator } from 'express-rate-limit';
import { verifyAccessToken } from '../utils/jwt.js';
import { ErrorResponse } from '../utils/ApiResponse.js';
import { HTTP_STATUS, ERROR_CODES } from '../constants/index.js';

const FIFTEEN_MINUTES = 15 * 60 * 1000;

const limitHandler =
  (message: string) =>
  (req: Request, res: Response): Response =>
    res
      .status(HTTP_STATUS.TOO_MANY_REQUESTS)
      .json(new ErrorResponse(HTTP_STATUS.TOO_MANY_REQUESTS, message, [], ERROR_CODES.RATE_LIMITED));

const ipKey = (req: Request): string => ipKeyGenerator(req.ip ?? 'unknown');

/** Account id from a valid access-token cookie, or null. Used only to pick a rate-limit bucket. */
const accountIdFromCookie = (req: Request): string | null => {
  const token: unknown = req.cookies?.access_token;
  if (typeof token !== 'string' || !token) return null;
  try {
    const payload = verifyAccessToken(token) as { accountId?: unknown };
    return typeof payload.accountId === 'string' ? payload.accountId : null;
  } catch {
    return null;
  }
};

export const DEFAULT_LIMIT_PER_ACCOUNT = 600;
export const DEFAULT_LIMIT_PER_IP = 200;

/**
 * Many phones on one shop Wi-Fi or one mobile carrier share a public IP, so signed-in
 * traffic is limited per account, and only anonymous traffic per IP.
 */
export const defaultLimiter = rateLimit({
  windowMs: FIFTEEN_MINUTES,
  limit: (req: Request) =>
    accountIdFromCookie(req) ? DEFAULT_LIMIT_PER_ACCOUNT : DEFAULT_LIMIT_PER_IP,
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req: Request) => req.path === '/health',
  keyGenerator: (req: Request) => {
    const accountId = accountIdFromCookie(req);
    return accountId ? `acct:${accountId}` : `ip:${ipKey(req)}`;
  },
  handler: limitHandler('Too many requests, please try again later.'),
});

/** Login and register: strict, keyed by IP and phone number so one person cannot lock out a whole network. */
export const authLimiter = rateLimit({
  windowMs: FIFTEEN_MINUTES,
  limit: 10,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req: Request) => {
    const phone: unknown = req.body?.phoneNumber;
    const phoneKey = typeof phone === 'string' ? phone.replace(/\s+/g, '') : '';
    return `${ipKey(req)}|${phoneKey}`;
  },
  handler: limitHandler('Too many login attempts, please try again later.'),
});

/** Refresh runs on every app start and every ~15 minutes of use; it must not share the login limit. */
export const refreshLimiter = rateLimit({
  windowMs: FIFTEEN_MINUTES,
  limit: 60,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req: Request) => ipKey(req),
  handler: limitHandler('Too many requests, please try again later.'),
});

export const exportLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 10, // A few per minute per account
  standardHeaders: true,
  legacyHeaders: false,
  validate: { keyGeneratorIpFallback: false },
  keyGenerator: (req: Request) => req.accountId || 'anonymous',
  handler: (req, res) => {
    return res
      .status(HTTP_STATUS.TOO_MANY_REQUESTS)
      .json(
        new ErrorResponse(
          HTTP_STATUS.TOO_MANY_REQUESTS,
          'Too many export requests, please wait a minute before trying again.',
          [],
          ERROR_CODES.RATE_LIMITED,
        ),
      );
  },
});

export const exportTimeoutGuard = (timeoutMs = 30000) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const timer = setTimeout(() => {
      if (!res.headersSent) {
        res
          .status(408)
          .json(
            new ErrorResponse(
              408,
              'Export request timed out. Please try again with a shorter date range.',
              [],
            ),
          );
      }
    }, timeoutMs);

    res.on('finish', () => clearTimeout(timer));
    res.on('close', () => clearTimeout(timer));
    next();
  };
};