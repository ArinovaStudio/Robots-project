# Deployment Guide — Robots Project

## Infrastructure Overview

| Node | IP | Role |
|------|----|------|
| Node 1 | E2E Networks India | PostgreSQL + pgvector database |
| Node 2 | E2E Networks India | Next.js app, Nginx reverse proxy, SSL |

**Domain:** `robots.mohsinbhat.in`  
**App port:** `3002` (internal, not exposed publicly)  
**DB port:** `5450` (internal, Node 2 → Node 1 only)

---

## Tech Stack

- **Next.js** — App Router, custom Node.js server (`server.ts`) with Socket.IO
- **PostgreSQL 16 + pgvector** — via `pgvector/pgvector:pg16` Docker image
- **Prisma ORM v7** — with `PrismaPg` adapter
- **NextAuth v4** — credentials + OAuth (Google, Facebook)
- **Docker** — multi-stage build, deployed via Docker Compose
- **Nginx** — reverse proxy with WebSocket support for Socket.IO
- **Let's Encrypt** — SSL via certbot webroot challenge

---

## Node 1 — Database Server

### Setup

```bash
mkdir -p /opt/robots-db
cd /opt/robots-db
# place docker-compose.yml (see below)
docker compose up -d
```

### docker-compose.yml

```yaml
services:
  robots-postgres:
    image: pgvector/pgvector:pg16
    container_name: robots-postgres
    restart: unless-stopped
    environment:
      POSTGRES_DB: robots_db
      POSTGRES_USER: <db-user>
      POSTGRES_PASSWORD: <db-password>
    ports:
      - "5450:5432"
    volumes:
      - robots_postgres_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U <db-user> -d robots_db"]
      interval: 30s
      timeout: 10s
      retries: 3
    deploy:
      resources:
        limits:
          memory: 512M

volumes:
  robots_postgres_data:
```

### Running Migrations

From your local machine with `DATABASE_URL` pointing at Node 1:

```bash
DATABASE_URL="postgresql://<user>:<password>@<node1-ip>:5450/robots_db?schema=public" \
  npx prisma migrate deploy
```

---

## Node 2 — Application Server

### Directory layout

```
/opt/cybershield/
  secrets/
    robots-project.env      # all env vars (never commit this)
  nginx/
    nginx.conf              # nginx config
    certs/
      robots-mohsinbhat-fullchain.pem
      robots-mohsinbhat-privkey.pem
```

### Environment variables (robots-project.env)

```env
DATABASE_URL=postgresql://<user>:<password>@<node1-ip>:5450/robots_db?schema=public
NEXTAUTH_SECRET=<random-32-byte-base64>
NEXTAUTH_URL=https://robots.mohsinbhat.in
CRON_SECRET=<random-hex>
PORT=3002
NODE_ENV=production

# Fill in when ready:
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
FACEBOOK_CLIENT_ID=
FACEBOOK_CLIENT_SECRET=
NEXT_PUBLIC_RAZORPAY_KEY_ID=
RAZORPAY_KEY_SECRET=
EMAIL_SERVER=
EMAIL_FROM=
```

Generate secrets:
```bash
# NEXTAUTH_SECRET
openssl rand -base64 32

# CRON_SECRET
openssl rand -hex 32
```

### Docker Compose (addition to existing cybershield stack)

```yaml
robots-project:
  image: ghcr.io/<your-org>/robots-project:latest
  container_name: robots-project
  restart: unless-stopped
  env_file:
    - /opt/cybershield/secrets/robots-project.env
  networks:
    - cybershield
  deploy:
    resources:
      limits:
        memory: 1G

networks:
  cybershield:
    external: true
```

---

## Docker Image — Build & Push

### Dockerfile structure

Two-stage build:

1. **builder** (`node:20-alpine`) — installs all deps, runs `prisma generate`, `next build`, and compiles `server.ts` via `tsc`
2. **runner** (`node:20-alpine`) — installs prod-only deps, copies `.next`, `server-dist`, `prisma`, `.prisma`

```bash
# Build locally
docker build -t robots-project:latest .

# Tag and push to your registry
docker tag robots-project:latest ghcr.io/<your-org>/robots-project:latest
docker push ghcr.io/<your-org>/robots-project:latest
```

Key Dockerfile flags:
- `npm ci --legacy-peer-deps` — required due to peer dependency conflicts in the lockfile
- `EXPOSE 3002` — app listens on this port via `PORT` env var
- `CMD ["node", "server-dist/server.js"]` — runs the custom server, not `next start`

### Known build gotchas

| Issue | Fix |
|-------|-----|
| `npm ci` fails with missing peer deps | Use `--legacy-peer-deps` in both builder and runner stages |
| Font files not found on Linux | All `.otf` font files must be lowercase — Linux Docker is case-sensitive |
| Razorpay crashes at build time | Uses lazy singleton via JS Proxy; route has `export const dynamic = "force-dynamic"` |
| `PromiseWithResolvers` TypeScript error | `tsconfig.server.json` must include `"lib": ["ES2020", "ESNext"]` and `"skipLibCheck": true` |

---

## Nginx Configuration

Located at `/opt/cybershield/nginx/nginx.conf`.

Key blocks for this app:

```nginx
upstream robots_app {
    server robots-project:3002;
}

server {
    listen 443 ssl http2;
    server_name robots.mohsinbhat.in;

    ssl_certificate     /etc/nginx/certs/robots-mohsinbhat-fullchain.pem;
    ssl_certificate_key /etc/nginx/certs/robots-mohsinbhat-privkey.pem;

    # Socket.IO — must upgrade to WebSocket
    location /socket.io/ {
        proxy_pass http://robots_app;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    # Static assets — long cache
    location /_next/static/ {
        proxy_pass http://robots_app;
        add_header Cache-Control "public, max-age=31536000, immutable";
    }

    # Everything else
    location / {
        proxy_pass http://robots_app;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}

server {
    listen 80;
    server_name robots.mohsinbhat.in;
    return 301 https://$host$request_uri;
}
```

---

## SSL Certificate

Issued via Let's Encrypt certbot (webroot challenge):

```bash
# On Node 2, with nginx running
certbot certonly --webroot \
  -w /var/www/certbot \
  -d robots.mohsinbhat.in \
  --email your@email.com \
  --agree-tos --non-interactive

# Copy certs to nginx certs dir
cp /etc/letsencrypt/live/robots.mohsinbhat.in/fullchain.pem \
   /opt/cybershield/nginx/certs/robots-mohsinbhat-fullchain.pem

cp /etc/letsencrypt/live/robots.mohsinbhat.in/privkey.pem \
   /opt/cybershield/nginx/certs/robots-mohsinbhat-privkey.pem

# Reload nginx
docker exec <nginx-container> nginx -s reload
```

Auto-renewal: add a cron or systemd timer to run `certbot renew` and re-copy certs + reload nginx.

---

## Data Migration (Local → Production)

To move data from local dev DB to production:

```bash
# Dump specific tables from local
pg_dump postgresql://<local-user>:<local-pass>@localhost:5432/robots_db \
  --no-owner --no-acl --data-only \
  -t '"User"' -t '"CompanyProfile"' -t '"Post"' \
  -t '"Connection"' -t '"Follow"' -t '"PostReaction"' \
  -t '"Comment"' -t '"SavedPost"' \
  -f /tmp/data-export.sql

# Restore to production (FK bypass for circular refs)
psql "postgresql://<user>:<password>@<node1-ip>:5450/robots_db" << 'SQL'
SET session_replication_role = replica;
\i /tmp/data-export.sql
SET session_replication_role = DEFAULT;
SQL
```

Or use `psql` directly with inline SQL for targeted inserts (avoids dump/restore entirely for small datasets).

---

## Seed Accounts

Five featured accounts exist in production for demo/testing. Passwords follow the pattern `Word3@Symbol#Year` (bcrypt rounds=12). Ask the project maintainer for credentials — do not store them in this file.

| Name | Email | Role | Company |
|------|-------|------|---------|
| Rohaan Kapoor | rohaan@robots.in | ADMIN | RobotsHQ Platform |
| Aarav Singhania | aarav@robots.in | USER | NexGen Semiconductors |
| Preethi Venkatesh | preethi@robots.in | USER | EcoHarvest AgriTech |
| Sameer Khatri | sameer@robots.in | USER | Khatri Steel & Alloys |
| Lakshmi Balasubramanian | lakshmi@robots.in | USER | LB Enterprise Consult |

---

## CI/CD — Jenkins

A `Jenkinsfile` exists at the repo root. The Jenkins job should be configured as:

- **Source:** this repo, branch `main`
- **Script path:** `Jenkinsfile`
- **Trigger:** on push to `main`

The pipeline builds the Docker image and deploys to Node 2 via SSH.

---

## Local Development

```bash
# Install deps
npm install --legacy-peer-deps

# Start local DB (postgres + pgvector)
docker compose up -d

# Apply migrations
npx prisma migrate dev

# Start dev server
npm run dev
```

App runs at `http://localhost:3002` (or whatever `PORT` is set to).

Local `.env` file (never commit):
```env
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/robots_db
NEXTAUTH_SECRET=<any-random-string-for-dev>
NEXTAUTH_URL=http://localhost:3002
PORT=3002
```

---

## Useful Commands

```bash
# Check app container logs
docker logs robots-project -f

# Check DB container
docker logs robots-postgres -f

# Connect to production DB
psql "postgresql://<user>:<password>@<node1-ip>:5450/robots_db"

# Restart app after image update
docker compose pull robots-project && docker compose up -d robots-project

# Run prisma studio against prod (tunnel first)
DATABASE_URL="..." npx prisma studio
```
