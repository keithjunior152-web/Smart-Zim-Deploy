import { Router, type IRouter } from "express";
import { and, asc, desc, eq, gte, sql } from "drizzle-orm";
import {
  db,
  users,
  notes,
  papers,
  assignments,
  submissions,
  notifications,
  subscriptions,
  announcements,
  type User,
} from "@workspace/db";
import { requireAuth, requireRole, requireSuperAdmin } from "../lib/auth";

const router: IRouter = Router();

const QUOTES = [
  "Education is the most powerful weapon you can use to change the world. — Nelson Mandela",
  "Success is no accident. It is hard work, perseverance, learning, studying, sacrifice and most of all, love of what you are doing.",
  "The expert in anything was once a beginner.",
  "Strive for progress, not perfection.",
  "Do something today that your future self will thank you for.",
  "Small daily improvements over time lead to stunning results.",
];

router.get("/dashboard/student", requireRole("student"), async (req, res): Promise<void> => {
  const me = (req as unknown as { user: User }).user;
  const sevenDaysAgo = new Date(Date.now() - 7 * 86400 * 1000);

  const upcoming = await db
    .select({ a: assignments, teacherName: users.name })
    .from(assignments)
    .leftJoin(users, eq(users.id, assignments.teacherId))
    .where(and(me.grade ? eq(assignments.grade, me.grade) : sql`TRUE`, gte(assignments.deadline, new Date())))
    .orderBy(asc(assignments.deadline))
    .limit(5);

  const recentNotes = await db
    .select({ n: notes, teacherName: users.name })
    .from(notes)
    .leftJoin(users, eq(users.id, notes.teacherId))
    .where(eq(notes.status, "published"))
    .orderBy(desc(notes.createdAt))
    .limit(6);

  const featuredPapers = await db
    .select()
    .from(papers)
    .orderBy(desc(papers.featured), desc(papers.year))
    .limit(6);

  const [{ c: notesReadThisWeek = 0 } = { c: 0 }] = await db
    .select({ c: sql<number>`COUNT(*)::int` })
    .from(notifications)
    .where(and(eq(notifications.userId, me.id), gte(notifications.createdAt, sevenDaysAgo)));

  const [{ c: papersAttempted = 0 } = { c: 0 }] = await db
    .select({ c: sql<number>`COUNT(DISTINCT ${submissions.assignmentId})::int` })
    .from(submissions)
    .where(eq(submissions.studentId, me.id));

  const [{ c: assignmentsDue = 0 } = { c: 0 }] = await db
    .select({ c: sql<number>`COUNT(*)::int` })
    .from(assignments)
    .where(and(me.grade ? eq(assignments.grade, me.grade) : sql`TRUE`, gte(assignments.deadline, new Date())));

  const greeting = (() => {
    const h = new Date().getHours();
    const first = me.name.split(/\s+/)[0];
    if (h < 12) return `Good morning, ${first}`;
    if (h < 17) return `Good afternoon, ${first}`;
    return `Good evening, ${first}`;
  })();

  res.json({
    greeting,
    studyStreak: me.studyStreak,
    notesReadThisWeek,
    papersAttempted,
    assignmentsDue,
    weeklyGoalMinutes: 300,
    weeklyMinutesCompleted: Math.min(me.totalStudyMinutes % 300 || 0, 300),
    upcomingAssignments: upcoming.map((r) => ({
      id: r.a.id,
      title: r.a.title,
      instructions: r.a.instructions,
      subject: r.a.subject,
      grade: r.a.grade,
      deadline: r.a.deadline.toISOString(),
      fileUrl: r.a.fileUrl,
      teacherId: r.a.teacherId,
      teacherName: r.teacherName,
      status: r.a.status,
      createdAt: r.a.createdAt.toISOString(),
      submissionCount: 0,
      mySubmission: null,
    })),
    recentNotes: recentNotes.map((r) => ({
      id: r.n.id,
      title: r.n.title,
      subject: r.n.subject,
      level: r.n.level,
      grade: r.n.grade,
      topic: r.n.topic,
      chapterNumber: r.n.chapterNumber,
      content: r.n.content,
      fileUrl: r.n.fileUrl,
      teacherId: r.n.teacherId,
      teacherName: r.teacherName,
      downloads: r.n.downloads,
      bookmarks: r.n.bookmarks,
      featured: r.n.featured,
      status: r.n.status,
      readMinutes: r.n.readMinutes,
      createdAt: r.n.createdAt.toISOString(),
    })),
    featuredPapers: featuredPapers.map((p) => ({
      id: p.id,
      examBoard: p.examBoard,
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
    })),
    motivationalQuote: QUOTES[Math.floor(Math.random() * QUOTES.length)],
  });
});

router.get("/dashboard/teacher", requireRole("teacher"), async (req, res): Promise<void> => {
  const me = (req as unknown as { user: User }).user;
  const myAssignments = await db
    .select()
    .from(assignments)
    .where(eq(assignments.teacherId, me.id))
    .orderBy(desc(assignments.createdAt))
    .limit(10);
  const aIds = myAssignments.map((a) => a.id);

  const [{ c: totalStudents = 0 } = { c: 0 }] = await db
    .select({ c: sql<number>`COUNT(*)::int` })
    .from(users)
    .where(eq(users.role, "student"));

  const [{ c: notesUploaded = 0 } = { c: 0 }] = await db
    .select({ c: sql<number>`COUNT(*)::int` })
    .from(notes)
    .where(eq(notes.teacherId, me.id));

  const [{ c: papersUploaded = 0 } = { c: 0 }] = await db
    .select({ c: sql<number>`COUNT(*)::int` })
    .from(papers);

  const [{ c: pendingSubmissions = 0 } = { c: 0 }] = aIds.length
    ? await db
        .select({ c: sql<number>`COUNT(*)::int` })
        .from(submissions)
        .where(and(sql`${submissions.assignmentId} IN ${aIds}`, sql`${submissions.grade} IS NULL`))
    : [{ c: 0 }];

  const recentRows = aIds.length
    ? await db
        .select({ s: submissions, studentName: users.name, assignmentTitle: assignments.title })
        .from(submissions)
        .leftJoin(users, eq(users.id, submissions.studentId))
        .leftJoin(assignments, eq(assignments.id, submissions.assignmentId))
        .where(sql`${submissions.assignmentId} IN ${aIds}`)
        .orderBy(desc(submissions.submittedAt))
        .limit(8)
    : [];

  res.json({
    totalStudents,
    pendingSubmissions,
    notesUploaded,
    papersUploaded,
    recentSubmissions: recentRows.map((r) => ({
      id: r.s.id,
      assignmentId: r.s.assignmentId,
      assignmentTitle: r.assignmentTitle,
      studentId: r.s.studentId,
      studentName: r.studentName ?? "Unknown",
      textResponse: r.s.textResponse,
      fileUrl: r.s.fileUrl,
      submittedAt: r.s.submittedAt.toISOString(),
      grade: r.s.grade,
      feedback: r.s.feedback,
      gradedAt: r.s.gradedAt?.toISOString() ?? null,
      gradedBy: r.s.gradedBy,
    })),
    myAssignments: myAssignments.map((a) => ({
      id: a.id,
      title: a.title,
      instructions: a.instructions,
      subject: a.subject,
      grade: a.grade,
      deadline: a.deadline.toISOString(),
      fileUrl: a.fileUrl,
      teacherId: a.teacherId,
      teacherName: me.name,
      status: a.status,
      createdAt: a.createdAt.toISOString(),
      submissionCount: 0,
      mySubmission: null,
    })),
  });
});

router.get("/dashboard/admin", requireRole("school_admin", "super_admin"), async (_req, res): Promise<void> => {
  const sevenDaysAgo = new Date(Date.now() - 7 * 86400 * 1000);
  const oneDayAgo = new Date(Date.now() - 86400 * 1000);

  const allUsers = await db.select().from(users);
  const totalUsers = allUsers.length;
  const totalStudents = allUsers.filter((u) => u.role === "student").length;
  const totalTeachers = allUsers.filter((u) => u.role === "teacher").length;
  const totalParents = allUsers.filter((u) => u.role === "parent").length;
  const pendingApprovals = allUsers.filter((u) => u.status === "pending").length;
  const activeSubs = allUsers.filter((u) => u.subscriptionStatus === "active").length;
  const newRegThisWeek = allUsers.filter((u) => u.createdAt >= sevenDaysAgo).length;
  const activeUsersToday = allUsers.filter((u) => u.lastActiveAt && u.lastActiveAt >= oneDayAgo).length;
  const activeUsersThisWeek = allUsers.filter((u) => u.lastActiveAt && u.lastActiveAt >= sevenDaysAgo).length;

  const allSubs = await db.select().from(subscriptions);
  const totalRevenue = allSubs.reduce((s, x) => s + (x.amountPaid ?? 0), 0);
  const mrr = allSubs.filter((s) => s.status === "active").reduce((s, x) => s + (x.amountPaid ?? 0), 0);

  const [{ c: totalPapers = 0 } = { c: 0 }] = await db.select({ c: sql<number>`COUNT(*)::int` }).from(papers);
  const [{ c: totalNotes = 0 } = { c: 0 }] = await db.select({ c: sql<number>`COUNT(*)::int` }).from(notes);
  const [{ s: paperDownloads = 0 } = { s: 0 }] = await db
    .select({ s: sql<number>`COALESCE(SUM(${papers.downloads}), 0)::int` })
    .from(papers);

  res.json({
    totalUsers,
    totalStudents,
    totalTeachers,
    totalParents,
    activeSubscriptions: activeSubs,
    monthlyRecurringRevenue: mrr,
    totalRevenue,
    pendingApprovals,
    totalPapers,
    totalNotes,
    paperDownloads,
    newRegistrationsThisWeek: newRegThisWeek,
    activeUsersToday,
    activeUsersThisWeek,
  });
});

router.get("/dashboard/parent", requireRole("parent"), async (req, res): Promise<void> => {
  const me = (req as unknown as { user: User }).user;
  const sevenDaysAgo = new Date(Date.now() - 7 * 86400 * 1000);

  const [{ totalStudents = 0 } = {}] = await db
    .select({ totalStudents: sql<number>`COUNT(*)::int` })
    .from(users)
    .where(eq(users.role, "student"));

  const [{ activeThisWeek = 0 } = {}] = await db
    .select({ activeThisWeek: sql<number>`COUNT(*)::int` })
    .from(users)
    .where(and(eq(users.role, "student"), gte(users.lastActiveAt, sevenDaysAgo)));

  const recentNotes = await db
    .select({ n: notes, teacherName: users.name })
    .from(notes)
    .leftJoin(users, eq(users.id, notes.teacherId))
    .where(eq(notes.status, "published"))
    .orderBy(desc(notes.createdAt))
    .limit(5);

  const recentAnnouncements = await db
    .select()
    .from(announcements)
    .orderBy(desc(announcements.createdAt))
    .limit(5);

  const h = new Date().getHours();
  const first = me.name.split(/\s+/)[0];
  const greeting = h < 12 ? `Good morning, ${first}` : h < 17 ? `Good afternoon, ${first}` : `Good evening, ${first}`;

  res.json({
    greeting,
    totalStudents,
    activeThisWeek,
    recentNotes: recentNotes.map((r) => ({
      id: r.n.id,
      title: r.n.title,
      subject: r.n.subject,
      grade: r.n.grade,
      teacherName: r.teacherName,
      createdAt: r.n.createdAt.toISOString(),
    })),
    recentAnnouncements: recentAnnouncements.map((a) => ({
      id: a.id,
      title: a.title,
      message: a.message,
      createdAt: a.createdAt.toISOString(),
    })),
  });
});

router.get("/dashboard/analytics", requireSuperAdmin(), async (_req, res): Promise<void> => {
  const allUsers = await db.select().from(users);
  // user growth: cumulative by day for last 30 days
  const userGrowth: { date: string; users: number }[] = [];
  const dayMs = 86400 * 1000;
  for (let i = 29; i >= 0; i--) {
    const d = new Date(Date.now() - i * dayMs);
    d.setHours(23, 59, 59, 999);
    const count = allUsers.filter((u) => u.createdAt <= d).length;
    userGrowth.push({ date: d.toISOString().slice(0, 10), users: count });
  }

  const topPapers = await db
    .select({ title: sql<string>`${papers.subject} || ' ' || ${papers.year}`, downloads: papers.downloads })
    .from(papers)
    .orderBy(desc(papers.downloads))
    .limit(8);

  const subjectActivity = await db
    .select({ subject: notes.subject, count: sql<number>`COUNT(*)::int` })
    .from(notes)
    .groupBy(notes.subject)
    .orderBy(desc(sql<number>`COUNT(*)`))
    .limit(8);

  const topSchools = await db
    .select({
      school: sql<string>`COALESCE(${users.school}, 'Unknown')`,
      students: sql<number>`COUNT(*)::int`,
    })
    .from(users)
    .where(eq(users.role, "student"))
    .groupBy(users.school)
    .orderBy(desc(sql<number>`COUNT(*)`))
    .limit(8);

  res.json({ userGrowth, topPapers, subjectActivity, topSchools });
});

export { requireAuth };
export default router;
