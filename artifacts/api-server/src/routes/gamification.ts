import { Router, type IRouter } from "express";
import { eq, desc } from "drizzle-orm";
import { db, studentGamification, studentAchievements, focusSessions, type User } from "@workspace/db";
import { requireAuth } from "../lib/auth";

const router: IRouter = Router();

const LEVELS = [
  { level: 1, label: "Newcomer", minXp: 0 },
  { level: 2, label: "Explorer", minXp: 100 },
  { level: 3, label: "Scholar", minXp: 300 },
  { level: 4, label: "Achiever", minXp: 600 },
  { level: 5, label: "Expert", minXp: 1000 },
  { level: 6, label: "Master", minXp: 1500 },
  { level: 7, label: "Elite", minXp: 2100 },
  { level: 8, label: "Champion", minXp: 2800 },
  { level: 9, label: "Legend", minXp: 3600 },
  { level: 10, label: "Zim Scholar Legend", minXp: 4500 },
];

function getLevel(xp: number) {
  for (let i = LEVELS.length - 1; i >= 0; i--) {
    if (xp >= LEVELS[i].minXp) return LEVELS[i];
  }
  return LEVELS[0];
}

function getNextLevel(xp: number) {
  const cur = getLevel(xp);
  return LEVELS.find(l => l.level === cur.level + 1) ?? null;
}

async function ensureProfile(userId: number) {
  const [existing] = await db.select().from(studentGamification).where(eq(studentGamification.userId, userId)).limit(1);
  if (existing) return existing;
  const [created] = await db.insert(studentGamification).values({ userId }).returning();
  return created;
}

export async function awardXp(userId: number, amount: number, reason: string) {
  const profile = await ensureProfile(userId);
  const newXp = profile.xp + amount;
  const newLevel = getLevel(newXp).level;
  const newCoins = profile.smartCoins + Math.floor(amount / 10);
  const today = new Date().toISOString().slice(0, 10);
  const lastDate = profile.lastActivityDate;
  const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
  const newStreak = lastDate === yesterday ? profile.studyStreak + 1 : lastDate === today ? profile.studyStreak : 1;
  const newLongest = Math.max(profile.longestStreak, newStreak);
  const [updated] = await db.update(studentGamification).set({
    xp: newXp,
    level: newLevel,
    smartCoins: newCoins,
    studyStreak: newStreak,
    longestStreak: newLongest,
    lastActivityDate: today,
    updatedAt: new Date(),
  }).where(eq(studentGamification.userId, userId)).returning();

  // Level-up achievement
  if (newLevel > profile.level) {
    const lvl = getLevel(newXp);
    await db.insert(studentAchievements).values({
      userId,
      badge: `level_${newLevel}`,
      label: `Level ${newLevel}: ${lvl.label}`,
      description: `Reached level ${newLevel} — ${lvl.label}!`,
      xpAwarded: 50,
    }).onConflictDoNothing();
  }

  // Streak achievements
  if (newStreak === 7) {
    const exists = await db.select().from(studentAchievements).where(eq(studentAchievements.userId, userId)).then(rows => rows.some(r => r.badge === "streak_7"));
    if (!exists) await db.insert(studentAchievements).values({ userId, badge: "streak_7", label: "7-Day Streak! 🔥", description: "Studied 7 days in a row. Outstanding discipline!", xpAwarded: 100 });
  }
  if (newStreak === 30) {
    const exists = await db.select().from(studentAchievements).where(eq(studentAchievements.userId, userId)).then(rows => rows.some(r => r.badge === "streak_30"));
    if (!exists) await db.insert(studentAchievements).values({ userId, badge: "streak_30", label: "30-Day Streak! 🏆", description: "A full month of daily study. Legendary!", xpAwarded: 500 });
  }

  return updated;
}

// Get gamification profile
router.get("/gamification/profile", requireAuth(), async (req, res): Promise<void> => {
  const me = (req as unknown as { user: User }).user;
  const profile = await ensureProfile(me.id);
  const lvl = getLevel(profile.xp);
  const next = getNextLevel(profile.xp);
  res.json({
    ...profile,
    levelLabel: lvl.label,
    nextLevelXp: next?.minXp ?? profile.xp,
    nextLevelLabel: next?.label ?? "Max Level",
    xpToNext: next ? next.minXp - profile.xp : 0,
    xpProgress: next ? Math.round(((profile.xp - lvl.minXp) / (next.minXp - lvl.minXp)) * 100) : 100,
  });
});

// Award XP manually (e.g. completing a task)
router.post("/gamification/award", requireAuth(), async (req, res): Promise<void> => {
  const me = (req as unknown as { user: User }).user;
  const { amount, reason } = req.body ?? {};
  if (!amount || amount <= 0) { res.status(400).json({ error: "amount required" }); return; }
  const updated = await awardXp(me.id, Number(amount), String(reason ?? "activity"));
  res.json(updated);
});

// Get achievements
router.get("/gamification/achievements", requireAuth(), async (req, res): Promise<void> => {
  const me = (req as unknown as { user: User }).user;
  const rows = await db.select().from(studentAchievements).where(eq(studentAchievements.userId, me.id)).orderBy(desc(studentAchievements.earnedAt));
  res.json(rows);
});

// Log a completed focus session + award XP
router.post("/focus-sessions", requireAuth(), async (req, res): Promise<void> => {
  const me = (req as unknown as { user: User }).user;
  const { durationMinutes, type } = req.body ?? {};
  if (!durationMinutes || durationMinutes < 1) { res.status(400).json({ error: "durationMinutes required" }); return; }
  const mins = Math.min(Number(durationMinutes), 120);
  const [session] = await db.insert(focusSessions).values({ userId: me.id, durationMinutes: mins, type: type ?? "study" }).returning();
  const xpGained = Math.round(mins * 0.6);
  const newCoins = Math.floor(mins / 10);
  await awardXp(me.id, xpGained, "focus_session");
  // Update focus score and total minutes
  const profile = await ensureProfile(me.id);
  const newTotal = profile.totalFocusMinutes + mins;
  const focusScore = Math.min(100, Math.round((newTotal / 600) * 100));
  await db.update(studentGamification).set({ totalFocusMinutes: newTotal, focusScore, smartCoins: profile.smartCoins + newCoins }).where(eq(studentGamification.userId, me.id));
  // First focus achievement
  const exists = await db.select().from(studentAchievements).where(eq(studentAchievements.userId, me.id)).then(rows => rows.some(r => r.badge === "first_focus"));
  if (!exists) await db.insert(studentAchievements).values({ userId: me.id, badge: "first_focus", label: "Study Shield Activated 🛡️", description: "Completed your first focus session!", xpAwarded: 25 });
  res.status(201).json({ session, xpGained, smartCoinsGained: newCoins });
});

// Get focus session history
router.get("/focus-sessions", requireAuth(), async (req, res): Promise<void> => {
  const me = (req as unknown as { user: User }).user;
  const rows = await db.select().from(focusSessions).where(eq(focusSessions.userId, me.id)).orderBy(desc(focusSessions.completedAt)).limit(30);
  res.json(rows);
});

export default router;
