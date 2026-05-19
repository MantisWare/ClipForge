# ClipForge Implementation Checklist

Track progress by phase. See [docs/clipforge_ai_shorts_platform_cursor_spec.md](docs/clipforge_ai_shorts_platform_cursor_spec.md) for full requirements. Phase 9: [docs/phase-9-monetization-overlays.md](docs/phase-9-monetization-overlays.md). Phase 10: [docs/phase-10-ai-amazon-affiliate.md](docs/phase-10-ai-amazon-affiliate.md). Phase 11: [docs/phase-11-multi-affiliate.md](docs/phase-11-multi-affiliate.md). Phase 12: [docs/phase-12-post-mvp-platform.md](docs/phase-12-post-mvp-platform.md).

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

### Desktop (`apps/desktop`)
- [x] Electron shell loads local Next.js dev server (port file + health poll)
- [ ] Packaged production build (electron-builder / signed installers)

### Workers
- [x] `services/worker-video` FastAPI + health + job stubs
- [x] `services/worker-ai` FastAPI + health + job stubs

### Documentation
- [x] `README.md` setup & architecture
- [x] `CHECKLIST.md` (this file)
- [x] `developer.md` — Docker and non-Docker dev setup
- [x] `start.sh` / `start-docker.sh` — install deps, migrate, run dev server

> **Auto-updated:** Added `developer.md` and start scripts on 2026-05-18. Rights gate deferred 2026-05-18 — direct import for MVP. `start.sh` auto-provisions local `clipforge` Postgres role/db on 2026-05-18. Web dev port auto-scan from 4000 (skips 3000) on 2026-05-18. Electron desktop shell (`apps/desktop`) on 2026-05-18.

---

## Phase 1 — Foundation

### Auth & workspace
- [x] Production-ready auth providers (email magic link / Google)
- [x] Workspace switcher in dashboard header
- [x] Workspace CRUD UI
- [x] Workspace membership & roles enforcement

### Dashboard
- [x] Real-time job status (adaptive polling)
- [x] Connected account status summary on dashboard
- [x] Scheduled posts panel (live calendar feed)

### Queue
- [x] Node BullMQ worker consumer (`apps/worker`)
- [x] Job status transitions (`running` → `completed` / `failed`)
- [x] Retry UI for failed jobs

### Brand
- [x] Logo + dark-first theme (pink/cyan/orange on black)

### Database
- [x] Seed script integrated into dev onboarding docs
- [x] Migration workflow in CI

> **Auto-updated:** Phase 1 foundation completed 2026-05-18. Dashboard scheduled posts panel wired to `/api/calendar` on 2026-05-18.

---

## Phase 2 — Source import

### API & workers
- [x] YouTube metadata (Data API v3)
- [x] Direct MP4/MOV URL handling
- [x] Presigned file upload + MinIO storage (`upload/presign`, `upload/complete`)
- [x] Vimeo URL parser (validate + direct download)
- [x] `apps/worker` `source.import` (yt-dlp, ffprobe, S3 upload)

### UI
- [x] Source detail page with video player (signed URL)
- [x] Import status progression on source card
- [x] New Project wizard — source step (`/projects/new`)

> **Auto-updated by Cursor:** Phase 2 source import completed 2026-05-18 (Node worker + presigned uploads).

### Compliance (deferred — pre-launch)
- [ ] Rights confirmation modal before third-party import
- [ ] Block import without rights confirmation
- [x] Warn on risky source patterns (validate API + import UI heuristics)

---

## Phase 3 — Transcription

- [x] Audio extraction worker (`media.extract_audio`)
- [x] Faster-Whisper transcription (`media.transcribe`)
- [x] `TranscriptSegment` + `TranscriptWord` persistence
- [x] Transcript viewer synced to playback
- [x] Language detection

> **Auto-updated by Cursor:** Phase 3 transcription completed 2026-05-18 (Node extract + worker-ai Faster-Whisper + transcript UI).

---

## Phase 4 — AI clip candidates

- [x] Sliding window generator (30 / 45 / 60s)
- [x] Heuristic scoring pass
- [x] LLM scoring with strict JSON schema
- [x] Generate 5–10 candidates per source
- [x] Clip review UI (scores, reasons, approve/reject)
- [x] Editable hook, title, caption, hashtags

> **Auto-updated by Cursor:** Phase 4 clip candidates completed 2026-05-18 (heuristic + OpenAI via worker-ai, review UI on project page).

---

## Phase 5 — Rendering

- [x] FFmpeg vertical 1080×1920 preset
- [x] Smart crop modes (center crop MVP; face tracking deferred)
- [x] Burned-in captions + safe areas
- [x] Hook overlay (2–3s)
- [x] Render preview page
- [x] Download rendered MP4

> **Auto-updated by Cursor:** Phase 5 rendering completed 2026-05-18 (Node FFmpeg + MinIO).

---

## Phase 6 — Publishing

- [x] Connected accounts OAuth (YouTube)
- [x] YouTube Shorts upload (`videos.insert`)
- [x] TikTok connector + `PRIVATE_ONLY` / `REQUIRES_AUDIT` flags
- [x] Instagram export fallback (Graph API container deferred)
- [x] Export fallback for unaudited apps
- [x] Publish from render preview UI

> **Auto-updated by Cursor:** Phase 6 publishing MVP completed 2026-05-18.

---

## Phase 7 — Discovery

- [x] YouTube most-popular API integration
- [x] Keyword search + filters (region, category)
- [x] Discovery cards with rights badges
- [x] Analyze action (import to project)
- [x] Rights warning on every third-party card

> **Auto-updated by Cursor:** Phase 7 discovery completed 2026-05-18.

---

## Phase 8 — Polish

> **Open source / free:** No Stripe or paid billing. Optional env-based quotas only. Full spec: [docs/phase-8-polish.md](docs/phase-8-polish.md).

- [x] Brand kits
- [x] Caption style presets
- [x] Content calendar
- [x] Batch clip generation
- [x] Analytics basics
- [x] Admin tools & env quotas (no payment provider) + `/admin` UI
- [x] Projects list page (replace placeholder)

> **Auto-updated by Cursor:** Phase 8 implemented on 2026-05-18 (brand kits, captions, calendar, batch, analytics, admin, projects list). Post–Phase 7 review fixes: render approval order, clip `rendered` status on success only, FFmpeg trim fallback, publish `ready` validation, YouTube token refresh, editor role on mutations, account disconnect API.

---

## Phase 9 — Monetization & interactive overlays

> **Depends on:** Phase 5 (render pipeline), Phase 8 (brand kits). Full spec: [docs/phase-9-monetization-overlays.md](docs/phase-9-monetization-overlays.md).

### Data model & catalog
- [x] `OverlayTemplate` workspace library (CTA card, product pin, end slate, QR, lower-third)
- [x] `ProductLink` catalog (title, URL, image, price, affiliate network, disclosure text)
- [x] `ClipOverlay` instances bound to `ClipCandidate` with timeline windows
- [x] Overlay zones respecting caption safe areas (spec §14.3)
- [x] Version history (`ClipOverlayRevision`) on save

### Overlay types (MVP of phase)
- [x] **End slate** — headline + CTA via FFmpeg drawtext
- [x] **Product pin** — title + Shop chip (S3 image presign on catalog)
- [x] **Affiliate lower-third** — disclosure bar
- [x] **Sponsored segment marker** — top partnership bar
- [x] **Promo code flash** — centered code text (copy in editor via style field)

### Editor UX (smooth creator flow)
- [x] Overlay timeline on `/projects/[sourceId]/clips/[clipId]` (ms timing + save)
- [x] Live preview canvas with safe-area guides
- [x] One-click “Apply brand kit defaults” to all overlays on a clip
- [x] Builtin presets seeded (Minimal, Bold CTA, Product focus, Podcast sponsor)
- [x] Bulk apply overlay pack (`POST /api/sources/[id]/overlays/apply-pack`)
- [x] Keyboard nudge (position) + duplicate overlay to sibling clips

### AI-assisted placement
- [x] Detect product mentions in transcript → suggest `ProductLink` matches (`ai.suggest_overlays`)
- [x] Suggest overlay start/end from transcript segments
- [x] Score overlay density (warn if >2 simultaneous or covers captions)
- [x] Generate CTA copy variants aligned with hook tone (user picks one)

### Render pipeline
- [x] Chained `render.clip` → `render.apply_overlays` (Node worker / FFmpeg)
- [x] Image prefetch in overlay pass (product `imageStorageKey` burned via FFmpeg movie filter)
- [x] Font/color from default brand kit on overlay pass
- [x] Export clean (`clean.mp4`) alongside monetized (`output.mp4`)
- [x] Render manifest `overlays.json` in S3

### Compliance & trust
- [x] Workspace-level default disclosure text + locale
- [x] Require disclosure on affiliate/sponsored overlays before render (when configured)
- [x] FTC-style checkbox on publish preview for monetized renders
- [x] Platform notes in publish UI (YouTube / TikTok / Instagram)
- [x] HTTPS URL validation + optional domain allowlist before render

### Publishing & metadata
- [x] Tracked links in YouTube description (UTM + workspace id)
- [x] Links block auto-generated from product overlays
- [ ] YouTube: `shopping` / product tag fields where API supports
- [x] Export package API (`overlays.json` + signed MP4 URLs; `linksText` in response)

### Analytics (phase tail)
- [x] Click/impression events (`OverlayEvent` + `/r/[slug]`)
- [x] Overlay analytics API (`GET /api/analytics/overlays`)
- [x] `RenderedClip.experimentGroup` field for future A/B (no UI yet)

### Integrations (later)
- [x] Import product feed (CSV via `POST /api/product-links/import`)
- [x] Webhook on render complete (`Workspace.renderWebhookUrl`)
- [x] API: attach overlay pack (`POST /api/clips/[id]/overlay-pack`)

> **Auto-updated by Cursor:** Phase 9 polish completed 2026-05-18 — brand kit apply, keyboard nudge, CTA variants API, product image burn-in, admin UI, scheduled posts panel, source risk warnings. Deferred: YouTube shopping API, rights confirmation modal (pre-launch).

---

## Phase 10 — AI Amazon affiliate discovery

> Full spec: [docs/phase-10-ai-amazon-affiliate.md](docs/phase-10-ai-amazon-affiliate.md)

### Workspace affiliate config
- [x] `amazonAssociateTag`, `amazonMarketplace`, `aiProductDiscoveryEnabled` on overlay settings
- [x] Monetization UI — Associates tag + marketplace + toggle

### AI product matching
- [x] OpenAI-compatible LLM via `worker-ai` `POST /v1/discover-amazon-product`
- [x] Context: transcript segments, hook, title, caption, hashtags
- [x] Job `ai.discover_amazon_product` in Node worker

### Affiliate links
- [x] Build tagged Amazon search URL (fallback without PA-API)
- [x] Optional PA-API 5 `SearchItems` → `/dp/{ASIN}?tag=` when env keys set
- [x] Create `ProductLink` + draft `product_pin` overlay with timing hint

### API & UI
- [x] `POST /api/clips/[id]/affiliate/discover`
- [x] Clip overlay editor — **Find Amazon product** button

### Deferred (completed in Phase 11)
- [x] Auto-discover on clip approval (`autoDiscoverOnApprove`)
- [x] Product image fetch to S3 after product API hit
- [x] Non-Amazon affiliate networks (see Phase 11)

> **Auto-updated by Cursor:** Phase 10 AI Amazon affiliate discovery implemented 2026-05-19.

---

## Phase 11 — Multi-network affiliate resolver

> Full spec: [docs/phase-11-multi-affiliate.md](docs/phase-11-multi-affiliate.md)

- [x] eBay Partner Network (campaign ID + optional Browse API)
- [x] Walmart Affiliates (Impact publisher id)
- [x] Best Buy Affiliates (Impact publisher id)
- [x] Etsy Affiliates (Awin publisher id)
- [x] Ordered fallback chain with category bias (tech / lifestyle / general)
- [x] Single product link + draft overlay per discovery
- [x] Catalog dedup by `externalProductId`
- [x] `requirePaapiForAmazon` to force fallback when Amazon has no ASIN
- [x] Monetization UI for all networks

> **Auto-updated by Cursor:** Phase 11 multi-affiliate implemented 2026-05-19.

---

## Phase 12 — Post-MVP platform enhancements

> **Status:** Planning only (not started). Full spec: [docs/phase-12-post-mvp-platform.md](docs/phase-12-post-mvp-platform.md).  
> Items deferred from Phases 5–9 and the 2026-05-19 gap review. Does not block current MVP.

### Face tracking (render)
- [ ] Face-aware vertical crop mode (replace center-crop-only MVP)
- [ ] Crop mode selector in render UI (`center` | `face` | smooth follow)
- [ ] Fallback to center when no face detected
- [ ] Feature flag + performance budget documented

### Instagram Graph automation (publish)
- [ ] Instagram Business/Creator OAuth scopes (linked Facebook Page)
- [ ] Graph API: container create → video upload → publish Reel
- [ ] Token refresh + error handling (rate limits, media specs)
- [ ] Publish UI: direct post path (retain export fallback until verified)

### Experiment group UI
- [ ] Assign `RenderedClip.experimentGroup` at render time (clip / batch)
- [ ] Display experiment label on render preview & export package
- [ ] Filter overlay analytics (and exports) by experiment group

### Worker handlers (replace noops)
- [ ] `source.validate` — implement async handler **or** remove job type from registry
- [ ] `ai.generate_metadata` — worker-ai + “Regenerate metadata” on clip review
- [ ] `overlay.validate_urls` — pre-render URL/allowlist checks (block vs warn TBD)
- [ ] Enqueue from web APIs where async; integration tests per handler

### Analytics charts & rollup UI
- [ ] Time-series charts (impressions/clicks by overlay, product link, date)
- [ ] Date-range filters on analytics dashboard
- [ ] Trigger or schedule `analytics.rollup` from UI (“Refresh analytics”)
- [ ] Optional CSV export for overlay performance

### Cleanup
- [ ] Remove orphan `apps/web/components/placeholder-page.tsx` (confirm zero imports)
- [ ] Audit remaining Phase 0 placeholder copy in nav/routes

> **Auto-updated by Cursor:** Phase 12 planning backlog added 2026-05-19.

---

## MVP acceptance (from spec §22)

- [x] User can sign in
- [x] User can create a workspace
- [x] User can paste URL or upload video
- [ ] User confirms rights (deferred to pre-launch)
- [x] Metadata extraction works
- [x] Transcription works
- [x] 5–10 candidate clips generated
- [x] Approve/reject candidates
- [x] Vertical clips rendered with captions
- [x] Download clips (`GET /api/rendered/[id]/download`)
- [x] YouTube Shorts upload attempted (OAuth + `publish.youtube` worker)
- [x] TikTok/Instagram scaffolds + export fallback
- [x] Discovery page with YouTube data
- [x] All heavy ops queued & status-tracked (BullMQ + job APIs)

> **Auto-updated by Cursor:** Synced MVP acceptance with Phases 1–7 implementation on 2026-05-18.

---

## Post-review fixes (2026-05-19)

- [x] Calendar scheduling: account picker, rendered clip picker, `?renderedClipId=` from preview
- [x] Scheduled + immediate YouTube publish use full affiliate description (`buildPublishMetadataForRendered`)
- [x] Re-render when clip status is `rendered`; overlay editor link on render preview
- [x] Publish preview loads generated description + links block
- [x] Monetization UI: URL allowlist + render webhook fields
- [x] Overlay editor: Apply overlay pack button
- [x] README architecture/docs accuracy (`apps/worker` as primary consumer)
- [x] Render webhook fires on clean-only renders (`variant: clean`)
- [x] TikTok/Instagram publish captions include affiliate links block
- [x] Overlay editor: manual product pin / affiliate bar from catalog

> **Auto-updated by Cursor:** Comprehensive gap scan fixes on 2026-05-19.
