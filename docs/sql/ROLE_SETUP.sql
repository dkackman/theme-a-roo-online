-- ============================================
-- SUPABASE ROLE SETUP (JWT-Based)
-- Run these commands in your Supabase SQL Editor
-- ============================================

-- Step 1: Create helper function to get user role from JWT
-- This function extracts the role from the JWT token's app_metadata
-- Note: We create this in the public schema to avoid auth schema permission issues
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

-- Step 2: Grant execute permission on the function
GRANT EXECUTE ON FUNCTION public.get_user_role() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_role() TO anon;

-- Step 3: Create a table to cache user profiles for admin viewing
-- (Views on auth.users have limitations, so we use a table with a trigger)
CREATE TABLE IF NOT EXISTS public.user_profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text,
  role text,
  created_at timestamptz,
  last_sign_in_at timestamptz,
  email_confirmed_at timestamptz,
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

-- Policy: Admins can see all profiles
CREATE POLICY "Admins can see all user profiles"
ON public.user_profiles FOR SELECT
USING (public.get_user_role() = 'admin');

-- Policy: Users can see their own profile
CREATE POLICY "Users can see own profile"
ON public.user_profiles FOR SELECT
USING (auth.uid() = id);

-- Grant permissions
GRANT SELECT ON public.user_profiles TO authenticated;

-- Create function to sync auth.users to user_profiles
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
    NEW.raw_app_meta_data->>'role',
    NEW.created_at,
    NEW.last_sign_in_at,
    NEW.email_confirmed_at
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    role = EXCLUDED.role,
    last_sign_in_at = EXCLUDED.last_sign_in_at,
    email_confirmed_at = EXCLUDED.email_confirmed_at,
    updated_at = now();
  RETURN NEW;
END;
$$;

-- Create trigger to sync on insert/update
DROP TRIGGER IF EXISTS sync_user_profile_trigger ON auth.users;
CREATE TRIGGER sync_user_profile_trigger
  AFTER INSERT OR UPDATE ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_user_profile();

-- Manually sync existing users
INSERT INTO public.user_profiles (id, email, role, created_at, last_sign_in_at, email_confirmed_at)
SELECT
  id,
  email,
  raw_app_meta_data->>'role',
  created_at,
  last_sign_in_at,
  email_confirmed_at
FROM auth.users
ON CONFLICT (id) DO UPDATE SET
  email = EXCLUDED.email,
  role = EXCLUDED.role,
  last_sign_in_at = EXCLUDED.last_sign_in_at,
  email_confirmed_at = EXCLUDED.email_confirmed_at,
  updated_at = now();

-- ============================================
-- RLS POLICIES FOR DIDS TABLE
-- ============================================

-- First, drop existing policies if they exist
DROP POLICY IF EXISTS "Users can see their own DIDs" ON dids;
DROP POLICY IF EXISTS "Users can insert their own DIDs" ON dids;
DROP POLICY IF EXISTS "Users can update their own DIDs" ON dids;
DROP POLICY IF EXISTS "Users can delete their own DIDs" ON dids;

-- SELECT Policies
-- Admins can see all DIDs
CREATE POLICY "Admins can see all DIDs"
ON dids FOR SELECT
USING (public.get_user_role() = 'admin');

-- Creators and regular users can see their own DIDs
CREATE POLICY "Users can see their own DIDs"
ON dids FOR SELECT
USING (auth.uid() = user_id);

-- INSERT Policies
-- All authenticated users can insert DIDs
CREATE POLICY "Authenticated users can insert DIDs"
ON dids FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- UPDATE Policies
-- Admins can update all DIDs
CREATE POLICY "Admins can update all DIDs"
ON dids FOR UPDATE
USING (public.get_user_role() = 'admin');

-- Users can update their own DIDs
CREATE POLICY "Users can update their own DIDs"
ON dids FOR UPDATE
USING (auth.uid() = user_id);

-- DELETE Policies
-- Admins can delete all DIDs
CREATE POLICY "Admins can delete all DIDs"
ON dids FOR DELETE
USING (public.get_user_role() = 'admin');

-- Users can delete their own DIDs
CREATE POLICY "Users can delete their own DIDs"
ON dids FOR DELETE
USING (auth.uid() = user_id);

-- ============================================
-- ASSIGN ROLES TO USERS
-- ============================================

-- Make yourself an admin (replace with your email)
-- IMPORTANT: Replace 'your-email@example.com' with your actual email!
UPDATE auth.users
SET raw_app_meta_data =
  raw_app_meta_data || '{"role": "admin"}'::jsonb
WHERE email = 'dkackman@gmail.com';

-- Example: Make another user a creator
-- UPDATE auth.users
-- SET raw_app_meta_data =
--   raw_app_meta_data || '{"role": "creator"}'::jsonb
-- WHERE email = 'creator@example.com';

-- All other users default to 'user' role (no update needed)

-- ============================================
-- VERIFY SETUP
-- ============================================

-- Check users and their roles
SELECT
  id,
  email,
  raw_app_meta_data->>'role' as role,
  created_at
FROM auth.users
ORDER BY created_at DESC;

-- ============================================
-- NOTES
-- ============================================
--
-- After running these commands:
-- 1. Users will need to log out and log back in for role changes to take effect
-- 2. The role is stored in the JWT token (app_metadata)
-- 3. RLS policies automatically enforce role-based permissions
-- 4. To change a user's role, just update their raw_app_meta_data
--
-- Role Hierarchy:
-- - admin: Can see/edit/delete ALL DIDs
-- - creator: Can see/edit/delete their own DIDs (same as user for now, but you can add special permissions)
-- - user: Can see/edit/delete only their own DIDs

