import { Router, type IRouter } from "express";
import { and, desc, eq } from "drizzle-orm";
import { db, bookmarks, type User } from "@workspace/db";
import { requireAuth } from "../lib/auth";

const router: IRouter = Router();

function serialize(b: typeof bookmarks.$inferSelect) {
  return {
    id: b.id,
    userId: b.userId,
    itemType: b.itemType,
    itemId: b.itemId,
    title: b.title,
    savedAt: b.savedAt.toISOString(),
  };
}

router.get("/bookmarks", requireAuth(), async (req, res): Promise<void> => {
  const me = (req as unknown as { user: User }).user;
  const rows = await db.select().from(bookmarks).where(eq(bookmarks.userId, me.id)).orderBy(desc(bookmarks.savedAt));
  res.json(rows.map(serialize));
});

router.post("/bookmarks", requireAuth(), async (req, res): Promise<void> => {
  const me = (req as unknown as { user: User }).user;
  const b = req.body;
  const [existing] = await db
    .select()
    .from(bookmarks)
    .where(
      and(eq(bookmarks.userId, me.id), eq(bookmarks.itemType, b.itemType), eq(bookmarks.itemId, Number(b.itemId))),
    )
    .limit(1);
  if (existing) {
    res.status(201).json(serialize(existing));
    return;
  }
  const [created] = await db
    .insert(bookmarks)
    .values({ userId: me.id, itemType: b.itemType, itemId: Number(b.itemId), title: b.title ?? null })
    .returning();
  res.status(201).json(serialize(created));
});

router.delete("/bookmarks/:id", requireAuth(), async (req, res): Promise<void> => {
  const me = (req as unknown as { user: User }).user;
  const id = Number(req.params.id);
  await db.delete(bookmarks).where(and(eq(bookmarks.id, id), eq(bookmarks.userId, me.id)));
  res.status(204).end();
});

export default router;
