-- ============================================
-- THEME-A-ROO ONLINE - Initial Database Setup
-- ============================================
-- This migration sets up:
-- 1. Required PostgreSQL extensions
-- 2. Supabase auth schema (simplified for self-hosted)
-- 3. Public tables (themes, addresses, DIDs, etc.)
-- 4. Row Level Security (RLS) policies
-- 5. Helper functions and triggers
-- ============================================

-- ============================================
-- STEP 1: Enable Required Extensions
-- ============================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";      -- UUID generation
CREATE EXTENSION IF NOT EXISTS "pgcrypto";       -- Cryptographic functions
-- CREATE EXTENSION IF NOT EXISTS "pgjwt";       -- JWT token handling (optional, not available on all systems)

-- ============================================
-- STEP 2: Verify Roles Exist
-- ============================================
-- Note: Roles 'anon' and 'authenticated' must be created first
-- by running migrations/000_superuser_setup.sql as postgres superuser

-- Verify the roles exist (this will fail with clear error if they don't)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'anon') THEN
    RAISE EXCEPTION 'Role "anon" does not exist. Run migrations/000_superuser_setup.sql first as postgres superuser.';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'authenticated') THEN
    RAISE EXCEPTION 'Role "authenticated" does not exist. Run migrations/000_superuser_setup.sql first as postgres superuser.';
  END IF;

  RAISE NOTICE 'Required roles verified: anon, authenticated';
END
$$;

-- ============================================
-- STEP 3: Create Auth Schema
-- ============================================
-- Supabase uses a separate 'auth' schema for authentication
-- This is a simplified version for self-hosted Postgres

CREATE SCHEMA IF NOT EXISTS auth;

-- Create auth.users table (core authentication table)
CREATE TABLE IF NOT EXISTS auth.users (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  email text UNIQUE,
  encrypted_password text,
  email_confirmed_at timestamptz,
  invited_at timestamptz,
  confirmation_token text,
  confirmation_sent_at timestamptz,
  recovery_token text,
  recovery_sent_at timestamptz,
  email_change_token_new text,
  email_change text,
  email_change_sent_at timestamptz,
  last_sign_in_at timestamptz,
  raw_app_meta_data jsonb DEFAULT '{}'::jsonb,
  raw_user_meta_data jsonb DEFAULT '{}'::jsonb,
  is_super_admin boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  phone text,
  phone_confirmed_at timestamptz,
  phone_change text,
  phone_change_token text,
  phone_change_sent_at timestamptz,
  confirmed_at timestamptz GENERATED ALWAYS AS (LEAST(email_confirmed_at, phone_confirmed_at)) STORED,
  email_change_token_current text,
  email_change_confirm_status smallint DEFAULT 0,
  banned_until timestamptz,
  reauthentication_token text,
  reauthentication_sent_at timestamptz,
  is_sso_user boolean DEFAULT false,
  deleted_at timestamptz
);

-- Create indexes on auth.users
CREATE INDEX IF NOT EXISTS users_email_idx ON auth.users (email);
CREATE INDEX IF NOT EXISTS users_created_at_idx ON auth.users (created_at);

-- Helper function to get current user ID (mimics Supabase's auth.uid())
CREATE OR REPLACE FUNCTION auth.uid()
RETURNS uuid
LANGUAGE sql
STABLE
AS $$
  SELECT COALESCE(
    current_setting('request.jwt.claim.sub', true)::uuid,
    (current_setting('request.jwt.claims', true)::jsonb ->> 'sub')::uuid
  );
$$;

-- Helper function to get JWT claims (mimics Supabase's auth.jwt())
CREATE OR REPLACE FUNCTION auth.jwt()
RETURNS jsonb
LANGUAGE sql
STABLE
AS $$
  SELECT COALESCE(
    current_setting('request.jwt.claims', true)::jsonb,
    '{}'::jsonb
  );
$$;

-- Grant necessary permissions on auth schema
GRANT USAGE ON SCHEMA auth TO postgres, anon, authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA auth TO postgres;
GRANT SELECT ON auth.users TO authenticated;

-- ============================================
-- STEP 4: Create Public Schema Tables
-- ============================================

-- User Profiles Table (synced from auth.users)
CREATE TABLE IF NOT EXISTS public.user_profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text,
  role text DEFAULT 'user',
  created_at timestamptz DEFAULT now(),
  last_sign_in_at timestamptz,
  email_confirmed_at timestamptz,
  updated_at timestamptz DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS user_profiles_pkey ON public.user_profiles (id);

-- Themes Table
CREATE TABLE IF NOT EXISTS public.themes (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
  name text NOT NULL DEFAULT '',
  display_name text NOT NULL DEFAULT 'New Theme',
  theme jsonb DEFAULT '{}'::jsonb,
  notes text,
  is_draft boolean NOT NULL DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT themes_user_id_name_key UNIQUE (user_id, name)
);

CREATE UNIQUE INDEX IF NOT EXISTS themes_pkey ON public.themes (id);
CREATE INDEX IF NOT EXISTS themes_user_id_idx ON public.themes (user_id);
CREATE UNIQUE INDEX IF NOT EXISTS themes_user_id_name_key ON public.themes (user_id, name);

-- Theme Files Table
-- Note: file_use_type is an ENUM in the original schema, but we'll use text for simplicity
CREATE TABLE IF NOT EXISTS public.theme_files (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  theme_id uuid NOT NULL REFERENCES public.themes(id) ON DELETE CASCADE,
  file_use_type text NOT NULL CHECK (file_use_type IN ('preview', 'thumbnail', 'icon', 'background')),
  mime_type text NOT NULL,
  file bytea NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT theme_files_theme_id_file_use_type_key UNIQUE (theme_id, file_use_type)
);

CREATE UNIQUE INDEX IF NOT EXISTS theme_files_pkey ON public.theme_files (id);
CREATE UNIQUE INDEX IF NOT EXISTS theme_files_theme_id_file_use_type_key ON public.theme_files (theme_id, file_use_type);

-- Addresses Table (Chia blockchain addresses)
CREATE TABLE IF NOT EXISTS public.addresses (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
  address text NOT NULL UNIQUE,
  network smallint NOT NULL DEFAULT 0,
  metadata jsonb DEFAULT '{}'::jsonb,
  notes text,
  name text,
  is_default boolean NOT NULL DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS addresses_pkey ON public.addresses (id);
CREATE UNIQUE INDEX IF NOT EXISTS addresses_address_key ON public.addresses (address);
CREATE INDEX IF NOT EXISTS addresses_user_id_idx ON public.addresses (user_id);

-- DIDs Table (Decentralized Identifiers)
CREATE TABLE IF NOT EXISTS public.dids (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
  launcher_id text NOT NULL UNIQUE,
  name text,
  network smallint NOT NULL DEFAULT 0,
  metadata jsonb DEFAULT '{}'::jsonb,
  notes text,
  avatar_uri text,
  is_default boolean NOT NULL DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS dids_pkey ON public.dids (id);
CREATE UNIQUE INDEX IF NOT EXISTS dids_launcher_id_key ON public.dids (launcher_id);
CREATE INDEX IF NOT EXISTS dids_user_id_idx ON public.dids (user_id);

-- ============================================
-- STEP 5: Enable Row Level Security (RLS)
-- ============================================

ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.themes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.theme_files ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.addresses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dids ENABLE ROW LEVEL SECURITY;

-- ============================================
-- STEP 6: Create Helper Functions
-- ============================================

-- Function to get user role from JWT
CREATE OR REPLACE FUNCTION public.get_user_role()
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT COALESCE(
    (auth.jwt() -> 'app_metadata' ->> 'role')::text,
    'user'
  );
$$;

GRANT EXECUTE ON FUNCTION public.get_user_role() TO authenticated, anon;

-- Function to sync auth.users to user_profiles
CREATE OR REPLACE FUNCTION public.sync_user_profile()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO public.user_profiles (id, email, role, created_at, last_sign_in_at, email_confirmed_at)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_app_meta_data->>'role', 'user'),
    NEW.created_at,
    NEW.last_sign_in_at,
    NEW.email_confirmed_at
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    role = COALESCE(EXCLUDED.role, 'user'),
    last_sign_in_at = EXCLUDED.last_sign_in_at,
    email_confirmed_at = EXCLUDED.email_confirmed_at,
    updated_at = now();
  RETURN NEW;
END;
$$;

-- ============================================
-- STEP 7: Create Triggers
-- ============================================

DROP TRIGGER IF EXISTS sync_user_profile_trigger ON auth.users;
CREATE TRIGGER sync_user_profile_trigger
  AFTER INSERT OR UPDATE ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_user_profile();

-- ============================================
-- STEP 8: RLS Policies for user_profiles
-- ============================================

-- Admins can see all profiles
CREATE POLICY "Admins can see all user profiles"
ON public.user_profiles FOR SELECT
USING (public.get_user_role() = 'admin');

-- Users can see their own profile
CREATE POLICY "Users can see own profile"
ON public.user_profiles FOR SELECT
USING (auth.uid() = id);

GRANT SELECT ON public.user_profiles TO authenticated;

-- ============================================
-- STEP 9: RLS Policies for themes
-- ============================================

-- Users can see their own themes
CREATE POLICY "Users can view own themes"
ON public.themes FOR SELECT
USING (auth.uid() = user_id);

-- Users can insert their own themes
CREATE POLICY "Users can insert own themes"
ON public.themes FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Users can update their own themes
CREATE POLICY "Users can update own themes"
ON public.themes FOR UPDATE
USING (auth.uid() = user_id);

-- Users can delete their own themes
CREATE POLICY "Users can delete own themes"
ON public.themes FOR DELETE
USING (auth.uid() = user_id);

-- Admins can see all themes
CREATE POLICY "Admins can view all themes"
ON public.themes FOR SELECT
USING (public.get_user_role() = 'admin');

GRANT ALL ON public.themes TO authenticated;

-- ============================================
-- STEP 10: RLS Policies for theme_files
-- ============================================

-- Users can manage theme files for their own themes
CREATE POLICY "Users can view own theme files"
ON public.theme_files FOR SELECT
USING (EXISTS (
  SELECT 1 FROM public.themes
  WHERE themes.id = theme_files.theme_id
  AND themes.user_id = auth.uid()
));

CREATE POLICY "Users can insert own theme files"
ON public.theme_files FOR INSERT
WITH CHECK (EXISTS (
  SELECT 1 FROM public.themes
  WHERE themes.id = theme_files.theme_id
  AND themes.user_id = auth.uid()
));

CREATE POLICY "Users can update own theme files"
ON public.theme_files FOR UPDATE
USING (EXISTS (
  SELECT 1 FROM public.themes
  WHERE themes.id = theme_files.theme_id
  AND themes.user_id = auth.uid()
));

CREATE POLICY "Users can delete own theme files"
ON public.theme_files FOR DELETE
USING (EXISTS (
  SELECT 1 FROM public.themes
  WHERE themes.id = theme_files.theme_id
  AND themes.user_id = auth.uid()
));

GRANT ALL ON public.theme_files TO authenticated;

-- ============================================
-- STEP 11: RLS Policies for addresses
-- ============================================

-- Users can see their own addresses
CREATE POLICY "Users can view own addresses"
ON public.addresses FOR SELECT
USING (auth.uid() = user_id);

-- Users can insert their own addresses
CREATE POLICY "Users can insert own addresses"
ON public.addresses FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Users can update their own addresses
CREATE POLICY "Users can update own addresses"
ON public.addresses FOR UPDATE
USING (auth.uid() = user_id);

-- Users can delete their own addresses
CREATE POLICY "Users can delete own addresses"
ON public.addresses FOR DELETE
USING (auth.uid() = user_id);

-- Admins can see all addresses
CREATE POLICY "Admins can view all addresses"
ON public.addresses FOR SELECT
USING (public.get_user_role() = 'admin');

GRANT ALL ON public.addresses TO authenticated;

-- ============================================
-- STEP 12: RLS Policies for dids
-- ============================================

-- Users can see their own DIDs
CREATE POLICY "Users can view own DIDs"
ON public.dids FOR SELECT
USING (auth.uid() = user_id);

-- Users can insert their own DIDs
CREATE POLICY "Users can insert own DIDs"
ON public.dids FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Users can update their own DIDs
CREATE POLICY "Users can update own DIDs"
ON public.dids FOR UPDATE
USING (auth.uid() = user_id);

-- Users can delete their own DIDs
CREATE POLICY "Users can delete own DIDs"
ON public.dids FOR DELETE
USING (auth.uid() = user_id);

-- Admins can see all DIDs
CREATE POLICY "Admins can view all DIDs"
ON public.dids FOR SELECT
USING (public.get_user_role() = 'admin');

-- Admins can update all DIDs
CREATE POLICY "Admins can update all DIDs"
ON public.dids FOR UPDATE
USING (public.get_user_role() = 'admin');

-- Admins can delete all DIDs
CREATE POLICY "Admins can delete all DIDs"
ON public.dids FOR DELETE
USING (public.get_user_role() = 'admin');

GRANT ALL ON public.dids TO authenticated;

-- ============================================
-- STEP 13: Grant Final Permissions
-- ============================================

-- Grant schema usage to roles
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO authenticated;

-- ============================================
-- MIGRATION COMPLETE
-- ============================================
-- Next steps:
-- 1. Create a test user in auth.users
-- 2. Assign admin role to your email
-- 3. Test authentication flow
-- ============================================
