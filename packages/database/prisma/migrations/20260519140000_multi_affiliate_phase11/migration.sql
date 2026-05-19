-- Phase 11: Multi-network affiliate + Phase 10 deferred fields

ALTER TABLE "WorkspaceOverlaySettings"
ADD COLUMN
IF NOT EXISTS "ebayCampaignId" TEXT,
ADD COLUMN
IF NOT EXISTS "walmartAffiliateId" TEXT,
ADD COLUMN
IF NOT EXISTS "bestBuyAffiliateId" TEXT,
ADD COLUMN
IF NOT EXISTS "etsyAwinAffiliateId" TEXT,
ADD COLUMN
IF NOT EXISTS "affiliateFallbackOrder" TEXT[] NOT NULL DEFAULT ARRAY['amazon', 'ebay', 'walmart', 'bestbuy', 'etsy']::TEXT[],
ADD COLUMN
IF NOT EXISTS "autoDiscoverOnApprove" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN
IF NOT EXISTS "requirePaapiForAmazon" BOOLEAN NOT NULL DEFAULT false;

ALTER TABLE "ProductLink"
ADD COLUMN
IF NOT EXISTS "externalProductId" TEXT;

CREATE UNIQUE INDEX
IF NOT EXISTS "ProductLink_workspace_network_external_key"
ON "ProductLink"
("workspaceId", "affiliateNetwork", "externalProductId")
WHERE "externalProductId" IS NOT NULL;
