import { Router, type IRouter } from "express";
import { and, asc, eq } from "drizzle-orm";
import { db, syllabusTopics } from "@workspace/db";
import { requireAuth } from "../lib/auth";

const router: IRouter = Router();

router.get("/syllabus", requireAuth(), async (req, res): Promise<void> => {
  const curriculum = typeof req.query.curriculum === "string" ? req.query.curriculum : undefined;
  const subject = typeof req.query.subject === "string" ? req.query.subject : undefined;
  const level = typeof req.query.level === "string" ? req.query.level : undefined;
  const conds = [];
  if (curriculum) conds.push(eq(syllabusTopics.curriculum, curriculum));
  if (subject) conds.push(eq(syllabusTopics.subject, subject));
  if (level) conds.push(eq(syllabusTopics.level, level));
  const rows = conds.length
    ? await db.select().from(syllabusTopics).where(and(...conds)).orderBy(asc(syllabusTopics.subject), asc(syllabusTopics.strand))
    : await db.select().from(syllabusTopics).orderBy(asc(syllabusTopics.subject), asc(syllabusTopics.strand));
  res.json(
    rows.map((t) => ({
      id: t.id,
      subject: t.subject,
      examBoard: t.examBoard,
      curriculum: t.curriculum,
      level: t.level,
      grade: t.grade,
      strand: t.strand,
      topic: t.topic,
      subtopics: t.subtopics ?? [],
      learningObjectives: t.learningObjectives,
    })),
  );
});

export default router;
