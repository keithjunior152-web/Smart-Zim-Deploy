import { pgTable, serial, text, integer, timestamp } from "drizzle-orm/pg-core";

export const plannerSlots = pgTable("planner_slots", {
  id: serial("id").primaryKey(),
  studentId: integer("student_id").notNull(),
  weekOf: text("week_of").notNull(),
  day: text("day").notNull(),
  subject: text("subject").notNull(),
  topic: text("topic"),
  source: text("source"),
  durationMinutes: integer("duration_minutes").notNull(),
  time: text("time").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export type PlannerSlot = typeof plannerSlots.$inferSelect;
export type InsertPlannerSlot = typeof plannerSlots.$inferInsert;
