import { describe, it, expect, vi, beforeEach } from 'vitest';
import { toast } from 'sonner';
import { showUserErrorToast, reportError } from '@/lib/errors';

vi.mock('sonner', () => ({
  toast: {
    error: vi.fn(),
  },
}));

describe('Toast de-duplication and throttling', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('de-duplicates identical error toasts within dedupe window', () => {
    const errorObj = {
      response: {
        status: 400,
        data: {
          code: 'PAYMENT_EXCEEDS_BALANCE',
        },
      },
    };

    // Trigger 5 times in rapid succession
    for (let i = 0; i < 5; i++) {
      showUserErrorToast(errorObj);
    }

    // Should only have called toast.error once!
    expect(toast.error).toHaveBeenCalledTimes(1);
  });

  it('allows different errors to display separate toasts', () => {
    const error1 = {
      response: {
        status: 404,
        data: { code: 'CATEGORY_NOT_FOUND' },
      },
    };
    const error2 = {
      response: {
        status: 409,
        data: { code: 'DUPLICATE_INCOME_ENTRY' },
      },
    };

    showUserErrorToast(error1);
    showUserErrorToast(error2);

    expect(toast.error).toHaveBeenCalledTimes(2);
  });

  it('global reportError throttles toasts to at most ONE generic toast per 10 seconds', () => {
    vi.useFakeTimers();

    // Trigger 5 unhandled errors
    reportError(new Error('Crash 1'));
    reportError(new Error('Crash 2'));
    reportError(new Error('Crash 3'));

    // Only 1 toast shown
    expect(toast.error).toHaveBeenCalledTimes(1);

    // Advance 5 seconds (not yet 10s)
    vi.advanceTimersByTime(5000);
    reportError(new Error('Crash 4'));
    expect(toast.error).toHaveBeenCalledTimes(1);

    // Advance remaining 5 seconds (total 10s elapsed)
    vi.advanceTimersByTime(5001);
    reportError(new Error('Crash 5'));
    expect(toast.error).toHaveBeenCalledTimes(2);

    vi.useRealTimers();
  });
});
