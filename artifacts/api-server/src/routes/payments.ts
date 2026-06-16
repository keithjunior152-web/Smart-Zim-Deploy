import { Router, type Request, type Response, type IRouter } from "express";
import Stripe from "stripe";
import { eq } from "drizzle-orm";
import { db, subscriptions, users, notifications, type User } from "@workspace/db";
import { requireAuth } from "../lib/auth";
import { sendSubscriptionEmail } from "../lib/email";
import { logger } from "../lib/logger";

// ── Plan config ───────────────────────────────────────────────────────────────
const PLANS = {
  monthly: { label: "Monthly Plan",  priceUsd: 2.00,  daysValid: 30  },
  yearly:  { label: "Yearly Plan",   priceUsd: 20.00, daysValid: 365 },
  school:  { label: "School Plan",   priceUsd: 50.00, daysValid: 30  },
} as const;

type PlanKey = keyof typeof PLANS;

function planExpiry(plan: PlanKey): Date {
  return new Date(Date.now() + PLANS[plan].daysValid * 86_400_000);
}

function siteOrigin(): string {
  return (
    process.env.SITE_ORIGIN ??
    (process.env.REPLIT_DOMAINS
      ? `https://${process.env.REPLIT_DOMAINS.split(",")[0]}`
      : "http://localhost:22156")
  );
}

// ── Stripe lazy client ────────────────────────────────────────────────────────
function getStripe(): Stripe {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error("STRIPE_SECRET_KEY is not set");
  return new Stripe(key);
}

// ── PayPal helpers ────────────────────────────────────────────────────────────
const PAYPAL_BASE =
  process.env.PAYPAL_ENV === "production"
    ? "https://api-m.paypal.com"
    : "https://api-m.sandbox.paypal.com";

async function getPayPalToken(): Promise<string> {
  const clientId = process.env.PAYPAL_CLIENT_ID;
  const secret   = process.env.PAYPAL_CLIENT_SECRET;
  if (!clientId || !secret)
    throw new Error("PAYPAL_CLIENT_ID and PAYPAL_CLIENT_SECRET must be set");
  const res = await fetch(`${PAYPAL_BASE}/v1/oauth2/token`, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: `Basic ${Buffer.from(`${clientId}:${secret}`).toString("base64")}`,
    },
    body: "grant_type=client_credentials",
  });
  const data = (await res.json()) as { access_token?: string; error?: string };
  if (!data.access_token)
    throw new Error(`PayPal auth failed: ${data.error ?? "unknown"}`);
  return data.access_token;
}

// ── Shared subscription activation ───────────────────────────────────────────
async function activateSubscription(
  userId: number,
  plan: PlanKey,
  paymentMethod: string,
  paymentRef: string,
  amountPaid: number,
): Promise<void> {
  const expiry = planExpiry(plan);
  await db.insert(subscriptions).values({
    userId,
    plan,
    status: "active",
    startDate: new Date(),
    expiryDate: expiry,
    paymentMethod,
    amountPaid,
    paymentReference: paymentRef,
  });
  const [u] = await db
    .update(users)
    .set({ subscriptionStatus: "active", subscriptionExpiry: expiry, status: "approved" })
    .where(eq(users.id, userId))
    .returning();
  if (!u) return;
  await db.insert(notifications).values({
    userId,
    type: "subscription",
    title: "Payment confirmed! 🎉",
    message: `Your ${plan} plan is active until ${expiry.toDateString()}.`,
    link: "/app/subscription",
  });
  sendSubscriptionEmail(u.email, u.name, plan, expiry).catch((err) =>
    logger.warn({ err, userId }, "subscription email failed"),
  );
}

// ── Stripe webhook (registered in app.ts BEFORE express.json) ─────────────────
export async function stripeWebhookHandler(req: Request, res: Response): Promise<void> {
  const rawSig = req.headers["stripe-signature"];
  const sig    = Array.isArray(rawSig) ? rawSig[0] : rawSig;
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!sig || !secret) {
    res.status(400).json({ error: "Missing stripe-signature or STRIPE_WEBHOOK_SECRET" });
    return;
  }
  let event: Stripe.Event;
  try {
    event = getStripe().webhooks.constructEvent(req.body as Buffer, sig, secret);
  } catch (err) {
    logger.warn({ err }, "Stripe webhook signature verification failed");
    res.status(400).json({ error: "Invalid signature" });
    return;
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    const userId  = Number(session.metadata?.userId);
    const plan    = session.metadata?.plan as PlanKey | undefined;
    if (userId && plan && PLANS[plan]) {
      const amount = (session.amount_total ?? 0) / 100;
      await activateSubscription(userId, plan, "stripe", session.id, amount);
      logger.info({ userId, plan }, "Stripe payment → subscription activated");
    }
  }
  res.json({ received: true });
}

// ── Router — normal JSON routes (checkout + PayPal) ──────────────────────────
const router: IRouter = Router();

// Stripe: create checkout session → return redirect URL
router.post("/payments/stripe/checkout", requireAuth(), async (req, res): Promise<void> => {
  const user = (req as unknown as { user: User }).user;
  const plan  = req.body?.plan as string;
  if (!plan || !(plan in PLANS)) {
    res.status(400).json({ error: "Invalid plan. Choose monthly, yearly, or school." });
    return;
  }
  const cfg = PLANS[plan as PlanKey];
  const session = await getStripe().checkout.sessions.create({
    mode: "payment",
    customer_email: user.email,
    line_items: [
      {
        price_data: {
          currency: "usd",
          unit_amount: Math.round(cfg.priceUsd * 100),
          product_data: {
            name: `SmartZim ${cfg.label}`,
            description: `${cfg.daysValid}-day access to all SmartZim features`,
          },
        },
        quantity: 1,
      },
    ],
    metadata: { userId: String(user.id), plan },
    success_url: `${siteOrigin()}/app/subscription?payment=success`,
    cancel_url:  `${siteOrigin()}/app/subscription?payment=cancelled`,
  });
  res.json({ url: session.url });
});

// PayPal: create order → return orderId to frontend
router.post("/payments/paypal/create-order", requireAuth(), async (req, res): Promise<void> => {
  const user = (req as unknown as { user: User }).user;
  const plan  = req.body?.plan as string;
  if (!plan || !(plan in PLANS)) {
    res.status(400).json({ error: "Invalid plan" });
    return;
  }
  const cfg   = PLANS[plan as PlanKey];
  const token = await getPayPalToken();
  const r     = await fetch(`${PAYPAL_BASE}/v2/checkout/orders`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify({
      intent: "CAPTURE",
      purchase_units: [
        {
          amount: { currency_code: "USD", value: cfg.priceUsd.toFixed(2) },
          description: `SmartZim ${cfg.label}`,
          custom_id: `${user.id}:${plan}`,
        },
      ],
      application_context: { shipping_preference: "NO_SHIPPING" },
    }),
  });
  const order = (await r.json()) as { id?: string; details?: unknown[] };
  if (!order.id) {
    logger.error({ order }, "PayPal create order failed");
    res.status(500).json({ error: "Failed to create PayPal order" });
    return;
  }
  res.json({ orderId: order.id });
});

// PayPal: capture order after user approves → activate subscription
router.post("/payments/paypal/capture-order/:orderId", requireAuth(), async (req, res): Promise<void> => {
  const user    = (req as unknown as { user: User }).user;
  const orderId = req.params.orderId as string;
  const token   = await getPayPalToken();
  const r       = await fetch(`${PAYPAL_BASE}/v2/checkout/orders/${orderId}/capture`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
  });
  const data = (await r.json()) as {
    status?: string;
    purchase_units?: { payments?: { captures?: { amount?: { value?: string }; custom_id?: string }[] } }[];
  };
  if (data.status !== "COMPLETED") {
    logger.warn({ data }, "PayPal capture not completed");
    res.status(400).json({ error: "Payment not completed" });
    return;
  }
  const capture   = data.purchase_units?.[0]?.payments?.captures?.[0];
  const customId  = capture?.custom_id ?? "";
  const [uidStr, plan] = customId.split(":");
  const amount    = parseFloat(capture?.amount?.value ?? "0");
  const userId    = Number(uidStr);

  if (!userId || !plan || !(plan in PLANS)) {
    res.status(400).json({ error: "Invalid order metadata" });
    return;
  }
  if (userId !== user.id) {
    res.status(403).json({ error: "User mismatch" });
    return;
  }
  await activateSubscription(userId, plan as PlanKey, "paypal", orderId, amount);
  logger.info({ userId, plan }, "PayPal payment → subscription activated");
  res.json({ success: true });
});

export default router;
