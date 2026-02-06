#!/usr/bin/env node

/**
 * Generate Supabase API Keys (ANON_KEY and SERVICE_ROLE_KEY)
 * These are JWT tokens signed with your JWT_SECRET
 */

const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

// Read JWT_SECRET from docker/.env
const envPath = path.join(__dirname, '../docker/.env');

if (!fs.existsSync(envPath)) {
  console.error('❌ Error: docker/.env file not found');
  console.error('Please ensure docker/.env exists with JWT_SECRET set');
  process.exit(1);
}

const envContent = fs.readFileSync(envPath, 'utf8');
const jwtSecretMatch = envContent.match(/^JWT_SECRET=(.+)$/m);

if (!jwtSecretMatch) {
  console.error('❌ Error: JWT_SECRET not found in docker/.env');
  process.exit(1);
}

const JWT_SECRET = jwtSecretMatch[1].trim();

console.log('============================================');
console.log('Supabase API Key Generator');
console.log('============================================\n');
console.log('Using JWT_SECRET from docker/.env');
console.log(`Secret: ${JWT_SECRET.substring(0, 10)}...${JWT_SECRET.substring(JWT_SECRET.length - 10)}\n`);

// Base64 URL encode
function base64UrlEncode(str) {
  return Buffer.from(str)
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');
}

// Create JWT
function createJWT(payload, secret) {
  const header = {
    alg: 'HS256',
    typ: 'JWT'
  };

  const encodedHeader = base64UrlEncode(JSON.stringify(header));
  const encodedPayload = base64UrlEncode(JSON.stringify(payload));

  const signatureInput = `${encodedHeader}.${encodedPayload}`;
  const signature = crypto
    .createHmac('sha256', secret)
    .update(signatureInput)
    .digest('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');

  return `${encodedHeader}.${encodedPayload}.${signature}`;
}

// Generate tokens
const now = Math.floor(Date.now() / 1000);
const farFuture = now + (100 * 365 * 24 * 60 * 60); // 100 years from now

const anonPayload = {
  role: 'anon',
  iss: 'supabase',
  iat: now,
  exp: farFuture
};

const serviceRolePayload = {
  role: 'service_role',
  iss: 'supabase',
  iat: now,
  exp: farFuture
};

const ANON_KEY = createJWT(anonPayload, JWT_SECRET);
const SERVICE_ROLE_KEY = createJWT(serviceRolePayload, JWT_SECRET);

console.log('✅ Keys generated successfully!\n');
console.log('============================================');
console.log('ANON_KEY (public - use in frontend)');
console.log('============================================');
console.log(ANON_KEY);
console.log('');
console.log('============================================');
console.log('SERVICE_ROLE_KEY (private - server only)');
console.log('============================================');
console.log(SERVICE_ROLE_KEY);
console.log('');

// Update docker/.env file
console.log('============================================');
console.log('Updating docker/.env...');
console.log('============================================\n');

let updatedEnv = envContent;

// Update ANON_KEY
if (envContent.includes('ANON_KEY=')) {
  updatedEnv = updatedEnv.replace(/^ANON_KEY=.*/m, `ANON_KEY=${ANON_KEY}`);
  console.log('✅ Updated ANON_KEY in docker/.env');
} else {
  console.log('⚠️  ANON_KEY not found in docker/.env - please add manually');
}

// Update SERVICE_ROLE_KEY
if (updatedEnv.includes('SERVICE_ROLE_KEY=')) {
  updatedEnv = updatedEnv.replace(/^SERVICE_ROLE_KEY=.*/m, `SERVICE_ROLE_KEY=${SERVICE_ROLE_KEY}`);
  console.log('✅ Updated SERVICE_ROLE_KEY in docker/.env');
} else {
  console.log('⚠️  SERVICE_ROLE_KEY not found in docker/.env - please add manually');
}

fs.writeFileSync(envPath, updatedEnv, 'utf8');

console.log('\n============================================');
console.log('Next Steps');
console.log('============================================\n');
console.log('1. Restart Docker services to use new keys:');
console.log('   ssh root@192.168.1.162 "cd /home/don/supabase && docker compose restart"');
console.log('');
console.log('2. Update your frontend .env.local with ANON_KEY:');
console.log('   NEXT_PUBLIC_SUPABASE_URL=http://192.168.1.162:8000');
console.log(`   NEXT_PUBLIC_SUPABASE_ANON_KEY=${ANON_KEY}`);
console.log('');
console.log('3. Test the API with curl:');
console.log(`   curl -H "apikey: ${ANON_KEY}" http://192.168.1.162:8000/rest/v1/`);
console.log('');
console.log('⚠️  Keep SERVICE_ROLE_KEY secret - never expose in frontend!');
console.log('');
