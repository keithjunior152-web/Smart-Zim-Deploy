import { pgTable, serial, integer, text, timestamp, jsonb } from "drizzle-orm/pg-core";
import { users } from "./users";

export type QuizQuestion = {
  id: string;
  question: string;
  options: string[];
  correctAnswer: string;
  explanation: string;
  subject?: string;
  topic?: string;
};

export const quizSessions = pgTable("quiz_sessions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  date: text("date").notNull(),
  grade: text("grade"),
  questions: jsonb("questions").notNull().$type<QuizQuestion[]>(),
  answers: jsonb("answers").$type<Record<string, string>>(),
  score: integer("score"),
  submittedAt: timestamp("submitted_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export type QuizSession = typeof quizSessions.$inferSelect;
export type InsertQuizSession = typeof quizSessions.$inferInsert;
