# Spendlio API

Backend API pre expense tracker s AI kategorizáciou výdavkov. Používateľ si zapisuje výdavky (ručne alebo cez voľný text/bankový výpis), Claude AI ich automaticky rozparsuje a zaradí do kategórií.

## Tech stack

- **Runtime:** Node.js + TypeScript
- **Web framework:** Fastify
- **Databáza:** PostgreSQL (lokálne cez Docker Compose)
- **ORM:** Drizzle ORM + drizzle-kit (migrácie)
- **Validácia / API dokumentácia:** Zod + fastify-type-provider-zod + Swagger (OpenAPI) UI na `/docs`
- **Autentifikácia:** JWT (bearer token) cez `@fastify/jwt`
- **AI:** Anthropic Claude API (`@anthropic-ai/sdk`) na kategorizáciu výdavkov z voľného textu
- **Email:** Gmail SMTP cez `nodemailer` (overovací email pri registrácii)

## Štruktúra projektu
``` 
spendlio/
├── docker-compose.yml
├── drizzle.config.ts
├── package.json
├── tsconfig.json
├── .env / .env.example
├── drizzle/ 
└── src/
├── index.ts 
├── db/
│ └── schema.ts 
├── shared/
│ ├── http-error.ts 
│ └── error-schemas.ts 
├── plugins/
│ ├── auth-plugin.ts 
│ └── global-error-responses.ts 
├── services/
│ ├── db.ts
│ ├── password.ts 
│ ├── client-id.ts
│ ├── verification-code.ts 
│ ├── email.ts 
│ └── anthropic.ts
├── prompts/
│ └── prompt.md 
└── modules/
├── auth/
│ ├── auth-schema.ts 
│ ├── auth-service.ts
│ └── auth-router.ts 
├── transactions/
│ ├── transactions-schema.ts
│ ├── transactions-service.ts
│ └── transactions-router.ts
└── categorize/
├── categorize-schema.ts
├── categorize-service.ts
└── categorize-router.ts
``` 

Princíp v každom module: **router** = len HTTP (parsuje request, volá service, mapuje výsledok), **service** = čistá business logika bez závislosti na Fastify, **schema** = validácia + Swagger dokumentácia (Zod).

## Čo je zatiaľ hotové

### Databáza
- `users` – `id` (serial, auto-increment), `clientId` (unikátne 6-miestne číslo na čitateľnú identifikáciu), `email`, `passwordHash`, `emailVerified` (0/1), `disabled` (0/1), `disabledAt`
- `transactions` – `id` (serial), `date`, `merchant`, `amount`, `category`, `source`, `userId` (FK na users, `onDelete: cascade`)
- `verification_tokens` – `id` (serial), `clientId` (FK na users.clientId), `code`, `purpose` (napr. `email_verification`), `isUsed` (0/1), `expiresAt`

### Autentifikácia (`/v1/auth/*`)
- `POST /auth/register` – vytvorí účet, vygeneruje `clientId`, vytvorí verifikačný kód a pošle ho emailom
- `POST /v1/auth/verify-email` – overí email cez `{ email, code }`, nastaví `emailVerified = 1`
- `POST /v1/auth/resend-verification` – vygeneruje a pošle nový verifikačný kód
- `POST /v1/auth/login` – prihlásenie, vráti JWT token. Odmietne prihlásenie ak: heslo nesedí, účet je `disabled`, alebo email nie je overený
- `POST /v1/auth/change-password` *(vyžaduje bearer token)* – zmena hesla, vyžaduje staré heslo
- `POST /v1/auth/disable-account` *(vyžaduje bearer token)* – deaktivuje účet (`disabled = 1`), účet sa natrvalo zmaže po 10 dňoch cez naplánovanú úlohu

### Transakcie (`/transactions/*`) *(všetky vyžadujú bearer token)*
- `GET /transactions` – zoznam výdavkov prihláseného používateľa
- `POST /transactions` – ručné pridanie výdavku
- `DELETE /transactions/:id` – zmazanie výdavku

### AI kategorizácia (`/categorize`) *(vyžaduje bearer token)*
- `POST /categorize` – zoberie voľný text (riadok z výpisu, opis nákupu), pošle ho do Claude API, automaticky rozparsuje na položky s dátumom/sumou/kategóriou a uloží do `transactions`

### Globálne error handling
- Vlastná `HttpError` trieda (`badRequest`, `unauthorized`, `notFound`, `internalError`) – v service funkciách sa len `throw`-ne, netreba nikde ručne písať status kód a text
- `global-error-responses.ts` plugin automaticky pridá 400/401/404/500 Swagger dokumentáciu ku každému endpointu bez opakovania v jednotlivých routes
- Presné error texty (`"Bad Request"`, `"Unauthorized"`, `"Not Found"`, `"Internal Server Error"`) sú zjednotené medzi runtime kódom a Zod schémami

### Infraštruktúra
- PostgreSQL beží lokálne cez Docker Compose (`docker-compose.yml`), connection údaje v `.env`
- Drizzle migrácie (`npm run db:generate`, `npm run db:migrate`)
- Swagger UI na `http://localhost:3000/docs` – interaktívna dokumentácia, bearer auth cez tlačidlo "Authorize"

## Čo ešte chýba / plánuje sa

- Endpoint na foto účteniek (OCR cez Claude vision)
- Reset hesla pre prípad zabudnutého hesla (bez znalosti starého) – infraštruktúra `verification_tokens` je na to pripravená (`purpose` pole)
- Produkčné nasadenie (Railway/Render), zmena `DATABASE_URL` na hostovanú DB
- Mobilná appka (React Native) ako frontend

## Ako spustiť lokálne

```bash
npm install
docker compose up -d
npm run db:generate
npm run db:migrate
npm run dev
```

Otvor `http://localhost:3000/docs`.

**Testovací flow:**
1. `POST /auth/register` s emailom a heslom (min. 8 znakov)
2. Over si terminál alebo emailovú schránku pre 6-miestny kód
3. `POST /auth/verify-email` s `{ email, code }`
4. `POST /auth/login` → dostaneš JWT token
5. Klikni **Authorize** v Swaggeri, vlož token
6. Skús `POST /transactions`, `GET /transactions`, `POST /categorize`

## Environment premenné

Pozri `.env.example` – potrebuješ nastaviť `DATABASE_URL` (alebo jednotlivé `POSTGRES_*` premenné pre Docker), `JWT_SECRET`, `ANTHROPIC_API_KEY`, `GMAIL_USER` a `GMAIL_APP_PASSWORD` (Gmail App Password, nie bežné heslo účtu).