#!/usr/bin/env node

/**
 * Automated Database Setup Script
 *
 * Sets up the complete Theme-a-roo database from scratch:
 * 1. Creates schema and tables
 * 2. Sets up RLS policies
 * 3. Creates sync trigger
 * 4. Syncs existing users
 */

const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

require('dotenv').config({ path: path.join(__dirname, '../.env.local') });

// Configuration from environment
const DEVUSER_URL = process.env.DATABASE_URL;
const POSTGRES_PASSWORD = process.env.POSTGRES_PASSWORD || 'Xa&n@#iKE^VW3RfYx9@';
const DB_HOST = process.env.DB_HOST || '192.168.1.75';
const DB_NAME = process.env.DB_NAME || 'devdb';

const POSTGRES_PASSWORD_ENCODED = encodeURIComponent(POSTGRES_PASSWORD);
const AUTH_ADMIN_URL = `postgresql://supabase_auth_admin:${POSTGRES_PASSWORD_ENCODED}@${DB_HOST}:5432/${DB_NAME}`;

// Color output helpers
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
};

function log(message, color = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

function success(message) {
  log(`✓ ${message}`, colors.green);
}

function error(message) {
  log(`✗ ${message}`, colors.red);
}

function info(message) {
  log(message, colors.blue);
}

function step(number, total, message) {
  log(`\n[${number}/${total}] ${message}`, colors.bright);
}

async function checkPrerequisites() {
  info('\nChecking prerequisites...');

  if (!DEVUSER_URL) {
    error('DATABASE_URL not set in .env.local');
    return false;
  }

  success('Environment variables configured');
  return true;
}

async function createSchema(client) {
  step(1, 6, 'Creating schema and tables');

  const schemaPath = path.join(__dirname, '../docs/sql/00_create_schema.sql');
  const sql = fs.readFileSync(schemaPath, 'utf8');

  await client.query(sql);
  success('Schema and tables created');
}

async function setupRLS(client) {
  step(2, 6, 'Setting up RLS policies');

  const rlsPath = path.join(__dirname, '../docs/sql/01_setup_rls.sql');
  const sql = fs.readFileSync(rlsPath, 'utf8');

  await client.query(sql);
  success('RLS policies created');
}

async function grantAuthAccess(authClient) {
  step(3, 6, 'Granting auth schema access');

  await authClient.query('GRANT USAGE ON SCHEMA auth TO devuser');
  await authClient.query('GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA auth TO devuser');

  success('Auth schema access granted');
}

async function createSyncTrigger(authClient) {
  step(4, 6, 'Creating user profile sync trigger');

  await authClient.query('DROP TRIGGER IF EXISTS sync_user_profile_trigger ON auth.users');
  await authClient.query(`
    CREATE TRIGGER sync_user_profile_trigger
      AFTER INSERT OR UPDATE ON auth.users
      FOR EACH ROW
      EXECUTE FUNCTION public.sync_user_profile()
  `);

  success('Sync trigger created');
}

async function syncExistingUsers(devClient, authClient) {
  step(5, 6, 'Syncing existing users');

  // Temporarily disable RLS
  await devClient.query('ALTER TABLE public.user_profiles DISABLE ROW LEVEL SECURITY');

  // Sync users
  await authClient.query('SET search_path TO auth, public');
  const result = await authClient.query(`
    INSERT INTO public.user_profiles (id, email, role, created_at, last_sign_in_at, email_confirmed_at)
    SELECT
      id,
      email,
      COALESCE(raw_app_meta_data->>'role', 'user'),
      created_at,
      last_sign_in_at,
      email_confirmed_at
    FROM auth.users
    ON CONFLICT (id) DO UPDATE SET
      email = EXCLUDED.email,
      role = EXCLUDED.role,
      last_sign_in_at = EXCLUDED.last_sign_in_at,
      email_confirmed_at = EXCLUDED.email_confirmed_at,
      updated_at = now()
    RETURNING email, role
  `);

  // Re-enable RLS
  await devClient.query('ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY');

  if (result.rowCount > 0) {
    success(`Synced ${result.rowCount} user(s)`);
    result.rows.forEach(user => {
      info(`  - ${user.email} (${user.role})`);
    });
  } else {
    info('No existing users to sync');
  }
}

async function verifySetup(client) {
  step(6, 6, 'Verifying setup');

  // Check tables
  const tables = await client.query(`
    SELECT tablename, rowsecurity
    FROM pg_tables
    WHERE schemaname = 'public'
      AND tablename IN ('user_profiles', 'themes', 'theme_files', 'addresses', 'dids')
    ORDER BY tablename
  `);

  info('\nTables created:');
  tables.rows.forEach(t => {
    const status = t.rowsecurity ? '✓ RLS enabled' : '✗ RLS disabled';
    info(`  ${t.tablename}: ${status}`);
  });

  // Check policies
  const policies = await client.query(`
    SELECT tablename, COUNT(*) as policy_count
    FROM pg_policies
    WHERE schemaname = 'public'
    GROUP BY tablename
    ORDER BY tablename
  `);

  info('\nPolicies created:');
  let totalPolicies = 0;
  policies.rows.forEach(p => {
    totalPolicies += parseInt(p.policy_count);
    info(`  ${p.tablename}: ${p.policy_count} policies`);
  });

  success(`\nTotal: ${tables.rowCount} tables, ${totalPolicies} policies`);
}

async function main() {
  log('\n╔════════════════════════════════════════════╗', colors.bright);
  log('║  Theme-a-roo Database Setup From Scratch  ║', colors.bright);
  log('╚════════════════════════════════════════════╝', colors.bright);

  // Check prerequisites
  if (!await checkPrerequisites()) {
    process.exit(1);
  }

  const devClient = new Client({ connectionString: DEVUSER_URL });
  const authClient = new Client({ connectionString: AUTH_ADMIN_URL });

  try {
    // Connect
    await devClient.connect();
    await authClient.connect();
    success('\nConnected to database');

    // Run setup steps
    await createSchema(devClient);
    await setupRLS(devClient);
    await grantAuthAccess(authClient);
    await createSyncTrigger(authClient);
    await syncExistingUsers(devClient, authClient);
    await verifySetup(devClient);

    log('\n╔════════════════════════════════════════════╗', colors.green);
    log('║      Database setup completed!  ✓          ║', colors.green);
    log('╚════════════════════════════════════════════╝', colors.green);

    info('\nNext steps:');
    info('1. Start your Next.js app: npm run dev');
    info('2. Create a test user: node scripts/create-test-user.js');
    info('3. Test the app at http://localhost:3000\n');

  } catch (err) {
    error(`\nSetup failed: ${err.message}`);
    console.error(err);
    process.exit(1);
  } finally {
    await devClient.end().catch(() => {});
    await authClient.end().catch(() => {});
  }
}

main();
