# Hisab Mezgeb (ሒሳብ መዝገብ)

A simple daily money and debt tracker for a small family retail shop —
built to replace a paper ledger, not to be a full accounting system.

This README is the practical, day-to-day reference. The full design
reasoning — why every decision below was made, not just what it is —
lives in the numbered spec documents (sections 1–10). Treat this file
as "how do I run/build/extend this," and the spec docs as "why does it
work this way."

---

## 1. What this project is (and isn't)

**Is:** a mobile-first web app for a family shop to log daily income,
categorized expenses, funding movements (money in/out of the shop that
isn't a sale), and customer debt — with reports that never blend those
categories together.

**Isn't:** an inventory system, a multi-user permissioned SaaS product,
or a general-purpose accounting tool. Two people (dad and a brother)
share one login. There are no item-level stock counts. These are
deliberate scope cuts — see [1. Problem & Solution Statement].

**The one rule that shapes everything else:** income and debt are
**two separate, non-reconciled systems**. The nightly income total is
a blended cash figure (shop sales + debt repayments counted together,
because that's how the cash drawer actually works). The debt module
tracks who owes what and since when. Neither one automatically
updates the other. If you're ever unsure why a feature is built a
certain way, this rule is usually the reason — see section 2 of the
requirements doc for the full reasoning.

---

## 2. Project structure

```
hisabmezgeb/
├── backend/     Express + TypeScript + Prisma + Postgres API
└── frontend/    Vite + React + TypeScript SPA
```

Two independent projects, each with its own `package.json`,
dependencies, and dev server. There is no shared workspace/monorepo
tooling (no Turborepo, no npm workspaces) — keep it that way unless a
real pain point shows up, given the project's scale.

---

## 3. Tech stack

### Backend
| Piece | What it's for |
|---|---|
| Express 5 + TypeScript | HTTP server |
| Prisma + `@prisma/adapter-pg` | Database ORM, talks to Postgres |
| Zod | Request validation (one schema file per entity) |
| bcrypt | Password hashing |
| jsonwebtoken | Auth tokens |
| Pino + `pino-http` | Structured logging — this **is** the "app health" technical/error logging from the spec, not a separate system |
| `express-rate-limit` | Rate limiting, with a stricter limiter on auth routes |
| Helmet, cors | Standard hardening |

### Frontend
| Piece | What it's for |
|---|---|
| Vite + React 19 + TypeScript | Build tool + UI framework |
| React Router v7 | Routing, incl. `ProtectedRoute`/`PublicRoute` split |
| TanStack Query | All server data — the cache layer described in section 6.5 |
| Zustand (+ `persist`) | UI-only/client state: the auth token and (soon) theme |
| react-hook-form + Zod | Forms and validation, matching the backend's schemas field-for-field |
| shadcn/ui + Tailwind v4 (Radix primitives) | Component primitives, CSS-variable theming (this is what makes dark mode straightforward to add later) |
| react-i18next + `i18next-browser-languagedetector` | English/Amharic/Tigrigna — see section 8 below |
| lucide-react | Icons (already used for the bottom tab bar) |
| Vitest + React Testing Library | Testing, both projects |

**Why this stack, specifically:** the frontend was originally planned
as Next.js and deliberately switched to Vite + React mid-spec, because
the real target is a Capacitor-wrapped mobile app, not a browser-first
website — Next's SSR/server-route features don't survive being bundled
into a native app shell the way a plain SPA does. See the "Capacitor"
discussion in the project's chat history / spec notes if you want the
full reasoning; the short version is: don't be tempted to add Next.js
back in later without re-reading why it was removed.

---

## 4. Getting started

### Prerequisites
- Node.js (LTS)
- Docker (for local Postgres via `docker-compose`) — or your own Postgres instance

### Backend setup
```bash
cd backend
cp .env.example .env      # fill in DATABASE_URL, JWT_SECRET, CLIENT_URL
docker compose up -d      # starts local Postgres on port 5433
npm install
npm run prisma:generate   # regenerate Prisma client after schema changes
npm run prisma:migrate    # apply migrations (schema.prisma must exist first)
npm run dev                # starts the API on PORT (default 3000)
```

### Frontend setup
```bash
cd frontend
cp .env.example .env      # set VITE_API_URL to the backend's /api/v1
npm install
npm run dev                # starts Vite dev server (default port 5173)
```

**Important env detail:** the backend's `CLIENT_URL` (used for CORS)
must point at the frontend's dev server (`http://localhost:5173`), not
the backend's own port — this was actually wrong in the original
template and has been fixed, but double-check it if CORS errors show
up after any `.env` changes.

### Common scripts (both projects)
| Script | What it does |
|---|---|
| `npm run dev` | Start the dev server |
| `npm run build` | Type-check (`tsc -b` on frontend / `tsc -p tsconfig.build.json` on backend) then build |
| `npm run test` | Run Vitest |
| `npm run lint` | ESLint |
| `npm run format` | Prettier, writes changes |

Backend-only: `npm run prisma:generate`, `npm run prisma:migrate`,
`npm run start` (runs the built `dist/server.js`).
Frontend-only: `npm run preview` (serves the production build locally).

---

## 5. Database

`backend/prisma/schema.prisma` defines 9 models — see [4. Database
Requirements & ER Diagram] for the full field-by-field spec and the
Mermaid ER diagram. In one line each:

- **Account** — the single shared login (phone number + password), one per shop
- **AppSettings** — language + notification preference, one-to-one with Account
- **DailyIncome** — one blended cash total per day (unique per account+date)
- **ExpenseCategory** — user-manageable categories, each tagged `business` or `personal`
- **DailyExpense** — one total per category per day (unique per account+date+category)
- **FundingEntry** — salary injected, capital borrowed, capital repaid — never counted in income/expense totals
- **DebtCustomer** — a person who owes money; balance is always computed, never stored
- **DebtBorrowRecord** / **DebtPayment** — the two event types that make up a customer's balance

**Non-negotiable patterns across every table:**
- **Soft delete only.** Every user-entered table has a nullable
  `deletedAt`; nothing is ever hard-deleted. Every query must filter
  `WHERE deletedAt IS NULL` — there is no database-level enforcement
  of this, it's an application-code discipline. See the
  `calculateCustomerBalance` spec in [8. Function-Level Spec] for why
  this matters concretely (a soft-deleted borrow record must not count
  toward a balance).
- **Money is `Decimal(10,2)`, never a float.** Rounding drift on money
  is a real bug class, not a style preference.
- **`accountId` is on almost every table** and should be indexed —
  nearly every query filters by it.

---

## 6. API conventions

Full endpoint-by-endpoint spec: [5. API Specification]. The short
version, since every route follows the same shape:

- Base path `/api/v1`
- Every response: `{ statusCode, success, message, data }` (the one
  exception is `GET /reports/export`, which returns a raw CSV stream)
- Auth: `Bearer <token>` header; the token payload is just
  `{ accountId }` — there are no roles or permissions to check
- Errors are thrown as `ApiError` and caught centrally by
  `error.middleware.ts` — don't `res.status().json()` errors manually
  in a controller, throw instead
- A day/category can only have one active income or expense entry —
  attempting a second insert returns `409`, and the frontend is
  expected to redirect to editing the existing entry rather than
  showing a raw error (see `createIncome`/`createExpense` in section 8)

---

## 7. Frontend architecture notes

- **Navigation is a fixed bottom tab bar** (`BottomTabLayout.tsx`) —
  five tabs: Home, Entries, Debts, Reports, Settings. There is no side
  menu or hamburger, by design — see section 6.0 for the full mobile-
  first rationale (the target user's daily apps are Facebook, TikTok,
  and WhatsApp, not desktop software).
- **Server state → TanStack Query. UI state → Zustand.** Don't blur
  this line — if it comes from an API call, it's a Query hook; if it's
  purely client-side (auth token, theme), it's the Zustand store.
- **Tables are rendered as card lists, not data-grids.** No column
  resizing, visibility toggles, or row-selection UI — see section 6.0
  for why those were explicitly cut for this audience.
- **The offline queue (`src/lib/offlineQueue.ts`, planned) is not yet
  built.** When you get to it: writes save to IndexedDB immediately,
  sync in strict FIFO order (not parallel) once online, and a 409 from
  a duplicate sync attempt should be treated as a benign "already
  synced" outcome, not a failure. Full spec: `syncPendingEntries` in
  [8. Function-Level Spec].
- **Auth token lives in `localStorage`** via Zustand's `persist`
  middleware. This is a known, documented tradeoff (see the comment
  block in `auth.store.ts`) — accepted for this project's scale rather
  than building httpOnly-cookie infrastructure.

---

## 8. Internationalization (i18n)

Three languages: English, Amharic (አማርኛ), Tigrigna (ትግርኛ).

- **Library:** `react-i18next`, config in `src/lib/i18n.ts`
- **Strings live in** `src/locales/{en,am,ti}.json` — one flat-ish
  nested JSON per language, same key structure across all three. If
  you add a new UI string, add the key to **all three files**, not
  just `en.json`, even if you don't have the translation yet (an
  English fallback string in the `am.json`/`ti.json` slot is better
  than a missing key, which shows the raw key name on screen)
- **Switching language** is already live in Settings and works
  instantly, no reload — but it currently only persists to
  `localStorage` on the device. Once the backend's `/settings`
  endpoint exists, wire the switcher to also call
  `useUpdateSettings` so the choice follows the account, not just the
  device — there's a comment marking exactly where in
  `SettingsPage.tsx` and `src/lib/i18n.ts`
- **Font:** the bundled Geist font is Latin-only. `globals.css` falls
  back to Noto Sans Ethiopic for `html[lang="am"]`/`html[lang="ti"]`,
  kept in sync automatically by the `useSyncHtmlLang` hook
- **Translation quality note:** the Amharic strings are solid; the
  Tigrigna ones are a reasonable first pass but genuinely benefit from
  a native-speaker review before this ships — don't treat them as
  final copy

---

## 9. Testing philosophy (TDD-by-skip)

Per [9. Test Plan & Test Files]: tests are written **before** the
implementation, using `it.skip`/`describe.skip`, then un-skipped one
at a time as each function is actually built. Test files always mirror
`src/` under `tests/` — never co-located next to the source file.

The highest-value tests to not skimp on, because they cover the least
obvious bugs (see section 8/9 for the full reasoning on each):
- `calculateCustomerBalance` excluding soft-deleted rows from its sum
- `createPayment` never writing to `DailyIncome` (the FR-23 guarantee)
- `createPayment`'s concurrent-overpayment race condition
- `syncPendingEntries` processing the offline queue strictly FIFO

---

## 10. The full spec set

This README is the "how"; these are the "why" — read them in order if
you're new to the project, or jump to the relevant one when a decision
here seems unexplained:

1. Problem & Solution Statement
2. Functional & Non-Functional Requirements
3. Use Cases
4. Database Requirements & ER Diagram
5. API Specification
6. Frontend — UI, Pages & Components
7. Folder & File Structure
8. Function-Level Specification
9. Test Plan & Test Files
10. Google Stitch UI prototyping prompts

---

## 11. Deliberately out of scope (don't accidentally rebuild these)

- Item-level inventory / stock tracking
- Multiple user roles or permissions
- Any automatic link between income entries and debt repayments
- Per-customer debt aging (days-owed) — deferred until real usage from
  dad/brother shows it's actually needed
- Multi-currency support
- A full offline-first sync engine with conflict resolution — the
  offline queue is "save, queue, retry," not simultaneous multi-device
  editing
- Tracking the full amount of the shared family government debt — only
  the shop's own paid portion is ever recorded

If a feature request seems to point back toward one of these, that's
worth a deliberate conversation before building it, not an assumption
that the original decision was forgotten.
