---
name: Stripe + PayPal integration
description: How Stripe and PayPal are wired in — custom direct SDK, no stripe-replit-sync.
---

## Rule
Do NOT use `stripe-replit-sync` — it requires the Replit Stripe connector (paid plan). Use the `stripe` npm package directly with `STRIPE_SECRET_KEY` env var.

**Why:** User is on Replit free tier. Replit Stripe connector is paid-only.

## How to apply
- Stripe webhook MUST be registered on `app` BEFORE `express.json()` middleware (raw body needed for signature verification). See `artifacts/api-server/src/app.ts`.
- Webhook handler exported from `routes/payments.ts` as `stripeWebhookHandler`.
- PayPal uses REST API v2 directly via `fetch` (no SDK) with `PAYPAL_CLIENT_ID` + `PAYPAL_CLIENT_SECRET`.
- On successful payment, `activateSubscription()` in `routes/payments.ts` sets user status to "approved" + subscriptionStatus to "active" automatically — no admin needed.

## Key env vars
- `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `VITE_STRIPE_PUBLISHABLE_KEY`
- `PAYPAL_CLIENT_ID`, `PAYPAL_CLIENT_SECRET`, `PAYPAL_ENV` (sandbox|production), `VITE_PAYPAL_CLIENT_ID`

## Prices (configurable in PLANS const in routes/payments.ts)
- monthly: $2/30 days, yearly: $20/365 days, school: $50/30 days
