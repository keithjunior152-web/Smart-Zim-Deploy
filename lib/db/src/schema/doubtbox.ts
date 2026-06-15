import { pgTable, serial, integer, text, boolean, timestamp } from "drizzle-orm/pg-core";

export const doubtQuestions = pgTable("doubt_questions", {
  id: serial("id").primaryKey(),
  subject: text("subject").notNull(),
  question: text("question").notNull(),
  userId: integer("user_id"),
  isAnonymous: boolean("is_anonymous").notNull().default(true),
  answer: text("answer"),
  answeredBy: integer("answered_by"),
  isPublished: boolean("is_published").notNull().default(false),
  isModerated: boolean("is_moderated").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  answeredAt: timestamp("answered_at", { withTimezone: true }),
});

export type DoubtQuestion = typeof doubtQuestions.$inferSelect;
export type InsertDoubtQuestion = typeof doubtQuestions.$inferInsert;
