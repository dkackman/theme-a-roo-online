# Supabase Local Deployment - Complete Log

## Date: February 5, 2026

## Overview

Successfully deployed Supabase local stack to Docker server at 192.168.1.162, connecting to PostgreSQL database at 192.168.1.75:5432.

---

## Architecture

### Two-Server Setup

```
┌─────────────────────────────────────────────────────────────┐
│  Development Machine (Mac)                                  │
│  - Next.js Frontend (http://localhost:3000)                 │
│  - Connects to Supabase API Gateway                         │
└────────────────────────┬────────────────────────────────────┘
                         │
                         │ HTTP/HTTPS
                         ↓
┌─────────────────────────────────────────────────────────────┐
│  Docker Server (192.168.1.162)                              │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  Kong API Gateway :8000                              │   │
│  │  - Routes all Supabase API requests                  │   │
│  └────────┬─────────────────────────────────────────────┘   │
│           │                                                  │
│  ┌────────┴────────┬──────────┬──────────┬──────────┐       │
│  │                 │          │          │          │       │
│  ▼                 ▼          ▼          ▼          ▼       │
│  PostgREST      GoTrue    Storage   Realtime    Meta        │
│  :3000          :9999     :5000     :4000       :8080       │
│  (REST API)     (Auth)    (Files)   (WS)        (DB Mgmt)   │
│                                                              │
│  Studio :3001 (Web UI)                                       │
│  Portainer :9443 (Docker UI)                                 │
└────────────────────────┬─────────────────────────────────────┘
                         │
                         │ PostgreSQL Protocol
                         ↓
┌─────────────────────────────────────────────────────────────┐
│  PostgreSQL Server (192.168.1.75)                           │
│  - PostgreSQL 16.11 on Debian                               │
│  - Database: devdb                                           │
│  - Port: 5432                                                │
└─────────────────────────────────────────────────────────────┘
```

---

## Services Deployed

All services running on Docker server (192.168.1.162):

| Service   | Image                          | Port       | Purpose                        |
| --------- | ------------------------------ | ---------- | ------------------------------ |
| Kong      | kong:2.8.1                     | 8000, 8443 | API Gateway - main entry point |
| PostgREST | postgrest/postgrest:v12.0.2    | 3000       | Auto-generated REST API        |
| GoTrue    | supabase/gotrue:v2.143.0       | 9999       | Authentication service         |
| Storage   | supabase/storage-api:v0.43.11  | 5000       | File storage service           |
| Realtime  | supabase/realtime:v2.25.50     | 4000       | WebSocket subscriptions        |
| Meta      | supabase/postgres-meta:v0.68.0 | 8080       | Database management API        |
| Studio    | supabase/studio:latest         | 3001       | Web UI for database            |
| imgproxy  | darthsim/imgproxy:v3.8.0       | 5001       | Image transformation           |
| Portainer | portainer/portainer-ce:latest  | 9000, 9443 | Docker management UI           |

---

## Issues Encountered and Resolutions

### 1. AppArmor Permission Errors

**Problem:**

```
Error response from daemon: Could not check if docker-default AppArmor profile
was loaded: open /sys/kernel/security/apparmor/profiles: permission denied
```

**Root Cause:**

- AppArmor service was disabled but kernel module still loaded
- Docker daemon checking AppArmor profiles for container security
- Containers created without AppArmor profile failed to start

**Resolution:**
Added `security_opt: ["apparmor=unconfined"]` to all services in docker-compose.yml:

```yaml
services:
  rest:
    image: postgrest/postgrest:v12.0.2
    security_opt:
      - apparmor=unconfined
    # ... rest of config
```

Applied to all 8 Supabase services and Portainer.

**Commands Used:**

```bash
# Check AppArmor status
lsmod | grep apparmor
systemctl status apparmor
cat /sys/module/apparmor/parameters/enabled  # Returns "Y" if enabled

# AppArmor was disabled but kernel module remained active
```

---

### 2. Database Password Special Characters

**Problem:**
Services failing to connect to PostgreSQL with errors like:

- Auth: `failed to connect to host=/tmp` (Unix socket instead of TCP)
- Storage: `connect ECONNREFUSED ::1:5432` (connecting to localhost)

**Root Cause:**
Password contained special characters: `Xa&n@#iKE^VW3RfYx9@`
When used in PostgreSQL connection URIs, these characters broke URL parsing.

**Resolution:**
Created URL-encoded version of password in .env file:

```bash
POSTGRES_PASSWORD=Xa&n@#iKE^VW3RfYx9@
POSTGRES_PASSWORD_ENCODED=Xa%26n%40%23iKE%5EVW3RfYx9%40
```

Updated docker-compose.yml to use encoded password in connection strings:

```yaml
# For services using full PostgreSQL URIs
PGRST_DB_URI: postgresql://authenticator:${POSTGRES_PASSWORD_ENCODED}@192.168.1.75:5432/devdb
GOTRUE_DB_DATABASE_URL: postgresql://supabase_auth_admin:${POSTGRES_PASSWORD_ENCODED}@192.168.1.75:5432/devdb
DATABASE_URL: postgresql://supabase_storage_admin:${POSTGRES_PASSWORD_ENCODED}@192.168.1.75:5432/devdb

# For services using separate host/port/password params (no encoding needed)
DB_PASSWORD: ${POSTGRES_PASSWORD}
```

**Encoding Rules:**

- `&` → `%26`
- `@` → `%40`
- `#` → `%23`
- `^` → `%5E`

---

### 3. Database Permission Errors

**Problem:**

```
ERROR: permission denied for schema public
ERROR: must be owner of table objects
```

**Root Cause:**
Supabase service users (supabase_auth_admin, supabase_storage_admin) lacked permissions to:

- Create tables in schemas
- Modify existing tables
- Run migrations

**Resolution:**
Created and executed `fix-permissions.sql`:

```sql
-- Grant schema permissions
GRANT ALL ON SCHEMA public TO supabase_auth_admin;
GRANT ALL ON SCHEMA auth TO supabase_auth_admin;
GRANT ALL ON SCHEMA storage TO supabase_storage_admin;

-- Grant table permissions
GRANT ALL ON ALL TABLES IN SCHEMA public TO supabase_auth_admin, supabase_storage_admin;
GRANT ALL ON ALL TABLES IN SCHEMA auth TO supabase_auth_admin;
GRANT ALL ON ALL TABLES IN SCHEMA storage TO supabase_storage_admin;

-- Grant sequence permissions
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO supabase_auth_admin, supabase_storage_admin;
GRANT ALL ON ALL SEQUENCES IN SCHEMA auth TO supabase_auth_admin;
GRANT ALL ON ALL SEQUENCES IN SCHEMA storage TO supabase_storage_admin;

-- Transfer ownership
ALTER TABLE storage.buckets OWNER TO supabase_storage_admin;
ALTER TABLE storage.objects OWNER TO supabase_storage_admin;

-- Grant default privileges for future objects
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO supabase_auth_admin, supabase_storage_admin;
ALTER DEFAULT PRIVILEGES IN SCHEMA auth GRANT ALL ON TABLES TO supabase_auth_admin;
ALTER DEFAULT PRIVILEGES IN SCHEMA storage GRANT ALL ON TABLES TO supabase_storage_admin;
```

**Execution:**

```bash
scp fix-permissions.sql root@192.168.1.75:/tmp/
ssh root@192.168.1.75 'su - postgres -c "psql -d devdb -f /tmp/fix-permissions.sql"'
```

---

### 4. Schema Ownership and Migration Conflicts

**Problem:**

- GoTrue: `column "instance_id" does not exist` - Schema mismatch
- Storage: `column "public" already exists` - Migration conflict

**Root Cause:**
Initial migration created simplified auth and storage schemas that didn't match what Supabase services expected. Services' built-in migrations conflicted with existing tables.

**Resolution:**

#### Auth Schema

Dropped and let GoTrue create its own schema:

```bash
ssh root@192.168.1.75 'su - postgres -c "psql -d devdb -c \"DROP SCHEMA IF EXISTS auth CASCADE; CREATE SCHEMA auth; ALTER SCHEMA auth OWNER TO supabase_auth_admin;\""'
```

**Impact:** Lost test user and RLS policies (need to recreate)

#### Storage Schema

Created minimal base tables that Storage service migrations can build upon:

```sql
-- Minimal buckets table
CREATE TABLE storage.buckets (
  id text PRIMARY KEY,
  name text NOT NULL UNIQUE,
  owner uuid,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Minimal objects table
CREATE TABLE storage.objects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  bucket_id text REFERENCES storage.buckets(id),
  name text NOT NULL,
  owner uuid,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  last_accessed_at timestamptz DEFAULT now(),
  metadata jsonb DEFAULT '{}'::jsonb,
  UNIQUE(bucket_id, name)
);

-- Transfer ownership
ALTER TABLE storage.buckets OWNER TO supabase_storage_admin;
ALTER TABLE storage.objects OWNER TO supabase_storage_admin;
```

**Key Learning:** Let Supabase services manage their own schemas through migrations. Only create minimal base tables if required.

---

### 5. Realtime Service Binary Path Error

**Problem:**

```
bash: line 1: ./prod/rel/realtime/bin/realtime: No such file or directory
```

**Root Cause:**
Custom command in docker-compose.yml specified incorrect binary path for Realtime service.

**Resolution:**
Removed custom command and used image's default entrypoint:

```yaml
# REMOVED:
command: >
  bash -c "./prod/rel/realtime/bin/realtime eval Realtime.Release.migrate
  && ./prod/rel/realtime/bin/realtime start"

# The image has a proper default entrypoint
```

---

### 6. Portainer Port Conflict

**Problem:**
Portainer was configured to use port 8000, conflicting with Kong API Gateway.

**Resolution:**
Recreated Portainer with standard ports and AppArmor fix:

```bash
docker rm portainer
docker run -d \
  --name portainer \
  --restart=unless-stopped \
  --security-opt apparmor=unconfined \
  -p 9000:9000 \
  -p 9443:9443 \
  -v /var/run/docker.sock:/var/run/docker.sock \
  -v portainer_data:/data \
  portainer/portainer-ce:latest
```

---

## Docker Host Changes

### System-Level Changes on 192.168.1.162

#### 1. AppArmor Status

```bash
# AppArmor service disabled (but kernel module still active)
systemctl disable apparmor
systemctl stop apparmor

# Check status
systemctl status apparmor  # Shows: inactive (dead)
cat /sys/module/apparmor/parameters/enabled  # Shows: Y (still enabled at kernel level)
```

**Note:** AppArmor kernel module remains active, requiring `security_opt` in container configs.

#### 2. Docker Containers

All containers recreated with AppArmor security option:

- 8 Supabase services via docker-compose
- Portainer via docker run

#### 3. Network Configuration

All services connected to Docker bridge network `supabase_supabase`

#### 4. Port Mappings

```
8000  → Kong API Gateway (HTTP)
8443  → Kong API Gateway (HTTPS)
3000  → PostgREST
9999  → GoTrue (Auth)
5000  → Storage API
4000  → Realtime
8080  → Meta (Database Management)
3001  → Studio (Web UI)
5001  → imgproxy
9000  → Portainer (HTTP)
9443  → Portainer (HTTPS)
```

---

## PostgreSQL Server Changes

### Changes on 192.168.1.75

#### 1. Database Users Created

```sql
-- Authenticator (used by PostgREST)
CREATE USER authenticator WITH NOINHERIT CREATEROLE;
GRANT anon TO authenticator;
GRANT authenticated TO authenticator;
GRANT service_role TO authenticator;

-- Supabase Admin
CREATE USER supabase_admin WITH SUPERUSER CREATEDB CREATEROLE REPLICATION;

-- Auth Admin (for GoTrue)
CREATE USER supabase_auth_admin WITH NOINHERIT CREATEROLE CREATEDB;
GRANT supabase_admin TO supabase_auth_admin;

-- Storage Admin (for Storage service)
CREATE USER supabase_storage_admin WITH NOINHERIT CREATEROLE CREATEDB;
GRANT supabase_admin TO supabase_storage_admin;
```

#### 2. Schema Ownership

```sql
-- Auth schema owned by GoTrue
ALTER SCHEMA auth OWNER TO supabase_auth_admin;

-- Storage schema owned by Storage service
ALTER SCHEMA storage OWNER TO supabase_storage_admin;

-- Realtime schema
ALTER SCHEMA _realtime OWNER TO supabase_admin;
```

#### 3. Permissions Granted

- Full permissions on schemas: auth, public, storage
- All permissions on tables, sequences, functions
- Default privileges for future objects

#### 4. Schemas

- `auth` - Managed by GoTrue (authentication)
- `storage` - Managed by Storage service (file storage)
- `public` - Application tables
- `_realtime` - Managed by Realtime service

---

## Configuration Files

### docker-compose.yml Key Changes

1. **Added security_opt to all services:**

   ```yaml
   security_opt:
     - apparmor=unconfined
   ```

2. **Updated database connection strings with URL-encoded passwords:**

   ```yaml
   PGRST_DB_URI: postgresql://authenticator:${POSTGRES_PASSWORD_ENCODED}@192.168.1.75:5432/devdb
   GOTRUE_DB_DATABASE_URL: postgresql://supabase_auth_admin:${POSTGRES_PASSWORD_ENCODED}@192.168.1.75:5432/devdb
   DATABASE_URL: postgresql://supabase_storage_admin:${POSTGRES_PASSWORD_ENCODED}@192.168.1.75:5432/devdb
   ```

3. **Removed problematic Realtime custom command**

4. **Updated Studio image to latest** (specific tag was missing)

### .env File Structure

```bash
# PostgreSQL Connection
POSTGRES_PASSWORD=Xa&n@#iKE^VW3RfYx9@
POSTGRES_PASSWORD_ENCODED=Xa%26n%40%23iKE%5EVW3RfYx9%40

# JWT Configuration
JWT_SECRET=vgm7bGcL9uLr2urv360SJEVYHdTFXGhwQAHTr3VRSSE=
JWT_EXPIRY=3600

# API Keys (demo keys - need to regenerate with correct JWT_SECRET)
ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0
SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU

# API URLs
API_EXTERNAL_URL=http://192.168.1.162:8000
SITE_URL=http://localhost:3000
ADDITIONAL_REDIRECT_URLS=http://localhost:3000/**

# Auth Settings
DISABLE_SIGNUP=false
ENABLE_EMAIL_SIGNUP=true
ENABLE_EMAIL_AUTOCONFIRM=true
```

---

## SQL Scripts Created

### 1. setup-db-users.sql

Creates all Supabase database users and roles with proper permissions.

### 2. fix-permissions.sql

Grants permissions and transfers ownership after initial setup issues.

### 3. transfer-ownership.sql

Transfers schema and table ownership to appropriate Supabase service users.

### 4. create-storage-tables.sql

Creates minimal storage.buckets and storage.objects tables for Storage service.

---

## Access URLs

### Docker Server (192.168.1.162)

- **Supabase API Gateway:** http://192.168.1.162:8000
- **Supabase Studio:** http://192.168.1.162:3001
- **Portainer (HTTP):** http://192.168.1.162:9000
- **Portainer (HTTPS):** https://192.168.1.162:9443

### API Endpoints

- **REST API:** http://192.168.1.162:8000/rest/v1/
- **Auth API:** http://192.168.1.162:8000/auth/v1/
- **Storage API:** http://192.168.1.162:8000/storage/v1/
- **Realtime:** ws://192.168.1.162:8000/realtime/v1/

---

## Verification Commands

### Check Container Status

```bash
ssh root@192.168.1.162 'docker ps'
```

### Check Logs

```bash
ssh root@192.168.1.162 'cd /home/don/supabase && docker compose logs -f [service-name]'
```

### Test API Gateway

```bash
curl http://192.168.1.162:8000/
# Expected: {"message":"no Route matched with those values"}
```

### Test REST API

```bash
curl -H "apikey: YOUR_ANON_KEY" http://192.168.1.162:8000/rest/v1/
```

### Check Database Users

```bash
ssh root@192.168.1.75 'su - postgres -c "psql -d devdb -c \"SELECT usename, usesuper, usecreatedb FROM pg_user WHERE usename LIKE '\''supabase%'\'' OR usename = '\''authenticator'\'';\""'
```

---

## Remaining Tasks

### Critical

1. **Generate proper API keys** with current JWT_SECRET
   - Current ANON_KEY and SERVICE_ROLE_KEY are demo keys
   - Don't match the JWT_SECRET in .env

2. **Recreate RLS policies**
   - Dropped when auth schema was rebuilt
   - Needed for row-level security on public tables

3. **Create test user**
   - Previous test user lost when auth schema dropped
   - Need user for testing authentication

### Configuration

4. **Update frontend .env.local**

   ```bash
   NEXT_PUBLIC_SUPABASE_URL=http://192.168.1.162:8000
   NEXT_PUBLIC_SUPABASE_ANON_KEY=<new-anon-key>
   ```

5. **Test Next.js application** with local Supabase

### Optional

6. **Configure SMTP** for email functionality
7. **Set up SSL/HTTPS** (nginx or Caddy reverse proxy)
8. **Configure backups** (database + storage volumes)
9. **Set up monitoring** and alerts

---

## Key Learnings

1. **AppArmor and Docker:** Even when AppArmor service is disabled, kernel module can remain active. Use `security_opt: ["apparmor=unconfined"]` for containers.

2. **Special Characters in Connection Strings:** Always URL-encode passwords containing special characters when used in PostgreSQL URIs.

3. **Schema Ownership:** Let Supabase services own and manage their schemas through migrations. Avoid creating conflicting schemas manually.

4. **Service Dependencies:** Some services (Storage) require base tables to exist before running migrations. Others (Auth) handle full schema creation.

5. **Two-Server Architecture:** Separation of Docker services and PostgreSQL requires careful network configuration and permission management.

---

## Files Modified

- `/docker/docker-compose.yml` - Added security_opt, updated connection strings
- `/docker/.env` - Added POSTGRES_PASSWORD_ENCODED, updated API_EXTERNAL_URL
- `/docker/fix-permissions.sql` - Created
- `/docker/transfer-ownership.sql` - Created
- `/docker/create-storage-tables.sql` - Created
- `/docker/DEPLOYMENT_LOG.md` - Created (this file)

---

## Success Criteria Met

✅ All 8 Supabase services running
✅ Services connecting to PostgreSQL at 192.168.1.75
✅ Kong API Gateway responding
✅ Portainer accessible for Docker management
✅ Supabase Studio accessible for database management
✅ No AppArmor permission errors
✅ No database connection errors
✅ Services staying running (not exiting)

---

## Next Steps

See "Remaining Tasks" section above for critical next steps before the stack is fully functional.
