import { pgTable, serial, text, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const paymentSettings = pgTable("payment_settings", {
  id: serial("id").primaryKey(),
  ecocashNumber: text("ecocash_number").notNull().default(""),
  innbucksNumber: text("innbucks_number").notNull().default(""),
  onemoneyNumber: text("onemoney_number").notNull().default(""),
  whatsappNumber: text("whatsapp_number").notNull().default(""),
  instructions: text("instructions").notNull().default(""),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertPaymentSettingsSchema = createInsertSchema(paymentSettings).omit({ id: true, updatedAt: true });
export type InsertPaymentSettings = z.infer<typeof insertPaymentSettingsSchema>;
export type PaymentSettings = typeof paymentSettings.$inferSelect;
