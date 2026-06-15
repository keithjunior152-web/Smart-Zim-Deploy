import { pgTable, serial, text, integer, timestamp, boolean, uniqueIndex } from "drizzle-orm/pg-core";
import { users } from "./users";

export const teacherProfiles = pgTable("teacher_profiles", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().unique().references(() => users.id, { onDelete: "cascade" }),
  headline: text("headline"),
  bio: text("bio"),
  subjectsTaught: text("subjects_taught"),
  gradeLevels: text("grade_levels"),
  city: text("city"),
  country: text("country").default("Zimbabwe"),
  languagesSpoken: text("languages_spoken"),
  yearsExperience: integer("years_experience").default(0),
  availabilityStatus: text("availability_status").default("available"),
  coverBannerUrl: text("cover_banner_url"),
  isVerified: boolean("is_verified").notNull().default(false),
  workHistory: text("work_history"),
  education: text("education"),
  skills: text("skills"),
  certifications: text("certifications"),
  followersCount: integer("followers_count").notNull().default(0),
  followingCount: integer("following_count").notNull().default(0),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export type TeacherProfile = typeof teacherProfiles.$inferSelect;
export type InsertTeacherProfile = typeof teacherProfiles.$inferInsert;

export const socialPosts = pgTable("social_posts", {
  id: serial("id").primaryKey(),
  authorId: integer("author_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  content: text("content").notNull(),
  postType: text("post_type").notNull().default("update"),
  imageUrl: text("image_url"),
  videoUrl: text("video_url"),
  hashtags: text("hashtags"),
  isPinned: boolean("is_pinned").notNull().default(false),
  reactionsCount: integer("reactions_count").notNull().default(0),
  commentsCount: integer("comments_count").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export type SocialPost = typeof socialPosts.$inferSelect;
export type InsertSocialPost = typeof socialPosts.$inferInsert;

export const postReactions = pgTable("post_reactions", {
  id: serial("id").primaryKey(),
  postId: integer("post_id").notNull().references(() => socialPosts.id, { onDelete: "cascade" }),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  reactionType: text("reaction_type").notNull().default("like"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => [uniqueIndex("post_reactions_unique").on(table.postId, table.userId)]);

export type PostReaction = typeof postReactions.$inferSelect;

export const postComments = pgTable("post_comments", {
  id: serial("id").primaryKey(),
  postId: integer("post_id").notNull().references(() => socialPosts.id, { onDelete: "cascade" }),
  authorId: integer("author_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  content: text("content").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export type PostComment = typeof postComments.$inferSelect;

export const teacherConnections = pgTable("teacher_connections", {
  id: serial("id").primaryKey(),
  requesterId: integer("requester_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  recipientId: integer("recipient_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  status: text("status").notNull().default("pending"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => [uniqueIndex("connections_unique").on(table.requesterId, table.recipientId)]);

export type TeacherConnection = typeof teacherConnections.$inferSelect;

export const skillEndorsements = pgTable("skill_endorsements", {
  id: serial("id").primaryKey(),
  profileUserId: integer("profile_user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  endorserId: integer("endorser_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  skill: text("skill").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => [uniqueIndex("endorsements_unique").on(table.profileUserId, table.endorserId, table.skill)]);

export type SkillEndorsement = typeof skillEndorsements.$inferSelect;

// Followers (one-directional, like Twitter/Instagram)
export const userFollows = pgTable("user_follows", {
  id: serial("id").primaryKey(),
  followerId: integer("follower_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  followingId: integer("following_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => [uniqueIndex("user_follows_unique").on(table.followerId, table.followingId)]);

export type UserFollow = typeof userFollows.$inferSelect;
