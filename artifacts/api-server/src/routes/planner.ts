import { Router, type IRouter } from "express";
import { and, asc, eq } from "drizzle-orm";
import { db, plannerSlots, type User } from "@workspace/db";
import { requireRole } from "../lib/auth";

const router: IRouter = Router();

function serialize(p: typeof plannerSlots.$inferSelect) {
  return {
    id: p.id,
    studentId: p.studentId,
    weekOf: p.weekOf,
    day: p.day,
    subject: p.subject,
    topic: p.topic,
    source: p.source,
    durationMinutes: p.durationMinutes,
    time: p.time,
    createdAt: p.createdAt.toISOString(),
  };
}

router.get("/planner", requireRole("student"), async (req, res): Promise<void> => {
  const me = (req as unknown as { user: User }).user;
  const rows = await db
    .select()
    .from(plannerSlots)
    .where(eq(plannerSlots.studentId, me.id))
    .orderBy(asc(plannerSlots.weekOf), asc(plannerSlots.day), asc(plannerSlots.time));
  res.json(rows.map(serialize));
});

router.post("/planner", requireRole("student"), async (req, res): Promise<void> => {
  const me = (req as unknown as { user: User }).user;
  const b = req.body;
  const [p] = await db
    .insert(plannerSlots)
    .values({
      studentId: me.id,
      weekOf: b.weekOf,
      day: b.day,
      subject: b.subject,
      topic: b.topic ?? null,
      durationMinutes: Number(b.durationMinutes),
      time: b.time,
    })
    .returning();
  res.status(201).json(serialize(p));
});

router.delete("/planner/:id", requireRole("student"), async (req, res): Promise<void> => {
  const me = (req as unknown as { user: User }).user;
  const id = Number(req.params.id);
  await db.delete(plannerSlots).where(and(eq(plannerSlots.id, id), eq(plannerSlots.studentId, me.id)));
  res.status(204).end();
});

export default router;
