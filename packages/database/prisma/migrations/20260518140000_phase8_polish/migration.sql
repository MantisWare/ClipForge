-- Phase 8: brand kits, caption presets, calendar, analytics

CREATE TABLE "BrandKit"
(
    "id" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "logoStorageKey" TEXT,
    "primaryColor" TEXT NOT NULL DEFAULT '#FFFFFF',
    "secondaryColor" TEXT,
    "fontFamily" TEXT NOT NULL DEFAULT 'Inter',
    "hookFontSize" INTEGER NOT NULL DEFAULT 48,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BrandKit_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "CaptionStylePreset"
(
    "id" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "brandKitId" TEXT,
    "name" TEXT NOT NULL,
    "presetKey" TEXT NOT NULL,
    "assTemplate" JSONB NOT NULL DEFAULT '{}',
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CaptionStylePreset_pkey" PRIMARY KEY ("id")
);

CREATE TYPE "ScheduledPublishStatus" AS ENUM
('scheduled', 'published', 'cancelled', 'failed');

CREATE TABLE "ScheduledPublish"
(
    "id" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "renderedClipId" TEXT NOT NULL,
    "connectedAccountId" TEXT,
    "platform" "Platform" NOT NULL,
    "title" TEXT,
    "caption" TEXT,
    "hashtags" TEXT
    [] DEFAULT ARRAY[]::TEXT[],
    "visibility" "PublishVisibility" NOT NULL DEFAULT 'public',
    "scheduledFor" TIMESTAMP
    (3) NOT NULL,
    "status" "ScheduledPublishStatus" NOT NULL DEFAULT 'scheduled',
    "publishJobId" TEXT,
    "errorMessage" TEXT,
    "createdAt" TIMESTAMP
    (3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP
    (3) NOT NULL,

    CONSTRAINT "ScheduledPublish_pkey" PRIMARY KEY
    ("id")
);

    CREATE TABLE "WorkspaceDailyStats"
    (
        "workspaceId" TEXT NOT NULL,
        "date" DATE NOT NULL,
        "sourcesImported" INTEGER NOT NULL DEFAULT 0,
        "clipsGenerated" INTEGER NOT NULL DEFAULT 0,
        "clipsApproved" INTEGER NOT NULL DEFAULT 0,
        "clipsRendered" INTEGER NOT NULL DEFAULT 0,
        "publishAttempts" INTEGER NOT NULL DEFAULT 0,
        "publishSuccess" INTEGER NOT NULL DEFAULT 0,

        CONSTRAINT "WorkspaceDailyStats_pkey" PRIMARY KEY ("workspaceId","date")
    );

    ALTER TYPE "JobType"
    ADD VALUE 'batch_render';
    ALTER TYPE "JobType"
    ADD VALUE 'publish_scheduled';
    ALTER TYPE "JobType"
    ADD VALUE 'analytics_rollup';

    CREATE INDEX "BrandKit_workspaceId_idx" ON "BrandKit"("workspaceId");
    CREATE INDEX "CaptionStylePreset_workspaceId_idx" ON "CaptionStylePreset"("workspaceId");
    CREATE INDEX "CaptionStylePreset_brandKitId_idx" ON "CaptionStylePreset"("brandKitId");
    CREATE INDEX "ScheduledPublish_workspaceId_idx" ON "ScheduledPublish"("workspaceId");
    CREATE INDEX "ScheduledPublish_scheduledFor_idx" ON "ScheduledPublish"("scheduledFor");
    CREATE INDEX "ScheduledPublish_status_idx" ON "ScheduledPublish"("status");
    CREATE INDEX "RenderedClip_captionStyleId_idx" ON "RenderedClip"("captionStyleId");

    ALTER TABLE "BrandKit" ADD CONSTRAINT "BrandKit_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    ALTER TABLE "CaptionStylePreset" ADD CONSTRAINT "CaptionStylePreset_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    ALTER TABLE "CaptionStylePreset" ADD CONSTRAINT "CaptionStylePreset_brandKitId_fkey" FOREIGN KEY ("brandKitId") REFERENCES "BrandKit"("id") ON DELETE SET NULL ON UPDATE CASCADE;
    ALTER TABLE "ScheduledPublish" ADD CONSTRAINT "ScheduledPublish_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    ALTER TABLE "ScheduledPublish" ADD CONSTRAINT "ScheduledPublish_renderedClipId_fkey" FOREIGN KEY ("renderedClipId") REFERENCES "RenderedClip"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    ALTER TABLE "ScheduledPublish" ADD CONSTRAINT "ScheduledPublish_connectedAccountId_fkey" FOREIGN KEY ("connectedAccountId") REFERENCES "ConnectedAccount"("id") ON DELETE SET NULL ON UPDATE CASCADE;
    ALTER TABLE "WorkspaceDailyStats" ADD CONSTRAINT "WorkspaceDailyStats_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    ALTER TABLE "RenderedClip" ADD CONSTRAINT "RenderedClip_captionStyleId_fkey" FOREIGN KEY ("captionStyleId") REFERENCES "CaptionStylePreset"("id") ON DELETE SET NULL ON UPDATE CASCADE;
