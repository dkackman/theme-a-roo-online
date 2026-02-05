#!/usr/bin/env node

// Test database connection
// URL-encoded password: Special characters must be encoded
// & -> %26, @ -> %40, # -> %23, ^ -> %5E

const { createClient } = require('@supabase/supabase-js');

// Read from environment variable or .env.local
require('dotenv').config({ path: '../.env.local' });

const DB_URL = process.env.DATABASE_URL;

if (!DB_URL) {
  console.error('Error: DATABASE_URL environment variable not set');
  console.error('Please set DATABASE_URL in your .env.local file');
  process.exit(1);
}

console.log('Testing connection to:', DB_URL.replace(/:[^:]*@/, ':****@'));

// For direct Postgres connection test
const testDirectConnection = async () => {
  try {
    // Using node-postgres (pg) if available
    const { Client } = require('pg');
    const client = new Client({ connectionString: DB_URL });

    await client.connect();
    console.log('✓ Successfully connected to PostgreSQL!');

    const result = await client.query('SELECT version()');
    console.log('✓ Database version:', result.rows[0].version.split(' ').slice(0, 2).join(' '));

    // Check if database is empty
    const tables = await client.query(`
      SELECT tablename
      FROM pg_tables
      WHERE schemaname = 'public'
    `);
    console.log(`✓ Tables in public schema: ${tables.rows.length}`);
    if (tables.rows.length > 0) {
      console.log('  Existing tables:', tables.rows.map(r => r.tablename).join(', '));
    }

    await client.end();
    return true;
  } catch (error) {
    console.error('✗ Connection failed:', error.message);
    return false;
  }
};

testDirectConnection();
