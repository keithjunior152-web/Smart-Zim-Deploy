import { Router, type IRouter } from "express";
import { and, desc, eq } from "drizzle-orm";
import { db, notes, users, type User } from "@workspace/db";
import { requireAuth, requireRole } from "../lib/auth";

const router: IRouter = Router();

function serialize(n: typeof notes.$inferSelect, teacherName?: string | null) {
  return {
    id: n.id,
    title: n.title,
    subject: n.subject,
    curriculum: n.curriculum,
    level: n.level,
    grade: n.grade,
    topic: n.topic,
    chapterNumber: n.chapterNumber,
    content: n.content,
    fileUrl: n.fileUrl,
    teacherId: n.teacherId,
    teacherName: teacherName ?? null,
    downloads: n.downloads,
    bookmarks: n.bookmarks,
    featured: n.featured,
    status: n.status,
    readMinutes: n.readMinutes,
    createdAt: n.createdAt.toISOString(),
  };
}

router.get("/notes", requireAuth(), async (req, res): Promise<void> => {
  const curriculum = typeof req.query.curriculum === "string" ? req.query.curriculum : undefined;
  const subject = typeof req.query.subject === "string" ? req.query.subject : undefined;
  const level = typeof req.query.level === "string" ? req.query.level : undefined;
  const grade = typeof req.query.grade === "string" ? req.query.grade : undefined;
  const conds = [eq(notes.status, "published")];
  if (curriculum) conds.push(eq(notes.curriculum, curriculum));
  if (subject) conds.push(eq(notes.subject, subject));
  if (level) conds.push(eq(notes.level, level));
  if (grade) conds.push(eq(notes.grade, grade));
  const rows = await db
    .select({ n: notes, teacherName: users.name })
    .from(notes)
    .leftJoin(users, eq(users.id, notes.teacherId))
    .where(and(...conds))
    .orderBy(desc(notes.featured), desc(notes.createdAt));
  res.json(rows.map((r) => serialize(r.n, r.teacherName)));
});

router.post("/notes", requireRole("teacher"), async (req, res): Promise<void> => {
  const me = (req as unknown as { user: User }).user;
  const b = req.body;
  if (!b?.title || !b?.subject || !b?.level || !b?.grade || !b?.topic || !b?.content) {
    res.status(400).json({ error: "Missing required fields" });
    return;
  }
  const [n] = await db
    .insert(notes)
    .values({
      title: b.title,
      subject: b.subject,
      curriculum: b.curriculum ?? "ZIMSEC",
      level: b.level,
      grade: b.grade,
      topic: b.topic,
      chapterNumber: b.chapterNumber ?? null,
      content: b.content,
      fileUrl: b.fileUrl ?? null,
      status: b.status ?? "published",
      teacherId: me.id,
      readMinutes: Math.max(3, Math.ceil(String(b.content).split(/\s+/).length / 200)),
    })
    .returning();
  res.status(201).json(serialize(n, me.name));
});

router.get("/notes/:id", requireAuth(), async (req, res): Promise<void> => {
  const id = Number(req.params.id);
  const [row] = await db
    .select({ n: notes, teacherName: users.name })
    .from(notes)
    .leftJoin(users, eq(users.id, notes.teacherId))
    .where(eq(notes.id, id))
    .limit(1);
  if (!row) {
    res.status(404).json({ error: "Not found" });
    return;
  }
  res.json(serialize(row.n, row.teacherName));
});

router.patch("/notes/:id", requireRole("teacher"), async (req, res): Promise<void> => {
  const id = Number(req.params.id);
  const b = req.body;
  const update: Partial<typeof notes.$inferInsert> = {};
  if (typeof b?.title === "string") update.title = b.title;
  if (typeof b?.content === "string") update.content = b.content;
  if (typeof b?.topic === "string") update.topic = b.topic;
  if (typeof b?.featured === "boolean") update.featured = b.featured;
  if (typeof b?.status === "string") update.status = b.status;
  const [n] = await db.update(notes).set(update).where(eq(notes.id, id)).returning();
  if (!n) {
    res.status(404).json({ error: "Not found" });
    return;
  }
  res.json(serialize(n));
});

router.delete("/notes/:id", requireRole("teacher"), async (req, res): Promise<void> => {
  const id = Number(req.params.id);
  await db.delete(notes).where(eq(notes.id, id));
  res.status(204).end();
});

export default router;
