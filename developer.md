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
5. Start `pnpm dev` — **Electron desktop** + Next.js (port 4000+) + BullMQ worker

`pnpm dev` runs web, worker, and `@clipforge/desktop` together. The Electron window loads the local Next.js server; you do not need to open a browser. For browser-only: `pnpm dev:browser`.

**Electron install:** `pnpm install` at the repo root runs Electron’s postinstall (downloads the native binary, ~150MB once). Verify with:

```bash
pnpm --dir apps/desktop exec electron --version
```

**Startup order:** `scripts/dev-turbo.sh` (used by `pnpm dev`) writes `.clipforge-dev-port` before Turbo starts, so the desktop shell does not race the web server. `./start.sh` does the same via `prepare_web_dev_env`.

Run the job worker in a **second terminal** only if not using root `pnpm dev` (which starts all three):

```bash
pnpm dev:worker
```

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

**Phase 2 (source import):** `ffmpeg` / `ffprobe` on PATH, `yt-dlp` for YouTube downloads, MinIO (or S3) for stored source files, Redis for BullMQ. The Node worker (`apps/worker`) runs `source.import` jobs.

```bash
# macOS (Homebrew)
brew install ffmpeg yt-dlp

# Verify
ffmpeg -version
yt-dlp --version
```

Set in `.env` (see [`.env.example`](.env.example)): `YOUTUBE_API_KEY`, `YTDLP_PATH`, `MAX_SOURCE_BYTES`, `IMPORT_TEMP_DIR`, and existing `S3_*` / `REDIS_URL`.

**Phase 3 (transcription):** Python 3.11+ and `services/worker-ai` (Faster-Whisper). After import, `apps/worker` auto-chains `media.extract_audio` → `media.transcribe` when `AUTO_TRANSCRIBE=true`.

```bash
# Python env (once)
cd services/worker-ai
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt

# Run worker-ai (separate terminal, port 8002)
uvicorn app.main:app --reload --port 8002
```

First transcription run downloads the Whisper model (`WHISPER_MODEL`, default `base`). Set `AUTO_TRANSCRIBE=false` to skip auto-transcription when worker-ai is not running.

**Phase 4 (clip candidates):** Requires transcript (`status: ready`). Set `OPENAI_API_KEY` for LLM scoring via `worker-ai` (`POST /v1/score-clips`). Without a key, candidates are ranked by heuristics only.

- `AUTO_GENERATE_CLIPS=true` — enqueue `ai.score_clips` after transcription completes
- `AUTO_GENERATE_CLIPS=false` (default) — use **Generate clips** on the project page

```bash
# worker-ai must be running (same terminal as Phase 3)
uvicorn app.main:app --reload --port 8002
```

**Phase 5 (rendering):** Approve a clip → **Render** on the project page. Output is 1080×1920 MP4 with burned captions and hook text. Preview and download at `/clips/{renderedId}/preview`.

**Phase 6 (publishing):** Connect YouTube at `/accounts` (uses `AUTH_GOOGLE_ID` / `AUTH_GOOGLE_SECRET` + `YOUTUBE_OAUTH_REDIRECT_URI`). Publish from render preview or download MP4 for TikTok/Instagram manual upload.

**Phase 7 (discovery):** `/discover` uses `YOUTUBE_API_KEY` for search and most-popular feeds. **Analyze** imports a video into your workspace (rights confirmation still deferred).

Make scripts executable once:

```bash
chmod +x start.sh start-docker.sh scripts/dev-common.sh
```

---

## Option A — Docker (recommended for new devs)

### What Docker provides

Docker uses **alternate host ports** so local Homebrew Postgres and Redis can keep using **5432** and **6379**:

| Service | Host port (Docker) | Purpose |
|---------|----------------------|---------|
| PostgreSQL 16 | **5433** | App database (container 5432) |
| Redis 7 | **6380** | BullMQ job queue (container 6379) |
| MinIO | **9002** / **9003** | S3 API on 9002, console on 9003 (local MinIO may use 9000/9001) |

`./start-docker.sh` loads [`infra/docker.env`](infra/docker.env):

```env
DATABASE_URL="postgresql://clipforge:clipforge@localhost:5433/clipforge?schema=public"
REDIS_URL="redis://localhost:6380"
S3_ENDPOINT="http://localhost:9002"
S3_PUBLIC_URL="http://localhost:9002"
```

`./start.sh` (no Docker) uses [`.env.example`](.env.example) defaults on **5432** / **6379** and MinIO **9000** / **9001**:

```env
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
   - Open http://localhost:9003 (Docker console; `./start.sh` uses http://localhost:9001)  
   - Login: `clipforge` / `clipforge_secret`  
   - Create bucket: `clipforge-media`

4. Use the ClipForge desktop window (or open http://localhost:4000+ from the log if using `dev:browser`). Sign in with `demo@clipforge.local`.

### Docker commands (manual)

```bash
docker compose -f infra/docker-compose.yml up -d    # start infra
docker compose -f infra/docker-compose.yml down   # stop infra
docker compose -f infra/docker-compose.yml logs -f postgres
```

### Troubleshooting (Docker)

| Issue | Fix |
|-------|-----|
| Port 5433, 6380, 9002, or 9003 in use | Another process holds Docker’s mapped ports; change `infra/docker-compose.yml` or free the port |
| `pg_isready` timeout | `docker compose -f infra/docker-compose.yml logs postgres` |
| MinIO upload errors later | Ensure bucket `clipforge-media` exists |

---

## Option B — Without Docker

You supply **PostgreSQL** yourself. **Redis** is optional for the scaffold (jobs are stored in Postgres; BullMQ enqueue may log a warning if Redis is down). **MinIO/S3** is only needed when implementing file uploads (Phase 2).

### B1 — macOS (Homebrew)

```bash
# PostgreSQL (required)
brew install postgresql@16
brew services start postgresql@16   # or let ./start.sh start it automatically
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
| `P1010: User was denied access` | Local Postgres is up but the `clipforge` role/db are missing. Run the Homebrew block above, or re-run `./start.sh` (it auto-provisions on localhost). Or set `DATABASE_URL` to your macOS user: `postgresql://YOUR_USERNAME@localhost:5432/clipforge?schema=public` |
| `migrate deploy` fails | Create database: `createdb clipforge` |
| Redis warnings | Start Redis or ignore until queue workers exist |
| Auth errors | Ensure `AUTH_SECRET` is set in **both** `.env` and `apps/web/.env` |
| `EADDRINUSE` on web port | Re-run `./start.sh` or `pnpm dev` — scan starts at `CLIPFORGE_WEB_PORT` (default 4000; port 3000 is never used) |
| Electron timeout / no window | Run `pnpm install` at repo root; ensure `pnpm dev` (not only `dev:web`). Check `.clipforge-dev-port` exists and `pnpm --dir apps/desktop exec electron --version` works |

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

## Phase 8 — Polish (OSS)

ClipForge is free and open source. There is no Stripe or billing integration.

After pulling Phase 8, apply the migration:

```bash
pnpm db:generate
pnpm --dir packages/database exec prisma migrate deploy
```

Optional env limits (see `.env.example`):

| Variable | Purpose |
|----------|---------|
| `MAX_SOURCES_PER_WORKSPACE` | Cap imports per workspace |
| `MAX_RENDERS_PER_DAY` | Cap renders per workspace per day |
| `BATCH_RENDER_CONCURRENCY` | Parallel renders in `batch.render` (default 2) |
| `ADMIN_USER_IDS` | Comma-separated user IDs for `/api/admin/*` |

Features: brand kits, caption presets (ASS), batch render, content calendar (YouTube schedule), analytics dashboard, projects list.

Full spec: [docs/phase-8-polish.md](docs/phase-8-polish.md)

---

## Related docs

- [README.md](README.md) — product overview  
- [CHECKLIST.md](CHECKLIST.md) — implementation progress  
- [docs/clipforge_ai_shorts_platform_cursor_spec.md](docs/clipforge_ai_shorts_platform_cursor_spec.md) — full spec
