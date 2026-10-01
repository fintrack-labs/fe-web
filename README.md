# fe-web

Vue 3 web client for **FinTrack**: sign in, manage accounts and transactions, and **scan a receipt to pre-fill a transaction**.

![Vue 3](https://img.shields.io/badge/Vue_3-42B883?logo=vuedotjs&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?logo=typescript&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-646CFF?logo=vite&logoColor=white)
![Pinia](https://img.shields.io/badge/Pinia-FFD859?logoColor=black)

Part of the [FinTrack Labs](https://github.com/fintrack-labs) project, a personal learning lab for distributed backend design and applied AI.

<!-- TODO: screenshot / GIF -->
<!-- ![Screenshot](./docs/screenshot.png) -->

**Live demo:** <!-- TODO --> &nbsp;|&nbsp; **Demo account:** <!-- TODO -->

## Features

- Register, log in, and log out against the auth service
- Accounts, categories, and transactions (income, expense, transfer, balance adjustment)
- **Receipt scan:** upload a photo and get a transaction draft; nothing is saved until you review and submit
- Automatic token refresh with a single retry after a `401`

## What's technically interesting

- **Three typed Axios clients** (auth, finance, OCR) sharing one interceptor pipeline.
- **Proactive and reactive token refresh:** refreshes before expiry, and on a `401` refreshes once and replays the original request.
- **Pinia only for auth state.** Domain data (accounts, categories, transactions) is fetched per view, which avoids a stale global cache.
- **OCR is advisory.** Results only prefill a form; the user stays in control of what gets saved.

## Tech stack

Vue 3 · TypeScript · Vite · Vue Router · Pinia · Axios

## How it talks to the backend

```
fe-web ──► be-auth-ts          login / register / refresh / logout
       ──► be-node-ts          accounts / categories / transactions
       ──► be-ai-ocr-service   POST /v1/ocr/analyze (image + bearer token)
```

## Getting started

Prerequisites: Node.js (LTS) and the backend services running (see the [org overview](https://github.com/fintrack-labs)).

```bash
git clone https://github.com/fintrack-labs/fe-web.git
cd fe-web
npm install
cp .env.example .env   # then fill in the values below
npm run dev
```

<!-- TODO: samakan nama script & variabel dengan package.json dan .env.example -->

Environment variables (names to confirm against `.env.example`):

| Variable | Purpose |
| --- | --- |
| `VITE_AUTH_API_URL` | Auth service base URL (e.g. `http://127.0.0.1:8081/auth/api`) |
| `VITE_CORE_API_URL` | Finance API base URL (e.g. `http://localhost:8080/api/v1`) |
| `VITE_OCR_API_URL` | OCR service base URL (e.g. `http://localhost:3000`) |
| `VITE_CLIENT_ID` / `VITE_CLIENT_SECRET` | Client credentials sent at login (see note below) |

## Known limitations

- Tokens are stored in `localStorage`, which raises the impact of any XSS bug. Planned: HttpOnly cookies or a BFF.
- `VITE_CLIENT_SECRET` is bundled into the browser build, so it is **not a real secret**. Client authentication needs a different design for a public SPA.
- The dashboard currently uses deterministic **mock data**; real analytics from the finance API are on the roadmap.
- DTOs are duplicated from the backend rather than generated from a shared OpenAPI contract.

## Related repositories

[`be-auth-ts`](https://github.com/fintrack-labs/be-auth-ts) · [`be-node-ts`](https://github.com/fintrack-labs/be-node-ts) · [`be-ai-ocr-service`](https://github.com/fintrack-labs/be-ai-ocr-service) · [`be-api-client-test`](https://github.com/fintrack-labs/be-api-client-test)
