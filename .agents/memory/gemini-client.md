---
name: Gemini AI client
description: The AI client lib is still named integrations-anthropic-ai but wraps Gemini 2.5 Flash.
---

## Rule
`lib/integrations-anthropic-ai/` now exports `gemini`, `generateText`, `generateWithParts`, `streamChat` powered by `@google/generative-ai`. Despite the package name, it's Gemini.

**Why:** Migrated from Anthropic to Gemini to use free GEMINI_API_KEY secret already in Replit. Package rename was skipped to avoid breaking all existing imports.

## How to apply
- Import from `@workspace/integrations-anthropic-ai` as before — exports are compatible.
- GEMINI_API_KEY is the required secret (not ANTHROPIC_API_KEY).
- Client is lazy-initialized — app starts without the key; throws only when AI routes are called.
