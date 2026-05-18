# ClipForge — Developer Guide

Setup and run ClipForge locally. Choose **Docker** (easiest, all services in containers) or **without Docker** (native or hosted services).

Quick launch:

| Script | Use when |
|--------|----------|
| [`./start-docker.sh`](start-docker.sh) | You have Docker Desktop / Docker Engine |
| [`./start.sh`](start.sh) | Postgres (and optionally Redis) already running locally or in the cloud |

Both scripts will:

1. Create `.env` and `apps/web/.env` from `.env.example` if missing  
2. Generate `AUTH_SECRET` if still set to the placeholder  
3. Run `pnpm install`  
4. Run Prisma generate + `migrate deploy`  
5. Start `pnpm dev` (Next.js on http://localhost:3000)

Optional seed (demo user/workspace):

```bash
CLIPFORGE_SEED=1 ./start.sh
# or
CLIPFORGE_SEED=1 ./start-docker.sh
```

---

## Prerequisites (all paths)

| Tool | Version | Notes |
|------|---------|--------|
| Node.js | 20+ | `node -v` |
| pnpm | 9+ | `corepack enable && corepack prepare pnpm@9.15.0 --activate` |
| OpenSSL | any | Used to generate `AUTH_SECRET` on first run |

**Phase 2+ (optional):** FFmpeg, Python 3.11+ for workers — not required for the web scaffold.

Make scripts executable once:

```bash
chmod +x start.sh start-docker.sh scripts/dev-common.sh
```

---

## Option A — Docker (recommended for new devs)

### What Docker provides

| Service | Port | Purpose |
|---------|------|---------|
| PostgreSQL 16 | 5432 | App database |
| Redis 7 | 6379 | BullMQ job queue |
| MinIO | 9000 / 9001 | S3-compatible object storage (console on 9001) |

Defaults match [`.env.example`](.env.example):

```env
DATABASE_URL="postgresql://clipforge:clipforge@localhost:5432/clipforge?schema=public"
REDIS_URL="redis://localhost:6379"
S3_ENDPOINT="http://localhost:9000"
S3_ACCESS_KEY="clipforge"
S3_SECRET_KEY="clipforge_secret"
S3_BUCKET="clipforge-media"
```

### Steps

1. Install [Docker Desktop](https://www.docker.com/products/docker-desktop/) (macOS/Windows) or Docker Engine (Linux).

2. Run:

   ```bash
   ./start-docker.sh
   ```

3. **First time only:** create the MinIO bucket  
   - Open http://localhost:9001  
   - Login: `clipforge` / `clipforge_secret`  
   - Create bucket: `clipforge-media`

4. Open http://localhost:3000 and sign in with `demo@clipforge.local`.

### Docker commands (manual)

```bash
docker compose -f infra/docker-compose.yml up -d    # start infra
docker compose -f infra/docker-compose.yml down   # stop infra
docker compose -f infra/docker-compose.yml logs -f postgres
```

### Troubleshooting (Docker)

| Issue | Fix |
|-------|-----|
| Port 5432 already in use | Stop local Postgres or change the compose port mapping |
| `pg_isready` timeout | `docker compose -f infra/docker-compose.yml logs postgres` |
| MinIO upload errors later | Ensure bucket `clipforge-media` exists |

---

## Option B — Without Docker

You supply **PostgreSQL** yourself. **Redis** is optional for the scaffold (jobs are stored in Postgres; BullMQ enqueue may log a warning if Redis is down). **MinIO/S3** is only needed when implementing file uploads (Phase 2).

### B1 — macOS (Homebrew)

```bash
# PostgreSQL (required)
brew install postgresql@16
brew services start postgresql@16
createuser -s clipforge 2>/dev/null || true
createdb -O clipforge clipforge 2>/dev/null || createdb clipforge
psql postgres -c "ALTER USER clipforge WITH PASSWORD 'clipforge';" 2>/dev/null || true

# Redis (recommended)
brew install redis
brew services start redis
```

Use the default `DATABASE_URL` from `.env.example`, or adjust for your local user:

```env
DATABASE_URL="postgresql://clipforge:clipforge@localhost:5432/clipforge?schema=public"
# or, if using your macOS user with peer auth:
# DATABASE_URL="postgresql://YOUR_USERNAME@localhost:5432/clipforge?schema=public"
```

Then:

```bash
./start.sh
```

### B2 — Linux (apt)

```bash
sudo apt update
sudo apt install -y postgresql postgresql-contrib redis-server
sudo systemctl start postgresql redis-server

sudo -u postgres createuser clipforge 2>/dev/null || true
sudo -u postgres createdb -O clipforge clipforge 2>/dev/null || true
sudo -u postgres psql -c "ALTER USER clipforge WITH PASSWORD 'clipforge';"
```

```bash
./start.sh
```

### B3 — Hosted services (no local infra)

Point `.env` and `apps/web/.env` at managed providers:

| Service | Examples | Env var |
|---------|----------|---------|
| Postgres | [Neon](https://neon.tech), [Supabase](https://supabase.com), Railway | `DATABASE_URL` |
| Redis | [Upstash](https://upstash.com), Redis Cloud | `REDIS_URL` |
| Object storage | Cloudflare R2, AWS S3 | `S3_*` |

Example Neon:

```env
DATABASE_URL="postgresql://user:pass@ep-xxx.us-east-2.aws.neon.tech/clipforge?sslmode=require"
REDIS_URL="rediss://default:xxx@xxx.upstash.io:6379"
```

Run migrations from your machine (scripts do this automatically):

```bash
./start.sh
```

`start.sh` only checks that something is listening on the host/port from `DATABASE_URL`; it does not start Postgres for you.

### Troubleshooting (no Docker)

| Issue | Fix |
|-------|-----|
| `PostgreSQL not reachable` | Start Postgres; verify `DATABASE_URL` |
| `migrate deploy` fails | Create database: `createdb clipforge` |
| Redis warnings | Start Redis or ignore until queue workers exist |
| Auth errors | Ensure `AUTH_SECRET` is set in **both** `.env` and `apps/web/.env` |

---

## Environment files

Always keep these in sync:

```bash
cp .env.example .env
cp .env.example apps/web/.env
```

Generate a secret manually:

```bash
openssl rand -base64 32
```

Set `AUTH_SECRET` in both files. `start.sh` / `start-docker.sh` auto-fill the placeholder on first run.

Full variable reference: [`.env.example`](.env.example) and [README.md — Environment variables](README.md#environment-variables).

---

## Manual workflow (without start scripts)

```bash
cp .env.example .env && cp .env.example apps/web/.env
# edit AUTH_SECRET

# Docker infra OR local Postgres
docker compose -f infra/docker-compose.yml up -d   # optional

pnpm install
pnpm db:generate
pnpm --dir packages/database exec prisma migrate deploy
pnpm db:seed          # optional
pnpm dev
```

---

## Python workers (optional)

Not started by `start.sh`. Run in separate terminals after the web app is up:

```bash
cd services/worker-video
python3 -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8001
```

```bash
cd services/worker-ai
python3 -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8002
```

Health checks: http://localhost:8001/health · http://localhost:8002/health

---

## Useful commands

| Command | Description |
|---------|-------------|
| `pnpm dev` | Next.js dev server |
| `pnpm db:studio` | Prisma Studio |
| `pnpm db:seed` | Demo user + workspace |
| `pnpm typecheck` | TypeScript across packages |
| `pnpm --dir packages/database exec prisma migrate deploy` | Non-interactive migrations |

---

## Related docs

- [README.md](README.md) — product overview  
- [CHECKLIST.md](CHECKLIST.md) — implementation progress  
- [docs/clipforge_ai_shorts_platform_cursor_spec.md](docs/clipforge_ai_shorts_platform_cursor_spec.md) — full spec
