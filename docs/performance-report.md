# Performance report

Measured from the code, the build and the test suites on this branch. The live site, the Render logs and the database were **not** reachable from here, so every live timing below is marked NOT VERIFIED and lists the exact check to run.

## 1. Hosting (likely the biggest factor; NOT VERIFIED)

| Question | What to check | Why it matters |
|---|---|---|
| Does the API sleep? | Render dashboard → service → plan. On the **free** plan the service sleeps after 15 minutes without traffic, and the next request waits for a cold start (often 30–60 s). | Dad opens the app once in the evening, so almost every first request would be a cold start. No frontend change can hide that. |
| Where is it? | Render region and the Neon/Supabase region. | Each request pays the round trip from Addis Ababa. Frankfurt is about 100 ms away; Oregon or Virginia about 250–300 ms. The API and the database should be in the same region. |

Run this twice, the second time right after the first; a big difference means the service was asleep:

```bash
curl -s -o /dev/null -w "%{time_total}s\n" https://<api-host>/health
```

Options if it sleeps: a paid Render instance (Starter, about $7/month) does not sleep. A free uptime ping every 10 minutes keeps it awake but uses free-tier hours and is against the spirit of the free plan. Moving API and DB to one EU region (Frankfurt) is the cheapest latency win.

## 2. Request waterfall on app start

| Step | Before | After |
|---|---|---|
| 1 | `POST /auth/refresh` (spinner, nothing else happens) | `POST /auth/refresh` **and** the page's data requests start together |
| 2 | Load the page's JS chunk | (same request wave) |
| 3 | Data requests (Home: `/income`, `/reports/summary`) | — |

With a saved account the page now renders while the session is checked (`ProtectedRoute`). If the access cookie has expired, the data request gets a 401, waits for the same refresh promise and retries once. On a phone in Addis this saves one full round trip (plus the server time of `/auth/refresh`) on every cold open.

Home makes 3 requests (refresh, today's income, week summary); Entries 2–3; Debts 2; Reports 3. Before WP8, development builds made a duplicate `/auth/refresh` call (StrictMode); that is gone.

## 3. Backend query counts (from the service code)

| Endpoint | Before | After |
|---|---|---|
| `GET /debt-customers` (Debts list) | 1 + **2 per customer**, one after another (30 customers = 61 sequential queries) | **3** queries: customers, then borrow and payment sums grouped by customer, in parallel |
| `GET /reports/summary` (Home, Reports, Debts header) | 7 aggregate queries one after another | the same 7, **in parallel** |

With a database 2–5 ms away, a 30-customer list goes from roughly 120–300 ms of DB time to about 10 ms. Per-route p50/p95 from the pino-http logs (`responseTime` field): NOT VERIFIED; run this on the Render log export:

```bash
grep '"req":{"method":"GET","url":"/api/v1/debt-customers' render.log | jq '.responseTime' | sort -n
```

Indexes: the existing `(accountId, date)` and `(customerId, date)` indexes cover the main filters. No index change is proposed without real query timings (that would also be a held migration).

The summary's "owed" total now counts only customers that still exist, so Home, Reports and the Debts list always agree. Before, a soft-deleted customer's open balance stayed in the total but not in the list.

## 4. Frontend build (`vite build`)

| File | Size | gzip |
|---|---|---|
| main `index-*.js` (React, router, query, axios, zod, radix) | 539 KB | 169 KB |
| `i18n-*.js` (all three locale files) | 93 KB | 27 KB |
| `BottomSheet-*.js` (vaul) | 60 KB | 19 KB |
| CSS | 71 KB | 12 KB |
| Noto Sans Ethiopic (ethiopic subset) | 198 KB | (woff2) |
| Service worker precache | 60 entries, 1.3 MB | one-time download, then served offline |

After the first visit everything is served from the service worker, so bundle size only affects the very first load and updates. Splitting locale files per language would save about 18 KB gzip on first load. That is not worth the extra network request on language switch for this app, so it was not done.

## 5. TanStack Query settings

`staleTime` is 2–10 minutes per query, 4xx errors are never retried, and `refetchOnWindowFocus` only refetches stale data. No refetch storm was found.

## Before / after (live)

| Measure | Before | After |
|---|---|---|
| Cold start (first request after 15 idle min) | NOT VERIFIED | NOT VERIFIED (hosting, see 1) |
| Home ready | refresh RTT + data RTT | max(refresh RTT, data RTT) |
| Debts list, 30 customers | ~61 sequential DB queries | 3 queries |
| Tap Save → confirmation | 1 request | 1 request (unchanged) |

Measure the live numbers with Chrome DevTools → Network → "Slow 4G" on the deployed site before and after deploying this branch.
