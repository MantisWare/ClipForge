-- AI Amazon affiliate product discovery (workspace settings + job type)

ALTER TYPE "JobType" ADD VALUE IF NOT EXISTS 'ai_discover_amazon_product';

ALTER TABLE "WorkspaceOverlaySettings"
ADD COLUMN IF NOT EXISTS "amazonAssociateTag" TEXT,
ADD COLUMN IF NOT EXISTS "amazonMarketplace" TEXT NOT NULL DEFAULT 'www.amazon.com',
ADD COLUMN IF NOT EXISTS "aiProductDiscoveryEnabled" BOOLEAN NOT NULL DEFAULT true;
