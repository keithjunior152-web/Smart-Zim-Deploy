# Supabase notes for SmartZim uploads & referrals

This file documents the storage buckets, env vars, and policies required for the uploads and referral features.

Buckets (recommended)
- public bucket: user-uploads  (profile pics, post images)
- private bucket: payments-proofs (payment confirmation images)

Environment variables (Vercel / local)
- NEXT_PUBLIC_SUPABASE_URL - your Supabase URL
- NEXT_PUBLIC_SUPABASE_ANON_KEY - Supabase anon key for client
- SUPABASE_SERVICE_ROLE_KEY - Supabase service_role key (server only)
- NEXT_PUBLIC_BUCKET_PUBLIC - default: user-uploads
- NEXT_PUBLIC_BUCKET_PRIVATE - default: payments-proofs
- REFERRAL_REWARD_DEFAULT - default: 50

Storage & RLS notes
- Public bucket: allow authenticated users to upload to a path limited to their user id, e.g. `profiles/{userId}/*` or `users/{userId}/*`.
  Configure this in Storage Policies or enforce it in your client/server code.
- Private bucket: do NOT expose uploads publicly. Use server-side signed URLs (createSignedUrl) to grant temporary access to admins.

Referral flow
- New DB columns: auth.users(referral_code, referred_by, credits, is_admin)
- New table: public.referrals(referrer_id, referred_id, rewarded)
- New settings: public.app_settings(key, value) with key 'referral_reward'
- Reward awarding should occur only after payment confirmation (via your payment webhook/handler).

Admin UI
- Add a simple admin page to update `referral_reward` in `app_settings` and to view referral stats.

Security
- NEVER expose SUPABASE_SERVICE_ROLE_KEY to the client. Store it in server environment variables only.
- Validate file types & size on client and server.

