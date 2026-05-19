const MARKETPLACE_TO_TLD: Record<string, string> = {
  "www.amazon.com": "com",
  "amazon.com": "com",
  "www.amazon.co.uk": "co.uk",
  "amazon.co.uk": "co.uk",
  "www.amazon.de": "de",
  "amazon.de": "de",
  "www.amazon.ca": "ca",
  "amazon.ca": "ca",
};

export const normalizeAmazonMarketplace = (marketplace: string): string => {
  const trimmed = marketplace.trim().toLowerCase();
  if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
    try {
      return new URL(trimmed).hostname;
    } catch {
      return "www.amazon.com";
    }
  }
  if (trimmed.includes(".")) {
    return trimmed.startsWith("www.") ? trimmed : `www.${trimmed}`;
  }
  return `www.amazon.${trimmed}`;
};

export const buildAmazonProductAffiliateUrl = (input: {
  asin: string;
  associateTag: string;
  marketplace?: string;
}): string => {
  const host = normalizeAmazonMarketplace(input.marketplace ?? "www.amazon.com");
  const url = new URL(`https://${host}/dp/${input.asin}`);
  url.searchParams.set("tag", input.associateTag);
  return url.toString();
};

export const buildAmazonSearchAffiliateUrl = (input: {
  searchQuery: string;
  associateTag: string;
  marketplace?: string;
}): string => {
  const host = normalizeAmazonMarketplace(input.marketplace ?? "www.amazon.com");
  const url = new URL(`https://${host}/s`);
  url.searchParams.set("k", input.searchQuery);
  url.searchParams.set("tag", input.associateTag);
  return url.toString();
};

export const marketplaceHostForPaapi = (marketplace: string): string => {
  const host = normalizeAmazonMarketplace(marketplace);
  const tld = MARKETPLACE_TO_TLD[host];
  if (tld === "co.uk") {
    return "webservices.amazon.co.uk";
  }
  if (tld === "de") {
    return "webservices.amazon.de";
  }
  if (tld === "ca") {
    return "webservices.amazon.ca";
  }
  return "webservices.amazon.com";
};
