export type AffiliateNetworkFieldId =
  | "amazon_tag"
  | "amazon_marketplace"
  | "ebay"
  | "walmart"
  | "bestbuy"
  | "etsy";

export type AffiliateNetworkHelp = {
  signupUrl: string;
  title: string;
};

/** Official program pages to obtain affiliate IDs / tags. */
export const AFFILIATE_NETWORK_HELP: Record<
  AffiliateNetworkFieldId,
  AffiliateNetworkHelp
> = {
  amazon_tag: {
    signupUrl: "https://affiliate-program.amazon.com/",
    title: "Open Amazon Associates to create or find your tracking ID",
  },
  amazon_marketplace: {
    signupUrl:
      "https://affiliate-program.amazon.com/help/node/topic/GP38PJ6EUR6PFBEC",
    title: "Open Amazon Associates help for marketplace / store IDs",
  },
  ebay: {
    signupUrl: "https://partnernetwork.ebay.com/",
    title: "Open eBay Partner Network to get your campaign ID",
  },
  walmart: {
    signupUrl: "https://affiliates.walmart.com/",
    title: "Open Walmart Affiliates (Impact) to get your publisher ID",
  },
  bestbuy: {
    signupUrl: "https://www.bestbuyaffiliates.com/",
    title: "Open Best Buy Affiliates (Impact) to get your publisher ID",
  },
  etsy: {
    signupUrl: "https://www.awin.com/us/publishers",
    title: "Open Awin publisher signup (Etsy program) to get your affiliate ID",
  },
};
