# ClipForge Implementation Checklist

Track progress by phase. See [docs/clipforge_ai_shorts_platform_cursor_spec.md](docs/clipforge_ai_shorts_platform_cursor_spec.md) for full requirements.

---

## Phase 0 — Scaffold

### Monorepo & tooling
- [x] pnpm workspace + Turborepo
- [x] Root `.env.example`, `.gitignore`
- [x] `packages/config` TypeScript bases
- [x] `packages/shared` Zod schemas, job constants, design tokens
- [x] `packages/database` Prisma schema + initial migration
- [x] `infra/docker-compose.yml` (Postgres, Redis, MinIO)

### Web app (`apps/web`)
- [x] Next.js 15 App Router + Tailwind dark theme
- [x] Auth.js (credentials demo + optional Google)
- [x] Dashboard shell + sidebar navigation
- [x] Placeholder pages (Discover, Projects, Clips, Calendar, etc.)
- [x] Hero import card (direct URL import; rights modal deferred)
- [x] Processing queue + recent projects (client polling)
- [x] API route stubs with Zod validation + workspace scoping
- [x] BullMQ enqueue client + S3 storage adapter stubs

### Workers
- [x] `services/worker-video` FastAPI + health + job stubs
- [x] `services/worker-ai` FastAPI + health + job stubs

### Documentation
- [x] `README.md` setup & architecture
- [x] `CHECKLIST.md` (this file)
- [x] `developer.md` — Docker and non-Docker dev setup
- [x] `start.sh` / `start-docker.sh` — install deps, migrate, run dev server

> **Auto-updated:** Added `developer.md` and start scripts on 2026-05-18. Rights gate deferred 2026-05-18 — direct import for MVP.

---

## Phase 1 — Foundation

### Auth & workspace
- [ ] Production-ready auth providers (email magic link / Google)
- [ ] Workspace switcher in dashboard header
- [ ] Workspace CRUD UI
- [ ] Workspace membership & roles enforcement

### Dashboard
- [ ] Real-time job status (SSE or polling improvements)
- [ ] Connected account status summary on dashboard
- [ ] Scheduled posts panel (stub data → real)

### Queue
- [ ] Node or Python BullMQ worker consumer
- [ ] Job status transitions (`running` → `completed` / `failed`)
- [ ] Retry UI for failed jobs

### Database
- [ ] Seed script integrated into dev onboarding docs
- [ ] Migration workflow in CI

---

## Phase 2 — Source import

### API & workers
- [ ] YouTube metadata (Data API v3)
- [ ] Direct MP4/MOV URL handling
- [ ] Multipart file upload + MinIO storage
- [ ] Vimeo URL parser (nice-to-have)
- [ ] `worker-video` `import_video` implementation

### UI
- [ ] Source detail page with video player (signed URL)
- [ ] Import status progression on source card
- [ ] New Project multi-step wizard (source step)

### Compliance (deferred — pre-launch)
- [ ] Rights confirmation modal before third-party import
- [ ] Block import without rights confirmation
- [ ] Warn on risky source patterns

---

## Phase 3 — Transcription

- [ ] Audio extraction worker (`media.extract_audio`)
- [ ] Faster-Whisper transcription (`media.transcribe`)
- [ ] `TranscriptSegment` + `TranscriptWord` persistence
- [ ] Transcript viewer synced to playback
- [ ] Language detection

---

## Phase 4 — AI clip candidates

- [ ] Sliding window generator (30 / 45 / 60s)
- [ ] Heuristic scoring pass
- [ ] LLM scoring with strict JSON schema
- [ ] Generate 5–10 candidates per source
- [ ] Clip review UI (scores, reasons, approve/reject)
- [ ] Editable hook, title, caption, hashtags

---

## Phase 5 — Rendering

- [ ] FFmpeg vertical 1080×1920 preset
- [ ] Smart crop modes (center, face — phased)
- [ ] Burned-in captions + safe areas
- [ ] Hook overlay (2–3s)
- [ ] Render preview page
- [ ] Download rendered MP4

---

## Phase 6 — Publishing

- [ ] Connected accounts OAuth (YouTube)
- [ ] YouTube Shorts upload (`videos.insert`)
- [ ] TikTok connector + `PRIVATE_ONLY` / `REQUIRES_AUDIT` flags
- [ ] Instagram Graph API container flow
- [ ] Export fallback for unaudited apps
- [ ] Publish job retry + status UI

---

## Phase 7 — Discovery

- [ ] YouTube most-popular API integration
- [ ] Keyword search + filters (region, category)
- [ ] Discovery cards with rights badges
- [ ] Analyze / watchlist actions
- [ ] Rights warning on every third-party card

---

## Phase 8 — Polish

- [ ] Brand kits
- [ ] Caption style presets
- [ ] Content calendar
- [ ] Batch clip generation
- [ ] Analytics basics
- [ ] Admin tools & plan quotas
- [ ] Stripe billing (optional)

---

## MVP acceptance (from spec §22)

- [ ] User can sign in
- [ ] User can create a workspace
- [ ] User can paste URL or upload video
- [ ] User confirms rights (deferred to pre-launch)
- [ ] Metadata extraction works
- [ ] Transcription works
- [ ] 5–10 candidate clips generated
- [ ] Approve/reject candidates
- [ ] Vertical clips rendered with captions
- [ ] Download clips
- [ ] YouTube Shorts upload attempted
- [ ] TikTok/Instagram scaffolds + export fallback
- [ ] Discovery page with YouTube data
- [ ] All heavy ops queued & status-tracked
