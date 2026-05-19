import { z } from "zod";

export const updateWorkspaceOverlaySettingsSchema = z.object({
  defaultDisclosureText: z.string().max(1000).nullable().optional(),
  defaultLocale: z.string().max(16).optional(),
  urlAllowlist: z.array(z.string().max(253)).optional(),
  requireDisclosureOnExport: z.boolean().optional(),
  renderWebhookUrl: z.string().url().nullable().optional(),
  amazonAssociateTag: z.string().max(64).nullable().optional(),
  amazonMarketplace: z.string().max(120).optional(),
  ebayCampaignId: z.string().max(64).nullable().optional(),
  walmartAffiliateId: z.string().max(64).nullable().optional(),
  bestBuyAffiliateId: z.string().max(64).nullable().optional(),
  etsyAwinAffiliateId: z.string().max(64).nullable().optional(),
  affiliateFallbackOrder: z.array(z.string().max(32)).optional(),
  aiProductDiscoveryEnabled: z.boolean().optional(),
  autoDiscoverOnApprove: z.boolean().optional(),
  requirePaapiForAmazon: z.boolean().optional(),
});

export type UpdateWorkspaceOverlaySettingsInput = z.infer<
  typeof updateWorkspaceOverlaySettingsSchema
>;
