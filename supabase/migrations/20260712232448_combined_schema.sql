-- Combined schema: base tables + feature additions
-- Run as a single migration.

-- ── enums ──────────────────────────────────────────────────────────────────
DO $$ BEGIN CREATE TYPE public.fraud_flag_status AS ENUM ('open','reviewing','dismissed','actioned'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE public.notification_type AS ENUM ('reward','gift','redemption','referral','fraud','campaign','system'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE public.gift_type AS ENUM ('discount','cash','airtime','points','voucher','other'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE public.gift_grant_status AS ENUM ('granted','redeemed','expired'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE public.referral_status AS ENUM ('pending','signed_up','qualified','rewarded'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE income_band AS ENUM ('under_100k','100k_300k','300k_700k','700k_1_5m','over_1_5m'); EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN CREATE TYPE device_type AS ENUM ('android','ios','desktop'); EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN CREATE TYPE marital_status AS ENUM ('single','married','other'); EXCEPTION WHEN duplicate_object THEN null; END $$;

-- ── base tables ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text UNIQUE NOT NULL,
  username text UNIQUE NOT NULL,
  password_hash text NOT NULL,
  role text NOT NULL CHECK (role IN ('reviewer','brand','admin')),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.ads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  asset_url text NOT NULL,
  asset_type text NOT NULL CHECK (asset_type IN ('image','video')),
  min_watch_seconds integer NOT NULL DEFAULT 15,
  point_reward integer NOT NULL DEFAULT 10,
  multiplier_factor text DEFAULT '1.0',
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','active','paused','archived')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.reviewer_profiles (
  user_id uuid PRIMARY KEY REFERENCES public.users(id) ON DELETE CASCADE,
  -- demographic columns from profile_expansion.sql
  city text,
  income_band income_band,
  occupation_sector text,
  device_type device_type,
  marital_status marital_status,
  interests text[],
  -- additional optional fields (if any)
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.review_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  ad_id uuid NOT NULL REFERENCES public.ads(id) ON DELETE CASCADE,
  started_at timestamptz NOT NULL DEFAULT now(),
  completed_at timestamptz,
  status text NOT NULL DEFAULT 'in_progress' CHECK (status IN ('in_progress','completed','abandoned')),
  reward_earned integer DEFAULT 0
);

-- ── add suspension flag to users ──────────────────────────────────────────
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS suspended boolean NOT NULL DEFAULT false;

-- ── add fraud‑related columns to review_sessions ──────────────────────────
ALTER TABLE public.review_sessions ADD COLUMN IF NOT EXISTS watch_percentage integer;
ALTER TABLE public.review_sessions ADD COLUMN IF NOT EXISTS ip_address text;
ALTER TABLE public.review_sessions ADD COLUMN IF NOT EXISTS user_agent text;
ALTER TABLE public.review_sessions ADD COLUMN IF NOT EXISTS device_fingerprint text;

-- ── fraud tables ───────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.fraud_flags (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  score integer NOT NULL,
  reason text NOT NULL,
  details jsonb,
  status public.fraud_flag_status NOT NULL DEFAULT 'open',
  reviewed_by uuid REFERENCES public.users(id),
  reviewed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_fraud_flags_user ON public.fraud_flags(user_id, status);

CREATE TABLE IF NOT EXISTS public.fraud_rules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  same_device_score integer NOT NULL DEFAULT 50,
  same_ip_score integer NOT NULL DEFAULT 20,
  excessive_daily_score integer NOT NULL DEFAULT 30,
  suspicious_pattern_score integer NOT NULL DEFAULT 50,
  warn_threshold integer NOT NULL DEFAULT 50,
  review_threshold integer NOT NULL DEFAULT 100,
  auto_suspend_threshold integer NOT NULL DEFAULT 150,
  max_daily_earnings integer NOT NULL DEFAULT 500,
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.device_signals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  review_session_id uuid REFERENCES public.review_sessions(id),
  ip_address text,
  user_agent text,
  device_fingerprint text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_device_signals_fp ON public.device_signals(device_fingerprint);
CREATE INDEX IF NOT EXISTS idx_device_signals_ip ON public.device_signals(ip_address);

-- ── notifications ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  type public.notification_type NOT NULL DEFAULT 'system',
  title text NOT NULL,
  message text NOT NULL,
  read boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_notifications_user ON public.notifications(user_id, read, created_at DESC);

-- ── gifts ──────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.gift_catalog (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ad_id uuid REFERENCES public.ads(id) ON DELETE CASCADE,
  type public.gift_type NOT NULL,
  label text NOT NULL,
  value integer NOT NULL DEFAULT 0,
  meta jsonb,
  weight integer NOT NULL DEFAULT 1,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_gift_catalog_pool ON public.gift_catalog(active, ad_id);

CREATE TABLE IF NOT EXISTS public.gift_grants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  gift_id uuid NOT NULL REFERENCES public.gift_catalog(id),
  review_session_id uuid REFERENCES public.review_sessions(id),
  type public.gift_type NOT NULL,
  label text NOT NULL,
  value integer NOT NULL DEFAULT 0,
  status public.gift_grant_status NOT NULL DEFAULT 'granted',
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_gift_grants_user ON public.gift_grants(user_id, created_at DESC);

-- ── referrals ──────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.referral_codes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE REFERENCES public.users(id) ON DELETE CASCADE,
  code text NOT NULL UNIQUE,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.referrals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  invitee_email text,
  invitee_user_id uuid REFERENCES public.users(id),
  channel text,
  status public.referral_status NOT NULL DEFAULT 'pending',
  reward_points integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  qualified_at timestamptz
);
CREATE UNIQUE INDEX IF NOT EXISTS uniq_referral_invitee ON public.referrals(referrer_id, invitee_user_id);

-- seed default fraud_rules row if none exists
INSERT INTO public.fraud_rules (id) SELECT gen_random_uuid() WHERE NOT EXISTS (SELECT 1 FROM public.fraud_rules);