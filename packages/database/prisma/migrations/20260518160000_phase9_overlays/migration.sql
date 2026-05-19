-- Phase 9: Monetization overlays

CREATE TYPE "OverlayType" AS ENUM
(
  'end_slate',
  'product_pin',
  'affiliate_bar',
  'sponsor_segment',
  'promo_code',
  'qr_card',
  'image'
);

CREATE TYPE "OverlayCompliance" AS ENUM
(
  'none',
  'affiliate',
  'sponsored',
  'ad'
);

CREATE TYPE "RenderVariant" AS ENUM
('clean', 'monetized');

CREATE TYPE "OverlayEventType" AS ENUM
('impression', 'click');

ALTER TYPE "JobType"
ADD VALUE
IF NOT EXISTS 'render_apply_overlays';
ALTER TYPE "JobType"
ADD VALUE
IF NOT EXISTS 'ai_suggest_overlays';
ALTER TYPE "JobType"
ADD VALUE
IF NOT EXISTS 'overlay_validate_urls';

ALTER TABLE "Workspace" ADD COLUMN
IF NOT EXISTS "renderWebhookUrl" TEXT;

ALTER TABLE "BrandKit" ADD COLUMN
IF NOT EXISTS "overlayDefaults" JSONB;

ALTER TABLE "RenderedClip" ADD COLUMN
IF NOT EXISTS "cleanStorageKey" TEXT;
ALTER TABLE "RenderedClip" ADD COLUMN
IF NOT EXISTS "overlaysManifestKey" TEXT;
ALTER TABLE "RenderedClip" ADD COLUMN
IF NOT EXISTS "brandKitId" TEXT;
ALTER TABLE "RenderedClip" ADD COLUMN
IF NOT EXISTS "renderVariant" "RenderVariant" NOT NULL DEFAULT 'clean';
ALTER TABLE "RenderedClip" ADD COLUMN
IF NOT EXISTS "experimentGroup" TEXT;

CREATE INDEX
IF NOT EXISTS "RenderedClip_brandKitId_idx" ON "RenderedClip"
("brandKitId");

ALTER TABLE "RenderedClip"
  ADD CONSTRAINT "RenderedClip_brandKitId_fkey"
  FOREIGN KEY ("brandKitId") REFERENCES "BrandKit"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE TABLE "WorkspaceOverlaySettings"
(
  "workspaceId" TEXT NOT NULL,
  "defaultDisclosureText" TEXT,
  "defaultLocale" TEXT NOT NULL DEFAULT 'en-US',
  "urlAllowlist" TEXT
  [] DEFAULT ARRAY[]::TEXT[],
  "requireDisclosureOnExport" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP
  (3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP
  (3) NOT NULL,
  CONSTRAINT "WorkspaceOverlaySettings_pkey" PRIMARY KEY
  ("workspaceId"),
  CONSTRAINT "WorkspaceOverlaySettings_workspaceId_fkey"
    FOREIGN KEY
  ("workspaceId") REFERENCES "Workspace"
  ("id") ON
  DELETE CASCADE ON
  UPDATE CASCADE
);

  CREATE TABLE "OverlayTemplate"
  (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "overlayType" "OverlayType" NOT NULL,
    "config" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "OverlayTemplate_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "OverlayTemplate_workspaceId_fkey"
    FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE
  );

  CREATE INDEX "OverlayTemplate_workspaceId_idx" ON "OverlayTemplate"("workspaceId");

  CREATE TABLE "ProductLink"
  (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "imageStorageKey" TEXT,
    "imageUrl" TEXT,
    "priceLabel" TEXT,
    "affiliateNetwork" TEXT,
    "disclosureText" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "ProductLink_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "ProductLink_workspaceId_fkey"
    FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE
  );

  CREATE INDEX "ProductLink_workspaceId_idx" ON "ProductLink"("workspaceId");

  CREATE TABLE "ClipOverlay"
  (
    "id" TEXT NOT NULL,
    "clipCandidateId" TEXT NOT NULL,
    "overlayType" "OverlayType" NOT NULL,
    "templateId" TEXT,
    "productLinkId" TEXT,
    "startMs" INTEGER NOT NULL,
    "endMs" INTEGER NOT NULL,
    "position" JSONB NOT NULL DEFAULT '{}',
    "style" JSONB NOT NULL DEFAULT '{}',
    "compliance" "OverlayCompliance" NOT NULL DEFAULT 'none',
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isDraft" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "ClipOverlay_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "ClipOverlay_clipCandidateId_fkey"
    FOREIGN KEY ("clipCandidateId") REFERENCES "ClipCandidate"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ClipOverlay_templateId_fkey"
    FOREIGN KEY ("templateId") REFERENCES "OverlayTemplate"("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "ClipOverlay_productLinkId_fkey"
    FOREIGN KEY ("productLinkId") REFERENCES "ProductLink"("id") ON DELETE SET NULL ON UPDATE CASCADE
  );

  CREATE INDEX "ClipOverlay_clipCandidateId_idx" ON "ClipOverlay"("clipCandidateId");

  CREATE TABLE "ClipOverlayRevision"
  (
    "id" TEXT NOT NULL,
    "clipCandidateId" TEXT NOT NULL,
    "snapshot" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ClipOverlayRevision_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "ClipOverlayRevision_clipCandidateId_fkey"
    FOREIGN KEY ("clipCandidateId") REFERENCES "ClipCandidate"("id") ON DELETE CASCADE ON UPDATE CASCADE
  );

  CREATE INDEX "ClipOverlayRevision_clipCandidateId_idx" ON "ClipOverlayRevision"("clipCandidateId");

  CREATE TABLE "OverlayLinkSlug"
  (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "productLinkId" TEXT,
    "renderedClipId" TEXT,
    "clipOverlayId" TEXT,
    "targetUrl" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "OverlayLinkSlug_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "OverlayLinkSlug_slug_key" UNIQUE ("slug"),
    CONSTRAINT "OverlayLinkSlug_productLinkId_fkey"
    FOREIGN KEY ("productLinkId") REFERENCES "ProductLink"("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "OverlayLinkSlug_renderedClipId_fkey"
    FOREIGN KEY ("renderedClipId") REFERENCES "RenderedClip"("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "OverlayLinkSlug_clipOverlayId_fkey"
    FOREIGN KEY ("clipOverlayId") REFERENCES "ClipOverlay"("id") ON DELETE SET NULL ON UPDATE CASCADE
  );

  CREATE INDEX "OverlayLinkSlug_workspaceId_idx" ON "OverlayLinkSlug"("workspaceId");

  CREATE TABLE "OverlayEvent"
  (
    "id" TEXT NOT NULL,
    "slugId" TEXT NOT NULL,
    "type" "OverlayEventType" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "OverlayEvent_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "OverlayEvent_slugId_fkey"
    FOREIGN KEY ("slugId") REFERENCES "OverlayLinkSlug"("id") ON DELETE CASCADE ON UPDATE CASCADE
  );

  CREATE INDEX "OverlayEvent_slugId_idx" ON "OverlayEvent"("slugId");
  CREATE INDEX "OverlayEvent_createdAt_idx" ON "OverlayEvent"("createdAt");
