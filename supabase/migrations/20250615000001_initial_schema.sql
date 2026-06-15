-- ============================================================
-- SmartZim — Initial Database Schema
-- Generated from Drizzle ORM schema definitions
-- Run this against a fresh Supabase project PostgreSQL database
-- ============================================================

-- ── Session store (connect-pg-simple) ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS "session" (
  "sid"    varchar      NOT NULL PRIMARY KEY,
  "sess"   json         NOT NULL,
  "expire" timestamp(6) NOT NULL
);
CREATE INDEX IF NOT EXISTS "IDX_session_expire" ON "session" ("expire");

-- ── Users ──────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS "users" (
  "id"                    serial PRIMARY KEY,
  "name"                  text        NOT NULL,
  "email"                 text        NOT NULL UNIQUE,
  "password_hash"         text        NOT NULL,
  "role"                  text        NOT NULL,
  "grade"                 text,
  "curriculum"            text        NOT NULL DEFAULT 'ZIMSEC',
  "subjects"              jsonb       NOT NULL DEFAULT '[]',
  "school"                text,
  "phone"                 text,
  "status"                text        NOT NULL DEFAULT 'pending',
  "rejection_reason"      text,
  "subscription_status"   text        NOT NULL DEFAULT 'trial',
  "subscription_expiry"   timestamptz,
  "trial_start_date"      timestamptz DEFAULT NOW(),
  "referral_code"         text,
  "profile_photo_url"     text,
  "cover_photo_url"       text,
  "study_streak"          integer     NOT NULL DEFAULT 0,
  "total_study_minutes"   integer     NOT NULL DEFAULT 0,
  "is_super_admin"        boolean     NOT NULL DEFAULT false,
  "created_at"            timestamptz NOT NULL DEFAULT NOW(),
  "last_active_at"        timestamptz
);

-- ── Curricula ──────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS "curricula" (
  "id"         serial PRIMARY KEY,
  "code"       text    NOT NULL UNIQUE,
  "name"       text    NOT NULL,
  "country"    text,
  "levels"     jsonb   NOT NULL DEFAULT '[]',
  "active"     boolean NOT NULL DEFAULT true,
  "sort_order" integer NOT NULL DEFAULT 0
);

-- ── Notes ──────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS "notes" (
  "id"             serial PRIMARY KEY,
  "title"          text    NOT NULL,
  "curriculum"     text    NOT NULL DEFAULT 'ZIMSEC',
  "subject"        text    NOT NULL,
  "level"          text    NOT NULL,
  "grade"          text    NOT NULL,
  "topic"          text    NOT NULL,
  "chapter_number" integer,
  "content"        text    NOT NULL,
  "file_url"       text,
  "teacher_id"     integer,
  "downloads"      integer NOT NULL DEFAULT 0,
  "bookmarks"      integer NOT NULL DEFAULT 0,
  "featured"       boolean NOT NULL DEFAULT false,
  "status"         text    NOT NULL DEFAULT 'published',
  "read_minutes"   integer NOT NULL DEFAULT 10,
  "created_at"     timestamptz NOT NULL DEFAULT NOW()
);

-- ── Papers (past exam papers) ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS "papers" (
  "id"              serial PRIMARY KEY,
  "exam_board"      text    NOT NULL,
  "curriculum"      text    NOT NULL DEFAULT 'ZIMSEC',
  "subject"         text    NOT NULL,
  "paper_code"      text,
  "level"           text    NOT NULL,
  "grade"           text,
  "year"            integer NOT NULL,
  "session"         text,
  "paper_number"    text,
  "file_url"        text,
  "mark_scheme_url" text,
  "downloads"       integer NOT NULL DEFAULT 0,
  "bookmarks"       integer NOT NULL DEFAULT 0,
  "topic_tags"      jsonb   NOT NULL DEFAULT '[]',
  "featured"        boolean NOT NULL DEFAULT false,
  "created_at"      timestamptz NOT NULL DEFAULT NOW()
);

-- ── Assignments ───────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS "assignments" (
  "id"           serial PRIMARY KEY,
  "title"        text    NOT NULL,
  "instructions" text    NOT NULL,
  "subject"      text    NOT NULL,
  "grade"        text    NOT NULL,
  "deadline"     timestamptz NOT NULL,
  "file_url"     text,
  "teacher_id"   integer NOT NULL,
  "status"       text    NOT NULL DEFAULT 'open',
  "created_at"   timestamptz NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS "submissions" (
  "id"            serial PRIMARY KEY,
  "assignment_id" integer NOT NULL,
  "student_id"    integer NOT NULL,
  "text_response" text,
  "file_url"      text,
  "submitted_at"  timestamptz NOT NULL DEFAULT NOW(),
  "grade"         integer,
  "feedback"      text,
  "graded_at"     timestamptz,
  "graded_by"     text
);

-- ── Mock Exams ────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS "mock_exams" (
  "id"                  serial PRIMARY KEY,
  "student_id"          integer NOT NULL,
  "curriculum"          text    NOT NULL DEFAULT 'ZIMSEC',
  "subject"             text    NOT NULL,
  "grade"               text    NOT NULL,
  "year"                integer,
  "paper_ref"           text,
  "score"               integer NOT NULL,
  "total_marks"         integer NOT NULL,
  "time_spent_minutes"  integer NOT NULL,
  "completed_at"        timestamptz NOT NULL DEFAULT NOW()
);

-- ── Exam Dates ────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS "exam_dates" (
  "id"         serial PRIMARY KEY,
  "student_id" integer NOT NULL,
  "curriculum" text    NOT NULL DEFAULT 'ZIMSEC',
  "subject"    text    NOT NULL,
  "paper"      text,
  "exam_date"  text    NOT NULL,
  "created_at" timestamptz NOT NULL DEFAULT NOW()
);

-- ── Topic Attempts ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS "topic_attempts" (
  "id"         serial PRIMARY KEY,
  "student_id" integer NOT NULL,
  "curriculum" text    NOT NULL DEFAULT 'ZIMSEC',
  "subject"    text    NOT NULL,
  "topic"      text    NOT NULL,
  "correct"    integer NOT NULL,
  "total"      integer NOT NULL,
  "source"     text    NOT NULL DEFAULT 'mock',
  "created_at" timestamptz NOT NULL DEFAULT NOW()
);

-- ── Bookmarks ─────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS "bookmarks" (
  "id"        serial PRIMARY KEY,
  "user_id"   integer NOT NULL,
  "item_type" text    NOT NULL,
  "item_id"   integer NOT NULL,
  "title"     text,
  "saved_at"  timestamptz NOT NULL DEFAULT NOW()
);

-- ── Notifications ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS "notifications" (
  "id"         serial PRIMARY KEY,
  "user_id"    integer NOT NULL,
  "type"       text    NOT NULL,
  "title"      text    NOT NULL,
  "message"    text    NOT NULL,
  "read"       boolean NOT NULL DEFAULT false,
  "link"       text,
  "created_at" timestamptz NOT NULL DEFAULT NOW()
);

-- ── Announcements ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS "announcements" (
  "id"         serial PRIMARY KEY,
  "title"      text NOT NULL,
  "message"    text NOT NULL,
  "target"     text NOT NULL DEFAULT 'all',
  "priority"   text NOT NULL DEFAULT 'normal',
  "created_by" text,
  "created_at" timestamptz NOT NULL DEFAULT NOW()
);

-- ── Subscriptions ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS "subscriptions" (
  "id"                 serial PRIMARY KEY,
  "user_id"            integer            NOT NULL,
  "plan"               text               NOT NULL,
  "status"             text               NOT NULL DEFAULT 'active',
  "start_date"         timestamptz        NOT NULL DEFAULT NOW(),
  "expiry_date"        timestamptz        NOT NULL,
  "payment_method"     text               NOT NULL DEFAULT 'manual',
  "amount_paid"        double precision   NOT NULL DEFAULT 0,
  "proof_url"          text,
  "payment_reference"  text,
  "sender_phone"       text,
  "rejection_reason"   text,
  "created_at"         timestamptz        NOT NULL DEFAULT NOW()
);

-- ── Payment Settings ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS "payment_settings" (
  "id"               serial PRIMARY KEY,
  "ecocash_number"   text        NOT NULL DEFAULT '',
  "innbucks_number"  text        NOT NULL DEFAULT '',
  "onemoney_number"  text        NOT NULL DEFAULT '',
  "whatsapp_number"  text        NOT NULL DEFAULT '',
  "instructions"     text        NOT NULL DEFAULT '',
  "updated_at"       timestamptz NOT NULL DEFAULT NOW()
);

-- ── Syllabus Topics ───────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS "syllabus_topics" (
  "id"                  serial PRIMARY KEY,
  "subject"             text  NOT NULL,
  "exam_board"          text  NOT NULL,
  "curriculum"          text  NOT NULL DEFAULT 'ZIMSEC',
  "level"               text  NOT NULL,
  "grade"               text  NOT NULL,
  "strand"              text  NOT NULL,
  "topic"               text  NOT NULL,
  "subtopics"           jsonb NOT NULL DEFAULT '[]',
  "learning_objectives" text
);

-- ── Planner Slots ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS "planner_slots" (
  "id"               serial PRIMARY KEY,
  "student_id"       integer NOT NULL,
  "week_of"          text    NOT NULL,
  "day"              text    NOT NULL,
  "subject"          text    NOT NULL,
  "topic"            text,
  "source"           text,
  "duration_minutes" integer NOT NULL,
  "time"             text    NOT NULL,
  "created_at"       timestamptz NOT NULL DEFAULT NOW()
);

-- ── AI Conversations ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS "conversations" (
  "id"         serial PRIMARY KEY,
  "user_id"    integer REFERENCES "users"("id") ON DELETE CASCADE,
  "title"      text    NOT NULL,
  "created_at" timestamptz NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS "messages" (
  "id"              serial PRIMARY KEY,
  "conversation_id" integer NOT NULL REFERENCES "conversations"("id") ON DELETE CASCADE,
  "role"            text    NOT NULL,
  "content"         text    NOT NULL,
  "created_at"      timestamptz NOT NULL DEFAULT NOW()
);

-- ── Social / Teacher Profiles ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS "teacher_profiles" (
  "id"                  serial PRIMARY KEY,
  "user_id"             integer NOT NULL UNIQUE REFERENCES "users"("id") ON DELETE CASCADE,
  "headline"            text,
  "bio"                 text,
  "subjects_taught"     text,
  "grade_levels"        text,
  "city"                text,
  "country"             text DEFAULT 'Zimbabwe',
  "languages_spoken"    text,
  "years_experience"    integer DEFAULT 0,
  "availability_status" text DEFAULT 'available',
  "cover_banner_url"    text,
  "is_verified"         boolean NOT NULL DEFAULT false,
  "work_history"        text,
  "education"           text,
  "skills"              text,
  "certifications"      text,
  "followers_count"     integer NOT NULL DEFAULT 0,
  "following_count"     integer NOT NULL DEFAULT 0,
  "updated_at"          timestamptz NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS "social_posts" (
  "id"              serial PRIMARY KEY,
  "author_id"       integer NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "content"         text    NOT NULL,
  "post_type"       text    NOT NULL DEFAULT 'update',
  "image_url"       text,
  "video_url"       text,
  "hashtags"        text,
  "is_pinned"       boolean NOT NULL DEFAULT false,
  "reactions_count" integer NOT NULL DEFAULT 0,
  "comments_count"  integer NOT NULL DEFAULT 0,
  "created_at"      timestamptz NOT NULL DEFAULT NOW(),
  "updated_at"      timestamptz NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS "post_reactions" (
  "id"            serial PRIMARY KEY,
  "post_id"       integer NOT NULL REFERENCES "social_posts"("id") ON DELETE CASCADE,
  "user_id"       integer NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "reaction_type" text    NOT NULL DEFAULT 'like',
  "created_at"    timestamptz NOT NULL DEFAULT NOW(),
  CONSTRAINT "post_reactions_unique" UNIQUE ("post_id", "user_id")
);

CREATE TABLE IF NOT EXISTS "post_comments" (
  "id"         serial PRIMARY KEY,
  "post_id"    integer NOT NULL REFERENCES "social_posts"("id") ON DELETE CASCADE,
  "author_id"  integer NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "content"    text    NOT NULL,
  "created_at" timestamptz NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS "teacher_connections" (
  "id"           serial PRIMARY KEY,
  "requester_id" integer NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "recipient_id" integer NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "status"       text    NOT NULL DEFAULT 'pending',
  "created_at"   timestamptz NOT NULL DEFAULT NOW(),
  CONSTRAINT "connections_unique" UNIQUE ("requester_id", "recipient_id")
);

CREATE TABLE IF NOT EXISTS "skill_endorsements" (
  "id"              serial PRIMARY KEY,
  "profile_user_id" integer NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "endorser_id"     integer NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "skill"           text    NOT NULL,
  "created_at"      timestamptz NOT NULL DEFAULT NOW(),
  CONSTRAINT "endorsements_unique" UNIQUE ("profile_user_id", "endorser_id", "skill")
);

CREATE TABLE IF NOT EXISTS "user_follows" (
  "id"           serial PRIMARY KEY,
  "follower_id"  integer NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "following_id" integer NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "created_at"   timestamptz NOT NULL DEFAULT NOW(),
  CONSTRAINT "user_follows_unique" UNIQUE ("follower_id", "following_id")
);

-- ── Channels / Group Chat ─────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS "class_channels" (
  "id"            serial PRIMARY KEY,
  "name"          text    NOT NULL,
  "school"        text    NOT NULL,
  "grade"         text,
  "channel_type"  text    NOT NULL DEFAULT 'class',
  "subject"       text,
  "description"   text,
  "created_by"    integer NOT NULL REFERENCES "users"("id"),
  "is_private"    boolean NOT NULL DEFAULT true,
  "members_count" integer NOT NULL DEFAULT 0,
  "created_at"    timestamptz NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS "channel_members" (
  "id"           serial PRIMARY KEY,
  "channel_id"   integer NOT NULL REFERENCES "class_channels"("id") ON DELETE CASCADE,
  "user_id"      integer NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "role"         text    NOT NULL DEFAULT 'member',
  "joined_at"    timestamptz NOT NULL DEFAULT NOW(),
  "last_read_at" timestamptz,
  CONSTRAINT "channel_members_unique" UNIQUE ("channel_id", "user_id")
);

CREATE TABLE IF NOT EXISTS "channel_messages" (
  "id"           serial PRIMARY KEY,
  "channel_id"   integer NOT NULL REFERENCES "class_channels"("id") ON DELETE CASCADE,
  "sender_id"    integer NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "content"      text    NOT NULL,
  "message_type" text    NOT NULL DEFAULT 'text',
  "file_url"     text,
  "is_pinned"    boolean NOT NULL DEFAULT false,
  "reply_to_id"  integer,
  "created_at"   timestamptz NOT NULL DEFAULT NOW(),
  "edited_at"    timestamptz,
  "is_deleted"   boolean NOT NULL DEFAULT false
);

CREATE TABLE IF NOT EXISTS "direct_messages" (
  "id"           serial PRIMARY KEY,
  "sender_id"    integer NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "recipient_id" integer NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "content"      text    NOT NULL,
  "file_url"     text,
  "is_read"      boolean NOT NULL DEFAULT false,
  "created_at"   timestamptz NOT NULL DEFAULT NOW(),
  "is_deleted"   boolean NOT NULL DEFAULT false
);

-- ── Gamification ──────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS "student_gamification" (
  "id"                   serial PRIMARY KEY,
  "user_id"              integer NOT NULL UNIQUE,
  "xp"                   integer NOT NULL DEFAULT 0,
  "level"                integer NOT NULL DEFAULT 1,
  "smart_coins"          integer NOT NULL DEFAULT 0,
  "study_streak"         integer NOT NULL DEFAULT 0,
  "longest_streak"       integer NOT NULL DEFAULT 0,
  "last_activity_date"   text,
  "focus_score"          integer NOT NULL DEFAULT 0,
  "total_focus_minutes"  integer NOT NULL DEFAULT 0,
  "updated_at"           timestamptz NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS "student_achievements" (
  "id"          serial PRIMARY KEY,
  "user_id"     integer NOT NULL,
  "badge"       text    NOT NULL,
  "label"       text    NOT NULL,
  "description" text    NOT NULL,
  "xp_awarded"  integer NOT NULL DEFAULT 0,
  "earned_at"   timestamptz NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS "focus_sessions" (
  "id"               serial PRIMARY KEY,
  "user_id"          integer NOT NULL,
  "duration_minutes" integer NOT NULL,
  "type"             text    NOT NULL DEFAULT 'study',
  "completed_at"     timestamptz NOT NULL DEFAULT NOW()
);

-- ── Quiz Sessions ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS "quiz_sessions" (
  "id"              serial PRIMARY KEY,
  "user_id"         integer NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "date"            text    NOT NULL,
  "grade"           text,
  "questions"       jsonb   NOT NULL,
  "answers"         jsonb,
  "score"           integer,
  "submitted_at"    timestamptz,
  "created_at"      timestamptz NOT NULL DEFAULT NOW()
);

-- ── Tutoring Marketplace ──────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS "tutor_listings" (
  "id"                serial PRIMARY KEY,
  "teacher_id"        integer NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "title"             text    NOT NULL,
  "subject"           text    NOT NULL,
  "grade_levels"      text    NOT NULL,
  "description"       text,
  "hourly_rate_cents" integer NOT NULL DEFAULT 500,
  "currency"          text    NOT NULL DEFAULT 'USD',
  "mode"              text    NOT NULL DEFAULT 'online',
  "location"          text,
  "is_active"         boolean NOT NULL DEFAULT true,
  "created_at"        timestamptz NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS "tutor_bookings" (
  "id"                   serial PRIMARY KEY,
  "student_id"           integer NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "teacher_id"           integer NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "listing_id"           integer NOT NULL REFERENCES "tutor_listings"("id") ON DELETE CASCADE,
  "status"               text    NOT NULL DEFAULT 'pending',
  "message"              text,
  "preferred_date_time"  text,
  "created_at"           timestamptz NOT NULL DEFAULT NOW()
);

-- ── Doubt Box ─────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS "doubt_questions" (
  "id"            serial PRIMARY KEY,
  "subject"       text    NOT NULL,
  "question"      text    NOT NULL,
  "user_id"       integer,
  "is_anonymous"  boolean NOT NULL DEFAULT true,
  "answer"        text,
  "answered_by"   integer,
  "is_published"  boolean NOT NULL DEFAULT false,
  "is_moderated"  boolean NOT NULL DEFAULT false,
  "created_at"    timestamptz NOT NULL DEFAULT NOW(),
  "answered_at"   timestamptz
);

-- ── Performance Indexes ───────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS "idx_users_email"            ON "users"("email");
CREATE INDEX IF NOT EXISTS "idx_users_role"             ON "users"("role");
CREATE INDEX IF NOT EXISTS "idx_users_status"           ON "users"("status");
CREATE INDEX IF NOT EXISTS "idx_notes_curriculum"       ON "notes"("curriculum", "subject", "grade");
CREATE INDEX IF NOT EXISTS "idx_papers_curriculum"      ON "papers"("curriculum", "subject", "year");
CREATE INDEX IF NOT EXISTS "idx_notifications_user"     ON "notifications"("user_id", "read");
CREATE INDEX IF NOT EXISTS "idx_bookmarks_user"         ON "bookmarks"("user_id", "item_type");
CREATE INDEX IF NOT EXISTS "idx_topic_attempts_student" ON "topic_attempts"("student_id", "subject");
CREATE INDEX IF NOT EXISTS "idx_subscriptions_user"     ON "subscriptions"("user_id", "status");
CREATE INDEX IF NOT EXISTS "idx_social_posts_author"    ON "social_posts"("author_id", "created_at" DESC);
CREATE INDEX IF NOT EXISTS "idx_channel_msgs_channel"   ON "channel_messages"("channel_id", "created_at" DESC);
CREATE INDEX IF NOT EXISTS "idx_direct_msgs_sender"     ON "direct_messages"("sender_id", "recipient_id");
CREATE INDEX IF NOT EXISTS "idx_conversations_user"     ON "conversations"("user_id");
