# Deploying Meridian Transfer to Vercel

This app is a Next.js 16 + Prisma application. It needs a **PostgreSQL** database
(Vercel's filesystem is read-only, so the old SQLite file won't work). These steps
use **Neon** for Postgres and the **Vercel website** (GitHub import) to deploy.

---

## 1. Create a Neon database

1. Go to https://neon.tech and create a project (free tier is fine).
2. Open **Connection Details** and copy **two** strings (toggle "Pooled connection"):
   - **Pooled** (host contains `-pooler`) → your `DATABASE_URL`.
   - **Direct** (same host **without** `-pooler`) → your `DIRECT_URL`.
   Both should end with `?sslmode=require`.

> Why two? Vercel runs serverless, so the app uses the **pooled** connection at
> runtime. Schema changes (`prisma db push`) need the **direct** connection, which
> Prisma reads from `DIRECT_URL`.

## 2. Generate an auth secret

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```
Copy the output — it's your `AUTH_SECRET`.

## 3. Configure environment variables

You'll set these in Vercel (step 5). For local use, copy `.env.example` to `.env`
and fill them in:

| Variable         | What it is                                            |
|------------------|-------------------------------------------------------|
| `DATABASE_URL`   | Neon **pooled** connection (host has `-pooler`)        |
| `DIRECT_URL`     | Neon **direct** connection (no `-pooler`)             |
| `AUTH_SECRET`    | random string from step 2                              |
| `ADMIN_EMAIL`    | the admin login the seed will create                  |
| `ADMIN_PASSWORD` | a strong password for that admin                       |
| `ADMIN_NAME`     | display name for the admin                             |
| `SEED_DEMO`      | leave unset / `false` in production                    |

## 4. Install the Vercel CLI & log in

```bash
npm i -g vercel
vercel login
```

## 5. Add the environment variables to Vercel

From the project folder, link the project and add each variable to **all**
environments (Production, Preview, Development):

```bash
vercel link            # create/link the Vercel project
vercel env add DATABASE_URL production
vercel env add DIRECT_URL production
vercel env add AUTH_SECRET production
vercel env add ADMIN_EMAIL production
vercel env add ADMIN_PASSWORD production
vercel env add ADMIN_NAME production
```
(Repeat for `preview` if you want preview deploys to work, or add them in the
Vercel dashboard → Project → Settings → Environment Variables.)

## 6. Deploy

```bash
vercel --prod
```

The build runs `prisma generate && prisma db push && next build`, so the database
schema is created automatically on first deploy.

## 7. Seed the admin + securities catalog (one time)

After the first successful deploy, seed the production database once. The
simplest way: temporarily point your local `.env` at the **production** Neon
URLs and admin creds, then run the seed (Prisma's seed runner loads `.env`):

```bash
# .env now holds your PRODUCTION DATABASE_URL / DIRECT_URL / ADMIN_* (SEED_DEMO unset)
npx prisma db seed
```

This creates your admin account and the securities catalog. It is **idempotent**
— safe to run again; it never deletes data. (Afterwards, switch `.env` back to
your dev database.)

Log in at `https://<your-app>.vercel.app/login` with `ADMIN_EMAIL` / `ADMIN_PASSWORD`.

---

## Local development

```bash
cp .env.example .env      # then paste your Neon URLs + secrets (SEED_DEMO=true for demo data)
npm install
npm run db:push           # create tables in your dev DB
npm run db:seed           # seed admin (+ demo users if SEED_DEMO=true)
npm run dev
```

## Notes & next steps
- Schema changes are applied with `prisma db push` (no migration history). For a
  stricter workflow, switch to `prisma migrate` once you have a stable Postgres DB.
- `bcryptjs` and `jose` are pure-JS and run on Vercel's serverless/edge runtimes.
- This is a demonstration platform — transfers, withdrawals, IRS filings, and KYC
  are simulated. Do not use with real customer funds or PII without proper
  broker-dealer registration, compliance, and a real IDV provider.
