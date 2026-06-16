# SmartZim — Production Migration Guide
## Replit → Vercel + Supabase

This guide walks through every step required to take SmartZim from Replit to production on **Vercel** (frontend + API) and **Supabase** (PostgreSQL + Storage).

---

## What Changed

### Files removed / replaced
| File | What changed |
|------|-------------|
| `artifacts/smartzim/vite.config.ts` | Removed `@replit/vite-plugin-*` plugins; `PORT`/`BASE_PATH` now have safe defaults; `SITE_ORIGIN` reads from env |
| `artifacts/smartzim/package.json` | Removed `@replit/vite-plugin-cartographer`, `@replit/vite-plugin-dev-banner`, `@replit/vite-plugin-runtime-error-modal` |
| `artifacts/api-server/src/app.ts` | `SESSION_SECRET` is now required (throws on startup if missing); CORS reads `ALLOWED_ORIGINS` env; cookie `secure: true` in production |
| `artifacts/api-server/src/lib/objectStorage.ts` | **Completely rewritten** — Replit GCS sidecar replaced with Supabase Storage SDK |
| `artifacts/api-server/src/lib/objectAcl.ts` | Updated to use Supabase storage refs instead of GCS File objects |
| `artifacts/api-server/package.json` | Removed `@google-cloud/storage`, `google-auth-library`; added `@supabase/supabase-js` |
| `lib/integrations-anthropic-ai/src/client.ts` | Removed Replit AI proxy; uses `ANTHROPIC_API_KEY` directly |
| `pnpm-workspace.yaml` | Removed all `@replit/*` catalog entries and `minimumReleaseAgeExclude` for Replit packages |
| `vercel.json` | New — configures Vercel deployment for monorepo |
| `api/index.ts` | New — Vercel serverless function entry wrapping the Express app |
| `supabase/migrations/` | New — full SQL schema + RLS policies |
| `supabase/seed.sql` | New — default curricula and payment settings |
| `.env.example` | New — all required environment variables |

---

## Step 1 — Create a Supabase project

1. Go to [supabase.com](https://supabase.com) → **New project**
2. Choose a region close to Zimbabwe (e.g. `eu-west-1` or `ap-southeast-1`)
3. Set a strong database password and save it securely

### Run the migrations

In the Supabase dashboard → **SQL Editor**, paste and run each migration file in order:

```
supabase/migrations/20250615000001_initial_schema.sql
supabase/migrations/20250615000002_rls.sql
supabase/seed.sql
```

Or use the Supabase CLI:

```bash
npx supabase db push --db-url "postgresql://postgres.[ref]:[password]@aws-0-[region].pooler.supabase.com:6543/postgres"
```

### Create Storage buckets

In Supabase → **Storage**, create two buckets:

| Bucket name | Visibility | Purpose |
|-------------|-----------|---------|
| `smartzim-public` | **Public** | Notes PDFs, past papers, profile photos |
| `smartzim-private` | **Private** | Assignment submissions, payment proofs |

### Get your credentials

From Supabase → **Project Settings** → **API**:
- `SUPABASE_URL` — e.g. `https://abcxyz.supabase.co`
- `SUPABASE_SERVICE_ROLE_KEY` — the **service_role** key (NOT the anon key)

From **Project Settings** → **Database** → **Connection string (URI)**:
- `DATABASE_URL` — use the **connection pooler** (port 6543) for production

---

## Step 2 — Get a Google Gemini API key

1. Go to [aistudio.google.com/app/apikey](https://aistudio.google.com/app/apikey)
2. Click **Create API key** → pick any Google Cloud project (or create one)
3. Copy the key (starts with `AIza…`) — this is your `GEMINI_API_KEY`

> **Free tier**: Gemini 2.5 Flash has a generous free quota — no billing required to start.

---

## Step 3 — Deploy to Vercel

### Install Vercel CLI (optional but recommended for testing)
```bash
npm i -g vercel
```

### Connect your GitHub repository

1. Push your updated code to GitHub
2. Go to [vercel.com](https://vercel.com) → **New Project** → import your repo
3. Vercel will auto-detect the `vercel.json` — no framework preset needed

### Configure environment variables in Vercel

In your Vercel project → **Settings** → **Environment Variables**, add:

```
DATABASE_URL          postgresql://postgres.[ref]:[pw]@aws-0-[region].pooler.supabase.com:6543/postgres
SESSION_SECRET        <generate: node -e "console.log(require('crypto').randomBytes(64).toString('hex'))">
SUPABASE_URL          https://[project-ref].supabase.co
SUPABASE_SERVICE_ROLE_KEY  eyJ...
SUPABASE_PUBLIC_BUCKET     smartzim-public
SUPABASE_PRIVATE_BUCKET    smartzim-private
GEMINI_API_KEY        AIza...
ALLOWED_ORIGINS       https://smartzim.vercel.app,https://smartzim.co.zw
SITE_ORIGIN           https://smartzim.vercel.app
NODE_ENV              production

# ── Email (optional but recommended) ──
# If not set, approve/reject still works — users just won't receive emails.
# Option A: Gmail (easiest to start)
SMTP_HOST             smtp.gmail.com
SMTP_PORT             587
SMTP_USER             you@gmail.com
SMTP_PASS             xxxx-xxxx-xxxx-xxxx   # 16-char App Password (not your Gmail password)
SMTP_FROM             SmartZim <noreply@smartzim.co.zw>

# Option B: Resend (recommended for production — free tier, easy setup)
# Sign up at resend.com → Domains → verify your domain → API Keys
SMTP_HOST             smtp.resend.com
SMTP_PORT             465
SMTP_USER             resend
SMTP_PASS             re_...   # your Resend API key
SMTP_FROM             SmartZim <noreply@yourdomain.com>
```

### Build & deploy

```bash
# Trigger a production deploy from CLI:
vercel --prod

# Or just push to your main branch — Vercel auto-deploys
```

**Vercel build config** (auto-detected from `vercel.json`):
- Build command: `pnpm run typecheck:libs && pnpm --filter @workspace/api-server run build && pnpm --filter @workspace/smartzim run build`
- Output directory: `artifacts/smartzim/dist/public`
- API function: `api/index.ts` → handles all `/api/*` routes

---

## Step 4 — Verify the deployment

```bash
# Health check
curl https://smartzim.vercel.app/api/healthz

# Expected: { "status": "ok" }
```

Check that:
- [ ] Landing page loads
- [ ] Login / register flow works
- [ ] File uploads work (test uploading a profile photo)
- [ ] AI tutor responds (ZimTutor chat)

---

## Step 5 — Custom domain (optional)

In Vercel → **Settings** → **Domains**, add your custom domain (e.g. `smartzim.co.zw`).

Update `ALLOWED_ORIGINS` and `SITE_ORIGIN` in your Vercel env vars after adding the domain.

---

## Local development after migration

Copy `.env.example` to `.env` and fill in your Supabase credentials:

```bash
cp .env.example .env
# Edit .env with your actual values
```

Run the API and frontend:

```bash
# Terminal 1 — API server
pnpm --filter @workspace/api-server run dev

# Terminal 2 — Frontend
PORT=3000 BASE_PATH=/ pnpm --filter @workspace/smartzim run dev
```

---

## Architecture overview

```
                    ┌─────────────────────────────────┐
                    │           Vercel Edge             │
                    │                                   │
  Browser ──────►  │  /         → static frontend      │
                    │  /api/*    → serverless function  │
                    │                                   │
                    └──────────────┬──────────────────┘
                                   │
                    ┌──────────────▼──────────────────┐
                    │      api/index.ts                │
                    │  (Express app, Vercel function)   │
                    │                                   │
                    │  • Session auth (postgres store)  │
                    │  • Drizzle ORM                    │
                    │  • Supabase Storage SDK           │
                    │  • Anthropic SDK (direct)         │
                    └──────────────┬──────────────────┘
                                   │
                    ┌──────────────▼──────────────────┐
                    │           Supabase               │
                    │                                   │
                    │  • PostgreSQL (23 tables)         │
                    │  • Storage (2 buckets)            │
                    └─────────────────────────────────┘
```

---

## Troubleshooting

### Sessions not persisting
- Ensure `SESSION_SECRET` is set and consistent across Vercel deployments
- `ALLOWED_ORIGINS` must include your exact frontend origin (no trailing slash)
- Vercel serverless functions are stateless — sessions rely on the postgres store; ensure `DATABASE_URL` is correct

### File uploads failing
- Confirm `SUPABASE_SERVICE_ROLE_KEY` is the service role key (not anon key)
- Check that the `smartzim-private` bucket exists in Supabase Storage
- Supabase free tier has a 50MB file size limit; the API allows up to 150MB — consider a paid plan for large uploads

### AI tutor not responding
- Verify `ANTHROPIC_API_KEY` is set in Vercel environment variables
- Check Anthropic usage limits on your account

### Build failing on Vercel
- Ensure `pnpm` is detected (Vercel auto-detects `pnpm-workspace.yaml`)
- Set `NODE_VERSION = 22` in Vercel project settings if builds fail
