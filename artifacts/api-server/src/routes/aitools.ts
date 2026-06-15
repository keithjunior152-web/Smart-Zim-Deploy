import { Router, type IRouter } from "express";
import { and, eq } from "drizzle-orm";
import multer from "multer";
import { db, quizSessions, topicAttempts, type QuizQuestion, type User } from "@workspace/db";
import { generateText, generateWithParts } from "@workspace/integrations-anthropic-ai";
import { requireAuth, requireRole } from "../lib/auth";
import type { Part } from "@google/generative-ai";

const router: IRouter = Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 15 * 1024 * 1024 },
});

const ALLOWED_IMAGE_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);

router.post("/ai/summarise", requireAuth(), upload.single("file"), async (req, res): Promise<void> => {
  const file = req.file;
  if (!file) { res.status(400).json({ error: "No file uploaded" }); return; }

  const isImage = ALLOWED_IMAGE_TYPES.has(file.mimetype);
  const isPdf = file.mimetype === "application/pdf";
  if (!isImage && !isPdf) { res.status(400).json({ error: "Only images (JPEG/PNG/WebP) and PDFs are supported" }); return; }

  const prompt = `You are an expert ZIMSEC/Cambridge study assistant. Analyse the uploaded study material carefully and produce a structured summary for a Zimbabwean student.

Return ONLY a valid JSON object with exactly these fields:
{
  "title": "Short descriptive title of the content",
  "subject": "The academic subject (e.g. Mathematics, Biology, History)",
  "summary": "A clear 2-4 paragraph summary of the main concepts, written in simple English",
  "keyDefinitions": [{"term": "term name", "definition": "clear definition"}],
  "keyPoints": ["Concise bullet point 1", "Concise bullet point 2"],
  "likelyExamQuestions": ["Exam question 1?", "Exam question 2?"]
}

Rules:
- keyDefinitions: up to 10 most important terms
- keyPoints: up to 8 key bullet points
- likelyExamQuestions: up to 5 ZIMSEC-style exam questions likely based on this material
- Return ONLY the JSON object, no markdown, no other text`;

  const parts: Part[] = [
    { inlineData: { mimeType: file.mimetype as string, data: file.buffer.toString("base64") } },
    { text: prompt },
  ];

  try {
    const text = await generateWithParts(parts, { maxTokens: 2500 });
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) { res.status(500).json({ error: "AI could not parse the document" }); return; }
    res.json(JSON.parse(jsonMatch[0]));
  } catch (err) {
    req.log.error({ err }, "Summarise failed");
    res.status(502).json({ error: "AI summarisation failed. Please try again." });
  }
});

router.get("/quiz/today", requireRole("student", "teacher"), async (req, res): Promise<void> => {
  const me = (req as unknown as { user: User }).user;
  const today = new Date().toISOString().slice(0, 10);

  const [existing] = await db
    .select()
    .from(quizSessions)
    .where(and(eq(quizSessions.userId, me.id), eq(quizSessions.date, today)))
    .limit(1);

  if (existing) { res.json(existing); return; }

  const grade = me.grade ?? "Form 3";
  const prompt = `You are a Zimbabwe ZIMSEC/Cambridge exam expert. Generate exactly 5 multiple-choice revision questions for a ${grade} student. Mix different subjects (Maths, English, Science, Geography, History, etc.).

Return ONLY a valid JSON array of exactly 5 objects:
[
  {
    "id": "q1",
    "question": "The full question text",
    "options": ["A. First option", "B. Second option", "C. Third option", "D. Fourth option"],
    "correctAnswer": "A",
    "explanation": "Brief explanation of why this answer is correct and the others are wrong",
    "subject": "Mathematics",
    "topic": "Quadratic equations"
  }
]

Each question MUST include "subject" (the academic subject) and "topic" (the specific syllabus topic it tests) so we can track the student's weak topics.
Ensure questions are appropriate for ${grade} level, varied in subject, and cover ZIMSEC curriculum topics.
Return ONLY the JSON array.`;

  try {
    const text = await generateText(prompt, { maxTokens: 2500 });
    const jsonMatch = text.match(/\[[\s\S]*\]/);
    const questions: QuizQuestion[] = jsonMatch ? JSON.parse(jsonMatch[0]) : [];

    const [session] = await db
      .insert(quizSessions)
      .values({ userId: me.id, date: today, grade: me.grade, questions })
      .returning();

    res.json(session);
  } catch (err) {
    req.log.error({ err }, "Quiz generation failed");
    res.status(502).json({ error: "Could not generate today's quiz. Please try again." });
  }
});

router.post("/quiz/submit", requireRole("student", "teacher"), async (req, res): Promise<void> => {
  const me = (req as unknown as { user: User }).user;
  const today = new Date().toISOString().slice(0, 10);
  const { answers } = req.body as { answers: Record<string, string> };

  const [session] = await db
    .select()
    .from(quizSessions)
    .where(and(eq(quizSessions.userId, me.id), eq(quizSessions.date, today)))
    .limit(1);

  if (!session) { res.status(404).json({ error: "No quiz found for today" }); return; }
  if (session.submittedAt) { res.status(409).json({ error: "Quiz already submitted" }); return; }

  const questions = session.questions as QuizQuestion[];
  let score = 0;
  for (const q of questions) {
    if (answers[q.id] === q.correctAnswer) score++;
  }

  const [updated] = await db
    .update(quizSessions)
    .set({ answers, score, submittedAt: new Date() })
    .where(eq(quizSessions.id, session.id))
    .returning();

  // Track per-topic performance for weak-topic analysis
  const byTopic = new Map<string, { subject: string; topic: string; correct: number; total: number }>();
  for (const q of questions) {
    if (!q.subject || !q.topic) continue;
    const key = `${q.subject}\u0000${q.topic}`;
    const agg = byTopic.get(key) ?? { subject: q.subject, topic: q.topic, correct: 0, total: 0 };
    agg.total += 1;
    if (answers[q.id] === q.correctAnswer) agg.correct += 1;
    byTopic.set(key, agg);
  }
  if (byTopic.size > 0) {
    await db.insert(topicAttempts).values(
      Array.from(byTopic.values()).map((a) => ({
        studentId: me.id,
        curriculum: me.curriculum ?? "ZIMSEC",
        subject: a.subject,
        topic: a.topic,
        correct: a.correct,
        total: a.total,
        source: "quiz",
      })),
    );
  }

  res.json(updated);
});

router.get("/quiz/history", requireAuth(), async (req, res): Promise<void> => {
  const me = (req as unknown as { user: User }).user;
  const rows = await db.select().from(quizSessions).where(eq(quizSessions.userId, me.id)).limit(30);
  res.json(rows);
});

export default router;
