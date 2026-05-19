import type { AffiliateResolveContext, ResolvedAffiliateProduct } from "../types.js";

export const buildBestBuySearchAffiliateUrl = (input: {
  searchQuery: string;
  affiliateId: string;
}): string => {
  const destination = new URL(
    "https://www.bestbuy.com/site/searchpage.jsp",
  );
  destination.searchParams.set("st", input.searchQuery);
  const encoded = encodeURIComponent(destination.toString());
  return `https://bestbuy.7tiv.net/c/${input.affiliateId}/10445/3760?u=${encoded}`;
};

export const resolveBestbuyProduct = async (
  ctx: AffiliateResolveContext,
): Promise<ResolvedAffiliateProduct | null> => {
  const affiliateId = ctx.settings.bestBuyAffiliateId?.trim() ?? "";
  if (affiliateId === "") {
    return null;
  }

  return {
    network: "bestbuy",
    productUrl: buildBestBuySearchAffiliateUrl({
      searchQuery: ctx.searchQuery,
      affiliateId,
    }),
    productTitle: ctx.productTitle,
    ctaLabel: "Shop at Best Buy",
    usedProductApi: false,
    attemptedNetworks: ["bestbuy"],
  };
};
