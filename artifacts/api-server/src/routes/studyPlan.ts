import { Router, type IRouter } from "express";
import { and, eq, sql } from "drizzle-orm";
import { db, plannerSlots, topicAttempts, examDates, syllabusTopics, type User } from "@workspace/db";
import { anthropic } from "@workspace/integrations-anthropic-ai";
import { requireRole } from "../lib/auth";

const router: IRouter = Router();

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

function mondayOf(d: Date): string {
  const date = new Date(d);
  const day = date.getDay(); // 0=Sun..6=Sat
  const diff = (day === 0 ? -6 : 1) - day;
  date.setDate(date.getDate() + diff);
  return date.toISOString().slice(0, 10);
}

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

type PlanSlot = { day: string; time: string; subject: string; topic: string; durationMinutes: number };

router.post("/ai/study-plan", requireRole("student"), async (req, res): Promise<void> => {
  const me = (req as unknown as { user: User }).user;
  const weeklyMinutes = Math.max(60, Math.min(3000, Number(req.body?.weeklyMinutes) || 600));
  const weekOf = req.body?.weekOf ? String(req.body.weekOf) : mondayOf(new Date());
  const curriculum = me.curriculum ?? "ZIMSEC";

  // Gather context: subjects, exam dates, weak topics, syllabus topics.
  const userSubjects = Array.isArray(me.subjects) ? (me.subjects as string[]) : [];
  const exams = await db.select().from(examDates).where(eq(examDates.studentId, me.id));
  const aggregates = await db
    .select({
      subject: topicAttempts.subject,
      topic: topicAttempts.topic,
      correct: sql<number>`sum(${topicAttempts.correct})`.mapWith(Number),
      total: sql<number>`sum(${topicAttempts.total})`.mapWith(Number),
    })
    .from(topicAttempts)
    .where(eq(topicAttempts.studentId, me.id))
    .groupBy(topicAttempts.subject, topicAttempts.topic);
  const weakTopics = aggregates
    .map((a) => ({ subject: a.subject, topic: a.topic, accuracy: a.total > 0 ? Math.round((a.correct / a.total) * 100) : 0 }))
    .sort((x, y) => x.accuracy - y.accuracy)
    .slice(0, 15);

  const syllabus = await db
    .select({ subject: syllabusTopics.subject, topic: syllabusTopics.topic })
    .from(syllabusTopics)
    .where(eq(syllabusTopics.curriculum, curriculum))
    .limit(400);

  const subjectsForPlan = Array.from(
    new Set([...userSubjects, ...exams.map((e) => e.subject)].filter(Boolean)),
  );
  if (subjectsForPlan.length === 0) {
    res.status(400).json({ error: "Add your subjects (in Profile) or exam dates first so I can build a plan." });
    return;
  }

  const today = new Date().toISOString().slice(0, 10);
  const examLines = exams.length
    ? exams.map((e) => `- ${e.subject}${e.paper ? ` (${e.paper})` : ""}: ${e.examDate}`).join("\n")
    : "(none set)";
  const weakLines = weakTopics.length
    ? weakTopics.map((w) => `- ${w.subject} — ${w.topic} (${w.accuracy}% so far)`).join("\n")
    : "(no practice data yet)";
  const syllabusLines = syllabus.length
    ? syllabus.slice(0, 120).map((s) => `- ${s.subject}: ${s.topic}`).join("\n")
    : "(no syllabus loaded)";

  const prompt = `You are ZimTutor, building a personalized weekly study plan for a ${curriculum} student preparing for exams. Today is ${today}.

Subjects to cover: ${subjectsForPlan.join(", ")}

Upcoming exam dates:
${examLines}

Weakest topics (from the student's practice results — prioritize these):
${weakLines}

Available syllabus topics to draw specific topics from:
${syllabusLines}

The student can study about ${weeklyMinutes} minutes total this week (week starting Monday ${weekOf}).

Build a day-by-day plan for Monday–Sunday. Rules:
- Total scheduled minutes across the week should be close to ${weeklyMinutes} (do not exceed it by much).
- Prioritize the weakest topics and the subjects whose exams are soonest.
- Each session targets ONE specific topic (use real syllabus topics where possible).
- Use sensible study times (e.g. "16:00", "18:00") and durations between 30 and 90 minutes.
- It is fine to leave a rest day if appropriate.

Return ONLY a valid JSON object, no markdown:
{
  "summary": "A 1-2 sentence plain-English summary of the plan's focus",
  "slots": [
    { "day": "Monday", "time": "16:00", "subject": "Mathematics", "topic": "Quadratic equations", "durationMinutes": 60 }
  ]
}`;

  let parsed: { summary?: string; slots?: PlanSlot[] };
  try {
    const response = await anthropic.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 3000,
      messages: [{ role: "user", content: prompt }],
    });
    const text = response.content.find((b) => b.type === "text")?.text ?? "{}";
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      res.status(502).json({ error: "Could not generate a plan. Please try again." });
      return;
    }
    parsed = JSON.parse(jsonMatch[0]);
  } catch (err) {
    req.log.error({ err }, "Study plan generation failed");
    res.status(502).json({ error: "Could not generate a plan. Please try again." });
    return;
  }

  const rawSlots = Array.isArray(parsed.slots) ? parsed.slots : [];
  const cleanSlots = rawSlots
    .filter((s) => s && DAYS.includes(s.day) && s.subject && s.topic)
    .map((s) => ({
      day: s.day,
      time: typeof s.time === "string" && /^\d{1,2}:\d{2}$/.test(s.time) ? s.time : "16:00",
      subject: String(s.subject),
      topic: String(s.topic),
      durationMinutes: Math.max(15, Math.min(180, Number(s.durationMinutes) || 60)),
    }));

  if (cleanSlots.length === 0) {
    res.status(502).json({ error: "The generated plan was empty. Please try again." });
    return;
  }

  // Replace any previously AI-generated slots for this week, keep manual ones.
  await db
    .delete(plannerSlots)
    .where(and(eq(plannerSlots.studentId, me.id), eq(plannerSlots.weekOf, weekOf), eq(plannerSlots.source, "ai")));

  const inserted = await db
    .insert(plannerSlots)
    .values(
      cleanSlots.map((s) => ({
        studentId: me.id,
        weekOf,
        day: s.day,
        subject: s.subject,
        topic: s.topic,
        source: "ai",
        durationMinutes: s.durationMinutes,
        time: s.time,
      })),
    )
    .returning();

  res.json({
    summary: typeof parsed.summary === "string" ? parsed.summary : "Your personalized study plan is ready.",
    slots: inserted.map(serialize),
  });
});

export default router;
