import { pgTable, serial, text, integer, timestamp, doublePrecision } from "drizzle-orm/pg-core";

export const subscriptions = pgTable("subscriptions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  plan: text("plan").notNull(),
  status: text("status").notNull().default("active"),
  startDate: timestamp("start_date", { withTimezone: true }).defaultNow().notNull(),
  expiryDate: timestamp("expiry_date", { withTimezone: true }).notNull(),
  paymentMethod: text("payment_method").notNull().default("manual"),
  amountPaid: doublePrecision("amount_paid").notNull().default(0),
  proofUrl: text("proof_url"),
  paymentReference: text("payment_reference"),
  senderPhone: text("sender_phone"),
  rejectionReason: text("rejection_reason"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export type Subscription = typeof subscriptions.$inferSelect;
export type InsertSubscription = typeof subscriptions.$inferInsert;
