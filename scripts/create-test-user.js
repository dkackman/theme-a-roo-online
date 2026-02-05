#!/usr/bin/env node

const { Client } = require('pg');
const crypto = require('crypto');

// Read from environment variable
require('dotenv').config({ path: '../.env.local' });

const DB_URL = process.env.DATABASE_URL;

if (!DB_URL) {
  console.error('Error: DATABASE_URL environment variable not set');
  console.error('Please set DATABASE_URL in your .env.local file');
  process.exit(1);
}

// Test user configuration
const TEST_USER = {
  email: 'test@example.com',
  password: 'testpassword123', // In production, this should be properly hashed
  role: 'admin' // or 'user' or 'creator'
};

async function createTestUser() {
  const client = new Client({ connectionString: DB_URL });

  try {
    console.log('Connecting to database...');
    await client.connect();
    console.log('✓ Connected\n');

    // Hash the password (simple bcrypt-style hash for demo)
    // In production, use proper bcrypt or similar
    const passwordHash = crypto
      .createHash('sha256')
      .update(TEST_USER.password)
      .digest('hex');

    console.log('Creating test user...');
    console.log(`Email: ${TEST_USER.email}`);
    console.log(`Role: ${TEST_USER.role}\n`);

    // Insert into auth.users
    const result = await client.query(`
      INSERT INTO auth.users (
        email,
        encrypted_password,
        email_confirmed_at,
        raw_app_meta_data,
        raw_user_meta_data,
        created_at,
        updated_at
      ) VALUES (
        $1,
        $2,
        NOW(),
        jsonb_build_object('role', $3::text),
        '{}'::jsonb,
        NOW(),
        NOW()
      )
      RETURNING id, email, raw_app_meta_data->>'role' as role
    `, [TEST_USER.email, passwordHash, TEST_USER.role]);

    console.log('✓ Test user created!');
    console.log(`  ID: ${result.rows[0].id}`);
    console.log(`  Email: ${result.rows[0].email}`);
    console.log(`  Role: ${result.rows[0].role}\n`);

    // Check that user_profiles was auto-synced via trigger
    const profileCheck = await client.query(`
      SELECT id, email, role
      FROM public.user_profiles
      WHERE email = $1
    `, [TEST_USER.email]);

    if (profileCheck.rows.length > 0) {
      console.log('✓ User profile auto-synced via trigger');
      console.log(`  Profile ID: ${profileCheck.rows[0].id}`);
      console.log(`  Profile Role: ${profileCheck.rows[0].role}\n`);
    } else {
      console.warn('⚠ User profile not found - trigger may not have fired\n');
    }

    console.log('Test user credentials:');
    console.log(`  Email: ${TEST_USER.email}`);
    console.log(`  Password: ${TEST_USER.password}`);
    console.log('\nNOTE: This is a development user with a simple password hash.');
    console.log('For production, integrate with Supabase Auth or implement proper password hashing.\n');

  } catch (error) {
    if (error.code === '23505') {
      console.error('\n✗ User already exists with that email');
      console.log('\nTo reset, delete the existing user first:');
      console.log(`  DELETE FROM auth.users WHERE email = '${TEST_USER.email}';`);
    } else {
      console.error('\n✗ Failed to create test user:');
      console.error(error.message);
    }
    process.exit(1);
  } finally {
    await client.end();
  }
}

createTestUser();
