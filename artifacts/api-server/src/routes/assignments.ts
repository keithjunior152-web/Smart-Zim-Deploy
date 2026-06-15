import { Router, type IRouter } from "express";
import { and, desc, eq, or, sql } from "drizzle-orm";
import {
  db,
  assignments,
  submissions,
  users,
  notifications,
  type User,
  type Assignment,
  type Submission,
} from "@workspace/db";
import { requireAuth, requireRole } from "../lib/auth";

const router: IRouter = Router();

function serializeAssignment(a: Assignment, teacherName?: string | null, submissionCount = 0, mySubmission?: Submission | null) {
  return {
    id: a.id,
    title: a.title,
    instructions: a.instructions,
    subject: a.subject,
    grade: a.grade,
    deadline: a.deadline.toISOString(),
    fileUrl: a.fileUrl,
    teacherId: a.teacherId,
    teacherName: teacherName ?? null,
    status: a.status,
    createdAt: a.createdAt.toISOString(),
    submissionCount,
    mySubmission: mySubmission ? serializeSubmission(mySubmission) : null,
  };
}

function serializeSubmission(s: Submission, studentName = "", assignmentTitle: string | null = null) {
  return {
    id: s.id,
    assignmentId: s.assignmentId,
    assignmentTitle,
    studentId: s.studentId,
    studentName,
    textResponse: s.textResponse,
    fileUrl: s.fileUrl,
    submittedAt: s.submittedAt.toISOString(),
    grade: s.grade,
    feedback: s.feedback,
    gradedAt: s.gradedAt?.toISOString() ?? null,
    gradedBy: s.gradedBy,
  };
}

router.get("/assignments", requireAuth(), async (req, res): Promise<void> => {
  const me = (req as unknown as { user: User }).user;
  const grade = typeof req.query.grade === "string" ? req.query.grade : undefined;
  const teacherId = req.query.teacherId ? Number(req.query.teacherId) : undefined;
  const conds = [];
  if (grade) conds.push(eq(assignments.grade, grade));
  if (teacherId) conds.push(eq(assignments.teacherId, teacherId));

  // Students: show ALL assignments (or filtered by their grade when grade matches)
  // This ensures students always see assignments even if grade wasn't set or format differs
  if (me.role === "student" && me.grade && !grade) {
    conds.push(or(
      eq(assignments.grade, me.grade),
      sql`lower(${assignments.grade}) = lower(${me.grade})`,
    ));
  }
  if (me.role === "teacher" && !teacherId) conds.push(eq(assignments.teacherId, me.id));

  const rows = await db
    .select({ a: assignments, teacherName: users.name })
    .from(assignments)
    .leftJoin(users, eq(users.id, assignments.teacherId))
    .where(conds.length ? and(...conds) : undefined)
    .orderBy(desc(assignments.deadline));

  // If student has grade set but no results, fall back to showing all
  let finalRows = rows;
  if (me.role === "student" && me.grade && rows.length === 0 && !grade) {
    finalRows = await db
      .select({ a: assignments, teacherName: users.name })
      .from(assignments)
      .leftJoin(users, eq(users.id, assignments.teacherId))
      .orderBy(desc(assignments.deadline));
  }

  const ids = finalRows.map((r) => r.a.id);
  const counts = ids.length
    ? await db
        .select({ assignmentId: submissions.assignmentId, c: sql<number>`COUNT(*)::int` })
        .from(submissions)
        .where(sql`${submissions.assignmentId} IN ${ids}`)
        .groupBy(submissions.assignmentId)
    : [];
  const countMap = new Map(counts.map((c) => [c.assignmentId, c.c]));

  let mySubsMap = new Map<number, Submission>();
  if (me.role === "student" && ids.length) {
    const mine = await db
      .select()
      .from(submissions)
      .where(and(eq(submissions.studentId, me.id), sql`${submissions.assignmentId} IN ${ids}`));
    mySubsMap = new Map(mine.map((s) => [s.assignmentId, s]));
  }

  res.json(
    finalRows.map((r) =>
      serializeAssignment(r.a, r.teacherName, countMap.get(r.a.id) ?? 0, mySubsMap.get(r.a.id) ?? null),
    ),
  );
});

router.post("/assignments", requireRole("teacher"), async (req, res): Promise<void> => {
  const me = (req as unknown as { user: User }).user;
  const b = req.body;
  if (!b?.title || !b?.instructions || !b?.subject || !b?.grade || !b?.deadline) {
    res.status(400).json({ error: "Missing required fields" });
    return;
  }
  const [a] = await db
    .insert(assignments)
    .values({
      title: b.title,
      instructions: b.instructions,
      subject: b.subject,
      grade: b.grade,
      deadline: new Date(b.deadline),
      fileUrl: b.fileUrl ?? null,
      status: b.status ?? "open",
      teacherId: me.id,
    })
    .returning();

  const studentsOfGrade = await db
    .select()
    .from(users)
    .where(and(eq(users.role, "student"), or(eq(users.grade, b.grade), sql`lower(${users.grade}) = lower(${b.grade})`)));
  for (const s of studentsOfGrade) {
    await db.insert(notifications).values({
      userId: s.id,
      type: "assignment",
      title: `New assignment: ${a.title}`,
      message: `${me.name} posted a new ${a.subject} assignment due ${new Date(a.deadline).toDateString()}`,
      link: `/app/assignments/${a.id}`,
    });
  }

  res.status(201).json(serializeAssignment(a, me.name, 0, null));
});

router.get("/assignments/:id", requireAuth(), async (req, res): Promise<void> => {
  const id = Number(req.params.id);
  const me = (req as unknown as { user: User }).user;
  const [row] = await db
    .select({ a: assignments, teacherName: users.name })
    .from(assignments)
    .leftJoin(users, eq(users.id, assignments.teacherId))
    .where(eq(assignments.id, id))
    .limit(1);
  if (!row) { res.status(404).json({ error: "Not found" }); return; }
  const [{ c: count } = { c: 0 }] = await db
    .select({ c: sql<number>`COUNT(*)::int` })
    .from(submissions)
    .where(eq(submissions.assignmentId, id));
  let my: Submission | null = null;
  if (me.role === "student") {
    const [s] = await db
      .select()
      .from(submissions)
      .where(and(eq(submissions.assignmentId, id), eq(submissions.studentId, me.id)))
      .limit(1);
    my = s ?? null;
  }
  res.json(serializeAssignment(row.a, row.teacherName, count, my));
});

router.delete("/assignments/:id", requireRole("teacher"), async (req, res): Promise<void> => {
  const id = Number(req.params.id);
  await db.delete(assignments).where(eq(assignments.id, id));
  res.status(204).end();
});

router.get("/assignments/:id/submissions", requireRole("teacher"), async (req, res): Promise<void> => {
  const id = Number(req.params.id);
  const rows = await db
    .select({ s: submissions, studentName: users.name, assignmentTitle: assignments.title })
    .from(submissions)
    .leftJoin(users, eq(users.id, submissions.studentId))
    .leftJoin(assignments, eq(assignments.id, submissions.assignmentId))
    .where(eq(submissions.assignmentId, id))
    .orderBy(desc(submissions.submittedAt));
  res.json(rows.map((r) => serializeSubmission(r.s, r.studentName ?? "Unknown", r.assignmentTitle)));
});

router.post("/assignments/:id/submissions", requireRole("student"), async (req, res): Promise<void> => {
  const id = Number(req.params.id);
  const me = (req as unknown as { user: User }).user;
  const b = req.body;
  const [existing] = await db
    .select()
    .from(submissions)
    .where(and(eq(submissions.assignmentId, id), eq(submissions.studentId, me.id)))
    .limit(1);
  let s;
  if (existing) {
    [s] = await db
      .update(submissions)
      .set({ textResponse: b?.textResponse ?? null, fileUrl: b?.fileUrl ?? null, submittedAt: new Date() })
      .where(eq(submissions.id, existing.id))
      .returning();
  } else {
    [s] = await db
      .insert(submissions)
      .values({
        assignmentId: id,
        studentId: me.id,
        textResponse: b?.textResponse ?? null,
        fileUrl: b?.fileUrl ?? null,
      })
      .returning();
  }
  const [a] = await db.select().from(assignments).where(eq(assignments.id, id)).limit(1);
  if (a) {
    await db.insert(notifications).values({
      userId: a.teacherId,
      type: "submission",
      title: `New submission: ${a.title}`,
      message: `${me.name} submitted ${a.title}`,
      link: `/app/teacher/assignments/${a.id}/submissions`,
    });
  }
  res.status(201).json(serializeSubmission(s, me.name, a?.title ?? null));
});

router.post("/submissions/:id/grade", requireRole("teacher"), async (req, res): Promise<void> => {
  const id = Number(req.params.id);
  const me = (req as unknown as { user: User }).user;
  const grade = Number(req.body?.grade);
  const feedback = String(req.body?.feedback ?? "");
  const [s] = await db
    .update(submissions)
    .set({ grade, feedback, gradedAt: new Date(), gradedBy: me.name })
    .where(eq(submissions.id, id))
    .returning();
  if (!s) { res.status(404).json({ error: "Not found" }); return; }
  const [a] = await db.select().from(assignments).where(eq(assignments.id, s.assignmentId)).limit(1);
  await db.insert(notifications).values({
    userId: s.studentId,
    type: "graded",
    title: `Graded: ${a?.title ?? "Assignment"}`,
    message: `You scored ${grade}. ${feedback.slice(0, 80)}`,
    link: `/app/assignments/${s.assignmentId}`,
  });
  const [student] = await db.select().from(users).where(eq(users.id, s.studentId)).limit(1);
  res.json(serializeSubmission(s, student?.name ?? "", a?.title ?? null));
});

router.get("/my-submissions", requireRole("student"), async (req, res): Promise<void> => {
  const me = (req as unknown as { user: User }).user;
  const rows = await db
    .select({ s: submissions, assignmentTitle: assignments.title })
    .from(submissions)
    .leftJoin(assignments, eq(assignments.id, submissions.assignmentId))
    .where(eq(submissions.studentId, me.id))
    .orderBy(desc(submissions.submittedAt));
  res.json(rows.map((r) => serializeSubmission(r.s, me.name, r.assignmentTitle)));
});

export default router;
