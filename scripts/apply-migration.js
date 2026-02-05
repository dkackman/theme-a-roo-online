#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { Client } = require('pg');

// Read from environment variable
require('dotenv').config({ path: '../.env.local' });

const DB_URL = process.env.DATABASE_URL;

if (!DB_URL) {
  console.error('Error: DATABASE_URL environment variable not set');
  console.error('Please set DATABASE_URL in your .env.local file');
  process.exit(1);
}

async function applyMigration() {
  const client = new Client({ connectionString: DB_URL });

  try {
    console.log('Connecting to database...');
    await client.connect();
    console.log('✓ Connected\n');

    // Read migration file
    const migrationPath = path.join(__dirname, '../migrations/001_initial_setup.sql');
    console.log(`Reading migration: ${migrationPath}`);
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
    console.log(`✓ Migration file loaded (${migrationSQL.length} characters)\n`);

    // Apply migration
    console.log('Applying migration...');
    console.log('This may take a moment as we create schemas, tables, and policies...\n');

    await client.query(migrationSQL);

    console.log('✓ Migration applied successfully!\n');

    // Verify tables were created
    console.log('Verifying setup...');
    const tables = await client.query(`
      SELECT schemaname, tablename
      FROM pg_tables
      WHERE schemaname IN ('public', 'auth')
      ORDER BY schemaname, tablename
    `);

    console.log('\nCreated tables:');
    tables.rows.forEach(row => {
      console.log(`  ${row.schemaname}.${row.tablename}`);
    });

    // Check roles
    const roles = await client.query(`
      SELECT rolname FROM pg_roles
      WHERE rolname IN ('anon', 'authenticated')
      ORDER BY rolname
    `);

    console.log('\nCreated roles:');
    roles.rows.forEach(row => {
      console.log(`  ${row.rolname}`);
    });

    console.log('\n✓ Database setup complete!');
    console.log('\nNext steps:');
    console.log('1. Create a test user (see scripts/create-test-user.js)');
    console.log('2. Configure environment variables');
    console.log('3. Test the Next.js app connection');

  } catch (error) {
    console.error('\n✗ Migration failed:');
    console.error(error.message);
    if (error.position) {
      console.error(`\nError at position ${error.position} in SQL`);
    }
    process.exit(1);
  } finally {
    await client.end();
  }
}

applyMigration();
