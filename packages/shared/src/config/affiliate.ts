export type AffiliateConfig = {
  openaiApiKey: string;
  openaiBaseUrl: string | undefined;
  openaiModel: string;
  paapiAccessKey: string | undefined;
  paapiSecretKey: string | undefined;
  paapiPartnerTag: string | undefined;
  paapiHost: string;
  paapiRegion: string;
  ebayClientId: string | undefined;
  ebayClientSecret: string | undefined;
};

export const getAffiliateConfig = (): AffiliateConfig => {
  const openaiApiKey = process.env.OPENAI_API_KEY?.trim() ?? "";
  const openaiBaseUrl = process.env.OPENAI_BASE_URL?.trim();
  const paapiAccessKey = process.env.AMAZON_PAAPI_ACCESS_KEY?.trim();
  const paapiSecretKey = process.env.AMAZON_PAAPI_SECRET_KEY?.trim();
  const ebayClientId = process.env.EBAY_CLIENT_ID?.trim();
  const ebayClientSecret = process.env.EBAY_CLIENT_SECRET?.trim();

  return {
    openaiApiKey,
    openaiBaseUrl:
      openaiBaseUrl !== undefined && openaiBaseUrl !== ""
        ? openaiBaseUrl
        : undefined,
    openaiModel: process.env.OPENAI_MODEL?.trim() ?? "gpt-4o-mini",
    paapiAccessKey:
      paapiAccessKey !== undefined && paapiAccessKey !== ""
        ? paapiAccessKey
        : undefined,
    paapiSecretKey:
      paapiSecretKey !== undefined && paapiSecretKey !== ""
        ? paapiSecretKey
        : undefined,
    paapiPartnerTag: process.env.AMAZON_PAAPI_PARTNER_TAG?.trim(),
    paapiHost:
      process.env.AMAZON_PAAPI_HOST?.trim() ?? "webservices.amazon.com",
    paapiRegion: process.env.AMAZON_PAAPI_REGION?.trim() ?? "us-east-1",
    ebayClientId:
      ebayClientId !== undefined && ebayClientId !== ""
        ? ebayClientId
        : undefined,
    ebayClientSecret:
      ebayClientSecret !== undefined && ebayClientSecret !== ""
        ? ebayClientSecret
        : undefined,
  };
};

export const isPaapiConfigured = (config: AffiliateConfig): boolean =>
  config.paapiAccessKey !== undefined &&
  config.paapiSecretKey !== undefined;
