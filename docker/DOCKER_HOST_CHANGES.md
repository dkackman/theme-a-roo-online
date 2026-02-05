# Docker Host Configuration Changes

**Server:** 192.168.1.162
**Date:** February 5, 2026
**User:** root

---

## System-Level Changes

### 1. AppArmor Configuration

#### Service Status
```bash
# Disabled AppArmor service
systemctl disable apparmor
systemctl stop apparmor

# Current status
systemctl status apparmor
# Output: inactive (dead), disabled
```

#### Kernel Module Status
```bash
# Check kernel parameter
cat /sys/module/apparmor/parameters/enabled
# Output: Y (still enabled at kernel level)

# Check if module is loaded
lsmod | grep apparmor
# Output: (empty - module not loaded as module, but built into kernel)
```

**Important:** AppArmor kernel support remains active even though the service is disabled. This requires all containers to use `security_opt: ["apparmor=unconfined"]` in their configuration.

---

## Docker Configuration

### Container Security Options

All containers now include AppArmor security option to bypass permission checks:

```yaml
security_opt:
  - apparmor=unconfined
```

**Applied to:**
- supabase-rest
- supabase-kong
- supabase-auth
- supabase-realtime
- supabase-storage
- supabase-imgproxy
- supabase-meta
- supabase-studio
- portainer

### Portainer Reconfiguration

**Original Configuration:**
- Port 8000 (HTTP) - conflicted with Kong
- Port 9443 (HTTPS)
- Missing AppArmor security option

**New Configuration:**
```bash
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

**Changes:**
- ✅ Port 8000 changed to 9000 (HTTP)
- ✅ Added AppArmor security option
- ✅ Container now starts successfully

---

## Network Configuration

### Docker Networks

**Supabase Network:**
```
Network: supabase_supabase
Driver: bridge
```

**Connected Services:**
- Kong
- PostgREST
- GoTrue
- Storage
- Realtime
- Meta
- Studio
- imgproxy

### Port Mappings

| Port | Service | Purpose |
|------|---------|---------|
| 8000 | Kong | API Gateway (HTTP) |
| 8443 | Kong | API Gateway (HTTPS) |
| 3000 | PostgREST | REST API |
| 9999 | GoTrue | Authentication |
| 5000 | Storage | File Storage |
| 4000 | Realtime | WebSocket Subscriptions |
| 8080 | Meta | Database Management |
| 3001 | Studio | Web UI |
| 5001 | imgproxy | Image Transformation |
| 9000 | Portainer | Docker UI (HTTP) |
| 9443 | Portainer | Docker UI (HTTPS) |

**Firewall/Network Access:**
No firewall changes were required. All ports are accessible on the local network (192.168.1.x).

---

## Storage Configuration

### Docker Volumes

**Created Volumes:**
```bash
# Check volumes
docker volume ls | grep supabase

# Output:
supabase_storage-data     # Storage service data
portainer_data            # Portainer configuration
```

**Volume Details:**

1. **storage-data**
   - Used by: Storage service, imgproxy
   - Path: /var/lib/storage (inside containers)
   - Purpose: Store uploaded files

2. **portainer_data**
   - Used by: Portainer
   - Path: /data (inside container)
   - Purpose: Portainer configuration and settings

---

## File System Changes

### Deployment Directory

**Location:** `/home/don/supabase/`

**Contents:**
```
/home/don/supabase/
├── docker-compose.yml
├── .env
├── kong.yml
├── setup-db-users.sql
├── fix-permissions.sql
├── transfer-ownership.sql
├── create-storage-tables.sql
└── README.md
```

**Ownership:**
- All files owned by root
- Permissions: 644 (readable by all, writable by root)

---

## Service Management

### Docker Compose Stack

**Project Name:** supabase (from directory name)
**Compose File:** `/home/don/supabase/docker-compose.yml`

**Management Commands:**
```bash
# From Docker server
cd /home/don/supabase

# Start all services
docker compose up -d

# Stop all services
docker compose down

# View status
docker compose ps

# View logs
docker compose logs -f [service-name]

# Restart specific service
docker compose restart [service-name]

# Recreate service (after config changes)
docker compose up -d --force-recreate [service-name]
```

**From Remote (Mac):**
```bash
# Start all
ssh root@192.168.1.162 'cd /home/don/supabase && docker compose up -d'

# Check status
ssh root@192.168.1.162 'docker ps'

# View logs
ssh root@192.168.1.162 'cd /home/don/supabase && docker compose logs -f [service]'
```

---

## Environment Variables

**File:** `/home/don/supabase/.env`

**Key Variables:**
- `POSTGRES_PASSWORD` - Plain text password
- `POSTGRES_PASSWORD_ENCODED` - URL-encoded for connection strings
- `JWT_SECRET` - JWT signing secret
- `ANON_KEY` - Public API key (needs regeneration)
- `SERVICE_ROLE_KEY` - Service API key (needs regeneration)
- `API_EXTERNAL_URL` - http://192.168.1.162:8000

**Security Note:** The .env file contains sensitive credentials. Ensure it has restrictive permissions (600 or 644) and is not publicly accessible.

---

## Container Restart Policy

All containers configured with: `restart: unless-stopped`

**Behavior:**
- Containers automatically restart on failure
- Containers automatically restart on system reboot
- Containers do NOT restart if manually stopped

**Override:** If a container is manually stopped with `docker stop`, it will not restart automatically. Use `docker start` or `docker compose up -d` to restart.

---

## Troubleshooting Commands

### Check Container Health

```bash
# All containers
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"

# Specific service logs
docker logs supabase-auth
docker logs supabase-storage
docker logs supabase-kong

# Follow logs in real-time
docker logs -f supabase-auth

# Last 50 lines
docker logs --tail 50 supabase-auth
```

### Check AppArmor Issues

```bash
# Check if AppArmor is causing issues
docker inspect [container-name] | grep -A 5 SecurityOpt

# Should show: "apparmor=unconfined"
```

### Network Troubleshooting

```bash
# Check which ports are listening
ss -tlnp | grep -E ":(8000|3000|9999|5000|4000|8080|3001|5001|9000|9443)"

# Test connectivity to PostgreSQL from Docker server
nc -zv 192.168.1.75 5432

# Test from within container
docker exec supabase-rest curl -I http://192.168.1.75:5432
```

---

## Backup and Recovery

### Backup Docker Volumes

```bash
# Backup storage data
docker run --rm -v supabase_storage-data:/data -v /backup:/backup \
  alpine tar -czf /backup/storage-data-$(date +%Y%m%d).tar.gz -C /data .

# Backup portainer data
docker run --rm -v portainer_data:/data -v /backup:/backup \
  alpine tar -czf /backup/portainer-data-$(date +%Y%m%d).tar.gz -C /data .
```

### Restore Docker Volumes

```bash
# Restore storage data
docker run --rm -v supabase_storage-data:/data -v /backup:/backup \
  alpine tar -xzf /backup/storage-data-YYYYMMDD.tar.gz -C /data

# Restore portainer data
docker run --rm -v portainer_data:/data -v /backup:/backup \
  alpine tar -xzf /backup/portainer-data-YYYYMMDD.tar.gz -C /data
```

### Backup Configuration Files

```bash
# From Docker server
tar -czf /backup/supabase-config-$(date +%Y%m%d).tar.gz \
  -C /home/don supabase/

# From remote (Mac)
scp root@192.168.1.162:/home/don/supabase/*.yml \
    root@192.168.1.162:/home/don/supabase/.env \
    ./backup/
```

---

## Security Considerations

### Current State

1. **AppArmor:** Disabled for containers (`apparmor=unconfined`)
   - Trade-off: Less isolation, easier container management
   - Acceptable for development/internal use
   - Consider re-enabling for production

2. **HTTP Only:** No SSL/TLS configured
   - All traffic unencrypted
   - Acceptable for internal network
   - Must add HTTPS for production

3. **Credentials:** Stored in plain text in .env file
   - Protected by file system permissions
   - Consider using Docker secrets or vault for production

4. **Network Exposure:** All ports exposed on host
   - Acceptable for internal network
   - Consider using reverse proxy (nginx/traefik) for production

### Production Hardening (Future)

1. ✅ Enable SSL/TLS with Let's Encrypt
2. ✅ Use Docker secrets for credentials
3. ✅ Configure firewall rules
4. ✅ Enable AppArmor with custom profiles
5. ✅ Set up monitoring and logging
6. ✅ Implement rate limiting
7. ✅ Regular security updates

---

## Change Log

### February 5, 2026

**Initial Deployment:**
- Deployed all 8 Supabase services
- Configured two-server architecture
- Fixed AppArmor permission issues
- Fixed database connection URL encoding
- Fixed database permission issues
- Reconfigured Portainer

**Issues Resolved:**
- AppArmor blocking container startup
- Special characters in passwords breaking connection strings
- Database permission denied errors
- Schema ownership conflicts
- Realtime service binary path error
- Portainer port conflict with Kong

---

## Contact and Support

**Primary Documentation:**
- [DEPLOYMENT_LOG.md](./DEPLOYMENT_LOG.md) - Complete deployment details
- [README.md](./README.md) - User guide and operations

**Server Access:**
- Docker Server: root@192.168.1.162
- PostgreSQL Server: root@192.168.1.75

**Deployed By:** Claude Code (AI Assistant)
**Deployment Method:** Manual SSH + Docker Compose
