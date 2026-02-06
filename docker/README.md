# Supabase Docker Deployment Guide

## ✅ Current Status: DEPLOYED

**Last Updated:** February 5, 2026

All Supabase services are running on Docker server 192.168.1.162, connected to PostgreSQL at 192.168.1.75:5432.

**📋 For complete deployment details, see [DEPLOYMENT_LOG.md](./DEPLOYMENT_LOG.md)**

## Quick Reference

### Access URLs

- **Supabase API Gateway:** <http://192.168.1.162:8000>
- **Supabase Studio (Web UI):** <http://192.168.1.162:3001>
- **Portainer (Docker UI):** <https://192.168.1.162:9443>

### Current Configuration

- **Docker Server:** 192.168.1.162
- **PostgreSQL Server:** 192.168.1.75:5432
- **Database:** devdb
- **JWT Secret:** vgm7bGcL9uLr2urv360SJEVYHdTFXGhwQAHTr3VRSSE=

### All Services Running

✅ Kong (API Gateway) - Port 8000
✅ PostgREST (REST API) - Port 3000
✅ GoTrue (Auth) - Port 9999
✅ Storage - Port 5000
✅ Realtime - Port 4000
✅ Meta - Port 8080
✅ Studio - Port 3001
✅ imgproxy - Port 5001
✅ Portainer - Ports 9000, 9443

### Manage Services

```bash
# View all containers
ssh root@192.168.1.162 'docker ps'

# View logs
ssh root@192.168.1.162 'cd /home/don/supabase && docker compose logs -f [service]'

# Restart services
ssh root@192.168.1.162 'cd /home/don/supabase && docker compose restart'

# Stop all
ssh root@192.168.1.162 'cd /home/don/supabase && docker compose down'

# Start all
ssh root@192.168.1.162 'cd /home/don/supabase && docker compose up -d'
```

### ⚠️ Next Steps Required

1. Generate proper API keys with current JWT_SECRET
2. Recreate RLS policies (dropped during schema rebuild)
3. Create test user in new auth schema
4. Update frontend .env.local with Supabase URL and keys
5. Test Next.js application

---

## Overview

This setup runs Supabase services on your Docker server (192.168.1.162) and connects to your existing PostgreSQL database (192.168.1.75).

## Architecture

```
┌─────────────────┐
│  Your Mac       │
│  (Frontend)     │  http://localhost:3000
│  Next.js App    │
└────────┬────────┘
         │
         │ HTTP Requests
         ↓
┌─────────────────────────────────────────┐
│  Docker Server (192.168.1.75)           │
│                                         │
│  ┌─────────────────────────────────┐   │
│  │  Kong API Gateway :8000         │   │
│  │  (Routes all API requests)      │   │
│  └────────┬────────────────────────┘   │
│           │                             │
│  ┌────────┴────────┬─────────┬──────┐  │
│  │                 │         │      │  │
│  ▼                 ▼         ▼      ▼  │
│  PostgREST      GoTrue   Storage  ...  │
│  :3000          :9999    :5000         │
│  (REST API)     (Auth)   (Files)       │
│                                         │
└────────┬────────────────────────────────┘
         │
         │ PostgreSQL Protocol
         ↓
┌─────────────────┐
│  PostgreSQL     │
│  :5432          │
│  (devdb)        │
└─────────────────┘
```

## Services

- **Kong (Port 8000)**: API Gateway - main entry point
- **PostgREST (Port 3000)**: Auto-generated REST API for database
- **GoTrue (Port 9999)**: Authentication service
- **Storage (Port 5000)**: File storage service
- **Realtime (Port 4000)**: WebSocket for real-time subscriptions
- **Meta (Port 8080)**: Database management API
- **Studio (Port 3001)**: Web UI for database management
- **imgproxy (Port 5001)**: Image transformation

## Prerequisites

- Docker and Docker Compose installed on 192.168.1.75
- PostgreSQL 16.11 running on 192.168.1.75:5432
- Database `devdb` with schema already set up (from Phase 1)

## Step-by-Step Deployment

### 1. Setup Database Users

First, create the necessary database users for Supabase services:

```bash
# SSH into your Docker server
ssh user@192.168.1.75

# Copy the SQL file to the server (or paste its contents)
# Then run as postgres superuser
psql -U postgres -d devdb -f setup-db-users.sql
```

Or run directly in pgAdmin connected to the database.

### 2. Configure Environment

```bash
# Copy environment template
cp .env.example .env

# Edit .env with your values
nano .env
```

**Important values to set:**

- `POSTGRES_PASSWORD`: Your actual postgres password
- `JWT_SECRET`: Generate with `openssl rand -base64 32`
- `API_EXTERNAL_URL`: `http://192.168.1.75:8000`
- `SITE_URL`: `http://localhost:3000` (or your frontend URL)

**For production**, generate proper API keys:

```bash
# Generate JWT tokens with your JWT_SECRET
# See: https://supabase.com/docs/guides/self-hosting/docker#generate-api-keys
```

### 3. Deploy to Docker Server

**Option A: Deploy files manually**

```bash
# Copy docker directory to your server
scp -r docker/* user@192.168.1.75:~/supabase/

# SSH into server
ssh user@192.168.1.75
cd ~/supabase

# Start services
docker-compose up -d
```

**Option B: Use Docker context (from your Mac)**

```bash
# Create remote Docker context
docker context create remote --docker "host=ssh://user@192.168.1.75"

# Use remote context
docker context use remote

# Deploy from your Mac
cd docker/
docker-compose up -d

# Switch back to local
docker context use default
```

### 4. Verify Deployment

```bash
# Check all containers are running
docker ps

# Check logs
docker-compose logs -f kong
docker-compose logs -f rest
docker-compose logs -f auth

# Test API Gateway
curl http://192.168.1.75:8000/rest/v1/

# Should return PostgREST info
```

### 5. Update Frontend Configuration

On your Mac, update `.env.local`:

```bash
# .env.local
NEXT_PUBLIC_SUPABASE_URL=http://192.168.1.75:8000
NEXT_PUBLIC_SUPABASE_ANON_KEY=<ANON_KEY-from-docker/.env>
```

### 6. Test the Frontend

```bash
# On your Mac
npm run dev

# Open http://localhost:3000
# Try logging in with test@example.com / testpassword123
```

## Accessing Services

From your Mac (or any machine on the network):

- **API Gateway**: http://192.168.1.75:8000
- **REST API**: http://192.168.1.75:8000/rest/v1/
- **Auth API**: http://192.168.1.75:8000/auth/v1/
- **Storage API**: http://192.168.1.75:8000/storage/v1/
- **Studio (UI)**: http://192.168.1.75:3001
- **Realtime**: ws://192.168.1.75:8000/realtime/v1/

## Managing Services

```bash
# SSH into Docker server
ssh user@192.168.1.75
cd ~/supabase

# View logs
docker-compose logs -f

# Restart a service
docker-compose restart auth

# Stop all services
docker-compose down

# Start all services
docker-compose up -d

# Rebuild after config changes
docker-compose up -d --force-recreate
```

## Troubleshooting

### Can't connect to PostgreSQL from containers

If containers can't reach the PostgreSQL server, you may need to:

1. **Update PostgreSQL's `pg_hba.conf`** to allow connections from Docker network:

   ```
   host    devdb    authenticator    172.0.0.0/8    md5
   host    devdb    supabase_*       172.0.0.0/8    md5
   ```

2. **Update PostgreSQL's `postgresql.conf`**:

   ```
   listen_addresses = '*'
   ```

3. **Restart PostgreSQL**:

   ```bash
   sudo systemctl restart postgresql
   ```

4. **Or use Docker host networking** - update docker-compose.yml:
   ```yaml
   network_mode: host
   ```

### Port conflicts

If ports are already in use, edit `docker-compose.yml` to use different ports:

```yaml
ports:
  - "8001:8000" # Use 8001 instead of 8000
```

### Authentication issues

1. Check JWT_SECRET matches in docker/.env and frontend .env.local
2. Verify ANON_KEY is correctly copied to frontend
3. Check auth service logs: `docker-compose logs auth`

### Database connection errors

1. Verify database users exist: `SELECT usename FROM pg_user;`
2. Check passwords match in docker/.env
3. Test connection from Docker server: `psql -h localhost -U authenticator -d devdb`

## Database Migrations

When you update the database schema:

```bash
# Run migration on PostgreSQL
psql -U devuser -d devdb -f migrations/002_your_migration.sql

# Restart PostgREST to pick up schema changes
docker-compose restart rest
```

## Backup and Restore

```bash
# Backup database
pg_dump -U postgres devdb > backup.sql

# Backup storage files
docker-compose exec storage tar -czf /backup/storage.tar.gz /var/lib/storage

# Restore database
psql -U postgres devdb < backup.sql
```

## Production Considerations

Before going to production:

1. **Generate proper JWT keys** using your own JWT_SECRET
2. **Enable HTTPS** (use nginx reverse proxy or Caddy)
3. **Set strong passwords** for all database users
4. **Configure SMTP** for email confirmation
5. **Set up backups** (database + storage volumes)
6. **Enable rate limiting** in Kong
7. **Monitor logs** and set up alerts
8. **Use Docker volumes** for persistent storage (already configured)

## Updating Services

```bash
# Pull latest images
docker-compose pull

# Recreate containers
docker-compose up -d --force-recreate
```

## Cleaning Up

```bash
# Stop and remove containers
docker-compose down

# Remove volumes (WARNING: deletes data)
docker-compose down -v

# Remove images
docker-compose down --rmi all
```

## Next Steps

Once deployed:

1. Test authentication with test user
2. Test database operations (create theme, etc.)
3. Set up edge functions (Phase 2)
4. Configure storage buckets
5. Test file uploads

## Support

- Supabase Docs: https://supabase.com/docs
- Self-hosting Guide: https://supabase.com/docs/guides/self-hosting/docker
- PostgREST Docs: https://postgrest.org/
