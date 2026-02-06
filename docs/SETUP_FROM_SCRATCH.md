# Complete Database Setup From Scratch

This guide will help you set up the entire database from zero to fully functional.

## Prerequisites

- PostgreSQL 16+ running and accessible
- Supabase Docker stack deployed (for auth schema)
- Database connection credentials

## Setup Sequence

### 1. Create Database Users

**Run as:** postgres superuser
**File:** [docker/setup-db-users.sql](../docker/setup-db-users.sql)

```bash
# Connect as postgres and run:
psql -U postgres -d devdb -f docker/setup-db-users.sql
```

This creates:
- `anon` - Anonymous access role
- `authenticated` - Authenticated users role
- `service_role` - Service account role
- `authenticator` - Connection pooler role
- `supabase_auth_admin` - Auth service admin
- `devuser` - Development/application user

### 2. Create Schema and Tables

**Run as:** devuser
**File:** [docs/sql/00_create_schema.sql](sql/00_create_schema.sql)

```bash
# Using devuser credentials:
psql -U devuser -d devdb -f docs/sql/00_create_schema.sql
```

This creates:
- All public schema tables in correct order
- Indexes and constraints
- Required PostgreSQL extensions
- Basic permissions

### 3. Start Supabase Auth Service

The Auth service (GoTrue) will automatically create its schema:

```bash
cd docker
docker compose up -d auth
```

GoTrue creates the `auth` schema with tables:
- `auth.users`
- `auth.identities`
- `auth.sessions`
- `auth.refresh_tokens`
- And other auth-related tables

**Wait** for migrations to complete (check logs):
```bash
docker logs supabase-auth --tail 50
```

Look for: `"msg":"GoTrue migrations applied successfully"`

### 4. Grant Auth Schema Access

**Run as:** supabase_auth_admin

```bash
node -e "
const { Client } = require('pg');
const client = new Client({
  connectionString: 'postgresql://supabase_auth_admin:PASSWORD@HOST:5432/devdb'
});

(async () => {
  await client.connect();
  await client.query('GRANT USAGE ON SCHEMA auth TO devuser');
  await client.query('GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA auth TO devuser');
  console.log('✓ Granted auth schema access to devuser');
  await client.end();
})();
"
```

### 5. Set Up RLS Policies

**Run as:** devuser + supabase_auth_admin
**File:** [docs/sql/01_setup_rls.sql](sql/01_setup_rls.sql)

```bash
# First part as devuser:
psql -U devuser -d devdb -f docs/sql/01_setup_rls.sql

# Second part (trigger) as supabase_auth_admin:
psql -U supabase_auth_admin -d devdb <<EOF
DROP TRIGGER IF EXISTS sync_user_profile_trigger ON auth.users;
CREATE TRIGGER sync_user_profile_trigger
  AFTER INSERT OR UPDATE ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_user_profile();
EOF
```

This creates:
- `get_user_role()` helper function
- RLS policies for all tables
- User profile sync trigger
- Grants necessary permissions

### 6. Sync Existing Users (if any)

```bash
node -e "
const { Client } = require('pg');
const devClient = new Client({
  connectionString: 'postgresql://devuser:PASSWORD@HOST:5432/devdb'
});
const authClient = new Client({
  connectionString: 'postgresql://supabase_auth_admin:PASSWORD@HOST:5432/devdb'
});

(async () => {
  await devClient.connect();
  await devClient.query('ALTER TABLE public.user_profiles DISABLE ROW LEVEL SECURITY');
  await devClient.end();

  await authClient.connect();
  const result = await authClient.query(\`
    INSERT INTO public.user_profiles (id, email, role, created_at, last_sign_in_at, email_confirmed_at)
    SELECT id, email, COALESCE(raw_app_meta_data->>'role', 'user'), created_at, last_sign_in_at, email_confirmed_at
    FROM auth.users
    ON CONFLICT (id) DO UPDATE SET
      email = EXCLUDED.email,
      role = EXCLUDED.role,
      last_sign_in_at = EXCLUDED.last_sign_in_at,
      email_confirmed_at = EXCLUDED.email_confirmed_at,
      updated_at = now()
  \`);
  console.log(\`✓ Synced \${result.rowCount} users\`);
  await authClient.end();

  await devClient.connect();
  await devClient.query('ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY');
  console.log('✓ RLS re-enabled');
  await devClient.end();
})();
"
```

### 7. Create Test User (Optional)

```bash
node scripts/create-test-user.js
```

Or via Auth API:
```bash
curl -X POST "http://YOUR_SUPABASE_URL/auth/v1/signup" \
  -H "apikey: YOUR_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{"email": "test@example.com", "password": "testpassword123"}'
```

## Verification

```bash
# Check all tables exist
psql -U devuser -d devdb -c "\dt public.*"

# Check RLS is enabled
psql -U devuser -d devdb -c "
SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY tablename;
"

# Check policies
psql -U devuser -d devdb -c "
SELECT tablename, COUNT(*) as policy_count
FROM pg_policies
WHERE schemaname = 'public'
GROUP BY tablename
ORDER BY tablename;
"

# Check user profiles
psql -U devuser -d devdb -c "SELECT * FROM public.user_profiles;"
```

## Automated Setup Script

For a completely automated setup, use:

```bash
node scripts/setup-database.js
```

This script will:
1. Check prerequisites
2. Run all SQL files in order
3. Create users and schemas
4. Set up RLS policies
5. Verify the setup
6. Report any errors

## Rollback / Reset

To completely reset the database:

```bash
# Drop all public tables
psql -U devuser -d devdb <<EOF
DROP TABLE IF EXISTS public.addresses CASCADE;
DROP TABLE IF EXISTS public.dids CASCADE;
DROP TABLE IF EXISTS public.theme_files CASCADE;
DROP TABLE IF EXISTS public.themes CASCADE;
DROP TABLE IF EXISTS public.user_profiles CASCADE;
DROP TYPE IF EXISTS file_use_type CASCADE;
EOF

# Drop auth schema (will be recreated by GoTrue)
psql -U postgres -d devdb -c "DROP SCHEMA IF EXISTS auth CASCADE; CREATE SCHEMA auth;"

# Restart from step 2
```

## Troubleshooting

### "permission denied for schema auth"
- Run step 4 to grant auth schema access to devuser

### "relation does not exist" when creating tables
- Ensure auth.users exists (GoTrue must run first)
- Check that auth schema is accessible

### "new row violates row-level security policy"
- Temporarily disable RLS for data operations
- Ensure user has proper role in JWT token

### Trigger creation fails
- Triggers on auth.users need supabase_auth_admin privileges
- Cannot be created by devuser

## Files Reference

| File | Purpose | Run As |
|------|---------|--------|
| `docker/setup-db-users.sql` | Create all database users | postgres |
| `docs/sql/00_create_schema.sql` | Create tables and indexes | devuser |
| `docs/sql/01_setup_rls.sql` | RLS policies and functions | devuser |
| `docs/sql/ROLE_SETUP.sql` | Original RLS reference | devuser |
| `scripts/create-test-user.js` | Create test user | node |
| `scripts/setup-database.js` | Automated setup | node |

## Next Steps

After setup is complete:
1. Update `.env.local` with connection details
2. Start the Next.js frontend: `npm run dev`
3. Test authentication flow
4. Verify RLS policies work correctly
