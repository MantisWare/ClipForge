# ClipForge

**Turn long-form videos into platform-ready Shorts, Reels, and TikToks** with AI-assisted clipping, captions, and publishing.

ClipForge turns long-form sources into short-form clips with AI-assisted editing and publishing. It is **free and open source** — no Stripe or paid tiers. Rights confirmation and discovery guardrails are planned for a later phase.

## Architecture

```mermaid
flowchart TB
  subgraph web [apps/web]
    UI[Next.js UI]
    API[API Routes]
    Auth[Auth.js]
  end
  subgraph data [Data Layer]
    PG[(PostgreSQL)]
    Redis[(Redis)]
    S3[MinIO / S3]
  end
  subgraph workers [Workers]
    NW[apps/worker Node BullMQ]
    WA[worker-ai FastAPI]
  end
  UI --> API
  API --> Auth
  API --> PG
  API --> Redis
  API --> S3
  Redis --> NW
  NW --> WA
```

| Layer | Stack |
|-------|--------|
| Frontend + API | Next.js 15, React 19, TypeScript, Tailwind |
| Auth | Auth.js v5 (Prisma adapter) |
| Database | PostgreSQL + Prisma |
| Queue | Redis + BullMQ (`apps/worker`) |
| Storage | S3-compatible (MinIO locally) |
| Media pipeline | Node worker: import, FFmpeg render, overlays, publish |
| AI services | Python `worker-ai`: transcribe, score clips, affiliate discovery |

## Monorepo layout

```txt
ClipForge/
├── apps/web/              # Next.js app (UI + /app/api)
├── apps/worker/           # BullMQ consumer: import, render, publish, overlays
├── packages/
│   ├── config/            # Shared TS configs
│   ├── database/          # Prisma schema & client
│   └── shared/            # Types, Zod schemas, constants
├── services/
│   ├── worker-video/      # Legacy FastAPI stubs (not on active queue path)
│   └── worker-ai/         # Transcription, clip scoring, product discovery LLM
├── infra/docker-compose.yml
├── developer.md           # Docker & local dev setup
├── start.sh               # Start without Docker
├── start-docker.sh        # Start with Docker infra
├── docs/                  # Product spec
├── CHECKLIST.md           # Implementation progress
└── README.md
```

## Prerequisites

- **Node.js** 20+
- **pnpm** 9+
- **PostgreSQL** (required) — via Docker, Homebrew, or hosted (Neon, Supabase, etc.)
- **Redis** (required for background jobs) — BullMQ queue for `apps/worker`
- **Docker** (optional) — easiest way to run Postgres, Redis, and MinIO together
- **FFmpeg** (for workers, Phase 2+)
- **Python** 3.11+ (for workers, optional in scaffold)

## Quick start

**Full setup guide (Docker and without):** [developer.md](developer.md)

### One-command start

```bash
chmod +x start.sh start-docker.sh

# With Docker (Postgres + Redis + MinIO)
./start-docker.sh

# Without Docker (local or hosted Postgres must already be running)
./start.sh
```

Open http://localhost:3000 — sign in with `demo@clipforge.local`.

Optional demo seed: `CLIPFORGE_SEED=1 ./start.sh`

### Manual setup

```bash
cp .env.example .env
cp .env.example apps/web/.env
# Set AUTH_SECRET (openssl rand -base64 32)

docker compose -f infra/docker-compose.yml up -d   # skip if not using Docker

pnpm install
pnpm db:generate
pnpm --dir packages/database exec prisma migrate deploy
pnpm dev
```

### 5. Python workers (optional)

```bash
# Terminal A
cd services/worker-video && pip install -r requirements.txt
uvicorn app.main:app --reload --port 8001

# Terminal B
cd services/worker-ai && pip install -r requirements.txt
uvicorn app.main:app --reload --port 8002
```

Health: http://localhost:8001/health · http://localhost:8002/health

## Environment variables

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | PostgreSQL connection string |
| `REDIS_URL` | Redis for BullMQ |
| `AUTH_SECRET` | Auth.js session secret |
| `AUTH_URL` | App URL (e.g. `http://localhost:3000`) |
| `AUTH_GOOGLE_ID` / `AUTH_GOOGLE_SECRET` | Optional Google OAuth |
| `S3_*` | Object storage (MinIO in dev) |
| `OPENAI_API_KEY` | LLM clip scoring (Phase 4) + Amazon product discovery (Phase 10) |
| `OPENAI_BASE_URL` | Optional ChatGPT-compatible API base URL |
| `AMAZON_PAAPI_ACCESS_KEY` | Optional PA-API product search (Phase 10) |
| `AMAZON_PAAPI_SECRET_KEY` | Optional PA-API secret |
| `EBAY_CLIENT_ID` / `EBAY_CLIENT_SECRET` | Optional eBay Browse API (Phase 11) |
| `YOUTUBE_API_KEY` | Discovery & metadata (Phase 7) |
| `WORKER_VIDEO_URL` / `WORKER_AI_URL` | Worker base URLs |

See [.env.example](.env.example) for defaults.

## Scripts

| Command | Description |
|---------|-------------|
| `pnpm dev` | Start Next.js dev server |
| `pnpm db:generate` | Generate Prisma client |
| `pnpm db:migrate` | Apply migrations |
| `pnpm db:studio` | Open Prisma Studio |
| `pnpm db:seed` | Seed demo workspace |
| `pnpm typecheck` | TypeScript check (all packages) |

## API overview (selected)

- `POST /api/sources/validate` | `import` — URL validation + queued import
- `POST /api/clips/generate-candidates` — AI clip scoring
- `POST /api/clips/[id]/render` — Vertical render (+ optional overlays)
- `POST /api/clips/[id]/affiliate/discover` — Multi-network affiliate product discovery
- `POST /api/publish/youtube` — YouTube Shorts upload (connected account)
- `POST /api/scheduled-publish` — Schedule publish with affiliate description
- `GET /api/discover/youtube/*` — YouTube discovery feeds

Full spec: [docs/clipforge_ai_shorts_platform_cursor_spec.md](docs/clipforge_ai_shorts_platform_cursor_spec.md)

## Progress

Track phases in **[CHECKLIST.md](CHECKLIST.md)** — through Phase 11 (monetization overlays + multi-network affiliate). See [docs/phase-9-monetization-overlays.md](docs/phase-9-monetization-overlays.md), [docs/phase-10-ai-amazon-affiliate.md](docs/phase-10-ai-amazon-affiliate.md), [docs/phase-11-multi-affiliate.md](docs/phase-11-multi-affiliate.md).

## Compliance (deferred)

MVP focuses on the import → clip → publish pipeline. Per spec §3, rights confirmation and discovery warnings can be added before public launch or multi-tenant use.

## License

Private / unlicensed — MANTISWARE ClipForge.
