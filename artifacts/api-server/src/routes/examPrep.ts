import { Router, type IRouter } from "express";
import { eq, sql } from "drizzle-orm";
import { db, topicAttempts, examDates, syllabusTopics, type User } from "@workspace/db";
import { requireRole } from "../lib/auth";

const router: IRouter = Router();

const MASTERY_THRESHOLD = 70;

type Aggregate = { subject: string; topic: string; correct: number; total: number; attempts: number };

async function aggregateTopics(studentId: number): Promise<Aggregate[]> {
  const rows = await db
    .select({
      subject: topicAttempts.subject,
      topic: topicAttempts.topic,
      correct: sql<number>`sum(${topicAttempts.correct})`.mapWith(Number),
      total: sql<number>`sum(${topicAttempts.total})`.mapWith(Number),
      attempts: sql<number>`count(*)`.mapWith(Number),
    })
    .from(topicAttempts)
    .where(eq(topicAttempts.studentId, studentId))
    .groupBy(topicAttempts.subject, topicAttempts.topic);
  return rows;
}

function accuracy(correct: number, total: number): number {
  return total > 0 ? Math.round((correct / total) * 100) : 0;
}

router.get("/weak-topics", requireRole("student"), async (req, res): Promise<void> => {
  const me = (req as unknown as { user: User }).user;
  const subjectFilter = req.query.subject ? String(req.query.subject) : null;
  const aggregates = await aggregateTopics(me.id);
  const weak = aggregates
    .filter((a) => (subjectFilter ? a.subject.toLowerCase() === subjectFilter.toLowerCase() : true))
    .map((a) => ({
      subject: a.subject,
      topic: a.topic,
      correct: a.correct,
      total: a.total,
      accuracy: accuracy(a.correct, a.total),
      attempts: a.attempts,
    }))
    .sort((x, y) => x.accuracy - y.accuracy);
  res.json(weak);
});

router.get("/exam-readiness", requireRole("student"), async (req, res): Promise<void> => {
  const me = (req as unknown as { user: User }).user;
  const curriculum = me.curriculum ?? "ZIMSEC";

  const aggregates = await aggregateTopics(me.id);
  const exams = await db.select().from(examDates).where(eq(examDates.studentId, me.id));
  const syllabus = await db
    .select({ subject: syllabusTopics.subject, topic: syllabusTopics.topic })
    .from(syllabusTopics)
    .where(eq(syllabusTopics.curriculum, curriculum));

  // Build the set of subjects to report: user's subjects + any with exams or attempts.
  const userSubjects = Array.isArray(me.subjects) ? (me.subjects as string[]) : [];
  const subjectSet = new Map<string, string>(); // lowercase -> display
  for (const s of userSubjects) subjectSet.set(s.toLowerCase(), s);
  for (const e of exams) subjectSet.set(e.subject.toLowerCase(), e.subject);
  for (const a of aggregates) if (!subjectSet.has(a.subject.toLowerCase())) subjectSet.set(a.subject.toLowerCase(), a.subject);

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const result = Array.from(subjectSet.values()).map((subject) => {
    const key = subject.toLowerCase();
    const subjAgg = aggregates.filter((a) => a.subject.toLowerCase() === key);
    const totalTopics = syllabus.filter((t) => t.subject.toLowerCase() === key).length;
    const attemptedTopics = subjAgg.length;
    const masteredTopics = subjAgg.filter((a) => accuracy(a.correct, a.total) >= MASTERY_THRESHOLD).length;
    const weakTopics = subjAgg
      .map((a) => ({ topic: a.topic, acc: accuracy(a.correct, a.total) }))
      .sort((x, y) => x.acc - y.acc)
      .slice(0, 5)
      .map((a) => a.topic);

    const denom = totalTopics > 0 ? totalTopics : Math.max(attemptedTopics, 1);
    const readiness = Math.min(100, Math.round((masteredTopics / denom) * 100));

    const upcoming = exams
      .filter((e) => e.subject.toLowerCase() === key)
      .sort((a, b) => a.examDate.localeCompare(b.examDate));
    const next = upcoming[0] ?? null;
    let daysUntil: number | null = null;
    if (next) {
      const ed = new Date(next.examDate + "T00:00:00");
      daysUntil = Math.round((ed.getTime() - today.getTime()) / 86_400_000);
    }

    return {
      subject,
      examDate: next?.examDate ?? null,
      paper: next?.paper ?? null,
      daysUntil,
      totalTopics,
      attemptedTopics,
      masteredTopics,
      readiness,
      weakTopics,
    };
  });

  // Sort: soonest exam first, then by lowest readiness.
  result.sort((a, b) => {
    if (a.daysUntil != null && b.daysUntil != null) return a.daysUntil - b.daysUntil;
    if (a.daysUntil != null) return -1;
    if (b.daysUntil != null) return 1;
    return a.readiness - b.readiness;
  });

  res.json(result);
});

export default router;
