-- ============================================================
-- SmartZim — Row Level Security Policies
-- SmartZim uses its own session-based auth (not Supabase Auth),
-- so RLS is configured conservatively:
--   • All access goes through the backend API (service role key)
--   • Direct client access to the database is disabled
--   • Public tables have read-only anon access where appropriate
-- ============================================================

-- Enable RLS on all tables
ALTER TABLE "session"               ENABLE ROW LEVEL SECURITY;
ALTER TABLE "users"                 ENABLE ROW LEVEL SECURITY;
ALTER TABLE "curricula"             ENABLE ROW LEVEL SECURITY;
ALTER TABLE "notes"                 ENABLE ROW LEVEL SECURITY;
ALTER TABLE "papers"                ENABLE ROW LEVEL SECURITY;
ALTER TABLE "assignments"           ENABLE ROW LEVEL SECURITY;
ALTER TABLE "submissions"           ENABLE ROW LEVEL SECURITY;
ALTER TABLE "mock_exams"            ENABLE ROW LEVEL SECURITY;
ALTER TABLE "exam_dates"            ENABLE ROW LEVEL SECURITY;
ALTER TABLE "topic_attempts"        ENABLE ROW LEVEL SECURITY;
ALTER TABLE "bookmarks"             ENABLE ROW LEVEL SECURITY;
ALTER TABLE "notifications"         ENABLE ROW LEVEL SECURITY;
ALTER TABLE "announcements"         ENABLE ROW LEVEL SECURITY;
ALTER TABLE "subscriptions"         ENABLE ROW LEVEL SECURITY;
ALTER TABLE "payment_settings"      ENABLE ROW LEVEL SECURITY;
ALTER TABLE "syllabus_topics"       ENABLE ROW LEVEL SECURITY;
ALTER TABLE "planner_slots"         ENABLE ROW LEVEL SECURITY;
ALTER TABLE "conversations"         ENABLE ROW LEVEL SECURITY;
ALTER TABLE "messages"              ENABLE ROW LEVEL SECURITY;
ALTER TABLE "teacher_profiles"      ENABLE ROW LEVEL SECURITY;
ALTER TABLE "social_posts"          ENABLE ROW LEVEL SECURITY;
ALTER TABLE "post_reactions"        ENABLE ROW LEVEL SECURITY;
ALTER TABLE "post_comments"         ENABLE ROW LEVEL SECURITY;
ALTER TABLE "teacher_connections"   ENABLE ROW LEVEL SECURITY;
ALTER TABLE "skill_endorsements"    ENABLE ROW LEVEL SECURITY;
ALTER TABLE "user_follows"          ENABLE ROW LEVEL SECURITY;
ALTER TABLE "class_channels"        ENABLE ROW LEVEL SECURITY;
ALTER TABLE "channel_members"       ENABLE ROW LEVEL SECURITY;
ALTER TABLE "channel_messages"      ENABLE ROW LEVEL SECURITY;
ALTER TABLE "direct_messages"       ENABLE ROW LEVEL SECURITY;
ALTER TABLE "student_gamification"  ENABLE ROW LEVEL SECURITY;
ALTER TABLE "student_achievements"  ENABLE ROW LEVEL SECURITY;
ALTER TABLE "focus_sessions"        ENABLE ROW LEVEL SECURITY;
ALTER TABLE "quiz_sessions"         ENABLE ROW LEVEL SECURITY;
ALTER TABLE "tutor_listings"        ENABLE ROW LEVEL SECURITY;
ALTER TABLE "tutor_bookings"        ENABLE ROW LEVEL SECURITY;
ALTER TABLE "doubt_questions"       ENABLE ROW LEVEL SECURITY;

-- ── Service role bypass ────────────────────────────────────────────────────────
-- The backend Express API connects with the SERVICE ROLE key, which bypasses
-- all RLS policies. This is correct and intentional — the API enforces its own
-- authorization layer. Never expose the service role key to clients.

-- ── Block all direct anonymous client access ───────────────────────────────────
-- No policies = no access (RLS default-deny). The service role is exempt.
-- This ensures no data leaks through direct Supabase client connections.

-- ── Optional: allow public read of curricula and syllabus for SEO/bots ─────────
CREATE POLICY "curricula_public_read"
  ON "curricula" FOR SELECT
  TO anon
  USING (active = true);

CREATE POLICY "syllabus_public_read"
  ON "syllabus_topics" FOR SELECT
  TO anon
  USING (true);

-- ── Storage Buckets ────────────────────────────────────────────────────────────
-- Run these after creating buckets in the Supabase Storage dashboard:
--   - smartzim-public  (public bucket)
--   - smartzim-private (private bucket)

-- Public bucket: allow anyone to download
-- (set the bucket to "public" in the Supabase dashboard and this policy
--  will be created automatically, but adding explicitly for completeness)
INSERT INTO storage.buckets (id, name, public)
VALUES ('smartzim-public', 'smartzim-public', true)
ON CONFLICT (id) DO UPDATE SET public = true;

INSERT INTO storage.buckets (id, name, public)
VALUES ('smartzim-private', 'smartzim-private', false)
ON CONFLICT (id) DO NOTHING;

-- Allow service role to manage all storage objects (no explicit policy needed
-- as service role bypasses RLS, but kept for documentation clarity).
