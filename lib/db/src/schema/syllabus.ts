import { pgTable, serial, text, jsonb } from "drizzle-orm/pg-core";

export const syllabusTopics = pgTable("syllabus_topics", {
  id: serial("id").primaryKey(),
  subject: text("subject").notNull(),
  examBoard: text("exam_board").notNull(),
  curriculum: text("curriculum").notNull().default("ZIMSEC"),
  level: text("level").notNull(),
  grade: text("grade").notNull(),
  strand: text("strand").notNull(),
  topic: text("topic").notNull(),
  subtopics: jsonb("subtopics").$type<string[]>().notNull().default([]),
  learningObjectives: text("learning_objectives"),
});

export type SyllabusTopic = typeof syllabusTopics.$inferSelect;
export type InsertSyllabusTopic = typeof syllabusTopics.$inferInsert;
