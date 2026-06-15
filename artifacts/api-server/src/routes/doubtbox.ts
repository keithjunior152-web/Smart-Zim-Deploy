import { Router, type IRouter } from "express";
import { eq, desc, and, sql } from "drizzle-orm";
import { db, doubtQuestions, users, type User } from "@workspace/db";
import { requireAuth } from "../lib/auth";

const router: IRouter = Router();

const selectShape = {
  id: doubtQuestions.id,
  subject: doubtQuestions.subject,
  question: doubtQuestions.question,
  isAnonymous: doubtQuestions.isAnonymous,
  answer: doubtQuestions.answer,
  answeredBy: doubtQuestions.answeredBy,
  isPublished: doubtQuestions.isPublished,
  createdAt: doubtQuestions.createdAt,
  answeredAt: doubtQuestions.answeredAt,
  answererName: sql<string | null>`${users.name}`.as("answerer_name"),
};

router.get("/doubt-box/:subject", requireAuth(), async (req, res): Promise<void> => {
  const subject = String(req.params.subject);
  const rows = await db
    .select(selectShape)
    .from(doubtQuestions)
    .leftJoin(users, eq(users.id, doubtQuestions.answeredBy!))
    .where(and(eq(doubtQuestions.isPublished, true), eq(doubtQuestions.subject, subject)))
    .orderBy(desc(doubtQuestions.createdAt))
    .limit(30);
  res.json(rows);
});

router.get("/doubt-box", requireAuth(), async (req, res): Promise<void> => {
  const subject = req.query.subject ? String(req.query.subject) : null;
  const condition = subject
    ? and(eq(doubtQuestions.isPublished, true), eq(doubtQuestions.subject, subject))
    : eq(doubtQuestions.isPublished, true);
  const rows = await db
    .select(selectShape)
    .from(doubtQuestions)
    .leftJoin(users, eq(users.id, doubtQuestions.answeredBy!))
    .where(condition)
    .orderBy(desc(doubtQuestions.createdAt))
    .limit(50);
  res.json(rows);
});

router.post("/doubt-box", requireAuth(), async (req, res): Promise<void> => {
  const me = (req as unknown as { user: User }).user;
  const { subject, question, isAnonymous } = req.body ?? {};
  if (!subject || !question) { res.status(400).json({ error: "subject and question required" }); return; }
  const anon = isAnonymous !== false;
  const [row] = await db.insert(doubtQuestions).values({
    subject: String(subject),
    question: String(question).slice(0, 1000),
    userId: me.id,
    isAnonymous: anon,
    isPublished: true,
    isModerated: false,
  }).returning();
  res.status(201).json(row);
});

router.post("/doubt-box/:id/answer", requireAuth(), async (req, res): Promise<void> => {
  const me = (req as unknown as { user: User }).user;
  if (me.role !== "teacher" && me.role !== "school_admin" && !me.isSuperAdmin) {
    res.status(403).json({ error: "Only teachers can answer" }); return;
  }
  const id = Number(req.params.id);
  const { answer } = req.body ?? {};
  if (!answer) { res.status(400).json({ error: "answer required" }); return; }
  const [updated] = await db.update(doubtQuestions)
    .set({ answer: String(answer).slice(0, 2000), answeredBy: me.id, answeredAt: new Date() })
    .where(eq(doubtQuestions.id, id))
    .returning();
  if (!updated) { res.status(404).json({ error: "Not found" }); return; }
  res.json(updated);
});

router.delete("/doubt-box/:id", requireAuth(), async (req, res): Promise<void> => {
  const me = (req as unknown as { user: User }).user;
  const id = Number(req.params.id);
  const [q] = await db.select().from(doubtQuestions).where(eq(doubtQuestions.id, id)).limit(1);
  if (!q) { res.status(404).json({ error: "Not found" }); return; }
  if (q.userId !== me.id && !me.isSuperAdmin) { res.status(403).json({ error: "Forbidden" }); return; }
  await db.delete(doubtQuestions).where(eq(doubtQuestions.id, id));
  res.json({ ok: true });
});

export default router;
