import type { AffiliateResolveContext, ResolvedAffiliateProduct } from "../types.js";

const ETSY_AWIN_MID = "10696";

export const buildEtsySearchAffiliateUrl = (input: {
  searchQuery: string;
  awinAffiliateId: string;
}): string => {
  const destination = new URL("https://www.etsy.com/search");
  destination.searchParams.set("q", input.searchQuery);
  const encoded = encodeURIComponent(destination.toString());
  return `https://www.awin1.com/cread.php?awinmid=${ETSY_AWIN_MID}&awinaffid=${input.awinAffiliateId}&ued=${encoded}`;
};

export const resolveEtsyProduct = async (
  ctx: AffiliateResolveContext,
): Promise<ResolvedAffiliateProduct | null> => {
  const awinAffiliateId = ctx.settings.etsyAwinAffiliateId?.trim() ?? "";
  if (awinAffiliateId === "") {
    return null;
  }

  return {
    network: "etsy",
    productUrl: buildEtsySearchAffiliateUrl({
      searchQuery: ctx.searchQuery,
      awinAffiliateId,
    }),
    productTitle: ctx.productTitle,
    ctaLabel: "Shop on Etsy",
    usedProductApi: false,
    attemptedNetworks: ["etsy"],
  };
};
