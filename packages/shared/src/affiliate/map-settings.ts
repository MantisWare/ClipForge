import type { WorkspaceAffiliateSettings } from "./types.js";

type OverlaySettingsRow = {
  amazonAssociateTag: string | null;
  amazonMarketplace: string;
  ebayCampaignId?: string | null;
  walmartAffiliateId?: string | null;
  bestBuyAffiliateId?: string | null;
  etsyAwinAffiliateId?: string | null;
  affiliateFallbackOrder?: string[];
  requirePaapiForAmazon?: boolean;
  defaultDisclosureText?: string | null;
};

export const mapWorkspaceAffiliateSettings = (
  row: OverlaySettingsRow,
): WorkspaceAffiliateSettings => ({
  amazonAssociateTag: row.amazonAssociateTag,
  amazonMarketplace: row.amazonMarketplace,
  ebayCampaignId: row.ebayCampaignId ?? null,
  walmartAffiliateId: row.walmartAffiliateId ?? null,
  bestBuyAffiliateId: row.bestBuyAffiliateId ?? null,
  etsyAwinAffiliateId: row.etsyAwinAffiliateId ?? null,
  affiliateFallbackOrder: row.affiliateFallbackOrder ?? [
    "amazon",
    "ebay",
    "walmart",
    "bestbuy",
    "etsy",
  ],
  requirePaapiForAmazon: row.requirePaapiForAmazon ?? false,
  defaultDisclosureText: row.defaultDisclosureText ?? null,
});
