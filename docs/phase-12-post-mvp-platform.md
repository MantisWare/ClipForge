# Phase 12 — Post-MVP platform enhancements

**Status:** Planning (not started)  
**Checklist:** [CHECKLIST.md](../CHECKLIST.md) → Phase 12  
**Depends on:** Phases 5–8 (render, publish, analytics), Phase 9 (overlays)

This phase collects deferred and lower-priority work identified during the Phase 9–11 gap review. Nothing here blocks the current MVP pipeline.

---

## Goals

1. **Smarter vertical crop** — face-aware reframing instead of center crop only.
2. **Full Instagram publish** — Graph API container flow, not export-only fallback.
3. **Experimentation** — surface `RenderedClip.experimentGroup` in UI for A/B renders.
4. **Worker completeness** — replace noop BullMQ handlers with real implementations or remove dead job types.
5. **Analytics depth** — charts and rollup UI on top of existing `OverlayEvent` + `analytics.rollup` handler.
6. **Code hygiene** — remove unused scaffold components.

---

## 1. Face tracking (render)

**Current state:** Phase 5 uses center crop (`run-render-clip.ts` scale + crop). Face tracking called out as deferred in checklist Phase 5.

**Planning notes**

- [ ] Choose approach: FFmpeg `cropdetect` + face detector (OpenCV/MediaPipe) vs. cloud API vs. per-frame bbox from worker-ai.
- [ ] Define crop modes: `center` | `face` | `face_smooth` (EMA on bbox).
- [ ] Persist crop keyframes or single anchor per clip segment.
- [ ] Feature flag: `CLIPFORGE_FACE_TRACKING_ENABLED`.
- [ ] Fallback to center crop when no face detected.
- [ ] Performance budget on long sources (sample frames vs. full pass).

**Touchpoints:** `apps/worker/src/render/run-render-clip.ts`, render config in `packages/shared`, clip render API/UI (crop mode selector).

---

## 2. Instagram Graph automation (publish)

**Current state:** `publish.instagram` enqueues worker job with `fallback: "export"`. Caption uses `buildPublishMetadataForRendered`. No Graph API container upload.

**Planning notes**

- [ ] Meta app review requirements (permissions, test users).
- [ ] OAuth scopes for Instagram Business/Creator linked to Facebook Page.
- [ ] Flow: create container → upload video → publish reel.
- [ ] Map `connectedAccount` tokens + refresh (mirror YouTube pattern).
- [ ] Error handling: rate limits, media specs (9:16, duration, codec).
- [ ] UI: replace “export fallback” copy when direct publish succeeds.

**Touchpoints:** `apps/worker/src/publish/`, `apps/web/app/api/publish/instagram/route.ts`, connected accounts OAuth.

---

## 3. Experiment group UI

**Current state:** `RenderedClip.experimentGroup` exists (Phase 9 schema). No creator UI.

**Planning notes**

- [ ] Define experiment model: label only vs. workspace-level experiment definitions.
- [ ] Assign group at render time (dropdown on render tab / batch render).
- [ ] Filter analytics and export package by `experimentGroup`.
- [ ] Optional: compare overlay variants (A/B) — may overlap with overlay pack templates.

**Touchpoints:** Prisma `RenderedClip`, render API, render preview, analytics APIs.

---

## 4. Worker job handlers (replace noops)

**Current state:** `apps/worker/src/handlers/index.ts` registers noops for:

| Job type | Intended role |
|----------|----------------|
| `source.validate` | Pre-import URL/metadata validation async |
| `ai.generate_metadata` | Regenerate title/caption/hashtags without full rescore |
| `overlay.validate_urls` | HEAD/GET check product URLs against allowlist before render |

These types exist in `packages/shared/src/constants/jobs.ts` but are **not enqueued** on active paths today (sync validation exists on some API routes).

**Planning notes**

- [ ] **Decision per job:** implement handler vs. remove from registry + constants.
- [ ] `source.validate`: enqueue from validate API or keep sync-only and delete job type.
- [ ] `ai.generate_metadata`: wire to worker-ai endpoint; UI “Regenerate metadata” on clip review.
- [ ] `overlay.validate_urls`: run before `render.apply_overlays`; fail fast with per-URL errors.
- [ ] Add integration tests for each handler once wired.
- [ ] Update enqueue sites in `apps/web` if moving validation async.

---

## 5. Analytics charts & rollup UI

**Current state:** `OverlayEvent` tracking, `GET /api/analytics/overlays`, `analytics.rollup` handler in worker. Dashboard shows basics (Phase 8); no dedicated charts or rollup schedule UI.

**Planning notes**

- [ ] Chart library choice (align with existing dashboard — likely lightweight SVG or existing stack).
- [ ] Views: impressions/clicks by overlay type, product link, date range.
- [ ] Rollup: cron or manual “Refresh analytics” → enqueue `analytics.rollup`.
- [ ] Workspace date-range filters; export CSV.
- [ ] Link from Monetization → product link performance.

**Touchpoints:** `apps/web/app/(dashboard)/analytics/`, `apps/worker/src/handlers/analytics-rollup.ts`, analytics API routes.

---

## 6. Cleanup — orphan scaffold

**Current state:** `apps/web/components/placeholder-page.tsx` unused after real pages shipped.

**Planning notes**

- [ ] Confirm zero imports (`grep placeholder-page`).
- [ ] Delete file; remove any stale exports from barrel files.
- [ ] Optional: audit other Phase 0 placeholder routes still marked “placeholder” in nav.

---

## Out of scope (remain deferred)

These are **not** part of Phase 12 unless explicitly pulled in later:

- Rights confirmation modal / block import without rights (pre-launch compliance).
- YouTube Shopping API native product tags (`shopping` fields).
- Stripe / paid billing tiers.
- TikTok audit automation beyond current scaffold.

---

## Suggested implementation order

1. Cleanup (`placeholder-page`) — quick win.
2. Worker noops — clarify sync vs async, then implement or delete.
3. Analytics UI — builds on existing events.
4. Experiment group UI — small schema/UI surface.
5. Instagram Graph — external dependency (Meta review).
6. Face tracking — highest render complexity.

---

## Open questions

- Face tracking: on-device (worker) only, or optional cloud for accuracy?
- Instagram: single connected account per workspace or per-user?
- `experimentGroup`: free-text label or enum tied to analytics?
- Should `overlay.validate_urls` block render or warn-only?

---

## Acceptance criteria (draft)

- [ ] User can select face-tracking crop mode and rendered output follows face when detected.
- [ ] User can publish a rendered clip to Instagram Reels via connected account (happy path).
- [ ] User can set/view `experimentGroup` on render and filter analytics by it.
- [ ] No noop handlers remain for job types still listed in `JOB_TYPES` (either implemented or removed).
- [ ] Analytics page shows time-series charts and supports rollup refresh.
- [ ] `placeholder-page.tsx` removed with no broken imports.
