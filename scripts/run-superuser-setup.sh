#!/bin/bash

# ============================================
# Run Superuser Setup
# ============================================
# This script applies the superuser setup to your PostgreSQL database
# Usage: ./scripts/run-superuser-setup.sh [postgres_password]
# ============================================

set -e  # Exit on error

DB_HOST="192.168.1.75"
DB_PORT="5432"
DB_NAME="devdb"
DB_USER="postgres"  # or your superuser name
MIGRATION_FILE="migrations/000_superuser_setup.sql"

echo "============================================"
echo "Superuser Setup for Theme-a-roo Online"
echo "============================================"
echo ""
echo "This will create the required PostgreSQL roles:"
echo "  - anon"
echo "  - authenticated"
echo ""
echo "Database: $DB_NAME on $DB_HOST:$DB_PORT"
echo "User: $DB_USER (superuser)"
echo ""

# Check if migration file exists
if [ ! -f "$MIGRATION_FILE" ]; then
  echo "Error: Migration file not found: $MIGRATION_FILE"
  exit 1
fi

# Prompt for password if not provided
if [ -z "$1" ]; then
  echo "Enter the password for PostgreSQL user '$DB_USER':"
  read -s POSTGRES_PASSWORD
  echo ""
else
  POSTGRES_PASSWORD="$1"
fi

# Build connection string (with URL encoding for password)
CONNECTION_STRING="postgresql://$DB_USER:$POSTGRES_PASSWORD@$DB_HOST:$DB_PORT/$DB_NAME"

echo "Connecting to database..."
echo ""

# Run the migration using psql via node-postgres
node -e "
const { Client } = require('pg');
const fs = require('fs');

const client = new Client({
  connectionString: '$CONNECTION_STRING'
});

async function run() {
  try {
    await client.connect();
    console.log('✓ Connected as superuser\\n');

    const sql = fs.readFileSync('$MIGRATION_FILE', 'utf8');
    await client.query(sql);

    console.log('\\n✓ Superuser setup complete!');
    console.log('\\nNext step: Run the main migration as devuser');
    console.log('  node scripts/apply-migration.js');

  } catch (error) {
    console.error('\\n✗ Setup failed:', error.message);
    process.exit(1);
  } finally {
    await client.end();
  }
}

run();
"
