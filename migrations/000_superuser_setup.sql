-- ============================================
-- SUPERUSER SETUP - Run this as postgres superuser
-- ============================================
-- This script must be run by a PostgreSQL superuser (typically 'postgres')
-- before running the main migration (001_initial_setup.sql)
--
-- To run this script:
-- psql -U postgres -d devdb -f migrations/000_superuser_setup.sql
-- ============================================

-- ============================================
-- STEP 1: Create Roles
-- ============================================
-- Create 'anon' role for anonymous/unauthenticated access
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'anon') THEN
    CREATE ROLE anon NOLOGIN;
    RAISE NOTICE 'Created role: anon';
  ELSE
    RAISE NOTICE 'Role already exists: anon';
  END IF;
END
$$;

-- Create 'authenticated' role for authenticated users
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'authenticated') THEN
    CREATE ROLE authenticated NOLOGIN;
    RAISE NOTICE 'Created role: authenticated';
  ELSE
    RAISE NOTICE 'Role already exists: authenticated';
  END IF;
END
$$;

-- ============================================
-- STEP 2: Grant Role Membership to devuser
-- ============================================
-- Allow devuser to use these roles for RLS policies
GRANT anon TO devuser;
GRANT authenticated TO devuser;

-- ============================================
-- STEP 3: Verify Setup
-- ============================================
-- List all roles to confirm creation
\echo ''
\echo 'Created roles:'
SELECT rolname, rolcanlogin
FROM pg_roles
WHERE rolname IN ('anon', 'authenticated', 'devuser')
ORDER BY rolname;

-- ============================================
-- SUPERUSER SETUP COMPLETE
-- ============================================
\echo ''
\echo '✓ Superuser setup complete!'
\echo 'Next step: Run migrations/001_initial_setup.sql as devuser'
