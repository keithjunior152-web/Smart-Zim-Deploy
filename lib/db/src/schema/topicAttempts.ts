import { pgTable, serial, text, integer, timestamp } from "drizzle-orm/pg-core";

export const topicAttempts = pgTable("topic_attempts", {
  id: serial("id").primaryKey(),
  studentId: integer("student_id").notNull(),
  curriculum: text("curriculum").notNull().default("ZIMSEC"),
  subject: text("subject").notNull(),
  topic: text("topic").notNull(),
  correct: integer("correct").notNull(),
  total: integer("total").notNull(),
  source: text("source").notNull().default("mock"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export type TopicAttempt = typeof topicAttempts.$inferSelect;
export type InsertTopicAttempt = typeof topicAttempts.$inferInsert;
