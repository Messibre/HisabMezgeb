import { Request, Response, NextFunction } from 'express';
import rateLimit from 'express-rate-limit';
import { ErrorResponse } from '../utils/ApiResponse.js';
import { HTTP_STATUS, ERROR_CODES } from '../constants/index.js';

export const defaultLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    return res
      .status(HTTP_STATUS.TOO_MANY_REQUESTS)
      .json(
        new ErrorResponse(
          HTTP_STATUS.TOO_MANY_REQUESTS,
          'Too many requests, please try again later.',
          [],
          ERROR_CODES.RATE_LIMITED,
        ),
      );
  },
});

export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    return res
      .status(HTTP_STATUS.TOO_MANY_REQUESTS)
      .json(
        new ErrorResponse(
          HTTP_STATUS.TOO_MANY_REQUESTS,
          'Too many login attempts, please try again later.',
          [],
          ERROR_CODES.RATE_LIMITED,
        ),
      );
  },
});

export const exportLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 10, // A few per minute per account
  standardHeaders: true,
  legacyHeaders: false,
  validate: { keyGeneratorIpFallback: false },
  keyGenerator: (req: any) => req.accountId || 'anonymous',
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