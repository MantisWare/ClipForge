-- CreateSchema
CREATE SCHEMA
IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "WorkspacePlan" AS ENUM
('free', 'creator', 'agency', 'enterprise');
CREATE TYPE "WorkspaceRole" AS ENUM
('owner', 'admin', 'editor', 'viewer');
CREATE TYPE "SourceType" AS ENUM
('youtube', 'vimeo', 'direct_url', 'upload');
CREATE TYPE "SourceStatus" AS ENUM
('pending', 'importing', 'imported', 'transcribing', 'analyzing', 'ready', 'failed');
CREATE TYPE "RightsStatus" AS ENUM
('owned', 'licensed', 'permission_required', 'unknown');
CREATE TYPE "ClipStatus" AS ENUM
('candidate', 'approved', 'rejected', 'rendered', 'published');
CREATE TYPE "RenderStatus" AS ENUM
('queued', 'rendering', 'ready', 'failed');
CREATE TYPE "Platform" AS ENUM
('youtube', 'tiktok', 'instagram');
CREATE TYPE "ConnectedAccountStatus" AS ENUM
('connected', 'expired', 'revoked', 'requires_review');
CREATE TYPE "PublishVisibility" AS ENUM
('public', 'private', 'unlisted', 'draft');
CREATE TYPE "PublishJobStatus" AS ENUM
('draft', 'queued', 'publishing', 'processing', 'published', 'failed', 'requires_manual_action');
CREATE TYPE "JobType" AS ENUM
('source_validate', 'source_import', 'source_extract_metadata', 'media_extract_audio', 'media_transcribe', 'media_detect_scenes', 'ai_score_clips', 'ai_generate_metadata', 'render_clip', 'publish_youtube', 'publish_tiktok', 'publish_instagram');
CREATE TYPE "JobStatus" AS ENUM
('queued', 'running', 'completed', 'failed', 'cancelled', 'retrying');

-- CreateTable User (Auth.js)
CREATE TABLE "User"
(
    "id" TEXT NOT NULL,
    "name" TEXT,
    "email" TEXT NOT NULL,
    "emailVerified" TIMESTAMP(3),
    "image" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Account"
(
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "providerAccountId" TEXT NOT NULL,
    "refresh_token" TEXT,
    "access_token" TEXT,
    "expires_at" INTEGER,
    "token_type" TEXT,
    "scope" TEXT,
    "id_token" TEXT,
    "session_state" TEXT,
    CONSTRAINT "Account_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Session"
(
    "id" TEXT NOT NULL,
    "sessionToken" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "VerificationToken"
(
    "identifier" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL
);

CREATE TABLE "Workspace"
(
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "ownerId" TEXT NOT NULL,
    "plan" "WorkspacePlan" NOT NULL DEFAULT 'free',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Workspace_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "WorkspaceMember"
(
    "id" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "role" "WorkspaceRole" NOT NULL DEFAULT 'editor',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "WorkspaceMember_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "SourceVideo"
(
    "id" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "sourceType" "SourceType" NOT NULL,
    "sourceUrl" TEXT NOT NULL,
    "sourcePlatformId" TEXT,
    "title" TEXT,
    "description" TEXT,
    "thumbnailUrl" TEXT,
    "durationSeconds" DOUBLE PRECISION,
    "width" INTEGER,
    "height" INTEGER,
    "fps" DOUBLE PRECISION,
    "language" TEXT,
    "storageKey" TEXT,
    "status" "SourceStatus" NOT NULL DEFAULT 'pending',
    "rightsStatus" "RightsStatus" NOT NULL DEFAULT 'unknown',
    "rightsConfirmed" BOOLEAN NOT NULL DEFAULT false,
    "rightsConfirmedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "SourceVideo_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "TranscriptSegment"
(
    "id" TEXT NOT NULL,
    "sourceVideoId" TEXT NOT NULL,
    "startMs" INTEGER NOT NULL,
    "endMs" INTEGER NOT NULL,
    "text" TEXT NOT NULL,
    "confidence" DOUBLE PRECISION,
    "speakerLabel" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "TranscriptSegment_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "TranscriptWord"
(
    "id" TEXT NOT NULL,
    "segmentId" TEXT NOT NULL,
    "word" TEXT NOT NULL,
    "startMs" INTEGER NOT NULL,
    "endMs" INTEGER NOT NULL,
    "confidence" DOUBLE PRECISION,
    CONSTRAINT "TranscriptWord_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ClipCandidate"
(
    "id" TEXT NOT NULL,
    "sourceVideoId" TEXT NOT NULL,
    "startMs" INTEGER NOT NULL,
    "endMs" INTEGER NOT NULL,
    "durationSeconds" DOUBLE PRECISION NOT NULL,
    "transcriptExcerpt" TEXT NOT NULL,
    "hookScore" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "viralityScore" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "clarityScore" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "standaloneScore" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "platformFitScore" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "overallScore" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "reasonSelected" TEXT NOT NULL,
    "suggestedHook" TEXT,
    "suggestedTitle" TEXT,
    "suggestedCaption" TEXT,
    "suggestedHashtags" TEXT
    [] DEFAULT ARRAY[]::TEXT[],
    "status" "ClipStatus" NOT NULL DEFAULT 'candidate',
    "createdAt" TIMESTAMP
    (3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP
    (3) NOT NULL,
    CONSTRAINT "ClipCandidate_pkey" PRIMARY KEY
    ("id")
);

    CREATE TABLE "RenderedClip"
    (
        "id" TEXT NOT NULL,
        "clipCandidateId" TEXT NOT NULL,
        "workspaceId" TEXT NOT NULL,
        "outputUrl" TEXT,
        "storageKey" TEXT,
        "thumbnailUrl" TEXT,
        "width" INTEGER NOT NULL DEFAULT 1080,
        "height" INTEGER NOT NULL DEFAULT 1920,
        "durationSeconds" DOUBLE PRECISION,
        "renderPreset" TEXT NOT NULL DEFAULT 'vertical_1080x1920',
        "captionStyleId" TEXT,
        "status" "RenderStatus" NOT NULL DEFAULT 'queued',
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL,
        CONSTRAINT "RenderedClip_pkey" PRIMARY KEY ("id")
    );

    CREATE TABLE "ConnectedAccount"
    (
        "id" TEXT NOT NULL,
        "workspaceId" TEXT NOT NULL,
        "platform" "Platform" NOT NULL,
        "accountName" TEXT NOT NULL,
        "externalAccountId" TEXT NOT NULL,
        "accessTokenEncrypted" TEXT NOT NULL,
        "refreshTokenEncrypted" TEXT,
        "tokenExpiresAt" TIMESTAMP(3),
        "scopes" TEXT
        [] DEFAULT ARRAY[]::TEXT[],
    "status" "ConnectedAccountStatus" NOT NULL DEFAULT 'connected',
    "publishCapability" TEXT,
    "createdAt" TIMESTAMP
        (3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP
        (3) NOT NULL,
    CONSTRAINT "ConnectedAccount_pkey" PRIMARY KEY
        ("id")
);

        CREATE TABLE "PublishJob"
        (
            "id" TEXT NOT NULL,
            "renderedClipId" TEXT NOT NULL,
            "workspaceId" TEXT NOT NULL,
            "platform" "Platform" NOT NULL,
            "connectedAccountId" TEXT,
            "title" TEXT,
            "caption" TEXT,
            "hashtags" TEXT
            [] DEFAULT ARRAY[]::TEXT[],
    "visibility" "PublishVisibility" NOT NULL DEFAULT 'public',
    "scheduledFor" TIMESTAMP
            (3),
    "status" "PublishJobStatus" NOT NULL DEFAULT 'draft',
    "externalPostId" TEXT,
    "externalUrl" TEXT,
    "errorMessage" TEXT,
    "createdAt" TIMESTAMP
            (3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP
            (3) NOT NULL,
    CONSTRAINT "PublishJob_pkey" PRIMARY KEY
            ("id")
);

            CREATE TABLE "Job"
            (
                "id" TEXT NOT NULL,
                "workspaceId" TEXT NOT NULL,
                "sourceVideoId" TEXT,
                "type" "JobType" NOT NULL,
                "status" "JobStatus" NOT NULL DEFAULT 'queued',
                "payload" JSONB NOT NULL DEFAULT '{}',
                "result" JSONB,
                "errorMessage" TEXT,
                "attempts" INTEGER NOT NULL DEFAULT 0,
                "maxAttempts" INTEGER NOT NULL DEFAULT 3,
                "bullJobId" TEXT,
                "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
                "updatedAt" TIMESTAMP(3) NOT NULL,
                "startedAt" TIMESTAMP(3),
                "completedAt" TIMESTAMP(3),
                CONSTRAINT "Job_pkey" PRIMARY KEY ("id")
            );

            -- Indexes & uniques
            CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
            CREATE UNIQUE INDEX "Account_provider_providerAccountId_key" ON "Account"("provider", "providerAccountId");
            CREATE UNIQUE INDEX "Session_sessionToken_key" ON "Session"("sessionToken");
            CREATE UNIQUE INDEX "VerificationToken_token_key" ON "VerificationToken"("token");
            CREATE UNIQUE INDEX "VerificationToken_identifier_token_key" ON "VerificationToken"("identifier", "token");
            CREATE INDEX "Workspace_ownerId_idx" ON "Workspace"("ownerId");
            CREATE UNIQUE INDEX "WorkspaceMember_workspaceId_userId_key" ON "WorkspaceMember"("workspaceId", "userId");
            CREATE INDEX "WorkspaceMember_userId_idx" ON "WorkspaceMember"("userId");
            CREATE INDEX "SourceVideo_workspaceId_idx" ON "SourceVideo"("workspaceId");
            CREATE INDEX "SourceVideo_status_idx" ON "SourceVideo"("status");
            CREATE INDEX "TranscriptSegment_sourceVideoId_idx" ON "TranscriptSegment"("sourceVideoId");
            CREATE INDEX "TranscriptWord_segmentId_idx" ON "TranscriptWord"("segmentId");
            CREATE INDEX "ClipCandidate_sourceVideoId_idx" ON "ClipCandidate"("sourceVideoId");
            CREATE INDEX "ClipCandidate_status_idx" ON "ClipCandidate"("status");
            CREATE INDEX "RenderedClip_workspaceId_idx" ON "RenderedClip"("workspaceId");
            CREATE INDEX "RenderedClip_clipCandidateId_idx" ON "RenderedClip"("clipCandidateId");
            CREATE INDEX "ConnectedAccount_workspaceId_idx" ON "ConnectedAccount"("workspaceId");
            CREATE UNIQUE INDEX "ConnectedAccount_workspaceId_platform_externalAccountId_key" ON "ConnectedAccount"("workspaceId", "platform", "externalAccountId");
            CREATE INDEX "PublishJob_workspaceId_idx" ON "PublishJob"("workspaceId");
            CREATE INDEX "PublishJob_status_idx" ON "PublishJob"("status");
            CREATE INDEX "Job_workspaceId_idx" ON "Job"("workspaceId");
            CREATE INDEX "Job_status_idx" ON "Job"("status");
            CREATE INDEX "Job_type_idx" ON "Job"("type");

            -- Foreign keys
            ALTER TABLE "Account" ADD CONSTRAINT "Account_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
            ALTER TABLE "Session" ADD CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
            ALTER TABLE "Workspace" ADD CONSTRAINT "Workspace_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
            ALTER TABLE "WorkspaceMember" ADD CONSTRAINT "WorkspaceMember_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;
            ALTER TABLE "WorkspaceMember" ADD CONSTRAINT "WorkspaceMember_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
            ALTER TABLE "SourceVideo" ADD CONSTRAINT "SourceVideo_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;
            ALTER TABLE "TranscriptSegment" ADD CONSTRAINT "TranscriptSegment_sourceVideoId_fkey" FOREIGN KEY ("sourceVideoId") REFERENCES "SourceVideo"("id") ON DELETE CASCADE ON UPDATE CASCADE;
            ALTER TABLE "TranscriptWord" ADD CONSTRAINT "TranscriptWord_segmentId_fkey" FOREIGN KEY ("segmentId") REFERENCES "TranscriptSegment"("id") ON DELETE CASCADE ON UPDATE CASCADE;
            ALTER TABLE "ClipCandidate" ADD CONSTRAINT "ClipCandidate_sourceVideoId_fkey" FOREIGN KEY ("sourceVideoId") REFERENCES "SourceVideo"("id") ON DELETE CASCADE ON UPDATE CASCADE;
            ALTER TABLE "RenderedClip" ADD CONSTRAINT "RenderedClip_clipCandidateId_fkey" FOREIGN KEY ("clipCandidateId") REFERENCES "ClipCandidate"("id") ON DELETE CASCADE ON UPDATE CASCADE;
            ALTER TABLE "RenderedClip" ADD CONSTRAINT "RenderedClip_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;
            ALTER TABLE "ConnectedAccount" ADD CONSTRAINT "ConnectedAccount_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;
            ALTER TABLE "PublishJob" ADD CONSTRAINT "PublishJob_renderedClipId_fkey" FOREIGN KEY ("renderedClipId") REFERENCES "RenderedClip"("id") ON DELETE CASCADE ON UPDATE CASCADE;
            ALTER TABLE "PublishJob" ADD CONSTRAINT "PublishJob_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;
            ALTER TABLE "PublishJob" ADD CONSTRAINT "PublishJob_connectedAccountId_fkey" FOREIGN KEY ("connectedAccountId") REFERENCES "ConnectedAccount"("id") ON DELETE SET NULL ON UPDATE CASCADE;
            ALTER TABLE "Job" ADD CONSTRAINT "Job_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;
            ALTER TABLE "Job" ADD CONSTRAINT "Job_sourceVideoId_fkey" FOREIGN KEY ("sourceVideoId") REFERENCES "SourceVideo"("id") ON DELETE SET NULL ON UPDATE CASCADE;
