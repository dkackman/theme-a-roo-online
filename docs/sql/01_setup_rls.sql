-- ============================================
-- RLS POLICIES SETUP
-- ============================================
-- Run this as devuser after tables are created
-- ============================================

-- Step 1: Create helper function to get user role from JWT
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

-- Step 2: Enable RLS on all tables
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.themes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.theme_files ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.addresses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dids ENABLE ROW LEVEL SECURITY;

-- ============================================
-- USER_PROFILES POLICIES
-- ============================================

DROP POLICY IF EXISTS "Admins can see all user profiles" ON public.user_profiles;
DROP POLICY IF EXISTS "Users can see own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Trigger can insert user profiles" ON public.user_profiles;

CREATE POLICY "Admins can see all user profiles"
  ON public.user_profiles FOR SELECT
  USING (public.get_user_role() = 'admin');

CREATE POLICY "Users can see own profile"
  ON public.user_profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Trigger can insert user profiles"
  ON public.user_profiles FOR INSERT
  WITH CHECK (true);

GRANT SELECT ON public.user_profiles TO authenticated;

-- ============================================
-- THEMES POLICIES
-- ============================================

DROP POLICY IF EXISTS "Admins can see all themes" ON public.themes;
DROP POLICY IF EXISTS "Users can see their own themes" ON public.themes;
DROP POLICY IF EXISTS "Authenticated users can insert themes" ON public.themes;
DROP POLICY IF EXISTS "Admins can update all themes" ON public.themes;
DROP POLICY IF EXISTS "Users can update their own themes" ON public.themes;
DROP POLICY IF EXISTS "Admins can delete all themes" ON public.themes;
DROP POLICY IF EXISTS "Users can delete their own themes" ON public.themes;

CREATE POLICY "Admins can see all themes"
  ON public.themes FOR SELECT
  USING (public.get_user_role() = 'admin');

CREATE POLICY "Users can see their own themes"
  ON public.themes FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Authenticated users can insert themes"
  ON public.themes FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can update all themes"
  ON public.themes FOR UPDATE
  USING (public.get_user_role() = 'admin');

CREATE POLICY "Users can update their own themes"
  ON public.themes FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can delete all themes"
  ON public.themes FOR DELETE
  USING (public.get_user_role() = 'admin');

CREATE POLICY "Users can delete their own themes"
  ON public.themes FOR DELETE
  USING (auth.uid() = user_id);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.themes TO authenticated;

-- ============================================
-- THEME_FILES POLICIES
-- ============================================

DROP POLICY IF EXISTS "Users can see files for their themes" ON public.theme_files;
DROP POLICY IF EXISTS "Users can insert files for their themes" ON public.theme_files;
DROP POLICY IF EXISTS "Users can update files for their themes" ON public.theme_files;
DROP POLICY IF EXISTS "Users can delete files for their themes" ON public.theme_files;

CREATE POLICY "Users can see files for their themes"
  ON public.theme_files FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.themes
      WHERE themes.id = theme_files.theme_id
      AND (themes.user_id = auth.uid() OR public.get_user_role() = 'admin')
    )
  );

CREATE POLICY "Users can insert files for their themes"
  ON public.theme_files FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.themes
      WHERE themes.id = theme_files.theme_id
      AND themes.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update files for their themes"
  ON public.theme_files FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.themes
      WHERE themes.id = theme_files.theme_id
      AND (themes.user_id = auth.uid() OR public.get_user_role() = 'admin')
    )
  );

CREATE POLICY "Users can delete files for their themes"
  ON public.theme_files FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.themes
      WHERE themes.id = theme_files.theme_id
      AND (themes.user_id = auth.uid() OR public.get_user_role() = 'admin')
    )
  );

GRANT SELECT, INSERT, UPDATE, DELETE ON public.theme_files TO authenticated;

-- ============================================
-- ADDRESSES POLICIES
-- ============================================

DROP POLICY IF EXISTS "Admins can see all addresses" ON public.addresses;
DROP POLICY IF EXISTS "Users can see their own addresses" ON public.addresses;
DROP POLICY IF EXISTS "Authenticated users can insert addresses" ON public.addresses;
DROP POLICY IF EXISTS "Admins can update all addresses" ON public.addresses;
DROP POLICY IF EXISTS "Users can update their own addresses" ON public.addresses;
DROP POLICY IF EXISTS "Admins can delete all addresses" ON public.addresses;
DROP POLICY IF EXISTS "Users can delete their own addresses" ON public.addresses;

CREATE POLICY "Admins can see all addresses"
  ON public.addresses FOR SELECT
  USING (public.get_user_role() = 'admin');

CREATE POLICY "Users can see their own addresses"
  ON public.addresses FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Authenticated users can insert addresses"
  ON public.addresses FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can update all addresses"
  ON public.addresses FOR UPDATE
  USING (public.get_user_role() = 'admin');

CREATE POLICY "Users can update their own addresses"
  ON public.addresses FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can delete all addresses"
  ON public.addresses FOR DELETE
  USING (public.get_user_role() = 'admin');

CREATE POLICY "Users can delete their own addresses"
  ON public.addresses FOR DELETE
  USING (auth.uid() = user_id);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.addresses TO authenticated;

-- ============================================
-- DIDS POLICIES
-- ============================================

DROP POLICY IF EXISTS "Admins can see all DIDs" ON public.dids;
DROP POLICY IF EXISTS "Users can see their own DIDs" ON public.dids;
DROP POLICY IF EXISTS "Authenticated users can insert DIDs" ON public.dids;
DROP POLICY IF EXISTS "Admins can update all DIDs" ON public.dids;
DROP POLICY IF EXISTS "Users can update their own DIDs" ON public.dids;
DROP POLICY IF EXISTS "Admins can delete all DIDs" ON public.dids;
DROP POLICY IF EXISTS "Users can delete their own DIDs" ON public.dids;

CREATE POLICY "Admins can see all DIDs"
  ON public.dids FOR SELECT
  USING (public.get_user_role() = 'admin');

CREATE POLICY "Users can see their own DIDs"
  ON public.dids FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Authenticated users can insert DIDs"
  ON public.dids FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can update all DIDs"
  ON public.dids FOR UPDATE
  USING (public.get_user_role() = 'admin');

CREATE POLICY "Users can update their own DIDs"
  ON public.dids FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can delete all DIDs"
  ON public.dids FOR DELETE
  USING (public.get_user_role() = 'admin');

CREATE POLICY "Users can delete their own DIDs"
  ON public.dids FOR DELETE
  USING (auth.uid() = user_id);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.dids TO authenticated;

-- ============================================
-- USER PROFILE SYNC FUNCTION
-- ============================================

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
    role = EXCLUDED.role,
    last_sign_in_at = EXCLUDED.last_sign_in_at,
    email_confirmed_at = EXCLUDED.email_confirmed_at,
    updated_at = now();
  RETURN NEW;
END;
$$;

-- NOTE: The trigger itself must be created as supabase_auth_admin:
-- DROP TRIGGER IF EXISTS sync_user_profile_trigger ON auth.users;
-- CREATE TRIGGER sync_user_profile_trigger
--   AFTER INSERT OR UPDATE ON auth.users
--   FOR EACH ROW
--   EXECUTE FUNCTION public.sync_user_profile();

-- ============================================
-- VERIFICATION
-- ============================================

SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN ('user_profiles', 'themes', 'theme_files', 'addresses', 'dids')
ORDER BY tablename;

SELECT tablename, COUNT(*) as policy_count
FROM pg_policies
WHERE schemaname = 'public'
GROUP BY tablename
ORDER BY tablename;
