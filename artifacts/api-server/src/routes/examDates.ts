import { Router, type IRouter } from "express";
import { and, asc, eq } from "drizzle-orm";
import { db, examDates, type User } from "@workspace/db";
import { requireRole } from "../lib/auth";

const router: IRouter = Router();

function serialize(e: typeof examDates.$inferSelect) {
  return {
    id: e.id,
    studentId: e.studentId,
    curriculum: e.curriculum,
    subject: e.subject,
    paper: e.paper,
    examDate: e.examDate,
    createdAt: e.createdAt.toISOString(),
  };
}

router.get("/exam-dates", requireRole("student"), async (req, res): Promise<void> => {
  const me = (req as unknown as { user: User }).user;
  const rows = await db
    .select()
    .from(examDates)
    .where(eq(examDates.studentId, me.id))
    .orderBy(asc(examDates.examDate));
  res.json(rows.map(serialize));
});

router.post("/exam-dates", requireRole("student"), async (req, res): Promise<void> => {
  const me = (req as unknown as { user: User }).user;
  const b = req.body;
  if (!b?.subject || !b?.examDate) {
    res.status(400).json({ error: "subject and examDate are required" });
    return;
  }
  const examDate = String(b.examDate);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(examDate) || Number.isNaN(Date.parse(examDate))) {
    res.status(400).json({ error: "examDate must be a valid YYYY-MM-DD date" });
    return;
  }
  const [e] = await db
    .insert(examDates)
    .values({
      studentId: me.id,
      curriculum: b.curriculum ?? me.curriculum ?? "ZIMSEC",
      subject: String(b.subject),
      paper: b.paper ?? null,
      examDate,
    })
    .returning();
  res.status(201).json(serialize(e));
});

router.delete("/exam-dates/:id", requireRole("student"), async (req, res): Promise<void> => {
  const me = (req as unknown as { user: User }).user;
  const id = Number(req.params.id);
  await db.delete(examDates).where(and(eq(examDates.id, id), eq(examDates.studentId, me.id)));
  res.status(204).end();
});

export default router;
