import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import {
  db,
  users,
  notifications,
  bookmarks,
  subscriptions,
  plannerSlots,
  studentGamification,
  studentAchievements,
  focusSessions,
  doubtQuestions,
  submissions,
  mockExams,
  classChannels,
} from "@workspace/db";
import {
  RegisterUserBody,
  LoginUserBody,
  ChangeMyPasswordBody,
} from "@workspace/api-zod";
import {
  hashPassword,
  verifyPassword,
  serializeUser,
  getCurrentUser,
  requireAuth,
  SUPER_ADMIN_EMAILS,
} from "../lib/auth";
import { sendWelcomeEmail } from "../lib/email";

const router: IRouter = Router();

router.post("/auth/register", async (req, res): Promise<void> => {
  const parsed = RegisterUserBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const { name, email, password, role, grade, curriculum, subjects, school, phone, referralCode } = parsed.data;
  const normalizedEmail = email.toLowerCase().trim();

  const [existing] = await db.select().from(users).where(eq(users.email, normalizedEmail)).limit(1);
  if (existing) {
    res.status(400).json({ error: "An account with this email already exists" });
    return;
  }

  const isSuper = SUPER_ADMIN_EMAILS.has(normalizedEmail);
  const passwordHash = await hashPassword(password);
  const [user] = await db
    .insert(users)
    .values({
      name,
      email: normalizedEmail,
      passwordHash,
      role: isSuper ? "super_admin" : role,
      grade: grade ?? null,
      curriculum: curriculum ?? "ZIMSEC",
      subjects: Array.isArray(subjects) ? subjects : [],
      school: school ?? null,
      phone: phone ?? null,
      referralCode: referralCode ?? null,
      // Registrations are auto-approved for both students and teachers —
      // there is no manual admin review step in the signup flow anymore.
      status: "approved",
      subscriptionStatus: isSuper ? "active" : "trial",
      isSuperAdmin: isSuper,
      trialStartDate: new Date(),
      lastActiveAt: new Date(),
    })
    .returning();

  await db.insert(notifications).values({
    userId: user.id,
    type: "approved",
    title: "Welcome to SmartZim",
    message: isSuper ? "Your account is ready." : "Your account is ready. Your 7-day trial starts now.",
    link: "/app",
  });

  req.session.userId = user.id;
  res.status(201).json({ user: serializeUser(user) });

  // Send welcome email (fire-and-forget — don't block the response)
  if (!isSuper) {
    sendWelcomeEmail(user.email, user.name, role).catch((err) =>
      req.log.warn({ err }, "Failed to send welcome email"),
    );
  }
});

router.post("/auth/login", async (req, res): Promise<void> => {
  const parsed = LoginUserBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const email = parsed.data.email.toLowerCase().trim();
  const [user] = await db.select().from(users).where(eq(users.email, email)).limit(1);
  if (!user) {
    res.status(401).json({ error: "Invalid email or password" });
    return;
  }
  const ok = await verifyPassword(parsed.data.password, user.passwordHash);
  if (!ok) {
    res.status(401).json({ error: "Invalid email or password" });
    return;
  }
  await db.update(users).set({ lastActiveAt: new Date() }).where(eq(users.id, user.id));
  req.session.userId = user.id;
  res.status(200).json({ user: serializeUser(user) });
});

router.post("/auth/change-password", requireAuth(), async (req, res): Promise<void> => {
  const parsed = ChangeMyPasswordBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const user = await getCurrentUser(req);
  if (!user) {
    res.status(401).json({ error: "Not authenticated" });
    return;
  }
  const { currentPassword, newPassword } = parsed.data;
  const ok = await verifyPassword(currentPassword, user.passwordHash);
  if (!ok) {
    res.status(401).json({ error: "Current password is incorrect" });
    return;
  }
  const sameAsOld = await verifyPassword(newPassword, user.passwordHash);
  if (sameAsOld) {
    res.status(400).json({ error: "New password must be different from your current password" });
    return;
  }
  const passwordHash = await hashPassword(newPassword);
  await db.update(users).set({ passwordHash }).where(eq(users.id, user.id));
  // Rotate the session ID after a credential change so any previously-issued
  // session cookie can no longer be used to ride this session.
  const userId = user.id;
  await new Promise<void>((resolve, reject) => {
    req.session.regenerate((err) => (err ? reject(err) : resolve()));
  });
  req.session.userId = userId;
  req.log.info({ userId }, "user changed their password");
  res.status(200).json({ message: "Password changed successfully" });
});

router.post("/auth/logout", async (req, res): Promise<void> => {
  await new Promise<void>((resolve) => {
    req.session.destroy(() => resolve());
  });
  res.clearCookie("connect.sid");
  res.status(204).end();
});

router.get("/auth/me", async (req, res): Promise<void> => {
  const user = await getCurrentUser(req);
  if (!user) {
    res.status(401).json({ error: "Not authenticated" });
    return;
  }
  res.json(serializeUser(user));
});

// Self-service account + data deletion (required by Google Play account-deletion policy).
router.delete("/auth/account", requireAuth(), async (req, res): Promise<void> => {
  const userId = req.session.userId;
  if (!userId) {
    res.status(401).json({ error: "Not authenticated" });
    return;
  }

  await db.transaction(async (tx) => {
    // Personal data in tables without a cascading FK to users — delete explicitly.
    await tx.delete(bookmarks).where(eq(bookmarks.userId, userId));
    await tx.delete(notifications).where(eq(notifications.userId, userId));
    await tx.delete(subscriptions).where(eq(subscriptions.userId, userId));
    await tx.delete(plannerSlots).where(eq(plannerSlots.studentId, userId));
    await tx.delete(studentGamification).where(eq(studentGamification.userId, userId));
    await tx.delete(studentAchievements).where(eq(studentAchievements.userId, userId));
    await tx.delete(focusSessions).where(eq(focusSessions.userId, userId));
    await tx.delete(doubtQuestions).where(eq(doubtQuestions.userId, userId));
    await tx.delete(submissions).where(eq(submissions.studentId, userId));
    await tx.delete(mockExams).where(eq(mockExams.studentId, userId));
    // class_channels.created_by has no cascading FK, so delete channels this user
    // created before removing the user (their members/messages cascade on channelId).
    await tx.delete(classChannels).where(eq(classChannels.createdBy, userId));
    // Deleting the user cascades social, channel, conversation, quiz and tutoring data.
    await tx.delete(users).where(eq(users.id, userId));
  });

  req.log.info({ deletedUserId: userId }, "user deleted their account");

  await new Promise<void>((resolve) => {
    req.session.destroy(() => resolve());
  });
  res.clearCookie("connect.sid");
  res.status(204).end();
});

export default router;
