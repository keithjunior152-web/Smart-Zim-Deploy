import { pgTable, serial, text, integer, timestamp } from "drizzle-orm/pg-core";

export const bookmarks = pgTable("bookmarks", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  itemType: text("item_type").notNull(),
  itemId: integer("item_id").notNull(),
  title: text("title"),
  savedAt: timestamp("saved_at", { withTimezone: true }).defaultNow().notNull(),
});

export type Bookmark = typeof bookmarks.$inferSelect;
export type InsertBookmark = typeof bookmarks.$inferInsert;
