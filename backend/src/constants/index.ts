export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  UNPROCESSABLE_ENTITY: 422,
  INTERNAL_SERVER_ERROR: 500,
  TOO_MANY_REQUESTS: 429,
} as const;

export * from './errorCodes.js';
// Largest value that fits Decimal(10,2); larger amounts must fail validation, not the DB.
export const MAX_AMOUNT = 99_999_999.99;
export const MAX_NOTE_LENGTH = 500;
