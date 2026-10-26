import { describe, it, expect } from 'vitest';
import { toUserError, type UserErrorKind } from '@/lib/errors';

describe('toUserError table-driven tests', () => {
  interface TestCase {
    name: string;
    error: any;
    context?: any;
    expectedKind: UserErrorKind;
    expectedTitleKey: string;
    expectedMessageKey: string;
    expectedAction?: string;
    expectedRequestId?: string;
    checkFieldErrors?: (fieldErrors?: Record<string, string>) => void;
  }

  const cases: TestCase[] = [
    // ── Backend CODE Cases ──
    {
      name: 'VALIDATION_FAILED code',
      error: {
        response: {
          status: 400,
          data: {
            code: 'VALIDATION_FAILED',
            requestId: 'req-val-123',
            errors: ['amount: Amount must be positive'],
          },
        },
      },
      expectedKind: 'validation',
      expectedTitleKey: 'errors.validation.title',
      expectedMessageKey: 'errors.validation.message',
      expectedRequestId: 'req-val-123',
      checkFieldErrors: (fields) => {
        expect(fields?.amount).toBe('Amount must be positive');
      },
    },
    {
      name: 'INVALID_CREDENTIALS code',
      error: {
        response: {
          status: 401,
          data: {
            code: 'INVALID_CREDENTIALS',
            requestId: 'req-auth-456',
          },
        },
      },
      expectedKind: 'session',
      expectedTitleKey: 'errors.invalidCredentials.title',
      expectedMessageKey: 'errors.invalidCredentials.message',
      expectedAction: 'retry',
      expectedRequestId: 'req-auth-456',
    },
    {
      name: 'PHONE_ALREADY_REGISTERED code',
      error: {
        response: {
          status: 409,
          data: {
            code: 'PHONE_ALREADY_REGISTERED',
            requestId: 'req-reg-789',
          },
        },
      },
      expectedKind: 'conflict',
      expectedTitleKey: 'errors.phoneRegistered.title',
      expectedMessageKey: 'errors.phoneRegistered.message',
      expectedRequestId: 'req-reg-789',
      checkFieldErrors: (fields) => {
        expect(fields?.phoneNumber).toBe('errors.phoneRegistered.message');
      },
    },
    {
      name: 'SESSION_EXPIRED code',
      error: {
        response: {
          status: 401,
          data: {
            code: 'SESSION_EXPIRED',
          },
        },
      },
      expectedKind: 'session',
      expectedTitleKey: 'errors.session.title',
      expectedMessageKey: 'errors.session.message',
      expectedAction: 'login',
    },
    {
      name: 'DUPLICATE_INCOME_ENTRY code',
      error: {
        response: {
          status: 409,
          data: {
            code: 'DUPLICATE_INCOME_ENTRY',
          },
        },
      },
      expectedKind: 'conflict',
      expectedTitleKey: 'errors.duplicateIncome.title',
      expectedMessageKey: 'errors.duplicateIncome.message',
    },
    {
      name: 'DUPLICATE_EXPENSE_ENTRY code',
      error: {
        response: {
          status: 409,
          data: {
            code: 'DUPLICATE_EXPENSE_ENTRY',
          },
        },
      },
      expectedKind: 'conflict',
      expectedTitleKey: 'errors.duplicateExpense.title',
      expectedMessageKey: 'errors.duplicateExpense.message',
    },
    {
      name: 'DUPLICATE_CATEGORY code',
      error: {
        response: {
          status: 409,
          data: {
            code: 'DUPLICATE_CATEGORY',
          },
        },
      },
      expectedKind: 'conflict',
      expectedTitleKey: 'errors.duplicateCategory.title',
      expectedMessageKey: 'errors.duplicateCategory.message',
      checkFieldErrors: (fields) => {
        expect(fields?.name).toBe('errors.duplicateCategory.message');
      },
    },
    {
      name: 'PAYMENT_EXCEEDS_BALANCE code',
      error: {
        response: {
          status: 400,
          data: {
            code: 'PAYMENT_EXCEEDS_BALANCE',
          },
        },
      },
      expectedKind: 'validation',
      expectedTitleKey: 'errors.paymentExceedsBalance.title',
      expectedMessageKey: 'errors.paymentExceedsBalance.message',
      checkFieldErrors: (fields) => {
        expect(fields?.amount).toBe('errors.paymentExceedsBalance.message');
      },
    },
    {
      name: 'CATEGORY_NOT_FOUND code',
      error: {
        response: {
          status: 404,
          data: {
            code: 'CATEGORY_NOT_FOUND',
          },
        },
      },
      expectedKind: 'notFound',
      expectedTitleKey: 'errors.categoryNotFound.title',
      expectedMessageKey: 'errors.categoryNotFound.message',
    },
    {
      name: 'CUSTOMER_NOT_FOUND code',
      error: {
        response: {
          status: 404,
          data: {
            code: 'CUSTOMER_NOT_FOUND',
          },
        },
      },
      expectedKind: 'notFound',
      expectedTitleKey: 'errors.customerNotFound.title',
      expectedMessageKey: 'errors.customerNotFound.message',
      expectedAction: 'goBack',
    },
    {
      name: 'RECORD_NOT_FOUND code',
      error: {
        response: {
          status: 404,
          data: {
            code: 'RECORD_NOT_FOUND',
          },
        },
      },
      expectedKind: 'notFound',
      expectedTitleKey: 'errors.recordNotFound.title',
      expectedMessageKey: 'errors.recordNotFound.message',
    },
    {
      name: 'RATE_LIMITED code',
      error: {
        response: {
          status: 429,
          data: {
            code: 'RATE_LIMITED',
          },
        },
      },
      expectedKind: 'rateLimited',
      expectedTitleKey: 'errors.rateLimited.title',
      expectedMessageKey: 'errors.rateLimited.message',
      expectedAction: 'retry',
    },
    {
      name: 'INTERNAL_ERROR code',
      error: {
        response: {
          status: 500,
          headers: { 'x-request-id': 'req-srv-999' },
          data: {
            code: 'INTERNAL_ERROR',
          },
        },
      },
      expectedKind: 'server',
      expectedTitleKey: 'errors.server.title',
      expectedMessageKey: 'errors.server.message',
      expectedAction: 'retry',
      expectedRequestId: 'req-srv-999',
    },

    // ── HTTP Status Code Fallbacks ──
    {
      name: 'HTTP 400 without specific code',
      error: {
        response: {
          status: 400,
          data: { message: 'Bad request' },
        },
      },
      expectedKind: 'validation',
      expectedTitleKey: 'errors.validation.title',
      expectedMessageKey: 'errors.validation.message',
    },
    {
      name: 'HTTP 401 without specific code',
      error: {
        response: {
          status: 401,
          data: { message: 'Unauthorized' },
        },
      },
      expectedKind: 'session',
      expectedTitleKey: 'errors.session.title',
      expectedMessageKey: 'errors.session.message',
      expectedAction: 'login',
    },
    {
      name: 'HTTP 404 without specific code',
      error: {
        response: {
          status: 404,
          data: { message: 'Not found' },
        },
      },
      expectedKind: 'notFound',
      expectedTitleKey: 'errors.recordNotFound.title',
      expectedMessageKey: 'errors.recordNotFound.message',
      expectedAction: 'goBack',
    },
    {
      name: 'HTTP 409 without specific code',
      error: {
        response: {
          status: 409,
          data: { message: 'Conflict' },
        },
      },
      expectedKind: 'conflict',
      expectedTitleKey: 'errors.duplicateIncome.title',
      expectedMessageKey: 'errors.duplicateIncome.message',
    },
    {
      name: 'HTTP 429 without specific code',
      error: {
        response: {
          status: 429,
          data: { message: 'Too many requests' },
        },
      },
      expectedKind: 'rateLimited',
      expectedTitleKey: 'errors.rateLimited.title',
      expectedMessageKey: 'errors.rateLimited.message',
      expectedAction: 'retry',
    },
    {
      name: 'HTTP 502 Bad Gateway',
      error: {
        response: {
          status: 502,
          data: { message: 'Bad Gateway' },
        },
      },
      expectedKind: 'server',
      expectedTitleKey: 'errors.server.title',
      expectedMessageKey: 'errors.server.message',
      expectedAction: 'retry',
    },

    // ── Network / Timeout / Offline ──
    {
      name: 'Axios timeout (ECONNABORTED)',
      error: {
        code: 'ECONNABORTED',
        message: 'timeout of 15000ms exceeded',
      },
      expectedKind: 'timeout',
      expectedTitleKey: 'errors.timeout.title',
      expectedMessageKey: 'errors.timeout.message',
      expectedAction: 'retry',
    },
    {
      name: 'Offline with offline queue (e.g. background sync supported)',
      error: {
        message: 'Network Error',
      },
      context: { hasOfflineQueue: true },
      expectedKind: 'offline',
      expectedTitleKey: 'errors.offline.title',
      expectedMessageKey: 'errors.offlineQueueSaved',
      expectedAction: 'retry',
    },
    {
      name: 'Offline without offline queue',
      error: {
        message: 'Network Error',
      },
      context: { hasOfflineQueue: false },
      expectedKind: 'offline',
      expectedTitleKey: 'errors.offline.title',
      expectedMessageKey: 'errors.offlineNoQueue',
      expectedAction: 'retry',
    },

    // ── Default Fallback ──
    {
      name: 'Generic JS error',
      error: new Error('Unexpected crash'),
      expectedKind: 'unknown',
      expectedTitleKey: 'errors.unknown.title',
      expectedMessageKey: 'errors.unknown.message',
      expectedAction: 'retry',
    },
  ];

  cases.forEach((tc) => {
    it(`correctly maps: ${tc.name}`, () => {
      const result = toUserError(tc.error, tc.context);
      expect(result.kind).toBe(tc.expectedKind);
      expect(result.titleKey).toBe(tc.expectedTitleKey);
      expect(result.messageKey).toBe(tc.expectedMessageKey);

      if (tc.expectedAction) {
        expect(result.action).toBe(tc.expectedAction);
      }
      if (tc.expectedRequestId) {
        expect(result.requestId).toBe(tc.expectedRequestId);
      }
      if (tc.checkFieldErrors) {
        tc.checkFieldErrors(result.fieldErrors);
      }
    });
  });
});
