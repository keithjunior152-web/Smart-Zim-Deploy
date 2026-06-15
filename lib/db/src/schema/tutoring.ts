import { pgTable, serial, integer, text, timestamp, boolean } from "drizzle-orm/pg-core";
import { users } from "./users";

export const tutorListings = pgTable("tutor_listings", {
  id: serial("id").primaryKey(),
  teacherId: integer("teacher_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  subject: text("subject").notNull(),
  gradeLevels: text("grade_levels").notNull(),
  description: text("description"),
  hourlyRateCents: integer("hourly_rate_cents").notNull().default(500),
  currency: text("currency").notNull().default("USD"),
  mode: text("mode").notNull().default("online"),
  location: text("location"),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const tutorBookings = pgTable("tutor_bookings", {
  id: serial("id").primaryKey(),
  studentId: integer("student_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  teacherId: integer("teacher_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  listingId: integer("listing_id").notNull().references(() => tutorListings.id, { onDelete: "cascade" }),
  status: text("status").notNull().default("pending"),
  message: text("message"),
  preferredDateTime: text("preferred_date_time"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export type TutorListing = typeof tutorListings.$inferSelect;
export type InsertTutorListing = typeof tutorListings.$inferInsert;
export type TutorBooking = typeof tutorBookings.$inferSelect;
