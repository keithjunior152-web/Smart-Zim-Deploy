import { Router, type IRouter } from "express";
import { and, desc, eq, sql } from "drizzle-orm";
import {
  db,
  users,
  notifications,
  subscriptions,
  mockExams,
  type User,
} from "@workspace/db";
import { requireAuth, requireSuperAdmin, serializeUser } from "../lib/auth";
import { sendApprovalEmail, sendRejectionEmail, sendSubscriptionEmail } from "../lib/email";

const router: IRouter = Router();

router.get("/users", requireSuperAdmin(), async (req, res): Promise<void> => {
  const status = typeof req.query.status === "string" ? req.query.status : undefined;
  const role = typeof req.query.role === "string" ? req.query.role : undefined;
  const conds = [];
  if (status) conds.push(eq(users.status, status));
  if (role) conds.push(eq(users.role, role));
  const where = conds.length > 0 ? and(...conds) : undefined;
  const rows = where
    ? await db.select().from(users).where(where).orderBy(desc(users.createdAt))
    : await db.select().from(users).orderBy(desc(users.createdAt));
  res.json(rows.map(serializeUser));
});

router.get("/users/:id", requireAuth(), async (req, res): Promise<void> => {
  const id = Number(req.params.id);
  if (!Number.isFinite(id)) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }
  const [u] = await db.select().from(users).where(eq(users.id, id)).limit(1);
  if (!u) {
    res.status(404).json({ error: "Not found" });
    return;
  }
  res.json(serializeUser(u));
});

router.patch("/users/:id", requireAuth(), async (req, res): Promise<void> => {
  const id = Number(req.params.id);
  const me = (req as unknown as { user: User }).user;
  if (id !== me.id && !me.isSuperAdmin) {
    res.status(403).json({ error: "Cannot update another user" });
    return;
  }
  const body = req.body as Record<string, unknown>;
  const update: Partial<User> = {};
  if (typeof body.name === "string") update.name = body.name;
  if (typeof body.grade === "string" || body.grade === null) update.grade = body.grade as string | null;
  if (typeof body.curriculum === "string") update.curriculum = body.curriculum;
  if (Array.isArray(body.subjects)) update.subjects = body.subjects.map((s: unknown) => String(s));
  if (typeof body.school === "string" || body.school === null) update.school = body.school as string | null;
  if (typeof body.phone === "string" || body.phone === null) update.phone = body.phone as string | null;
  if (typeof body.profilePhotoUrl === "string" || body.profilePhotoUrl === null) update.profilePhotoUrl = body.profilePhotoUrl as string | null;
  if (typeof body.coverPhotoUrl === "string" || body.coverPhotoUrl === null) update.coverPhotoUrl = body.coverPhotoUrl as string | null;
  const [u] = await db.update(users).set(update).where(eq(users.id, id)).returning();
  res.json(serializeUser(u));
});

router.delete("/users/:id", requireSuperAdmin(), async (req, res): Promise<void> => {
  const id = Number(req.params.id);
  await db.delete(users).where(eq(users.id, id));
  res.status(204).end();
});

router.post("/users/:id/approve", requireSuperAdmin(), async (req, res): Promise<void> => {
  const id = Number(req.params.id);
  const [u] = await db
    .update(users)
    .set({ status: "approved", rejectionReason: null })
    .where(eq(users.id, id))
    .returning();
  if (!u) {
    res.status(404).json({ error: "Not found" });
    return;
  }
  await db.insert(notifications).values({
    userId: u.id,
    type: "approved",
    title: "Welcome to SmartZim",
    message: "Your account has been approved. Your 7-day trial starts now.",
    link: "/app",
  });
  sendApprovalEmail(u.email, u.name).catch((err) =>
    req.log.warn({ err, userId: u.id }, "approval email failed")
  );
  res.json(serializeUser(u));
});

router.post("/users/:id/reject", requireSuperAdmin(), async (req, res): Promise<void> => {
  const id = Number(req.params.id);
  const reason = typeof req.body?.reason === "string" ? req.body.reason : "No reason provided";
  const [u] = await db
    .update(users)
    .set({ status: "rejected", rejectionReason: reason })
    .where(eq(users.id, id))
    .returning();
  if (!u) {
    res.status(404).json({ error: "Not found" });
    return;
  }
  await db.insert(notifications).values({
    userId: u.id,
    type: "rejected",
    title: "Registration not approved",
    message: reason,
  });
  sendRejectionEmail(u.email, u.name, reason).catch((err) =>
    req.log.warn({ err, userId: u.id }, "rejection email failed")
  );
  res.json(serializeUser(u));
});

router.post("/users/:id/grant-subscription", requireSuperAdmin(), async (req, res): Promise<void> => {
  const id = Number(req.params.id);
  const expiry = req.body?.expiryDate ? new Date(req.body.expiryDate) : new Date(Date.now() + 30 * 86400 * 1000);
  const plan = typeof req.body?.plan === "string" ? req.body.plan : "monthly";
  const [u] = await db
    .update(users)
    .set({ subscriptionStatus: "active", subscriptionExpiry: expiry })
    .where(eq(users.id, id))
    .returning();
  if (!u) {
    res.status(404).json({ error: "Not found" });
    return;
  }
  await db.insert(subscriptions).values({
    userId: u.id,
    plan,
    status: "active",
    startDate: new Date(),
    expiryDate: expiry,
    paymentMethod: "manual_grant",
    amountPaid: 0,
  });
  await db.insert(notifications).values({
    userId: u.id,
    type: "subscription",
    title: "Subscription activated",
    message: `Your ${plan} plan is active until ${expiry.toDateString()}.`,
    link: "/app/subscription",
  });
  sendSubscriptionEmail(u.email, u.name, plan, expiry).catch((err) =>
    req.log.warn({ err, userId: u.id }, "subscription email failed")
  );
  res.json(serializeUser(u));
});

router.post("/users/:id/revoke-subscription", requireSuperAdmin(), async (req, res): Promise<void> => {
  const id = Number(req.params.id);
  const [u] = await db
    .update(users)
    .set({ subscriptionStatus: "expired", subscriptionExpiry: new Date() })
    .where(eq(users.id, id))
    .returning();
  if (!u) {
    res.status(404).json({ error: "Not found" });
    return;
  }
  res.json(serializeUser(u));
});

router.post("/users/:id/promote", requireSuperAdmin(), async (req, res): Promise<void> => {
  const id = Number(req.params.id);
  const [u] = await db.update(users).set({ role: "school_admin" }).where(eq(users.id, id)).returning();
  if (!u) {
    res.status(404).json({ error: "Not found" });
    return;
  }
  res.json(serializeUser(u));
});

router.get("/leaderboard", requireAuth(), async (req, res): Promise<void> => {
  const grade = typeof req.query.grade === "string" ? req.query.grade : undefined;
  const type = typeof req.query.type === "string" ? req.query.type : "individual";

  if (type === "school") {
    const rows = await db
      .select({
        school: sql<string>`COALESCE(${users.school}, 'Unknown School')`,
        totalScore: sql<number>`COALESCE(SUM(${mockExams.score}), 0)::int`,
        examsCompleted: sql<number>`COUNT(${mockExams.id})::int`,
        studentCount: sql<number>`COUNT(DISTINCT ${users.id})::int`,
      })
      .from(users)
      .leftJoin(mockExams, eq(mockExams.studentId, users.id))
      .where(eq(users.role, "student"))
      .groupBy(sql`COALESCE(${users.school}, 'Unknown School')`)
      .orderBy(desc(sql`COALESCE(SUM(${mockExams.score}), 0)`))
      .limit(50);
    res.json(rows);
    return;
  }

  const conds = [eq(users.role, "student")];
  if (grade) conds.push(eq(users.grade, grade));
  const rows = await db
    .select({
      userId: users.id,
      name: users.name,
      grade: users.grade,
      school: users.school,
      score: sql<number>`COALESCE(SUM(${mockExams.score}), 0)::int`,
      examsCompleted: sql<number>`COUNT(${mockExams.id})::int`,
    })
    .from(users)
    .leftJoin(mockExams, eq(mockExams.studentId, users.id))
    .where(and(...conds))
    .groupBy(users.id)
    .orderBy(desc(sql`COALESCE(SUM(${mockExams.score}), 0)`))
    .limit(50);
  res.json(rows);
});

export default router;
