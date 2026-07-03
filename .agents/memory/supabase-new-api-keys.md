---
name: Supabase new API key format breaks storage admin SDK calls
description: Supabase projects created/migrated to the "new API keys" system issue sb_secret_/sb_publishable_ style keys instead of JWTs; these break supabase-js storage admin operations that expect a JWT service_role key.
---

Newer Supabase projects (or projects with "new API keys" enabled) expose keys in
the format `sb_secret_...` / `sb_publishable_...` instead of the legacy JWT
format (`eyJ...`). If a user pastes the new-style `sb_secret_...` key into
`SUPABASE_SERVICE_ROLE_KEY`, `@supabase/supabase-js` storage admin calls like
`createSignedUploadUrl()` fail at runtime with `Invalid Compact JWS` — the SDK
internally expects the service_role key to be a parseable JWT.

**Why:** the storage-js sub-library decodes the service_role key as a JWT to
determine role/permissions for admin operations; the new opaque secret key
format isn't a JWT and fails to parse.

**How to apply:** if a Supabase-backed upload/storage feature fails with
"Invalid Compact JWS" (or similarly cryptic JWT-parsing errors) right after a
service role key is added, ask the user to enable "Legacy API Keys" / "JWT
Keys" in Supabase Dashboard → Project Settings → API (sometimes under an
Advanced/Legacy tab), and copy the `service_role` key from there instead — it
will start with `eyJ`. This is unrelated to `SUPABASE_URL` or bucket setup.
