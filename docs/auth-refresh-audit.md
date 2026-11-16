# `/auth/refresh` audit

## Every path that can call `/auth/refresh`

| Path | Before | After |
|---|---|---|
| `useAuthBootstrap` on app start | Called `api.post('/auth/refresh')` directly. React StrictMode runs the effect twice in development, so 2 calls. | Uses the shared `executeRefresh()`: 1 call, also in StrictMode. Skipped when this device has no saved account. |
| 401 interceptor (`handleResponseError`) | Single-flight within a tab. Any refresh failure (429, 5xx, timeout) logged the user out. | Same single flight; only a 401/403 from refresh logs out. Never runs for `/auth/*` URLs or network errors. |
| Several tabs/windows | Each tab refreshed on its own. | Tabs take turns through `navigator.locks` (`hisab-auth-refresh`). A tab that gets the lock less than 10 s after another tab refreshed reuses that result. Without the Web Locks API it falls back to the per-tab single flight; the server's 30 s grace window covers the overlap. |
| TanStack Query retries | 4xx are never retried (`queryClient.ts`), so a 401 is handled once by the interceptor. | Unchanged. |
| `refetchOnWindowFocus` | Refetches data on focus; a refresh happens only if the access token has expired. | Unchanged. |
| Service worker | `/api/` is `NetworkOnly`; the SW never calls refresh. | Unchanged. |
| Rate limit | `/auth/refresh` shared the login limiter (10 / 15 min / IP), so duplicate calls could lock a session out. | Own limiter, 60 / 15 min / IP. |

## Counts (from `frontend/tests/refreshCount.test.tsx`)

| Scenario | Calls |
|---|---|
| Landing / login / register, no saved account | 0 |
| Opening the app with a saved account (StrictMode) | 1 |
| Five screens getting a 401 at once | 1 |
| 20 minutes idle (fake timers) | 0 |
| Second tab right after the first tab refreshed | 1 total |
| After logout, a 401 on `/auth/login` | 0 |

In normal use, after start-up a refresh happens only when the 15-minute access token has expired and a request needs it.

## Session length (decision: sliding 30 days)

The owner chose a sliding session. Every successful refresh now:

1. revokes the presented refresh token (`revokedAt = now`) with a conditional update, so only one request wins;
2. issues a new refresh token valid for `JWT_REFRESH_EXPIRES_IN` (30 days) and sets it as the `refresh_token` cookie.

A token revoked less than **30 seconds** ago is still accepted once more and returns an access token without issuing another refresh token. Two tabs, or a slow retry, can send the previous cookie right after a rotation; the browser already holds the new cookie. A token revoked longer ago is rejected with 401 and logged as a reuse warning.

**Trade-off:** a stolen refresh token stays usable until the next rotation by the real user, plus 30 seconds, instead of for its full 30 days. Reuse is detected and rejected but does not revoke the account's other sessions, so an edge case cannot log dad out on every device. Refresh JWTs now carry a random `jti`, so two tokens issued in the same second are always different.
