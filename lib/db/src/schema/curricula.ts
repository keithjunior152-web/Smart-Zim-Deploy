import { pgTable, serial, text, integer, boolean, jsonb } from "drizzle-orm/pg-core";

export type CurriculumLevel = {
  value: string;
  label: string;
  grades: string[];
  subjects: string[];
};

export const curricula = pgTable("curricula", {
  id: serial("id").primaryKey(),
  code: text("code").notNull().unique(),
  name: text("name").notNull(),
  country: text("country"),
  levels: jsonb("levels").$type<CurriculumLevel[]>().notNull().default([]),
  active: boolean("active").notNull().default(true),
  sortOrder: integer("sort_order").notNull().default(0),
});

export type Curriculum = typeof curricula.$inferSelect;
export type InsertCurriculum = typeof curricula.$inferInsert;
