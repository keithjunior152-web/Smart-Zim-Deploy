---
name: Vercel serverless Express deployment
description: Common pitfalls wrapping an Express app as a Vercel serverless function in a pnpm monorepo, and the same-domain CORS trap.
---

When deploying an Express API as a Vercel serverless function (`api/index.ts` wrapping a bundled Express app) in a pnpm monorepo:

1. **Never statically `import` an ESM bundle from the function entry.** Vercel compiles `api/*.ts` to CommonJS, and a static `import` becomes `require()`, which throws `ERR_REQUIRE_ESM` against an ESM `dist/*.mjs` bundle. Use a lazily-cached `await import(...)` inside an async handler instead.
2. **The bundled entry must not call `app.listen()`/exit on missing `PORT`.** A dev entry point (`src/index.ts`) that calls `.listen()` is wrong for serverless — add a second build entry (e.g. `src/app.ts`) that only exports the Express app, and point the serverless function at that bundle.
3. **`api/*.ts` is type-checked by Vercel in isolation**, outside the monorepo's tsconfig/workspace graph. It has no access to `@types/node` or other workspace type packages. Avoid importing Node built-in types (`http`, etc.) in that file — use `unknown`/local type aliases instead, or the build fails with `TS2307` even though local `pnpm run typecheck` passes fine.
4. **Same-domain frontend+API on Vercel still triggers browser CORS.** If the SPA and API share one Vercel deployment (via rewrites), the browser still sends an `Origin` header on POST/PUT, and a static `ALLOWED_ORIGINS` allow-list won't include the ever-changing Vercel preview/production subdomain. Fix by dynamically comparing `Origin` against the request's own `Host`/`X-Forwarded-Host` header and allowing same-origin requests, rather than trying to enumerate every Vercel URL.
5. **Debugging loop for non-technical users deploying to Vercel:** build-log errors show in the "Deployments" tab; runtime errors (500s after a successful build) only show in the separate "Logs" tab. A "Redeploy" can silently redeploy a stale/previous commit if the user clicks it from the wrong deployment row — always confirm the deployed commit hash/message matches the latest fix before trusting that new code is live.

**Why:** each of these caused a distinct, confusing round of "I pushed the fix but the same error shows up" — none are discoverable from a single error message alone.
