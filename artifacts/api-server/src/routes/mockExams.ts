import { Router, type IRouter } from "express";
import { desc, eq } from "drizzle-orm";
import { db, mockExams, topicAttempts, users, type User } from "@workspace/db";
import { requireRole } from "../lib/auth";

const router: IRouter = Router();

function serialize(m: typeof mockExams.$inferSelect) {
  return {
    id: m.id,
    studentId: m.studentId,
    subject: m.subject,
    curriculum: m.curriculum,
    grade: m.grade,
    year: m.year,
    paperRef: m.paperRef,
    score: m.score,
    totalMarks: m.totalMarks,
    timeSpentMinutes: m.timeSpentMinutes,
    completedAt: m.completedAt.toISOString(),
  };
}

router.get("/mock-exams", requireRole("student", "teacher"), async (req, res): Promise<void> => {
  const me = (req as unknown as { user: User }).user;
  const rows =
    me.role === "student"
      ? await db.select().from(mockExams).where(eq(mockExams.studentId, me.id)).orderBy(desc(mockExams.completedAt))
      : await db.select().from(mockExams).orderBy(desc(mockExams.completedAt)).limit(50);
  res.json(rows.map(serialize));
});

router.post("/mock-exams", requireRole("student"), async (req, res): Promise<void> => {
  const me = (req as unknown as { user: User }).user;
  const b = req.body;
  const [m] = await db
    .insert(mockExams)
    .values({
      studentId: me.id,
      subject: b.subject,
      curriculum: b.curriculum ?? me.curriculum ?? "ZIMSEC",
      grade: b.grade,
      year: b.year ?? null,
      paperRef: b.paperRef ?? null,
      score: Number(b.score),
      totalMarks: Number(b.totalMarks),
      timeSpentMinutes: Number(b.timeSpentMinutes),
    })
    .returning();
  // bump streak + minutes
  await db
    .update(users)
    .set({
      totalStudyMinutes: (me.totalStudyMinutes ?? 0) + Number(b.timeSpentMinutes),
      studyStreak: (me.studyStreak ?? 0) + 1,
      lastActiveAt: new Date(),
    })
    .where(eq(users.id, me.id));

  // Capture per-topic performance for weak-topic analysis.
  const topicResults = Array.isArray(b.topicResults) ? b.topicResults : [];
  const rows = topicResults
    .filter((t: { topic?: string; total?: number }) => t && t.topic && Number(t.total) > 0)
    .map((t: { topic: string; correct?: number; total: number }) => ({
      studentId: me.id,
      curriculum: m.curriculum,
      subject: m.subject,
      topic: String(t.topic),
      correct: Math.max(0, Math.min(Number(t.total), Number(t.correct) || 0)),
      total: Number(t.total),
      source: "mock",
    }));
  if (rows.length > 0) {
    await db.insert(topicAttempts).values(rows);
  }

  res.status(201).json(serialize(m));
});

export default router;
