import { pgTable, serial, text, timestamp, integer, boolean, jsonb } from "drizzle-orm/pg-core";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  role: text("role").notNull(),
  grade: text("grade"),
  curriculum: text("curriculum").notNull().default("ZIMSEC"),
  subjects: jsonb("subjects").$type<string[]>().notNull().default([]),
  school: text("school"),
  phone: text("phone"),
  status: text("status").notNull().default("pending"),
  rejectionReason: text("rejection_reason"),
  subscriptionStatus: text("subscription_status").notNull().default("trial"),
  subscriptionExpiry: timestamp("subscription_expiry", { withTimezone: true }),
  trialStartDate: timestamp("trial_start_date", { withTimezone: true }).defaultNow(),
  referralCode: text("referral_code"),
  profilePhotoUrl: text("profile_photo_url"),
  coverPhotoUrl: text("cover_photo_url"),
  studyStreak: integer("study_streak").notNull().default(0),
  totalStudyMinutes: integer("total_study_minutes").notNull().default(0),
  isSuperAdmin: boolean("is_super_admin").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  lastActiveAt: timestamp("last_active_at", { withTimezone: true }),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;
