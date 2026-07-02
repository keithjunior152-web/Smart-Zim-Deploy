---
name: Vercel functions config path matching
description: vercel.json functions key must exactly match the source file path/extension used in api/, including extension.
---

## Rule
In `vercel.json`, the `functions` object key (e.g. `"api/index.ts"`) must match the actual filename+extension of the serverless entry file on disk. If the entry is `api/index.ts` but the key says `"api/index.js"`, Vercel fails the build with "pattern doesn't match any Serverless Functions".

**Why:** Caused a real "build error" on a Vercel deploy in this project — local `pnpm run build` succeeded fine (this only breaks in Vercel's own build step, not local build scripts), which made it easy to overlook.

## How to apply
- When adding/renaming an `api/*` entry file, immediately check `vercel.json`'s `functions` keys and `rewrites` destinations for the same filename.
- Rewrite destinations to serverless functions can drop the extension entirely (e.g. `/api/index`) — Vercel resolves it either way, but the `functions` key must be exact.
