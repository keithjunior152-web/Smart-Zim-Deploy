import { pgTable, serial, text, integer, timestamp } from "drizzle-orm/pg-core";

export const examDates = pgTable("exam_dates", {
  id: serial("id").primaryKey(),
  studentId: integer("student_id").notNull(),
  curriculum: text("curriculum").notNull().default("ZIMSEC"),
  subject: text("subject").notNull(),
  paper: text("paper"),
  examDate: text("exam_date").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export type ExamDate = typeof examDates.$inferSelect;
export type InsertExamDate = typeof examDates.$inferInsert;
