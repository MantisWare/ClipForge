import { createHash, createHmac } from "node:crypto";
import type { AffiliateConfig } from "../config/affiliate.js";
import {
  marketplaceHostForPaapi,
  normalizeAmazonMarketplace,
} from "./affiliate-url.js";

export type PaapiSearchHit = {
  asin: string;
  title: string;
  detailPageUrl?: string;
  imageUrl?: string;
  priceLabel?: string;
};

const sha256 = (value: string) =>
  createHash("sha256").update(value, "utf8").digest("hex");

const hmacSha256 = (key: Buffer | string, value: string) =>
  createHmac("sha256", key).update(value, "utf8").digest();

const signPaapiRequest = (input: {
  accessKey: string;
  secretKey: string;
  region: string;
  host: string;
  target: string;
  payload: string;
}): Record<string, string> => {
  const amzDate = new Date().toISOString().replace(/[:-]|\.\d{3}/g, "");
  const dateStamp = amzDate.slice(0, 8);
  const service = "ProductAdvertisingAPI";
  const canonicalUri = "/paapi5/searchitems";
  const canonicalQuerystring = "";
  const payloadHash = sha256(input.payload);
  const canonicalHeaders =
    `content-encoding:amz-1.0\ncontent-type:application/json; charset=utf-8\nhost:${input.host}\nx-amz-date:${amzDate}\nx-amz-target:${input.target}\n`;
  const signedHeaders = "content-encoding;content-type;host;x-amz-date;x-amz-target";
  const canonicalRequest = [
    "POST",
    canonicalUri,
    canonicalQuerystring,
    canonicalHeaders,
    signedHeaders,
    payloadHash,
  ].join("\n");

  const credentialScope = `${dateStamp}/${input.region}/${service}/aws4_request`;
  const stringToSign = [
    "AWS4-HMAC-SHA256",
    amzDate,
    credentialScope,
    sha256(canonicalRequest),
  ].join("\n");

  const kDate = hmacSha256(`AWS4${input.secretKey}`, dateStamp);
  const kRegion = hmacSha256(kDate, input.region);
  const kService = hmacSha256(kRegion, service);
  const kSigning = hmacSha256(kService, "aws4_request");
  const signature = hmacSha256(kSigning, stringToSign).toString("hex");

  return {
    Authorization: `AWS4-HMAC-SHA256 Credential=${input.accessKey}/${credentialScope}, SignedHeaders=${signedHeaders}, Signature=${signature}`,
    "Content-Encoding": "amz-1.0",
    "Content-Type": "application/json; charset=utf-8",
    Host: input.host,
    "X-Amz-Date": amzDate,
    "X-Amz-Target": input.target,
  };
};

export const searchAmazonProducts = async (input: {
  config: AffiliateConfig;
  marketplace: string;
  associateTag: string;
  searchQuery: string;
  itemCount?: number;
}): Promise<PaapiSearchHit[]> => {
  if (
    input.config.paapiAccessKey === undefined ||
    input.config.paapiSecretKey === undefined
  ) {
    return [];
  }

  const host = marketplaceHostForPaapi(input.marketplace);
  const partnerTag = input.associateTag;
  const marketplace = normalizeAmazonMarketplace(input.marketplace);
  const payload = JSON.stringify({
    Keywords: input.searchQuery,
    Resources: [
      "Images.Primary.Medium",
      "ItemInfo.Title",
      "Offers.Listings.Price",
    ],
    PartnerTag: partnerTag,
    PartnerType: "Associates",
    Marketplace: marketplace,
    ItemCount: input.itemCount ?? 3,
  });

  const target = "com.amazon.paapi5.v1.ProductAdvertisingAPIv1.SearchItems";
  const headers = signPaapiRequest({
    accessKey: input.config.paapiAccessKey,
    secretKey: input.config.paapiSecretKey,
    region: input.config.paapiRegion,
    host,
    target,
    payload,
  });

  const res = await fetch(`https://${host}/paapi5/searchitems`, {
    method: "POST",
    headers,
    body: payload,
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Amazon PA-API search failed: ${res.status} ${text}`);
  }

  const data = (await res.json()) as {
    SearchResult?: {
      Items?: Array<{
        ASIN?: string;
        DetailPageURL?: string;
        Images?: { Primary?: { Medium?: { URL?: string } } };
        ItemInfo?: { Title?: { DisplayValue?: string } };
        Offers?: {
          Listings?: Array<{ Price?: { DisplayAmount?: string } }>;
        };
      }>;
    };
  };

  const items = data.SearchResult?.Items ?? [];
  return items
    .filter((item) => item.ASIN !== undefined && item.ASIN !== "")
    .map((item) => ({
      asin: item.ASIN as string,
      title: item.ItemInfo?.Title?.DisplayValue ?? "Amazon product",
      detailPageUrl: item.DetailPageURL,
      imageUrl: item.Images?.Primary?.Medium?.URL,
      priceLabel: item.Offers?.Listings?.[0]?.Price?.DisplayAmount,
    }));
};
