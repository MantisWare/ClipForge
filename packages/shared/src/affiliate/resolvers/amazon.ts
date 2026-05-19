import {
  buildAmazonProductAffiliateUrl,
  buildAmazonSearchAffiliateUrl,
} from "../../amazon/affiliate-url.js";
import { searchAmazonProducts } from "../../amazon/paapi-search.js";
import { getAffiliateConfig, isPaapiConfigured } from "../../config/affiliate.js";
import type { AffiliateResolveContext, ResolvedAffiliateProduct } from "../types.js";

export const resolveAmazonProduct = async (
  ctx: AffiliateResolveContext,
): Promise<ResolvedAffiliateProduct | null> => {
  const tag = ctx.settings.amazonAssociateTag?.trim() ?? "";
  if (tag === "") {
    return null;
  }

  const marketplace = ctx.settings.amazonMarketplace;
  const config = getAffiliateConfig();
  let productUrl = buildAmazonSearchAffiliateUrl({
    searchQuery: ctx.searchQuery,
    associateTag: tag,
    marketplace,
  });
  let imageUrl: string | undefined;
  let priceLabel: string | undefined;
  let externalProductId: string | undefined;
  let usedProductApi = false;
  let productTitle = ctx.productTitle;

  if (isPaapiConfigured(config)) {
    try {
      const hits = await searchAmazonProducts({
        config,
        marketplace,
        associateTag: tag,
        searchQuery: ctx.searchQuery,
        itemCount: 3,
      });
      const best = hits[0];
      if (best !== undefined) {
        usedProductApi = true;
        externalProductId = best.asin;
        productUrl = buildAmazonProductAffiliateUrl({
          asin: best.asin,
          associateTag: tag,
          marketplace,
        });
        imageUrl = best.imageUrl;
        priceLabel = best.priceLabel;
        if (best.title !== "") {
          productTitle = best.title;
        }
      }
    } catch {
      /* search URL fallback */
    }
  }

  if (ctx.settings.requirePaapiForAmazon && !usedProductApi) {
    return null;
  }

  return {
    network: "amazon",
    productUrl,
    productTitle,
    imageUrl,
    priceLabel,
    externalProductId,
    ctaLabel: "Shop on Amazon",
    usedProductApi,
    attemptedNetworks: ["amazon"],
  };
};
