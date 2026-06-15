import { pgTable, serial, text, integer, timestamp } from "drizzle-orm/pg-core";

export const mockExams = pgTable("mock_exams", {
  id: serial("id").primaryKey(),
  studentId: integer("student_id").notNull(),
  curriculum: text("curriculum").notNull().default("ZIMSEC"),
  subject: text("subject").notNull(),
  grade: text("grade").notNull(),
  year: integer("year"),
  paperRef: text("paper_ref"),
  score: integer("score").notNull(),
  totalMarks: integer("total_marks").notNull(),
  timeSpentMinutes: integer("time_spent_minutes").notNull(),
  completedAt: timestamp("completed_at", { withTimezone: true }).defaultNow().notNull(),
});

export type MockExam = typeof mockExams.$inferSelect;
export type InsertMockExam = typeof mockExams.$inferInsert;
