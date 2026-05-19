import type { AffiliateNetwork, ProductCategory, WorkspaceAffiliateSettings } from "./types.js";

const DEFAULT_ORDER: AffiliateNetwork[] = [
  "amazon",
  "ebay",
  "walmart",
  "bestbuy",
  "etsy",
];

const TECH_BIAS: AffiliateNetwork[] = [
  "amazon",
  "bestbuy",
  "walmart",
  "ebay",
  "etsy",
];

const LIFESTYLE_BIAS: AffiliateNetwork[] = [
  "amazon",
  "etsy",
  "ebay",
  "walmart",
  "bestbuy",
];

export const isAffiliateNetwork = (value: string): value is AffiliateNetwork =>
  value === "amazon" ||
  value === "ebay" ||
  value === "walmart" ||
  value === "bestbuy" ||
  value === "etsy";

export const rankAffiliateNetworks = (
  settings: WorkspaceAffiliateSettings,
  category: ProductCategory,
): AffiliateNetwork[] => {
  const configuredOrder = settings.affiliateFallbackOrder
    .filter(isAffiliateNetwork);

  const base =
    category === "tech"
      ? TECH_BIAS
      : category === "lifestyle"
        ? LIFESTYLE_BIAS
        : configuredOrder.length > 0
          ? configuredOrder
          : DEFAULT_ORDER;

  const seen = new Set<AffiliateNetwork>();
  const ordered: AffiliateNetwork[] = [];

  for (const network of base) {
    if (!seen.has(network)) {
      seen.add(network);
      ordered.push(network);
    }
  }

  for (const network of DEFAULT_ORDER) {
    if (!seen.has(network)) {
      seen.add(network);
      ordered.push(network);
    }
  }

  return ordered;
};

export const hasAnyAffiliateNetworkConfigured = (
  settings: WorkspaceAffiliateSettings,
): boolean => {
  if (settings.amazonAssociateTag?.trim() !== "") {
    return true;
  }
  if (settings.ebayCampaignId?.trim() !== "") {
    return true;
  }
  if (settings.walmartAffiliateId?.trim() !== "") {
    return true;
  }
  if (settings.bestBuyAffiliateId?.trim() !== "") {
    return true;
  }
  if (settings.etsyAwinAffiliateId?.trim() !== "") {
    return true;
  }
  return false;
};

export const isNetworkConfigured = (
  settings: WorkspaceAffiliateSettings,
  network: AffiliateNetwork,
): boolean => {
  switch (network) {
    case "amazon":
      return (settings.amazonAssociateTag?.trim() ?? "") !== "";
    case "ebay":
      return (settings.ebayCampaignId?.trim() ?? "") !== "";
    case "walmart":
      return (settings.walmartAffiliateId?.trim() ?? "") !== "";
    case "bestbuy":
      return (settings.bestBuyAffiliateId?.trim() ?? "") !== "";
    case "etsy":
      return (settings.etsyAwinAffiliateId?.trim() ?? "") !== "";
    default:
      return false;
  }
};
