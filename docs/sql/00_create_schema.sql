-- ============================================
-- THEME-A-ROO ONLINE - COMPLETE SCHEMA SETUP
-- ============================================
-- Run this as the database owner (devuser) to create all tables
-- Prerequisites: Database users must already exist (see setup-db-users.sql)
-- ============================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================
-- ENUMS
-- ============================================

DO $$ BEGIN
  CREATE TYPE file_use_type AS ENUM ('shell', 'header', 'metadata');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- ============================================
-- TABLES (in correct order for foreign keys)
-- ============================================

-- 1. user_profiles (referenced by other tables)
CREATE TABLE IF NOT EXISTS public.user_profiles (
  id uuid PRIMARY KEY,
  email text,
  role text,
  created_at timestamptz,
  last_sign_in_at timestamptz,
  email_confirmed_at timestamptz,
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT user_profiles_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS user_profiles_email_idx ON public.user_profiles(email);

-- 2. themes (referenced by theme_files)
CREATE TABLE IF NOT EXISTS public.themes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  theme jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  notes text,
  name text NOT NULL DEFAULT '',
  display_name text NOT NULL DEFAULT 'New Theme',
  is_draft boolean NOT NULL DEFAULT true,
  CONSTRAINT themes_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.user_profiles(id) ON DELETE CASCADE,
  CONSTRAINT themes_user_id_name_key UNIQUE (user_id, name)
);

CREATE INDEX IF NOT EXISTS themes_user_id_idx ON public.themes(user_id);

-- 3. theme_files (depends on themes)
CREATE TABLE IF NOT EXISTS public.theme_files (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  theme_id uuid NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  file_use_type file_use_type NOT NULL,
  mime_type text NOT NULL,
  file bytea NOT NULL,
  CONSTRAINT theme_files_theme_id_fkey FOREIGN KEY (theme_id) REFERENCES public.themes(id) ON DELETE CASCADE,
  CONSTRAINT theme_files_theme_id_file_use_type_key UNIQUE (theme_id, file_use_type)
);

CREATE INDEX IF NOT EXISTS theme_files_theme_id_idx ON public.theme_files(theme_id);

-- 4. addresses (depends on user_profiles)
CREATE TABLE IF NOT EXISTS public.addresses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  address text NOT NULL UNIQUE,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  notes text,
  network smallint NOT NULL DEFAULT 0,
  CONSTRAINT addresses_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.user_profiles(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS addresses_user_id_idx ON public.addresses(user_id);

-- 5. dids (depends on user_profiles)
CREATE TABLE IF NOT EXISTS public.dids (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  launcher_id text NOT NULL UNIQUE,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  notes text,
  network smallint NOT NULL DEFAULT 0,
  name text,
  CONSTRAINT dids_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.user_profiles(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS dids_user_id_idx ON public.dids(user_id);

-- ============================================
-- GRANT PERMISSIONS
-- ============================================

GRANT USAGE ON SCHEMA public TO authenticated, anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- ============================================
-- VERIFICATION
-- ============================================

SELECT
  tablename,
  tableowner
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY tablename;
