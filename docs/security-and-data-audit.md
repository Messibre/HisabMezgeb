# Security and data-loss audit

Branch `fix/production-hardening`, November 2026. Read from the code and run against the test suites; the live site and database were **not** reachable from here.

Status: **OK** / **PROBLEM (fixed)** / **PROBLEM (open)** / **CANNOT CHECK**.

## Step 0 — Backups (hard stop)

| Item | Status | Evidence |
|---|---|---|
| Backup, restore, verify and retention scripts | OK | `backend/scripts/*.sh`, runbook `backend/docs/backup-and-restore.md` |
| A schedule that runs them in production | **CANNOT CHECK / likely missing** | The runbook shows a cron line with a placeholder path (`/path/to/hisabmezgeb/...`). No GitHub workflow, Render cron job or other scheduler is in the repo. |
| Last backup run, where encrypted copies are | CANNOT CHECK | Needs the host. |
| `verify-restore.sh` ever run on a real backup | CANNOT CHECK | No record in the repo. |

**Decision taken (owner, 2026-11-16):** work that does not touch the schema goes ahead; **every Prisma migration is on hold** until a backup is scheduled and a restore has been checked. On Render, add a *Cron Job* service that runs `scripts/run-scheduled-backup.sh` (needs `pg_dump`, `age` and the R2 credentials in its environment), or use the Neon/Supabase point-in-time restore plus a weekly off-site dump.

## Findings

| # | Area | Status | Severity | Evidence | Fix |
|---|---|---|---|---|---|
| 1 | `/auth/refresh` shared the login limiter (10 / 15 min / IP) | PROBLEM (fixed) | High | `routes/auth.routes.ts` | Own `refreshLimiter` (60 / 15 min / IP). Commit `ec20b95`. |
| 2 | Login/register limited per IP only (shared mobile IPs) | PROBLEM (fixed) | Medium | `rateLimiter.middleware.ts` | Keyed by IP + phone number. |
| 3 | Default limiter 100 / 15 min / IP, also on `/health`; cookies parsed after it | PROBLEM (fixed) | High | `app.ts`, `rateLimiter.middleware.ts` | Per account (600) when signed in, per IP (200) otherwise, `/health` skipped, cookie parser moved before it. |
| 4 | Any refresh failure (429, 5xx, timeout) logged the user out and wiped the cache | PROBLEM (fixed) | High | `frontend/src/lib/axios.ts` | Only 401/403 from refresh logs out. Commit `e1b1be4`. |
| 5 | No log redaction: cookies could reach the logs | PROBLEM (fixed) | High | `utils/logger.ts` | Redacts `cookie`, `authorization`, `set-cookie`, password fields; test sends real values and checks the output. Commit `f8fcdfc`. |
| 6 | Re-adding a deleted day's income/expense → unique key on soft-deleted row → **500** | PROBLEM (fixed) | High | `@@unique([accountId, date])` + `createIncome` checked `deletedAt: null` only | Chose **reviving the deleted row** (no migration needed, keeps one row per day). P2002 → 409, P2020 → 400, P2025 → 404 everywhere. Commit `b036107`. |
| 7 | Payment race: balance checked outside a transaction | PROBLEM (fixed) | High | `debtPayment.service.ts` | `createPayment`/`updatePayment` run in a transaction with `SELECT … FOR UPDATE` on the customer. Commit `c9ff26d`. |
| 8 | Balance subtracted as floats (0.30 full payment could be refused) | PROBLEM (fixed) | Medium | `calculateCustomerBalance` | Decimal subtraction. |
| 9 | Amount above `Decimal(10,2)` → DB error → 500; notes unlimited | PROBLEM (fixed) | Medium | `schemas/*.ts` | `max(99,999,999.99)`, notes ≤ 500 chars. Commit `bda20ed`. |
| 10 | `as any` in `app.ts` and export limiter | PROBLEM (fixed) | Low | | Typed. |
| 11 | `CLIENT_URL` defaulted to `*` | PROBLEM (fixed) | Medium | `config/env.ts` | Default is localhost; production logs **UNSAFE PRODUCTION CONFIGURATION** if the origin is not one exact `https://` origin or the JWT secrets are short/identical. It warns rather than exits so a deploy never takes the live app down. |
| 12 | Dependencies (`npm audit --omit=dev`) | PROBLEM (fixed) | Critical/High | backend 14 (1 critical `proxy-addr`), frontend 26 | All semver-compatible updates; both now **0**. `shadcn` CLI moved to devDependencies (build-time only). |
| 13 | `onDelete: Cascade` on money tables | PROBLEM (open, migration held) | Medium | `schema.prisma` | No code hard-deletes today, so only a manual DB delete can trigger it. Change to `Restrict` after the backup is verified. |
| 14 | Refresh tokens do not rotate (fixed 30 days) | PROBLEM (decided) | Medium | `auth.service.ts` | Owner chose a sliding 30-day session; built in WP8. |
| 15 | Account isolation | OK (code read) | — | Every update/delete by id is preceded by a `findFirst/findUnique` with `accountId`; list queries filter by `accountId`. | A database-backed cross-account test suite needs Postgres (Docker was not running here). **CANNOT CHECK at runtime** — run the check in section E of doc 17 by hand. |
| 16 | Password hashing | OK | — | bcrypt, `BCRYPT_SALT_ROUNDS` (default 10). 12 is a reasonable production value. | |
| 17 | Password change revokes all sessions; login does not revoke other devices | OK | — | `auth.service.ts` | |
| 18 | Secrets in git history | OK | — | `git log --all` search: only `.env.example` placeholders and test-only URLs. | |
| 19 | Frontend: tokens in storage, `dangerouslySetInnerHTML`, secrets in the bundle | OK | — | Only `VITE_API_URL`, `VITE_APP_ENV`, `VITE_APP_NAME` in `dist`. Persisted store holds the account object only. | |
| 20 | Service worker caches API responses | OK | — | `vite.config.ts`: `/api/` is `NetworkOnly`, denylisted from navigation fallback. Nothing user-specific is in Cache Storage after logout. | |
| 21 | Dates | OK | — | Frontend sends local `YYYY-MM-DD` (`toApiDate`, never `toISOString`); server stores it as a date. 00:30 in Addis on 14 Nov is sent as `2026-11-14`. | |
| 22 | Money precision in API responses | PROBLEM (open) | Low | Services return `amount.toNumber()`; frontend uses `parseFloat` on inputs. | Values are ≤ 2 decimals and < 1e8, so doubles are exact enough to display. Changing the wire type to strings would break the frontend contract; left as is. |
| 23 | Offline: what happens when Save is pressed with no internet | PROBLEM | High | The offline queue exists but no hook uses it; every create posts directly. | **The entry is not saved.** WP3 makes this honest (Save disabled offline). |
| 24 | `trust proxy` = 1 | OK for Render | — | Render puts one proxy in front of the service. | |

## Commands for the owner (live site)

Cookies (expect `HttpOnly; Secure; SameSite=None; Path=/api/v1`):

```bash
curl -si -X POST https://<api-host>/api/v1/auth/login -H "Content-Type: application/json" -d '{"phoneNumber":"<test phone>","password":"<test password>"}' | grep -i set-cookie
```

Use a test account, not dad's. CORS: in Render → Environment, `CLIENT_URL` must be exactly the frontend origin (for example `https://hisab-mezgeb.vercel.app`, no trailing slash). After deploying, search the Render logs for `UNSAFE PRODUCTION CONFIGURATION`.

## Health and uptime

`GET /health` returns `{status: "ok"}` only, and is not rate limited. Point a free uptime monitor (for example UptimeRobot) at it every 5 minutes; on a sleeping Render plan this also shows how often the API is cold.

## Content-Security-Policy (try in report-only first)

```
Content-Security-Policy-Report-Only: default-src 'self'; script-src 'self' 'sha256-<hash of the inline theme script>'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; font-src 'self'; connect-src 'self' https://<api-host>; manifest-src 'self'; worker-src 'self'; frame-ancestors 'none'; base-uri 'self'; form-action 'self'
```

## Migrations on hold (need a verified backup first)

| Migration | Why |
|---|---|
| `onDelete: Restrict` for category→expenses and customer→borrows/payments | Finding 13 |
| `clientRequestId` + unique `(accountId, clientRequestId)` on borrow, payment, funding | WP3 idempotency |
| `systemKey` on `ExpenseCategory` + backfill | WP5 |
| Indexes, if WP7 measurements show slow queries | WP7 |
