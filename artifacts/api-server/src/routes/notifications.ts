import { Router, type IRouter } from "express";
import { and, desc, eq } from "drizzle-orm";
import { db, notifications, type User } from "@workspace/db";
import { requireAuth } from "../lib/auth";

const router: IRouter = Router();

function serialize(n: typeof notifications.$inferSelect) {
  return {
    id: n.id,
    userId: n.userId,
    type: n.type,
    title: n.title,
    message: n.message,
    read: n.read,
    link: n.link,
    createdAt: n.createdAt.toISOString(),
  };
}

router.get("/notifications", requireAuth(), async (req, res): Promise<void> => {
  const me = (req as unknown as { user: User }).user;
  const rows = await db
    .select()
    .from(notifications)
    .where(eq(notifications.userId, me.id))
    .orderBy(desc(notifications.createdAt))
    .limit(100);
  res.json(rows.map(serialize));
});

router.post("/notifications/read-all", requireAuth(), async (req, res): Promise<void> => {
  const me = (req as unknown as { user: User }).user;
  await db.update(notifications).set({ read: true }).where(eq(notifications.userId, me.id));
  res.status(204).end();
});

router.post("/notifications/:id/read", requireAuth(), async (req, res): Promise<void> => {
  const me = (req as unknown as { user: User }).user;
  const id = Number(req.params.id);
  const [n] = await db
    .update(notifications)
    .set({ read: true })
    .where(and(eq(notifications.id, id), eq(notifications.userId, me.id)))
    .returning();
  if (!n) {
    res.status(404).json({ error: "Not found" });
    return;
  }
  res.json(serialize(n));
});

export default router;
