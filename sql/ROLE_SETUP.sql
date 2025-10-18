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

