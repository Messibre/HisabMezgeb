import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Request, Response, NextFunction } from 'express';
import errorMiddleware from '../../src/middlewares/error.middleware.js';
import ApiError from '../../src/utils/ApiError.js';
import { ERROR_CODES, HTTP_STATUS } from '../../src/constants/index.js';
import logger from '../../src/utils/logger.js';

vi.mock('../../src/utils/logger.js', () => ({
  default: {
    error: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    debug: vi.fn(),
  },
}));

describe('Error Middleware', () => {
  let req: Partial<Request> & { id?: string };
  let res: Partial<Response>;
  let next: NextFunction;
  let statusMock: ReturnType<typeof vi.fn>;
  let jsonMock: ReturnType<typeof vi.fn>;
  let setHeaderMock: ReturnType<typeof vi.fn>;
  let getHeaderMock: ReturnType<typeof vi.fn>;
  let headersSent: Record<string, string>;

  beforeEach(() => {
    headersSent = {};
    jsonMock = vi.fn();
    statusMock = vi.fn().mockImplementation(() => ({ json: jsonMock }));
    setHeaderMock = vi.fn().mockImplementation((key: string, value: string) => {
      headersSent[key.toLowerCase()] = value;
    });
    getHeaderMock = vi.fn().mockImplementation((key: string) => {
      return headersSent[key.toLowerCase()];
    });

    req = {
      method: 'POST',
      path: '/api/v1/income',
      headers: { 'x-request-id': 'req-test-123' },
      id: 'req-test-123',
    };

    res = {
      status: statusMock,
      json: jsonMock,
      setHeader: setHeaderMock,
      getHeader: getHeaderMock,
    };

    next = vi.fn();
    vi.clearAllMocks();
  });

  it('keeps status, message, errors and explicit code for a known ApiError', () => {
    const error = new ApiError(
      HTTP_STATUS.CONFLICT,
      'Income already recorded for this date',
      [],
      ERROR_CODES.DUPLICATE_INCOME_ENTRY
    );

    errorMiddleware(error, req as Request, res as Response, next);

    expect(statusMock).toHaveBeenCalledWith(409);
    expect(jsonMock).toHaveBeenCalledWith(
      expect.objectContaining({
        statusCode: 409,
        success: false,
        message: 'Income already recorded for this date',
        code: ERROR_CODES.DUPLICATE_INCOME_ENTRY,
        requestId: 'req-test-123',
      })
    );
    expect(setHeaderMock).toHaveBeenCalledWith('Access-Control-Expose-Headers', 'x-request-id');
  });

  it('assigns appropriate default code for ApiError when code is not explicitly set', () => {
    const error = new ApiError(HTTP_STATUS.NOT_FOUND, 'Customer not found');

    errorMiddleware(error, req as Request, res as Response, next);

    expect(statusMock).toHaveBeenCalledWith(404);
    expect(jsonMock).toHaveBeenCalledWith(
      expect.objectContaining({
        statusCode: 404,
        success: false,
        code: ERROR_CODES.RECORD_NOT_FOUND,
        requestId: 'req-test-123',
      })
    );
  });

  it('handles validation ApiError (400) by assigning VALIDATION_FAILED code', () => {
    const error = new ApiError(HTTP_STATUS.BAD_REQUEST, 'Validation failed', ['Invalid date format']);

    errorMiddleware(error, req as Request, res as Response, next);

    expect(statusMock).toHaveBeenCalledWith(400);
    expect(jsonMock).toHaveBeenCalledWith(
      expect.objectContaining({
        statusCode: 400,
        success: false,
        code: ERROR_CODES.VALIDATION_FAILED,
        errors: ['Invalid date format'],
        requestId: 'req-test-123',
      })
    );
  });

  it('converts an unknown Error into a safe 500 with INTERNAL_ERROR code without leaking details', () => {
    const unknownError = new Error('Sensitive internal system failure in memory buffer');

    errorMiddleware(unknownError, req as Request, res as Response, next);

    expect(statusMock).toHaveBeenCalledWith(500);
    expect(jsonMock).toHaveBeenCalledWith({
      statusCode: 500,
      success: false,
      message: 'Internal server error',
      errors: [],
      code: ERROR_CODES.INTERNAL_ERROR,
      requestId: 'req-test-123',
    });

    // Real error is logged with logger, including requestId
    expect(logger.error).toHaveBeenCalledWith(
      expect.objectContaining({
        err: unknownError,
        requestId: 'req-test-123',
      }),
      '[POST] /api/v1/income'
    );
  });

  it('never leaks Prisma or SQL error messages to client', () => {
    const prismaError = new Error(
      'Invalid `prisma.dailyIncome.create()` invocation: Unique constraint failed on the fields: (`accountId`,`date`) in schema `hisab`'
    );
    (prismaError as any).code = 'P2002';

    errorMiddleware(prismaError, req as Request, res as Response, next);

    expect(statusMock).toHaveBeenCalledWith(500);
    const sentResponse = jsonMock.mock.calls[0][0];

    expect(sentResponse.message).toBe('Internal server error');
    expect(sentResponse.code).toBe(ERROR_CODES.INTERNAL_ERROR);
    expect(JSON.stringify(sentResponse)).not.toContain('prisma');
    expect(JSON.stringify(sentResponse)).not.toContain('Unique constraint');
    expect(JSON.stringify(sentResponse)).not.toContain('hisab');
  });
});
