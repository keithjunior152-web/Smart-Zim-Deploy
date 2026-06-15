import { pgTable, serial, text, integer, timestamp } from "drizzle-orm/pg-core";

export const assignments = pgTable("assignments", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  instructions: text("instructions").notNull(),
  subject: text("subject").notNull(),
  grade: text("grade").notNull(),
  deadline: timestamp("deadline", { withTimezone: true }).notNull(),
  fileUrl: text("file_url"),
  teacherId: integer("teacher_id").notNull(),
  status: text("status").notNull().default("open"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export type Assignment = typeof assignments.$inferSelect;
export type InsertAssignment = typeof assignments.$inferInsert;

export const submissions = pgTable("submissions", {
  id: serial("id").primaryKey(),
  assignmentId: integer("assignment_id").notNull(),
  studentId: integer("student_id").notNull(),
  textResponse: text("text_response"),
  fileUrl: text("file_url"),
  submittedAt: timestamp("submitted_at", { withTimezone: true }).defaultNow().notNull(),
  grade: integer("grade"),
  feedback: text("feedback"),
  gradedAt: timestamp("graded_at", { withTimezone: true }),
  gradedBy: text("graded_by"),
});

export type Submission = typeof submissions.$inferSelect;
export type InsertSubmission = typeof submissions.$inferInsert;
