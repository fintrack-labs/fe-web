# Fintrack Labs — Frontend Web

> Built with **OpenCode** — tagged `#VibeEngineer`.

Single-page application (SPA) for personal finance tracking. This frontend is part of the `fintrack-labs` monorepo, alongside `be-express-ts` (NestJS/Fastify backend) and other modules.

- Language: strict TypeScript, Vue 3 with Composition API (`<script setup>`).
- All UI labels are in English.
- Amounts use the `id-ID` locale (e.g. `1.234.567,89`) with a comma as the decimal separator.
- No code comments; conventions are enforced through explicit file and function naming.

## How to Run

Required Node version: `^22.18.0 || >=24.12.0`.

```sh
npm install
npm run dev          # dev server + hot reload (Vite)
npm run type-check   # vue-tsc --build, type-check without building
npm run build        # type-check then production build (dist/)
npm run build-only   # Vite build only
npm run preview      # serve the local production build
```

Configuration comes from `.env` / `.env.sample`:

| Variable | Purpose |
|---|---|
| `VITE_API_BASE_URL` | Base URL of the core API (transactions, accounts, categories, etc.) |
| `VITE_AUTH_BASE_URL` | Base URL of the authentication API (login, register, token refresh) |
| `VITE_CLIENT_ID` / `VITE_CLIENT_SECRET` | OAuth client credentials used for token refresh |

## Tech Stack

| Layer | Technology | Role |
|---|---|---|
| UI framework | **Vue 3.5** (Composition API, `<script setup>`) | Builds the entire interface as reactive components |
| Language | **TypeScript ~6.0** | Type-safe `.vue` components, services, DTOs, utils |
| Build / dev server | **Vite 8** | Bundler, HMR, `@/ → src/` alias, production build |
| Routing | **vue-router 5** | Page navigation including lazy-loaded routes |
| Global state | **Pinia 2** | Single store: authentication session |
| HTTP client | **Axios 1.x** | All backend communication (2 instances: `coreApi`, `authApi`) |
| Styling | **Tailwind CSS 3.4** | All styling via utility classes + shared `components/` |
| Type-check | **vue-tsc** | Validates template types in `.vue` files during `npm run build` |
| Number formatting | `Intl.NumberFormat('id-ID')` (built-in Web API) | Currency formatting in the UI |
| Money / input | Internal implementation (no library) | `utils/amount.ts` + `composables/useAmountField.ts` |

## Project Structure

```
src/
├── main.ts                  # bootstrap: Pinia, router, session handler, token refresh
├── App.vue                  # root component (hosts ToastHost, etc.)
├── env.d.ts
├── assets/main.css          # Tailwind directives + custom utilities (thin-scrollbar, etc.)
├── components/              # pure reusable components (no API state)
│   ├── SelectField.vue      # custom dropdown: auto placement/flip, keyboard nav, scroll-safe
│   ├── Sidebar.vue          # collapsible grouped navigation (Account, Transaction)
│   └── ToastHost.vue        # renders toast notifications
├── composables/             # reusable composables (local state + lifecycle)
│   ├── useToast.ts          # toast notifications (global)
│   ├── useAmountField.ts    # amount input: id-ID formatting, deletion detection
│   ├── useResizableColumns.ts # tables with resizable columns + localStorage persistence
│   ├── useScrollIdle.ts     # detects active vs idle scrolling (for slim scrollbars)
│   ├── useHideOnScroll.ts   # hides/shows elements on scroll (e.g. header/list)
│   └── useFontScale.ts      # root font size (sm/md/lg) applied to <html> rem base
├── constants/storage.ts     # localStorage keys (token, refresh token, user)
├── dto/                     # type contracts replicated from the backend (req & res)
│   ├── auth.dto.ts          # login/register/refresh/ApiEnvelope
│   ├── user.dto.ts
│   ├── account.dto.ts
│   ├── category.dto.ts
│   ├── transaction.dto.ts   # CreateTransactionRequestDto, AdjustBalanceRequestDto
│   └── paginated.dto.ts     # PaginatedResponse<T>
├── layouts/DashboardLayout.ts  # main layout after login (sidebar + content)
├── mocks/dashboard.ts       # deterministic dummy data for the Dashboard
├── router/index.ts          # route registration + auth guards
├── services/                # per-domain API communication layer
│   ├── api.ts               # Axios client factory + interceptors (token, 401 retry, envelope unwrap)
│   ├── auth.service.ts      # login/register/me
│   ├── account.service.ts   # list + create accounts (search/filter/sort params)
│   ├── category.service.ts  # transaction categories
│   ├── transaction.service.ts # create, list, adjust balance
│   ├── token-refresh.service.ts # proactive refresh & single-flight refresh
│   └── session.ts           # global "unauthorized" event handler
├── stores/auth.store.ts     # Pinia store: auth status & logout
├── utils/                   # pure functions
│   ├── amount.ts            # amount parse/format (id-ID)
│   ├── format.ts            # formatCurrency
│   ├── token.ts             # read/write tokens in localStorage + exp validation
│   ├── jwt.ts               # decode JWT without a library (payload access)
│   ├── api-error.ts         # Axios error message extraction
│   ├── account-type.ts      # labels/colors for account types
│   ├── category.ts          # category labels/utilities
│   └── payment-method.ts    # account type → payment method mapping
└── views/                   # one page per route
    ├── LoginView.vue / RegisterView.vue
    ├── DashboardView.vue    # KPIs, daily chart, monthly comparison (mock data)
    ├── AccountsView.vue     # account list, balance summary, filters, resizable table
    ├── AccountCreateView.vue # create-account form (name, type, currency, initial balance)
    ├── TransactionsView.vue # create-transaction form (with "add another / view list" dialog)
    ├── TransactionsListView.vue # full transaction list (mobile filters, resizable columns)
    ├── AdjustmentView.vue   # account balance adjustment (actual balance)
    └── ProfileView.vue      # profile mockup + font size control (sm/md/lg)
```

## External Libraries — When and Under What Conditions They Are Used

### Vue 3.5
Used **everywhere** — every `.vue` file uses `ref`/`computed`/`watch` reactivity and lifecycle hooks (`onMounted`, `onBeforeUnmount`). Consistently applied patterns:

- `ref()` for local component and store state.
- `watch(..., { immediate: true })` to sync values coming from outside (e.g. `route.query.accountId` in `AdjustmentView`).
- `Transition` for dropdown (`SelectField`) and dialog animations.

### vue-router 5
Used on **page navigation**.

- Main routes are lazy-loaded (`() => import(...)`) — important for bundle splitting.
- `meta.requiresAuth` / `meta.requiresGuest` are enforced by the **`beforeEach` guard**: pages under `DashboardLayout` reject unauthenticated users (redirect to `/login`); login/register pages reject authenticated users (redirect to dashboard).
- Programmatic navigation via `router.push` (and `useRoute` / `useRouter` in components).

### Pinia 2
Used only for **global authentication state** (`stores/auth.store.ts`). Components call `useAuthStore()` to check `isAuthenticated` and invoke `logout()`. Domain data (accounts, categories, transactions) is not stored globally — it is fetched per component.

### Axios 1.x
Used for **all HTTP calls to the backend** through `services/api.ts`. Two instances:

- `authApi` → `VITE_AUTH_BASE_URL`, with **envelope unwrapping** — responses shaped `{ statusCode, message, data }` are unwrapped automatically to `data`.
- `coreApi` → `VITE_API_BASE_URL`, plain responses returned as-is.

Specific conditions handled by the interceptors:

- Automatically adds `Authorization: Bearer <token>` to every request when a token exists.
- On a `401` response: tries `refreshAccessToken()` once per request (`config._retry`), then **replays the original request**. If refresh fails → `logout()` + `notifyUnauthorized()` → redirected to `/login`.
- Auth-related endpoints (`/login`, `/logout`, `/refresh-token`) are skipped from the retry logic.
- `getApiErrorMessage()` (via `axios.isAxiosError`) is used in every `catch` to surface backend error messages.

### Tailwind CSS 3.4
Used **everywhere** for styling — there is no per-page custom CSS; all layout, spacing, and the dark (slate/indigo) theme come from utility classes. `tailwind.config.js` only registers content paths (no plugins). Advanced utilities live in `assets/main.css`: `.thin-scrollbar` (thin scrollbar shown only while `is-scrolling` from `useScrollIdle`).

### vue-tsc
Used during `npm run type-check` / `npm run build` — validates types including those inside `.vue` templates (because `tsc` does not understand `.vue`).

### vue-devtools / vite-plugin-vue-devtools
Development only — Vue DevTools integration through Vite.

## Internal Modules That Behave Like "Libraries"

### services/ (per-domain API layer)
Pattern: each domain exposes an `XXXService` object calling `coreApi` with its DTOs.

- `transactionService.create(payload)` — used by the create-transaction form (`TransactionsView`).
- `accountService.list(params)` — the backend paginates, so a global `limit: 200` is used and `search/type/currency/sortBy/sortOrder` params are passed through; consumed by `AccountsView`, `AdjustmentView`, and transaction-form dropdowns.
- `categoryService`, `authService` → analogous per domain.
- `token-refresh.service` → used both by the `api.ts` interceptor on 401 and for **proactive refresh** via `scheduleTokenRefresh()` in `main.ts`. It guarantees refresh runs once (the `refreshPromise` variable) and keeps a 5-minute margin before token expiry.

### composables/ (behaviors reused across components)
- `useToast()` — **global notifications**. Used in nearly every view as `toast.success/error/info`. Toasts auto-dismiss after 5 seconds.
- `useAmountField()` → built on `utils/amount.ts` — **amount input**. Used whenever users type a nominal value (transaction & adjustment forms). Applies id-ID formatting and handles the "deleting trailing zero" case via the `previous` parameter (deletion detection).
- `useResizableColumns(columns, storageKey)` — **tables with resizable columns**. Used in `TransactionsListView` and `AccountsView`. Pass a `{ key, label, width, ... }` column list; widths persist in `localStorage` (per-table keys `fintrack.transaction_columns`, `fintrack.account_columns`) across sessions; `reset()` restores defaults.
- `useScrollIdle(delay=700)` — **scroll detection**. Returns `isScrolling` + an `onScroll` handler. Used to reveal the slim scrollbar only while the user is scrolling (tables, dropdowns).
- `useHideOnScroll(target, offset)` — **collapses a header/list on scroll-down** and reveals it again on scroll-up.

### utils/ (pure functions)
- `amount.ts` — `parseAmount`, `formatAmountInput`, `countDecimalPlaces`. Core money-input logic; distinguishes **comma (decimal)** vs **dot (thousands separator)**.
- `format.ts` — `formatCurrency(value, currency)` using `Intl.NumberFormat('id-ID')`; falls back to plain number formatting if the currency code is invalid.
- `token.ts` + `jwt.ts` — read/write tokens in `localStorage` and decode JWT without dependencies to check `exp`. Used by the auth store, interceptors, and refresh service.
- `api-error.ts` — `getApiErrorMessage(error, fallback)`. Used by every `catch` for friendly messages.
- `account-type.ts` — labels + color classes per account type (AccountsView & SelectField options).
- `category.ts` — category labels/utilities.
- `payment-method.ts` — account type → payment method mapping when creating transactions (e.g. `INVESTMENT → BANK`, `CASH → CASH`), keeping transactions consistent with the business rules.

### dto/ (type contracts)
Not logic — they act as the **contract** replicated from the backend so every request payload and response is type-checked. If the backend reshapes a response (e.g. envelope), changes belong here.

### mocks/dashboard.ts
Deterministic dummy data (seeded `mulberry32` RNG) for the Dashboard while backend analytics data is unavailable. Used only by `DashboardView`; the rest of the app hits real APIs.

## Business Rules Enforced in the Frontend

- **ATM cash withdrawals** are recorded as type `TRANSFER`, not `INCOME` with a source account.
- **Payment method** differs by transaction direction:
  - `INCOME` → follows the destination account's method (`destinationAccount`).
  - `EXPENSE` / `TRANSFER` → follows the source account's method (`sourceAccount`).
  - `INVESTMENT` → always `BANK`.
- **Balance adjustment** (`AdjustmentView`) sends `{ accountId, actualBalance, reason? }` — `accountId` (not `sourceAccountId`) is the agreed contract with the backend.
- All labels/alerts are in English; the UI is mobile-first.

## Authentication Flow (summary)

1. Login → `authApi` returns access + refresh tokens → stored in `localStorage` (keys `finlab_*`).
2. `auth.store` mirrors the login state from the token.
3. User info (`sub`, `email`, `name`, `adGroup`) is synced from the JWT payload (`utils/token.ts`).
4. `main.ts` schedules proactive refresh; the `api.ts` interceptor is the second safety layer (401 retry).
5. When the token is truly invalid → global logout → redirect to `/login`.