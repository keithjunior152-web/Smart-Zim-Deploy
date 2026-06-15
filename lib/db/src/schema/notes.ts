import { pgTable, serial, text, integer, boolean, timestamp } from "drizzle-orm/pg-core";

export const notes = pgTable("notes", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  curriculum: text("curriculum").notNull().default("ZIMSEC"),
  subject: text("subject").notNull(),
  level: text("level").notNull(),
  grade: text("grade").notNull(),
  topic: text("topic").notNull(),
  chapterNumber: integer("chapter_number"),
  content: text("content").notNull(),
  fileUrl: text("file_url"),
  teacherId: integer("teacher_id"),
  downloads: integer("downloads").notNull().default(0),
  bookmarks: integer("bookmarks").notNull().default(0),
  featured: boolean("featured").notNull().default(false),
  status: text("status").notNull().default("published"),
  readMinutes: integer("read_minutes").notNull().default(10),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export type Note = typeof notes.$inferSelect;
export type InsertNote = typeof notes.$inferInsert;
