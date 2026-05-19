import { z } from "zod";

export const AFFILIATE_NETWORKS = [
  "amazon",
  "ebay",
  "walmart",
  "bestbuy",
  "etsy",
] as const;

export type AffiliateNetwork = (typeof AFFILIATE_NETWORKS)[number];

export const productCategorySchema = z.enum([
  "tech",
  "lifestyle",
  "general",
]);

export type ProductCategory = z.infer<typeof productCategorySchema>;

export type WorkspaceAffiliateSettings = {
  amazonAssociateTag: string | null;
  amazonMarketplace: string;
  ebayCampaignId: string | null;
  walmartAffiliateId: string | null;
  bestBuyAffiliateId: string | null;
  etsyAwinAffiliateId: string | null;
  affiliateFallbackOrder: string[];
  requirePaapiForAmazon: boolean;
  defaultDisclosureText: string | null;
};

export type ResolvedAffiliateProduct = {
  network: AffiliateNetwork;
  productUrl: string;
  productTitle: string;
  imageUrl?: string;
  priceLabel?: string;
  externalProductId?: string;
  ctaLabel: string;
  usedProductApi: boolean;
  attemptedNetworks: AffiliateNetwork[];
};

export type AffiliateResolveContext = {
  searchQuery: string;
  productTitle: string;
  category: ProductCategory;
  settings: WorkspaceAffiliateSettings;
};
