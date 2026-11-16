import { Request, Response, NextFunction } from 'express';
import { Prisma } from '@prisma/client';
import ApiError from '../utils/ApiError.js';
import { ErrorResponse } from '../utils/ApiResponse.js';
import logger from '../utils/logger.js';
import { ERROR_CODES, HTTP_STATUS } from '../constants/index.js';

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
    case 409:
      return ERROR_CODES.DUPLICATE_ENTRY;
    case 429:
      return ERROR_CODES.RATE_LIMITED;
    case 500:
      return ERROR_CODES.INTERNAL_ERROR;
    default:
      return 'ERROR';
  }
};

/**
 * Maps known Prisma errors that are caused by the request (not the server) to an
 * ApiError, so a race on a unique key is a 409 and a value the column cannot hold
 * is a 400 — never a 500.
 */
const fromPrismaError = (err: unknown): ApiError | null => {
  if (!(err instanceof Prisma.PrismaClientKnownRequestError)) return null;
  switch (err.code) {
    case 'P2002':
      return new ApiError(HTTP_STATUS.CONFLICT, 'This record already exists', [], ERROR_CODES.DUPLICATE_ENTRY);
    case 'P2000':
    case 'P2020':
      return new ApiError(HTTP_STATUS.BAD_REQUEST, 'A value is out of range', [], ERROR_CODES.VALIDATION_FAILED);
    case 'P2025':
      return new ApiError(HTTP_STATUS.NOT_FOUND, 'Record not found', [], ERROR_CODES.RECORD_NOT_FOUND);
    default:
      return null;
  }
};

const hasStatusCode = (err: Error): err is ApiError =>
  'statusCode' in err && typeof (err as { statusCode?: unknown }).statusCode === 'number';

const errorMiddleware = (err: Error, req: Request, res: Response, _next: NextFunction) => {
  const requestId =
    (req.id ? String(req.id) : undefined) ||
    (req.headers['x-request-id'] as string | undefined) ||
    (res.getHeader('x-request-id') as string | undefined) ||
    (res.getHeader('X-Request-Id') as string | undefined);

  res.setHeader('Access-Control-Expose-Headers', 'x-request-id');
  if (requestId && !res.getHeader('x-request-id')) {
    res.setHeader('x-request-id', requestId);
  }

  logger.error({ err, requestId }, `[${req.method}] ${req.path}`);

  const known = err instanceof ApiError || hasStatusCode(err) ? (err as ApiError) : fromPrismaError(err);
  if (known) {
    const code = getDefaultCode(known);
    return res
      .status(known.statusCode)
      .json(new ErrorResponse(known.statusCode, known.message, known.errors ?? [], code, requestId));
  }

  // Never leak stack traces, Prisma errors, or SQL messages to the client.
  return res
    .status(500)
    .json(new ErrorResponse(500, 'Internal server error', [], ERROR_CODES.INTERNAL_ERROR, requestId));
};

export default errorMiddleware;
