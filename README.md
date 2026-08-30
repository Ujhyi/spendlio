# Spendlio

An expense tracker with AI-powered categorization. Log a purchase in your own words, snap a photo of a receipt, or add it manually — Spendlio parses it and sorts it into a category automatically.

Monorepo-style setup with two separate projects:

- **`spendlio-api`** — Fastify + TypeScript backend
- **`spendlio-web`** — Next.js frontend

## Tech stack

### Backend (`spendlio-api`)

- **Runtime:** Node.js + TypeScript
- **Web framework:** Fastify
- **Database:** PostgreSQL (local via Docker Compose)
- **ORM:** Drizzle ORM + drizzle-kit (migrations)
- **Validation / API docs:** Zod + fastify-type-provider-zod + Swagger (OpenAPI) UI at `/docs`
- **Auth:** JWT access tokens (15 min) + rotating refresh tokens (30 days) via `@fastify/jwt`
- **OAuth:** Google Sign-In (Google Identity Services + `google-auth-library`)
- **AI:** Google Gemini API (`gemini-3.6-flash`) for text and receipt-photo categorization
- **File upload:** `@fastify/multipart` (receipt photos)
- **Email:** Gmail SMTP via `nodemailer` (verification codes)

### Frontend (`spendlio-web`)

- **Framework:** Next.js 14 (App Router) + TypeScript
- **Styling:** Tailwind CSS, custom dark/light theme via CSS variables
- **Charts:** Recharts
- **Icons:** lucide-react
- **i18n:** custom lightweight SK/EN translation context
- **Auth state:** React Context + localStorage, automatic access-token refresh on 401

## Project structure
```
spendlio-api/
├── docker-compose.yml
├── drizzle.config.ts
├── package.json
├── tsconfig.json
├── .env
├── .env.example
├── drizzle/
└── src/
    ├── index.ts
    ├── db/
    │   └── schema.ts
    ├── shared/
    │   ├── http-error.ts
    │   └── error-schemas.ts
    ├── plugins/
    │   ├── auth-plugin.ts
    │   └── global-error-responses.ts
    ├── services/
    │   ├── db.ts
    │   ├── password.ts
    │   ├── client-id.ts
    │   ├── verification-code.ts
    │   ├── refresh-token.ts
    │   ├── google-auth.ts
    │   ├── email.ts
    │   ├── gemini.ts
    │   └── account-cleanup.ts
    ├── prompts/
    │   ├── categorize_text_prompt.md
    │   └── categorize_receipt_prompt.md
    └── modules/
        ├── auth/
        │   ├── auth-schema.ts
        │   ├── auth-service.ts
        │   └── auth-router.ts
        ├── transaction/
        │   ├── transaction-schema.ts
        │   ├── transaction-service.ts
        │   └── transaction-router.ts
        └── categorize/
            ├── categorize-schema.ts
            ├── categorize-service.ts
            └── categorize-router.ts
```

Pattern used in every backend module: **router** = HTTP layer only (parses request, calls service, maps result), **service** = business logic with no Fastify dependency, **schema** = Zod validation + Swagger docs, single source of truth for both request validation and response shape.

## What's implemented

### Database

- `users` — `id` (serial), `clientId` (unique 6-digit human-readable id), `email`, `passwordHash` (nullable — Google accounts have none), `googleId`, `emailVerified`, `disabled` / `disabledAt`
- `transactions` — `id` (serial), `date`, `merchant` (product name), `shop` (nullable, store name), `amount`, `category`, `source` (`manual` / `ai_text` / `ai_receipt`), `clientId` (FK → `users.clientId`, cascade delete)
- `verification_tokens` — email verification codes, `purpose` field so it can be reused for other token types later, `isUsed` flag
- `refresh_tokens` — random 40-byte hex tokens, `clientId` FK, `expiresAt`

### Auth (`/v1/auth/*`)

- `POST /auth/register` — creates account, generates `clientId`, sends a 6-digit verification code by email
- `POST /auth/verify-email` — verifies `{ email, code }`, sets `emailVerified = 1`
- `POST /auth/resend-verification` — issues and sends a new code
- `POST /auth/login` — returns `{ token, refreshToken }`. Rejects if password is wrong, account is disabled, or email isn't verified
- `POST /auth/google` — Google Sign-In: verifies the Google ID token server-side, creates the account on first login (auto-verified, no password) or links `googleId` to an existing email *(currently disabled on the frontend — Google OAuth consent screen is still in Testing mode)*
- `POST /auth/refresh` — exchanges a valid refresh token for a new access + refresh token pair (refresh tokens are rotated on every use)
- `POST /auth/logout` — revokes the refresh token server-side
- `POST /auth/change-password` *(auth required)* — requires the old password
- `POST /auth/disable-account` *(auth required)* — sets `disabled = 1`; a scheduled job permanently deletes the account 10 days later

### Transactions (`/v1/transactions/*`) *(all require bearer token)*

- `GET /transactions` — list of the logged-in user's expenses
- `POST /transactions` — manual entry
- `PATCH /transactions/:id` — partial update (send only the fields you want to change)
- `DELETE /transactions/:id`

### AI categorization (`/v1/categorize*`) *(auth required)*

- `POST /categorize` — free text (a bank-statement line, a description of a purchase) → Gemini parses it into one or more `{ date, merchant, amount, category }` items and saves them
- `POST /categorize-receipt` — multipart photo upload → Gemini vision extracts individual line items (product name, store name, price, category) from the receipt image

### Auth model

- Access token (JWT, 15 min) carries `userId`, `clientId`, `email`
- Refresh token (opaque random string, 30 days, stored in DB) is what actually keeps the user logged in
- The frontend's `api-client.ts` transparently retries a request once on `401`: it calls `/auth/refresh`, stores the new pair, and re-sends the original request — the user never notices the access token expiring
- Logout revokes the refresh token server-side and clears both tokens from `localStorage`

### Error handling

- A single `HttpError` class (`badRequest`, `unauthorized`, `notFound`, `internalError`) — service functions just `throw`, no manual status codes or response shaping
- `global-error-responses.ts` plugin auto-attaches 400/401/404/500 Swagger docs to every route via an `onRoute` hook, so individual routes don't repeat them
- Error response shape is a fixed literal per status code (e.g. `error: "Unauthorized"`), kept in sync between the runtime `HttpError` labels and the Zod schemas

### Frontend features

- **Auth flow:** register → email verification → login (email/password) → protected dashboard. Google Sign-In button is built and functional but commented out on the frontend until the app is published in Google Cloud Console
- **Dashboard:** expenses from the last 4 weeks, grouped by week (collapsible), running total, skeleton loading state, empty state
- **Quick add:** manual entry form, free-text AI categorization box, receipt photo upload (camera capture on mobile via `capture="environment"`)
- **Inline edit/delete** on each transaction row — always visible on mobile (not hover-only), two-click delete confirmation (no native `confirm()`)
- **History page** (`/dashboard/history`) — filter by period (this week / this month / last 3 months / all time / custom date range) and by category (multi-select), with a bar chart (daily granularity for week/month, monthly for longer ranges)
- **Account settings** — change password, disable account (with an inline warning + confirm step, no native `alert()`)
- **Dark mode** — class-based, CSS variables, persisted in `localStorage`, respects system preference on first load, no flash-of-wrong-theme (inline script in `<head>`)
- **Language switch (SK/EN)** — custom translation context, persisted in `localStorage`; category names themselves stay in Slovak (they're stored values used by the AI prompts too)
- **Responsive:** compact spacing/typography on mobile breakpoints for auth pages and dashboard, single-column layout below `md`
- **Design:** dark-first fintech look — bold `Space Grotesk` display type, single purple accent color, pill-shaped filters/buttons, rounded cards, tabular numerals for amounts

## Environment variables

### `spendlio-api/.env`

```
POSTGRES_USER=
POSTGRES_PASSWORD=
POSTGRES_DB=
POSTGRES_PORT=5432

DATABASE_URL=postgresql://user:password@localhost:5432/dbname

JWT_SECRET=
GEMINI_API_KEY=
GOOGLE_CLIENT_ID=

GMAIL_USER=
GMAIL_APP_PASSWORD=
EMAIL_FROM=

PORT=3000
```

### `spendlio-web/.env.local`

```
NEXT_PUBLIC_API_URL=http://localhost:8000/v1
NEXT_PUBLIC_GOOGLE_CLIENT_ID=
```

## Running locally

### Backend

```bash
cd spendlio-api
npm install
docker compose up -d
npm run db:generate
npm run db:migrate
npm run dev
```

API docs: `http://localhost:8000/docs`

### Frontend

```bash
cd spendlio-web
npm install
npm run dev
```

App: `http://localhost:3000`

### Test flow

1. `POST /auth/register` with an email and a password (min. 8 chars) — or use the frontend's register page
2. Check your inbox (or the backend terminal, if `GMAIL_USER`/`GMAIL_APP_PASSWORD` aren't set — the code is logged to the console as a dev fallback) for the 6-digit code
3. `POST /auth/verify-email`
4. Log in → land on `/dashboard`
5. Try adding an expense manually, via the AI text box, or by uploading a receipt photo

## Google Sign-In setup

1. Create OAuth credentials at `https://console.cloud.google.com/apis/credentials` (type: **Web application**)
2. Add your frontend's exact origin (e.g. `http://localhost:3000`, no path) under **Authorized JavaScript origins**
3. Put the Client ID in both `.env` files as shown above
4. Publish the OAuth consent screen (**Publish App** under the OAuth consent screen settings) before going live — while it's in Testing mode, only explicitly added test-user emails can sign in
5. Uncomment the `GoogleSignInButton` usage in `src/app/login/page.tsx`

## Not yet implemented

- Forgot-password flow (no old password known) — the `verification_tokens` table's `purpose` field is already designed to support this without a new table
- Production deployment (Railway/Render), swapping `DATABASE_URL` for a hosted instance
- Native mobile app (React Native) — the API is already consumed by a plain fetch-based client, so this is mostly a new frontend, not a new backend
