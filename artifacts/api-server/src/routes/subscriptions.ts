import { Router, type IRouter } from "express";
import { desc, eq } from "drizzle-orm";
import { db, subscriptions, users, notifications, type User } from "@workspace/db";
import { requireAuth, requireSuperAdmin } from "../lib/auth";

const router: IRouter = Router();

// Only accept internal object-storage paths as payment proof to avoid
// stored URL injection (javascript:/data:/phishing) when the admin views it.
function sanitizeProofUrl(raw: unknown): string | null {
  if (!raw) return null;
  const v = String(raw).trim();
  if (v.length > 500) return null;
  return /^\/api\/storage\/objects\/[\w\-./]+$/.test(v) ? v : null;
}

function clamp(raw: unknown, max: number): string | null {
  if (!raw) return null;
  const v = String(raw).trim();
  if (!v) return null;
  return v.slice(0, max);
}

function serialize(s: typeof subscriptions.$inferSelect, userName?: string | null, userEmail?: string | null) {
  return {
    id: s.id,
    userId: s.userId,
    userName: userName ?? null,
    userEmail: userEmail ?? null,
    plan: s.plan,
    status: s.status,
    startDate: s.startDate.toISOString(),
    expiryDate: s.expiryDate.toISOString(),
    paymentMethod: s.paymentMethod,
    amountPaid: s.amountPaid,
    proofUrl: s.proofUrl ?? null,
    paymentReference: s.paymentReference ?? null,
    senderPhone: s.senderPhone ?? null,
    rejectionReason: s.rejectionReason ?? null,
    createdAt: s.createdAt.toISOString(),
  };
}

router.get("/subscriptions", requireSuperAdmin(), async (_req, res): Promise<void> => {
  const rows = await db
    .select({ s: subscriptions, name: users.name, email: users.email })
    .from(subscriptions)
    .leftJoin(users, eq(users.id, subscriptions.userId))
    .orderBy(desc(subscriptions.createdAt));
  res.json(rows.map((r) => serialize(r.s, r.name, r.email)));
});

// Current user's own subscriptions (latest first)
router.get("/subscriptions/mine", requireAuth(), async (req, res): Promise<void> => {
  const me = (req as unknown as { user: User }).user;
  const rows = await db
    .select()
    .from(subscriptions)
    .where(eq(subscriptions.userId, me.id))
    .orderBy(desc(subscriptions.createdAt));
  res.json(rows.map((s) => serialize(s, me.name, me.email)));
});

router.post("/subscriptions/checkout", requireAuth(), async (req, res): Promise<void> => {
  const me = (req as unknown as { user: User }).user;
  const b = req.body ?? {};
  const plan = String(b?.plan ?? "monthly");
  const paymentMethod = String(b?.paymentMethod ?? "manual");
  const amount = plan === "school" ? 50 : plan === "registration" ? 4 : 2;
  const expiry = new Date(Date.now() + 30 * 86400 * 1000);
  const [s] = await db
    .insert(subscriptions)
    .values({
      userId: me.id,
      plan,
      status: "pending",
      startDate: new Date(),
      expiryDate: expiry,
      paymentMethod,
      amountPaid: amount,
      proofUrl: sanitizeProofUrl(b?.proofUrl),
      paymentReference: clamp(b?.paymentReference, 200),
      senderPhone: clamp(b?.senderPhone, 40),
    })
    .returning();
  res.status(201).json(serialize(s, me.name, me.email));
});

// Start 7-day free trial (one per user)
router.post("/subscriptions/trial", requireAuth(), async (req, res): Promise<void> => {
  const me = (req as unknown as { user: User }).user;
  // Check if user already has any subscription
  const [existing] = await db.select().from(subscriptions).where(eq(subscriptions.userId, me.id)).limit(1);
  if (existing) { res.status(409).json({ error: "You already have a subscription or trial" }); return; }
  const expiry = new Date(Date.now() + 7 * 86400 * 1000);
  const [s] = await db
    .insert(subscriptions)
    .values({
      userId: me.id,
      plan: "trial",
      status: "trial",
      startDate: new Date(),
      expiryDate: expiry,
      paymentMethod: "none",
      amountPaid: 0,
    })
    .returning();
  res.status(201).json(serialize(s, me.name, me.email));
});

// Super admin: approve a subscription (marks active AND unlocks the user's account)
router.patch("/subscriptions/:id/approve", requireSuperAdmin(), async (req, res): Promise<void> => {
  const id = Number(req.params.id);
  const [updated] = await db
    .update(subscriptions)
    .set({ status: "active", rejectionReason: null })
    .where(eq(subscriptions.id, id))
    .returning();
  if (!updated) { res.status(404).json({ error: "Subscription not found" }); return; }
  // Unlock the user: activate their subscription status + expiry
  await db
    .update(users)
    .set({ subscriptionStatus: "active", subscriptionExpiry: updated.expiryDate })
    .where(eq(users.id, updated.userId));
  await db.insert(notifications).values({
    userId: updated.userId,
    type: "subscription",
    title: "Payment approved",
    message: "Your payment has been verified and your SmartZim account is now active. Enjoy full access!",
    link: "/app/subscription",
  });
  const [u] = await db.select({ name: users.name, email: users.email }).from(users).where(eq(users.id, updated.userId)).limit(1);
  res.json(serialize(updated, u?.name, u?.email));
});

// Super admin: reject a subscription payment
router.patch("/subscriptions/:id/reject", requireSuperAdmin(), async (req, res): Promise<void> => {
  const id = Number(req.params.id);
  const reason = String(req.body?.reason ?? "").trim().slice(0, 500);
  if (!reason) { res.status(400).json({ error: "A reason is required" }); return; }
  const [updated] = await db
    .update(subscriptions)
    .set({ status: "rejected", rejectionReason: reason })
    .where(eq(subscriptions.id, id))
    .returning();
  if (!updated) { res.status(404).json({ error: "Subscription not found" }); return; }
  await db.insert(notifications).values({
    userId: updated.userId,
    type: "subscription",
    title: "Payment could not be verified",
    message: `We couldn't verify your recent payment: ${reason}. Please re-submit your proof of payment.`,
    link: "/app/subscription",
  });
  const [u] = await db.select({ name: users.name, email: users.email }).from(users).where(eq(users.id, updated.userId)).limit(1);
  res.json(serialize(updated, u?.name, u?.email));
});

export default router;
