export function getAuthErrorMessage(
  error: unknown,
  context?: 'login' | 'register'
): string {
  if (!error || typeof error !== 'object') {
    return 'auth.errorGeneric';
  }

  const err = error as { response?: { status?: number }; message?: string };

  if (!err.response) {
    // Network / timeout / offline error
    return 'auth.errorNetwork';
  }

  const status = err.response.status;

  if (status === 401 && context === 'login') {
    return 'auth.errorLoginFailed';
  }

  if (status === 409 && context === 'register') {
    return 'auth.errorRegisterFailed';
  }

  if (status === 429) {
    return 'auth.errorRateLimited';
  }

  return 'auth.errorGeneric';
}
