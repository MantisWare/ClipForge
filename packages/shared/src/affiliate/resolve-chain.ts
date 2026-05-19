import {
  isNetworkConfigured,
  rankAffiliateNetworks,
} from "./network-order.js";
import { resolveAmazonProduct } from "./resolvers/amazon.js";
import { resolveBestbuyProduct } from "./resolvers/bestbuy.js";
import { resolveEbayProduct } from "./resolvers/ebay.js";
import { resolveEtsyProduct } from "./resolvers/etsy.js";
import { resolveWalmartProduct } from "./resolvers/walmart.js";
import type {
  AffiliateNetwork,
  AffiliateResolveContext,
  ResolvedAffiliateProduct,
} from "./types.js";

const resolveByNetwork = async (
  network: AffiliateNetwork,
  ctx: AffiliateResolveContext,
): Promise<ResolvedAffiliateProduct | null> => {
  switch (network) {
    case "amazon":
      return resolveAmazonProduct(ctx);
    case "ebay":
      return resolveEbayProduct(ctx);
    case "walmart":
      return resolveWalmartProduct(ctx);
    case "bestbuy":
      return resolveBestbuyProduct(ctx);
    case "etsy":
      return resolveEtsyProduct(ctx);
    default:
      return null;
  }
};

export const resolveAffiliateProductChain = async (
  ctx: AffiliateResolveContext,
): Promise<ResolvedAffiliateProduct> => {
  const ordered = rankAffiliateNetworks(ctx.settings, ctx.category);
  const attemptedNetworks: AffiliateNetwork[] = [];

  for (const network of ordered) {
    if (!isNetworkConfigured(ctx.settings, network)) {
      continue;
    }
    attemptedNetworks.push(network);
    const result = await resolveByNetwork(network, ctx);
    if (result !== null) {
      return {
        ...result,
        attemptedNetworks,
      };
    }
  }

  throw new Error(
    `No affiliate network could resolve a product. Configure at least one network in Monetization. Tried: ${attemptedNetworks.join(", ") || "none configured"}`,
  );
};
