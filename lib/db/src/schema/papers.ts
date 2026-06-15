import { pgTable, serial, text, integer, boolean, timestamp, jsonb } from "drizzle-orm/pg-core";

export const papers = pgTable("papers", {
  id: serial("id").primaryKey(),
  examBoard: text("exam_board").notNull(),
  curriculum: text("curriculum").notNull().default("ZIMSEC"),
  subject: text("subject").notNull(),
  paperCode: text("paper_code"),
  level: text("level").notNull(),
  grade: text("grade"),
  year: integer("year").notNull(),
  session: text("session"),
  paperNumber: text("paper_number"),
  fileUrl: text("file_url"),
  markSchemeUrl: text("mark_scheme_url"),
  downloads: integer("downloads").notNull().default(0),
  bookmarks: integer("bookmarks").notNull().default(0),
  topicTags: jsonb("topic_tags").$type<string[]>().notNull().default([]),
  featured: boolean("featured").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export type Paper = typeof papers.$inferSelect;
export type InsertPaper = typeof papers.$inferInsert;
