# SmartZim Learning

Zimbabwe's ZIMSEC & Cambridge exam prep platform — AI tutor, past papers, study notes, mock exams, gamification, teacher social network, and more.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 8080)
- `pnpm --filter @workspace/smartzim run dev` — run the frontend (port 22156)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- Frontend: React 19 + Vite 7 SPA, Tailwind CSS v4, TanStack Query, Wouter (routing), vite-plugin-pwa (PWA)
- API: Express 5, session auth (connect-pg-simple + bcryptjs)
- DB: PostgreSQL + Drizzle ORM (23 tables)
- AI: Google Gemini 2.5 Flash (lazy-initialized via `GEMINI_API_KEY`)
- Storage: Supabase Storage (lazy-initialized, replaces Replit Object Storage)
- Validation: Zod v4, drizzle-zod
- Build: esbuild (CJS → ESM bundle for API)

## Required env vars

| Var | Purpose |
|-----|---------|
| `DATABASE_URL` | Postgres connection string (Replit Postgres for dev) |
| `SESSION_SECRET` | Express session secret |
| `GEMINI_API_KEY` | Google Gemini API key (ZimTutor chat, quiz, study plan, summariser) |
| `SUPABASE_URL` | Supabase project URL (only needed for file uploads) |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key (only needed for file uploads) |
| `SUPABASE_PUBLIC_BUCKET` | Public storage bucket name (default: `smartzim-public`) |
| `SUPABASE_PRIVATE_BUCKET` | Private storage bucket name (default: `smartzim-private`) |

## Where things live

```
artifacts/smartzim/       — React PWA frontend
artifacts/api-server/     — Express 5 API server
lib/db/                   — Drizzle ORM schema (23 tables) + migrations
lib/api-spec/             — OpenAPI spec (source of truth)
lib/api-client-react/     — Generated React Query hooks
lib/api-zod/              — Generated Zod schemas
lib/integrations-anthropic-ai/ — Anthropic AI client (lazy)
lib/object-storage-web/   — Object storage client for browser
api/index.ts              — Vercel serverless function entry
vercel.json               — Vercel deployment config
supabase/migrations/      — SQL schema + RLS policies for Supabase
supabase/seed.sql         — Default curricula + payment settings
MIGRATION.md              — Full Vercel + Supabase deployment guide
.env.example              — All required environment variables documented
```

## Architecture decisions

- **Session auth over JWT**: Uses `express-session` + `connect-pg-simple` for reliable server-side sessions stored in Postgres — no token expiry management on the client.
- **Vercel deployment**: Frontend is a static SPA build; API is wrapped as a Vercel serverless function at `api/index.ts`. All `/api/*` routes go to the function; everything else hits `index.html`.
- **Supabase over Firebase**: PostgreSQL-compatible — Drizzle schema works unchanged. Supabase Storage replaces Replit Object Storage.
- **Lazy initialization**: Anthropic and Supabase clients only throw when actually called — app starts cleanly in dev without all production keys set.
- **PWA**: vite-plugin-pwa with Workbox service worker, offline caching, installable manifest with SmartZim branding.

## Product

SmartZim serves three user roles:
- **Students**: past papers, AI tutor (ZimTutor), notes, mock exams, study planner, gamification (XP/streaks), quiz sessions
- **Teachers**: assignment creation/grading, note uploads, tutor listings, social profile (LinkedIn-style), channel messaging
- **Admin**: user approval/rejection, subscription management, announcements, payment settings

## Vercel + Supabase Deployment

See `MIGRATION.md` for the full step-by-step guide. Summary:
1. Create Supabase project → run `supabase/migrations/` SQL → create 2 storage buckets
2. Get Google Gemini API key (free at https://aistudio.google.com/app/apikey)
3. Import repo to Vercel → add env vars → deploy

## User preferences

- Production target: Vercel (frontend + API as serverless function) + Supabase (PostgreSQL + Storage)
- No Railway or other backend hosting platforms
- All Replit-specific dependencies removed

## Gotchas

- Drizzle schema push: always run `pnpm --filter @workspace/db run push` after schema changes in dev
- The pnpm lockfile must be regenerated after removing `@replit/*` catalog entries: run `pnpm install --no-frozen-lockfile`
- Vercel free tier serverless functions have a 30s timeout — long AI streaming responses may need chunked transfer
- Supabase connection pooler (port 6543) must be used for `DATABASE_URL` in production, not the direct connection (port 5432)

## Pointers

- See `MIGRATION.md` for the Vercel + Supabase deployment walkthrough
- See `.env.example` for all environment variables
- See the `pnpm-workspace` skill for workspace structure details
