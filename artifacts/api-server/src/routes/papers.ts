import { Router, type IRouter } from "express";
import { and, desc, eq, sql } from "drizzle-orm";
import { db, papers } from "@workspace/db";
import { requireAuth, requireRole } from "../lib/auth";

const router: IRouter = Router();

function serialize(p: typeof papers.$inferSelect) {
  return {
    id: p.id,
    examBoard: p.examBoard,
    curriculum: p.curriculum,
    subject: p.subject,
    paperCode: p.paperCode,
    level: p.level,
    grade: p.grade,
    year: p.year,
    session: p.session,
    paperNumber: p.paperNumber,
    fileUrl: p.fileUrl,
    markSchemeUrl: p.markSchemeUrl,
    downloads: p.downloads,
    bookmarks: p.bookmarks,
    topicTags: p.topicTags ?? [],
    featured: p.featured,
    createdAt: p.createdAt.toISOString(),
  };
}

router.get("/papers", requireAuth(), async (req, res): Promise<void> => {
  const curriculum = typeof req.query.curriculum === "string" ? req.query.curriculum : undefined;
  const examBoard = typeof req.query.examBoard === "string" ? req.query.examBoard : undefined;
  const subject = typeof req.query.subject === "string" ? req.query.subject : undefined;
  const level = typeof req.query.level === "string" ? req.query.level : undefined;
  const year = req.query.year ? Number(req.query.year) : undefined;
  const conds = [];
  if (curriculum) conds.push(eq(papers.curriculum, curriculum));
  if (examBoard) conds.push(eq(papers.examBoard, examBoard));
  if (subject) conds.push(eq(papers.subject, subject));
  if (level) conds.push(eq(papers.level, level));
  if (year) conds.push(eq(papers.year, year));
  const rows = conds.length
    ? await db.select().from(papers).where(and(...conds)).orderBy(desc(papers.featured), desc(papers.year))
    : await db.select().from(papers).orderBy(desc(papers.featured), desc(papers.year));
  res.json(rows.map(serialize));
});

router.post("/papers", requireRole("teacher"), async (req, res): Promise<void> => {
  const b = req.body;
  if (!b?.examBoard || !b?.subject || !b?.level || !b?.year) {
    res.status(400).json({ error: "Missing required fields" });
    return;
  }
  const [p] = await db
    .insert(papers)
    .values({
      examBoard: b.examBoard,
      curriculum: b.curriculum ?? b.examBoard ?? "ZIMSEC",
      subject: b.subject,
      paperCode: b.paperCode ?? null,
      level: b.level,
      grade: b.grade ?? null,
      year: Number(b.year),
      session: b.session ?? null,
      paperNumber: b.paperNumber ?? null,
      fileUrl: b.fileUrl ?? null,
      markSchemeUrl: b.markSchemeUrl ?? null,
      topicTags: Array.isArray(b.topicTags) ? b.topicTags : [],
    })
    .returning();
  res.status(201).json(serialize(p));
});

router.get("/papers/:id", requireAuth(), async (req, res): Promise<void> => {
  const id = Number(req.params.id);
  const [p] = await db.select().from(papers).where(eq(papers.id, id)).limit(1);
  if (!p) {
    res.status(404).json({ error: "Not found" });
    return;
  }
  res.json(serialize(p));
});

router.delete("/papers/:id", requireRole("teacher"), async (req, res): Promise<void> => {
  const id = Number(req.params.id);
  await db.delete(papers).where(eq(papers.id, id));
  res.status(204).end();
});

router.post("/papers/:id/download", requireAuth(), async (req, res): Promise<void> => {
  const id = Number(req.params.id);
  const [p] = await db
    .update(papers)
    .set({ downloads: sql`${papers.downloads} + 1` })
    .where(eq(papers.id, id))
    .returning();
  if (!p) {
    res.status(404).json({ error: "Not found" });
    return;
  }
  res.json(serialize(p));
});

export default router;
