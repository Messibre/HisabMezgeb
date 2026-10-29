import { Request, Response, NextFunction } from 'express';
import ApiError from '../utils/ApiError.js';
import { ErrorResponse } from '../utils/ApiResponse.js';
import logger from '../utils/logger.js';
import { ERROR_CODES } from '../constants/index.js';

const getDefaultCode = (err: ApiError): string => {
  if (err.code) return err.code;
  switch (err.statusCode) {
    case 400:
      return ERROR_CODES.VALIDATION_FAILED;
    case 401:
      if (err.message.toLowerCase().includes('password') || err.message.toLowerCase().includes('credential')) {
        return ERROR_CODES.INVALID_CREDENTIALS;
      }
      return ERROR_CODES.SESSION_EXPIRED;
    case 404:
      return ERROR_CODES.RECORD_NOT_FOUND;
    case 429:
      return ERROR_CODES.RATE_LIMITED;
    case 500:
      return ERROR_CODES.INTERNAL_ERROR;
    default:
      return 'ERROR';
  }
};

const errorMiddleware = (err: Error, req: Request, res: Response, _next: NextFunction) => {
  const requestId =
    ((req as any).id as string | undefined) ||
    (req.headers['x-request-id'] as string | undefined) ||
    (res.getHeader('x-request-id') as string | undefined) ||
    (res.getHeader('X-Request-Id') as string | undefined);

  // Expose x-request-id header to browsers
  res.setHeader('Access-Control-Expose-Headers', 'x-request-id');
  if (requestId && !res.getHeader('x-request-id')) {
    res.setHeader('x-request-id', requestId);
  }

  // 1. Log error with requestId
  logger.error({ err, requestId }, `[${req.method}] ${req.path}`);

  // 2. Handle Known Operational Errors (ApiError)
  if (err instanceof ApiError || ('statusCode' in err && typeof (err as any).statusCode === 'number')) {
    const apiErr = err as ApiError;
    const code = getDefaultCode(apiErr);
    return res
      .status(apiErr.statusCode)
      .json(new ErrorResponse(apiErr.statusCode, apiErr.message, apiErr.errors ?? [], code, requestId));
  }

  // 3. Handle Unknown / System Errors (Prisma, syntax errors, native crashes)
  // Never leak stack traces, Prisma errors, or SQL messages to client
  return res
    .status(500)
    .json(
      new ErrorResponse(
        500,
        'Internal server error',
        [],
        ERROR_CODES.INTERNAL_ERROR,
        requestId
      )
    );
};

export default errorMiddleware;