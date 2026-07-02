import { Router, type IRouter } from "express";
import { and, asc, desc, eq, sql } from "drizzle-orm";
import multer from "multer";
import { db, conversations, messages, examDates, topicAttempts, plannerSlots, type User } from "@workspace/db";
import { streamChat, type GeminiMessage } from "@workspace/integrations-gemini-ai";
import { requireAuth } from "../lib/auth";
import { encryptMessage, decryptMessage } from "../lib/crypto";
import type { Part } from "@google/generative-ai";

const router: IRouter = Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 12 * 1024 * 1024 },
});

const ALLOWED_IMAGE_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);
const ALLOWED_DOC_TYPES = new Set(["application/pdf"]);

const ZIM_TUTOR_SYSTEM = `You are ZimTutor, a warm, patient AI study coach for SmartZim — a learning platform for Zimbabwean students preparing for ZIMSEC and Cambridge examinations. You help students understand concepts, work through past-paper questions, and study smart.

Guidelines:
- Always speak in clear, encouraging English. Use simple language by default; switch to a more advanced register if the student is in A-Level.
- When you give an example, prefer Zimbabwean / Southern African contexts (HCB, Victoria Falls, Zambezi, Mbare, mealie-meal, etc.) where relevant — but never force it.
- For mathematical or scientific content, show your working step-by-step. Write ALL mathematics using LaTeX so it renders properly: use $...$ for inline math (e.g. $x^2 + 3x = 0$) and $$...$$ on their own lines for displayed equations and multi-line working (use aligned environments where helpful). Never write maths as plain ASCII like x^2 — always wrap it in LaTeX delimiters.
- When a diagram, graph sketch, flow, cycle, tree, or labelled process would help (e.g. the water cycle, a food chain, a circuit, an organisational structure, a number line, a sequence of steps), draw it as a Mermaid diagram inside a fenced code block with the language tag \`mermaid\` (e.g. flowchart, graph, sequenceDiagram). Keep node labels short. Add a one-line plain-English caption under the diagram.
- For ZIMSEC marking-style questions, demonstrate the kind of structured answer that earns marks (point + explanation + example).
- Encourage the student. End most replies with one short prompt to keep them learning ("Want to try a question on this?").
- Never claim you are a real human teacher. Be transparent that you are SmartZim's AI tutor.
- Refuse to write entire assignments for the student to submit — instead, scaffold them through the answer.`;

async function ensureOwned(userId: number, conversationId: number) {
  const [c] = await db
    .select()
    .from(conversations)
    .where(and(eq(conversations.id, conversationId), eq(conversations.userId, userId)))
    .limit(1);
  return c ?? null;
}

router.get("/gemini/conversations", requireAuth(), async (req, res): Promise<void> => {
  const me = (req as unknown as { user: User }).user;
  const rows = await db
    .select()
    .from(conversations)
    .where(eq(conversations.userId, me.id))
    .orderBy(desc(conversations.createdAt))
    .limit(100);
  res.json(rows.map((c) => ({ id: c.id, title: c.title, createdAt: c.createdAt.toISOString() })));
});

router.post("/gemini/conversations", requireAuth(), async (req, res): Promise<void> => {
  const me = (req as unknown as { user: User }).user;
  const title = String(req.body?.title ?? "New conversation").slice(0, 200);
  const [c] = await db.insert(conversations).values({ title, userId: me.id }).returning();
  res.status(201).json({ id: c.id, title: c.title, createdAt: c.createdAt.toISOString() });
});

router.get("/gemini/conversations/:id", requireAuth(), async (req, res): Promise<void> => {
  const me = (req as unknown as { user: User }).user;
  const id = Number(req.params.id);
  const c = await ensureOwned(me.id, id);
  if (!c) { res.status(404).json({ error: "Not found" }); return; }
  const msgs = await db.select().from(messages).where(eq(messages.conversationId, id)).orderBy(asc(messages.createdAt));
  res.json({
    id: c.id,
    title: c.title,
    createdAt: c.createdAt.toISOString(),
    messages: msgs.map((m) => ({
      id: m.id,
      conversationId: m.conversationId,
      role: m.role,
      content: decryptMessage(m.content),
      createdAt: m.createdAt.toISOString(),
    })),
  });
});

router.delete("/gemini/conversations/:id", requireAuth(), async (req, res): Promise<void> => {
  const me = (req as unknown as { user: User }).user;
  const id = Number(req.params.id);
  const c = await ensureOwned(me.id, id);
  if (!c) { res.status(404).json({ error: "Not found" }); return; }
  await db.delete(conversations).where(eq(conversations.id, id));
  res.status(204).end();
});

router.get("/gemini/conversations/:id/messages", requireAuth(), async (req, res): Promise<void> => {
  const me = (req as unknown as { user: User }).user;
  const id = Number(req.params.id);
  const c = await ensureOwned(me.id, id);
  if (!c) { res.status(404).json({ error: "Not found" }); return; }
  const msgs = await db.select().from(messages).where(eq(messages.conversationId, id)).orderBy(asc(messages.createdAt));
  res.json(
    msgs.map((m) => ({
      id: m.id,
      conversationId: m.conversationId,
      role: m.role,
      content: decryptMessage(m.content),
      createdAt: m.createdAt.toISOString(),
    })),
  );
});

router.post(
  "/gemini/conversations/:id/messages",
  requireAuth(),
  upload.single("attachment"),
  async (req, res): Promise<void> => {
    const me = (req as unknown as { user: User }).user;
    const id = Number(req.params.id);
    const file = (req as unknown as { file?: Express.Multer.File }).file;
    const rawContent = String(req.body?.content ?? "").trim();

    const content = rawContent || (file ? `Please analyse the attached ${file.originalname} and answer every question in it. Show working clearly.` : "");

    if (!content && !file) { res.status(400).json({ error: "Empty message" }); return; }

    if (file) {
      const isImage = ALLOWED_IMAGE_TYPES.has(file.mimetype);
      const isDoc = ALLOWED_DOC_TYPES.has(file.mimetype);
      if (!isImage && !isDoc) {
        res.status(400).json({ error: "Unsupported file type. Upload a JPG, PNG, WebP, GIF or PDF." });
        return;
      }
    }

    const c = await ensureOwned(me.id, id);
    if (!c) { res.status(404).json({ error: "Conversation not found" }); return; }

    // Persist user message
    const persistedContent = file ? `[Uploaded: ${file.originalname}]\n\n${content}` : content;
    await db.insert(messages).values({ conversationId: id, role: "user", content: encryptMessage(persistedContent) });

    // Load full history
    const historyRows = await db
      .select()
      .from(messages)
      .where(eq(messages.conversationId, id))
      .orderBy(asc(messages.createdAt));
    const history = historyRows.map((m) => ({ ...m, content: decryptMessage(m.content) }));

    // Student personalisation context
    let examLine: string | null = null;
    let weakLine: string | null = null;
    let planLine: string | null = null;
    if (me.role === "student") {
      const today = new Date().toISOString().slice(0, 10);
      const upcomingExams = await db.select().from(examDates).where(eq(examDates.studentId, me.id)).orderBy(asc(examDates.examDate)).limit(20);
      const future = upcomingExams.filter((e) => e.examDate >= today).slice(0, 5);
      if (future.length > 0) {
        examLine = "Upcoming exams: " + future.map((e) => `${e.subject}${e.paper ? ` (${e.paper})` : ""} on ${e.examDate}`).join("; ") + ".";
      }
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
      const weak = aggregates
        .map((a) => ({ subject: a.subject, topic: a.topic, acc: a.total > 0 ? Math.round((a.correct / a.total) * 100) : 0 }))
        .filter((a) => a.acc < 70)
        .sort((x, y) => x.acc - y.acc)
        .slice(0, 6);
      if (weak.length > 0) {
        weakLine = "Weak topics to prioritize: " + weak.map((w) => `${w.subject} — ${w.topic} (${w.acc}%)`).join("; ") + ". Steer the student toward these when relevant.";
      }
      const d = new Date();
      const dow = d.getUTCDay();
      const diff = dow === 0 ? -6 : 1 - dow;
      const monday = new Date(d);
      monday.setUTCDate(d.getUTCDate() + diff);
      const weekOf = monday.toISOString().slice(0, 10);
      const dayOrder = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
      const planSlots = await db.select().from(plannerSlots).where(and(eq(plannerSlots.studentId, me.id), eq(plannerSlots.weekOf, weekOf)));
      if (planSlots.length > 0) {
        const sorted = planSlots
          .slice()
          .sort((a, b) => {
            if (a.source === "ai" && b.source !== "ai") return -1;
            if (b.source === "ai" && a.source !== "ai") return 1;
            const di = dayOrder.indexOf(a.day) - dayOrder.indexOf(b.day);
            return di !== 0 ? di : a.time.localeCompare(b.time);
          })
          .slice(0, 6);
        planLine = "The student's current study plan includes: " + sorted.map((s) => `${s.day} ${s.time} ${s.subject}${s.topic ? ` — ${s.topic}` : ""} (${s.durationMinutes}m)`).join("; ") + ".";
      }
    }

    const studentContext = [
      me.role === "student" ? `The student's name is ${me.name}.` : null,
      me.curriculum ? `They follow the ${me.curriculum} curriculum.` : null,
      me.grade ? `They are in ${me.grade}.` : null,
      me.school ? `They attend ${me.school}.` : null,
      req.body?.subject ? `The current subject is ${req.body.subject}.` : null,
      req.body?.level ? `They are studying at ${req.body.level} level.` : null,
      examLine,
      weakLine,
      planLine,
    ]
      .filter(Boolean)
      .join(" ");

    const systemPrompt = studentContext ? `${ZIM_TUTOR_SYSTEM}\n\nContext: ${studentContext}` : ZIM_TUTOR_SYSTEM;

    // Build Gemini history (all turns except the very last one we just inserted)
    const geminiHistory: GeminiMessage[] = history.slice(0, -1).map((m) => ({
      role: m.role === "assistant" ? ("model" as const) : ("user" as const),
      parts: [{ text: m.content }],
    }));

    // Last user parts — may include inline file
    const lastParts: Part[] = [];
    if (file) {
      lastParts.push({
        inlineData: {
          mimeType: file.mimetype as string,
          data: file.buffer.toString("base64"),
        },
      });
    }
    lastParts.push({ text: content });

    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");
    res.flushHeaders?.();

    try {
      const fullResponse = await streamChat(
        { system: systemPrompt, history: geminiHistory, lastParts, maxTokens: 8192 },
        (chunk) => res.write(`data: ${JSON.stringify({ content: chunk })}\n\n`),
      );

      await db.insert(messages).values({ conversationId: id, role: "assistant", content: encryptMessage(fullResponse) });
      res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
      res.end();

      // Auto-title from first exchange
      if (history.length <= 1 && c.title === "New conversation") {
        const title = content.slice(0, 60).replace(/\s+/g, " ");
        await db.update(conversations).set({ title }).where(eq(conversations.id, id));
      }
    } catch (err) {
      req.log.error({ err }, "Gemini stream error");
      res.write(`data: ${JSON.stringify({ error: "Stream failed" })}\n\n`);
      res.end();
    }
  },
);

export default router;
