import { pgTable, serial, text, integer, timestamp, boolean, uniqueIndex } from "drizzle-orm/pg-core";
import { users } from "./users";

// Class / subject channels (school-based groups)
export const classChannels = pgTable("class_channels", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),            // e.g. "Grade 10B — St Mary's"
  school: text("school").notNull(),
  grade: text("grade"),                    // e.g. "Grade 10", "Form 4"
  channelType: text("channel_type").notNull().default("class"), // class | cross_class | inter_school | subject
  subject: text("subject"),
  description: text("description"),
  createdBy: integer("created_by").notNull().references(() => users.id),
  isPrivate: boolean("is_private").notNull().default(true),
  membersCount: integer("members_count").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export type ClassChannel = typeof classChannels.$inferSelect;
export type InsertClassChannel = typeof classChannels.$inferInsert;

// Channel memberships
export const channelMembers = pgTable("channel_members", {
  id: serial("id").primaryKey(),
  channelId: integer("channel_id").notNull().references(() => classChannels.id, { onDelete: "cascade" }),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  role: text("role").notNull().default("member"), // member | teacher | admin
  joinedAt: timestamp("joined_at", { withTimezone: true }).defaultNow().notNull(),
  lastReadAt: timestamp("last_read_at", { withTimezone: true }),
}, (table) => [uniqueIndex("channel_members_unique").on(table.channelId, table.userId)]);

export type ChannelMember = typeof channelMembers.$inferSelect;

// Messages inside channels
export const channelMessages = pgTable("channel_messages", {
  id: serial("id").primaryKey(),
  channelId: integer("channel_id").notNull().references(() => classChannels.id, { onDelete: "cascade" }),
  senderId: integer("sender_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  content: text("content").notNull(),
  messageType: text("message_type").notNull().default("text"), // text | announcement | assignment | file
  fileUrl: text("file_url"),
  isPinned: boolean("is_pinned").notNull().default(false),
  replyToId: integer("reply_to_id"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  editedAt: timestamp("edited_at", { withTimezone: true }),
  isDeleted: boolean("is_deleted").notNull().default(false),
});

export type ChannelMessage = typeof channelMessages.$inferSelect;
export type InsertChannelMessage = typeof channelMessages.$inferInsert;

// Direct messages between users
export const directMessages = pgTable("direct_messages", {
  id: serial("id").primaryKey(),
  senderId: integer("sender_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  recipientId: integer("recipient_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  content: text("content").notNull(),
  fileUrl: text("file_url"),
  isRead: boolean("is_read").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  isDeleted: boolean("is_deleted").notNull().default(false),
});

export type DirectMessage = typeof directMessages.$inferSelect;
export type InsertDirectMessage = typeof directMessages.$inferInsert;
