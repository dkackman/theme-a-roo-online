#!/usr/bin/env node
/* eslint-disable no-console */

const fs = require("fs");
const path = require("path");
const { Client } = require("pg");
const readline = require("readline");

// Configuration
const DB_HOST = "192.168.1.75";
const DB_PORT = "5432";
const DB_NAME = "devdb";
const DB_USER = "postgres"; // or your superuser name
const MIGRATION_FILE = path.join(
  __dirname,
  "../migrations/000_superuser_setup.sql"
);

console.log("============================================");
console.log("Superuser Setup for Theme-a-roo Online");
console.log("============================================\n");
console.log("This will create the required PostgreSQL roles:");
console.log("  - anon");
console.log("  - authenticated\n");
console.log(`Database: ${DB_NAME} on ${DB_HOST}:${DB_PORT}`);
console.log(`User: ${DB_USER} (superuser)\n`);

// Check if migration file exists
if (!fs.existsSync(MIGRATION_FILE)) {
  console.error(`Error: Migration file not found: ${MIGRATION_FILE}`);
  process.exit(1);
}

// Function to prompt for password
function promptPassword() {
  return new Promise((resolve) => {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });

    // Hide password input
    const stdin = process.stdin;
    const onData = (char) => {
      char = char + "";
      switch (char) {
        case "\n":
        case "\r":
        case "\u0004":
          stdin.removeListener("data", onData);
          break;
        default:
          process.stdout.write("\b \b"); // Clear the character
          break;
      }
    };

    rl.question(
      `Enter the password for PostgreSQL user '${DB_USER}': `,
      (password) => {
        rl.close();
        console.log(); // New line after password
        resolve(password);
      }
    );

    stdin.on("data", onData);
  });
}

async function runSuperuserSetup() {
  let password;

  // Check if password provided as argument
  if (process.argv[2]) {
    password = process.argv[2];
  } else {
    password = await promptPassword();
  }

  // URL encode the password
  const encodedPassword = encodeURIComponent(password);
  const connectionString = `postgresql://${DB_USER}:${encodedPassword}@${DB_HOST}:${DB_PORT}/${DB_NAME}`;

  const client = new Client({ connectionString });

  try {
    console.log("Connecting to database...\n");
    await client.connect();
    console.log("✓ Connected as superuser\n");

    // Read and execute migration
    const sql = fs.readFileSync(MIGRATION_FILE, "utf8");
    console.log("Executing superuser setup...\n");
    await client.query(sql);

    console.log("\n✓ Superuser setup complete!\n");
    console.log("Next step: Run the main migration as devuser");
    console.log("  node scripts/apply-migration.js\n");
  } catch (error) {
    console.error("\n✗ Setup failed:");
    console.error(error.message);
    if (error.code) {
      console.error(`Error code: ${error.code}`);
    }
    process.exit(1);
  } finally {
    await client.end();
  }
}

runSuperuserSetup();
