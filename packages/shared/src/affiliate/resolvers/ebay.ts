import { getAffiliateConfig } from "../../config/affiliate.js";
import type { AffiliateResolveContext, ResolvedAffiliateProduct } from "../types.js";

const EBAY_ROVER_BASE =
  "https://rover.ebay.com/rover/1/711-53200-19255-0/1";

export const buildEbaySearchAffiliateUrl = (input: {
  searchQuery: string;
  campaignId: string;
}): string => {
  const destination = new URL("https://www.ebay.com/sch/i.html");
  destination.searchParams.set("_nkw", input.searchQuery);
  const rover = new URL(EBAY_ROVER_BASE);
  rover.searchParams.set("mpre", destination.toString());
  rover.searchParams.set("campid", input.campaignId);
  rover.searchParams.set("toolid", "10001");
  return rover.toString();
};

type EbaySearchItem = {
  itemId: string;
  title: string;
  itemWebUrl?: string;
  imageUrl?: string;
  priceLabel?: string;
};

const searchEbayBrowseApi = async (
  searchQuery: string,
): Promise<EbaySearchItem | null> => {
  const config = getAffiliateConfig();
  if (
    config.ebayClientId === undefined ||
    config.ebayClientSecret === undefined
  ) {
    return null;
  }

  const credentials = Buffer.from(
    `${config.ebayClientId}:${config.ebayClientSecret}`,
  ).toString("base64");

  const tokenRes = await fetch(
    "https://api.ebay.com/identity/v1/oauth2/token",
    {
      method: "POST",
      headers: {
        Authorization: `Basic ${credentials}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: "grant_type=client_credentials&scope=https://api.ebay.com/oauth/api_scope",
    },
  );

  if (!tokenRes.ok) {
    return null;
  }

  const tokenJson = (await tokenRes.json()) as { access_token?: string };
  if (tokenJson.access_token === undefined) {
    return null;
  }

  const params = new URLSearchParams({
    q: searchQuery,
    limit: "3",
  });

  const searchRes = await fetch(
    `https://api.ebay.com/buy/browse/v1/item_summary/search?${params.toString()}`,
    {
      headers: {
        Authorization: `Bearer ${tokenJson.access_token}`,
        "X-EBAY-C-MARKETPLACE-ID": "EBAY_US",
      },
    },
  );

  if (!searchRes.ok) {
    return null;
  }

  const data = (await searchRes.json()) as {
    itemSummaries?: Array<{
      itemId?: string;
      title?: string;
      itemWebUrl?: string;
      image?: { imageUrl?: string };
      price?: { value?: string; currency?: string };
    }>;
  };

  const first = data.itemSummaries?.[0];
  if (first?.itemId === undefined) {
    return null;
  }

  return {
    itemId: first.itemId,
    title: first.title ?? "eBay listing",
    itemWebUrl: first.itemWebUrl,
    imageUrl: first.image?.imageUrl,
    priceLabel:
      first.price?.value !== undefined
        ? `${first.price.currency ?? "$"}${first.price.value}`
        : undefined,
  };
};

export const resolveEbayProduct = async (
  ctx: AffiliateResolveContext,
): Promise<ResolvedAffiliateProduct | null> => {
  const campaignId = ctx.settings.ebayCampaignId?.trim() ?? "";
  if (campaignId === "") {
    return null;
  }

  const apiHit = await searchEbayBrowseApi(ctx.searchQuery);
  if (apiHit !== null) {
    const productUrl = buildEbaySearchAffiliateUrl({
      searchQuery: ctx.searchQuery,
      campaignId,
    });
    return {
      network: "ebay",
      productUrl: apiHit.itemWebUrl ?? productUrl,
      productTitle: apiHit.title,
      imageUrl: apiHit.imageUrl,
      priceLabel: apiHit.priceLabel,
      externalProductId: apiHit.itemId,
      ctaLabel: "Shop on eBay",
      usedProductApi: true,
      attemptedNetworks: ["ebay"],
    };
  }

  return {
    network: "ebay",
    productUrl: buildEbaySearchAffiliateUrl({
      searchQuery: ctx.searchQuery,
      campaignId,
    }),
    productTitle: ctx.productTitle,
    ctaLabel: "Shop on eBay",
    usedProductApi: false,
    attemptedNetworks: ["ebay"],
  };
};
