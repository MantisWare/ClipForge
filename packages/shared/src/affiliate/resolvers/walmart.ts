import type { AffiliateResolveContext, ResolvedAffiliateProduct } from "../types.js";

export const buildWalmartSearchAffiliateUrl = (input: {
  searchQuery: string;
  affiliateId: string;
}): string => {
  const destination = new URL("https://www.walmart.com/search");
  destination.searchParams.set("q", input.searchQuery);
  const encoded = encodeURIComponent(destination.toString());
  return `https://goto.walmart.com/c/${input.affiliateId}/5688/93838?veh=aff&sourceid=imp_clipforge&u=${encoded}`;
};

export const resolveWalmartProduct = async (
  ctx: AffiliateResolveContext,
): Promise<ResolvedAffiliateProduct | null> => {
  const affiliateId = ctx.settings.walmartAffiliateId?.trim() ?? "";
  if (affiliateId === "") {
    return null;
  }

  return {
    network: "walmart",
    productUrl: buildWalmartSearchAffiliateUrl({
      searchQuery: ctx.searchQuery,
      affiliateId,
    }),
    productTitle: ctx.productTitle,
    ctaLabel: "Shop at Walmart",
    usedProductApi: false,
    attemptedNetworks: ["walmart"],
  };
};
