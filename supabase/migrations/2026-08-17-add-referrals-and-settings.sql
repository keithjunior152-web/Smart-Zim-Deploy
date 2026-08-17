-- Migration: add referrals, credits, and app settings for referral reward
-- Run this in Supabase SQL editor

-- 1) Add referral & admin fields to auth.users
ALTER TABLE IF EXISTS auth.users
  ADD COLUMN IF NOT EXISTS referral_code TEXT,
  ADD COLUMN IF NOT EXISTS referred_by UUID NULL,
  ADD COLUMN IF NOT EXISTS credits INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS is_admin BOOLEAN DEFAULT FALSE;

-- 2) Create referrals table
CREATE TABLE IF NOT EXISTS public.referrals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_id uuid REFERENCES auth.users(id),
  referred_id uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now(),
  rewarded boolean DEFAULT FALSE
);

-- 3) App settings table (editable by admin)
CREATE TABLE IF NOT EXISTS public.app_settings (
  key text PRIMARY KEY,
  value text NOT NULL
);

-- 4) Insert default referral reward if missing
INSERT INTO public.app_settings (key, value)
  VALUES ('referral_reward', '50')
  ON CONFLICT (key) DO NOTHING;

-- 5) Helper function: atomic increment of user credits
CREATE OR REPLACE FUNCTION public.increment_user_credits(user_id uuid, amount int)
RETURNS void LANGUAGE plpgsql AS $$
BEGIN
  UPDATE auth.users SET credits = COALESCE(credits,0) + amount WHERE id = user_id;
END;
$$;
