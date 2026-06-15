import { pgTable, serial, integer, text, timestamp, boolean } from "drizzle-orm/pg-core";

export const studentGamification = pgTable("student_gamification", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().unique(),
  xp: integer("xp").notNull().default(0),
  level: integer("level").notNull().default(1),
  smartCoins: integer("smart_coins").notNull().default(0),
  studyStreak: integer("study_streak").notNull().default(0),
  longestStreak: integer("longest_streak").notNull().default(0),
  lastActivityDate: text("last_activity_date"),
  focusScore: integer("focus_score").notNull().default(0),
  totalFocusMinutes: integer("total_focus_minutes").notNull().default(0),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export const studentAchievements = pgTable("student_achievements", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  badge: text("badge").notNull(),
  label: text("label").notNull(),
  description: text("description").notNull(),
  xpAwarded: integer("xp_awarded").notNull().default(0),
  earnedAt: timestamp("earned_at", { withTimezone: true }).defaultNow().notNull(),
});

export const focusSessions = pgTable("focus_sessions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  durationMinutes: integer("duration_minutes").notNull(),
  type: text("type").notNull().default("study"),
  completedAt: timestamp("completed_at", { withTimezone: true }).defaultNow().notNull(),
});

export type StudentGamification = typeof studentGamification.$inferSelect;
export type StudentAchievement = typeof studentAchievements.$inferSelect;
export type FocusSession = typeof focusSessions.$inferSelect;
