import { toast } from 'sonner';
import i18n from '@/lib/i18n';

export type UserErrorKind =
  | 'offline'
  | 'timeout'
  | 'session'
  | 'validation'
  | 'conflict'
  | 'notFound'
  | 'rateLimited'
  | 'server'
  | 'unknown';

export interface UserError {
  kind: UserErrorKind;
  titleKey: string;
  messageKey: string;
  action?: 'retry' | 'login' | 'goHome' | 'goBack';
  requestId?: string;
  fieldErrors?: Record<string, string>;
  rawMessage?: string;
}

export interface ErrorContext {
  hasOfflineQueue?: boolean;
  isSaving?: boolean;
  resource?: string;
}

/**
 * Parses field-specific errors from server response
 */
function parseFieldErrors(errors: unknown): Record<string, string> | undefined {
  if (!errors) return undefined;
  const result: Record<string, string> = {};

  if (Array.isArray(errors)) {
    for (const item of errors) {
      if (typeof item === 'string') {
        const colonIdx = item.indexOf(':');
        if (colonIdx > 0) {
          const field = item.slice(0, colonIdx).trim();
          const msg = item.slice(colonIdx + 1).trim();
          result[field] = msg;
        } else {
          result._general = item;
        }
      } else if (item && typeof item === 'object' && 'path' in item && 'message' in item) {
        const field = Array.isArray((item as any).path)
          ? (item as any).path.join('.')
          : String((item as any).path);
        result[field] = String((item as any).message);
      }
    }
  } else if (typeof errors === 'object') {
    for (const [k, v] of Object.entries(errors)) {
      result[k] = String(v);
    }
  }

  return Object.keys(result).length > 0 ? result : undefined;
}

/**
 * Transforms any error (backend API, network, JS crash) into a safe, user-friendly error contract.
 * Mapping precedence:
 * 1. Backend error code
 * 2. HTTP status code
 * 3. Network / offline condition
 * 4. Fallback unknown error
 */
export function toUserError(error: unknown, context?: ErrorContext): UserError {
  const err = error as any;
  const responseData = err?.response?.data;
  const status = typeof err?.response?.status === 'number' ? err.response.status : undefined;
  const code = responseData?.code || err?.code;
  const requestId =
    responseData?.requestId ||
    err?.response?.headers?.['x-request-id'] ||
    err?.response?.headers?.['X-Request-Id'];
  const fieldErrors = parseFieldErrors(responseData?.errors);

  // 1. Backend CODE Mapping
  if (typeof code === 'string') {
    switch (code) {
      case 'VALIDATION_FAILED':
        return {
          kind: 'validation',
          titleKey: 'errors.validation.title',
          messageKey: 'errors.validation.message',
          requestId,
          fieldErrors,
        };
      case 'INVALID_CREDENTIALS':
        return {
          kind: 'session',
          titleKey: 'errors.invalidCredentials.title',
          messageKey: 'errors.invalidCredentials.message',
          action: 'retry',
          requestId,
        };
      case 'PHONE_ALREADY_REGISTERED':
        return {
          kind: 'conflict',
          titleKey: 'errors.phoneRegistered.title',
          messageKey: 'errors.phoneRegistered.message',
          requestId,
          fieldErrors: { phoneNumber: 'errors.phoneRegistered.message' },
        };
      case 'SESSION_EXPIRED':
        return {
          kind: 'session',
          titleKey: 'errors.session.title',
          messageKey: 'errors.session.message',
          action: 'login',
          requestId,
        };
      case 'DUPLICATE_INCOME_ENTRY':
        return {
          kind: 'conflict',
          titleKey: 'errors.duplicateIncome.title',
          messageKey: 'errors.duplicateIncome.message',
          requestId,
        };
      case 'DUPLICATE_EXPENSE_ENTRY':
        return {
          kind: 'conflict',
          titleKey: 'errors.duplicateExpense.title',
          messageKey: 'errors.duplicateExpense.message',
          requestId,
        };
      case 'DUPLICATE_CATEGORY':
        return {
          kind: 'conflict',
          titleKey: 'errors.duplicateCategory.title',
          messageKey: 'errors.duplicateCategory.message',
          requestId,
          fieldErrors: { name: 'errors.duplicateCategory.message' },
        };
      case 'PAYMENT_EXCEEDS_BALANCE':
        return {
          kind: 'validation',
          titleKey: 'errors.paymentExceedsBalance.title',
          messageKey: 'errors.paymentExceedsBalance.message',
          requestId,
          fieldErrors: { amount: 'errors.paymentExceedsBalance.message' },
        };
      case 'CATEGORY_NOT_FOUND':
        return {
          kind: 'notFound',
          titleKey: 'errors.categoryNotFound.title',
          messageKey: 'errors.categoryNotFound.message',
          requestId,
        };
      case 'CUSTOMER_NOT_FOUND':
        return {
          kind: 'notFound',
          titleKey: 'errors.customerNotFound.title',
          messageKey: 'errors.customerNotFound.message',
          action: 'goBack',
          requestId,
        };
      case 'RECORD_NOT_FOUND':
        return {
          kind: 'notFound',
          titleKey: 'errors.recordNotFound.title',
          messageKey: 'errors.recordNotFound.message',
          requestId,
        };
      case 'RATE_LIMITED':
        return {
          kind: 'rateLimited',
          titleKey: 'errors.rateLimited.title',
          messageKey: 'errors.rateLimited.message',
          action: 'retry',
          requestId,
        };
      case 'INTERNAL_ERROR':
        return {
          kind: 'server',
          titleKey: 'errors.server.title',
          messageKey: 'errors.server.message',
          action: 'retry',
          requestId,
        };
    }
  }

  // 2. HTTP Status Code Mapping
  if (status !== undefined) {
    if (status === 400 || status === 422) {
      return {
        kind: 'validation',
        titleKey: 'errors.validation.title',
        messageKey: 'errors.validation.message',
        requestId,
        fieldErrors,
      };
    }
    if (status === 401 || status === 403) {
      return {
        kind: 'session',
        titleKey: 'errors.session.title',
        messageKey: 'errors.session.message',
        action: 'login',
        requestId,
      };
    }
    if (status === 404) {
      return {
        kind: 'notFound',
        titleKey: 'errors.recordNotFound.title',
        messageKey: 'errors.recordNotFound.message',
        action: 'goBack',
        requestId,
      };
    }
    if (status === 409) {
      return {
        kind: 'conflict',
        titleKey: 'errors.duplicateIncome.title',
        messageKey: 'errors.duplicateIncome.message',
        requestId,
      };
    }
    if (status === 429) {
      return {
        kind: 'rateLimited',
        titleKey: 'errors.rateLimited.title',
        messageKey: 'errors.rateLimited.message',
        action: 'retry',
        requestId,
      };
    }
    if (status >= 500) {
      return {
        kind: 'server',
        titleKey: 'errors.server.title',
        messageKey: 'errors.server.message',
        action: 'retry',
        requestId,
      };
    }
  }

  // 3. Network & Connection Conditions
  const isTimeout =
    err?.code === 'ECONNABORTED' ||
    err?.code === 'ETIMEDOUT' ||
    (typeof err?.message === 'string' && err.message.toLowerCase().includes('timeout'));

  if (isTimeout) {
    return {
      kind: 'timeout',
      titleKey: 'errors.timeout.title',
      messageKey: 'errors.timeout.message',
      action: 'retry',
    };
  }

  const isNetworkOffline =
    (typeof navigator !== 'undefined' && !navigator.onLine) ||
    err?.message === 'Network Error' ||
    err?.code === 'ERR_NETWORK';

  if (isNetworkOffline) {
    return {
      kind: 'offline',
      titleKey: 'errors.offline.title',
      messageKey: context?.hasOfflineQueue
        ? 'errors.offlineQueueSaved'
        : 'errors.offlineNoQueue',
      action: 'retry',
    };
  }

  // 4. Default Unknown Error
  return {
    kind: 'unknown',
    titleKey: 'errors.unknown.title',
    messageKey: 'errors.unknown.message',
    action: 'retry',
    rawMessage: typeof err?.message === 'string' ? err.message : undefined,
  };
}

// ── Toast De-duplication Cache ──
const recentToastMessages = new Map<string, number>();
const TOAST_DEDUPE_MS = 3500;

/**
 * Displays an error toast with strict de-duplication to prevent 5 stacked toasts
 */
export function showUserErrorToast(error: unknown, context?: ErrorContext): void {
  const userError = toUserError(error, context);
  const localizedMessage = i18n.t(userError.messageKey);
  const dedupeKey = `${userError.kind}:${localizedMessage}`;

  const now = Date.now();
  const lastShown = recentToastMessages.get(dedupeKey);
  if (lastShown && now - lastShown < TOAST_DEDUPE_MS) {
    return; // De-duplicate identical error
  }
  recentToastMessages.set(dedupeKey, now);

  const fullMessage =
    userError.kind === 'server' && userError.requestId
      ? `${localizedMessage} (${i18n.t('errors.reference')}: ${userError.requestId})`
      : localizedMessage;

  toast.error(fullMessage, {
    id: dedupeKey,
  });
}

// ── Global Error Reporting & Throttled Toast ──
let lastGlobalToastTimestamp = 0;
const GLOBAL_TOAST_THROTTLE_MS = 10000;

/**
 * Global handler for unhandled errors and promise rejections.
 * Throttles toasts to at most ONE generic toast per 10 seconds.
 */
export function reportError(error: unknown, info?: unknown): void {
  if (import.meta.env.DEV) {
    console.error('[ErrorReport]', error, info);
  } else {
    // TODO: Connect to external error monitoring service (e.g. Sentry, Datadog)
  }

  const now = Date.now();
  if (now - lastGlobalToastTimestamp >= GLOBAL_TOAST_THROTTLE_MS) {
    lastGlobalToastTimestamp = now;
    toast.error(i18n.t('errors.unhandled.message'), {
      id: 'global-unhandled-error',
    });
  }
}
