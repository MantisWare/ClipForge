import { z } from "zod";

export const discoverAmazonProductSchema = z.object({
  workspaceId: z.string().min(1),
  replaceExistingDraft: z.boolean().optional(),
});

export const aiProductDiscoveryResultSchema = z.object({
  searchQuery: z.string().min(1).max(200),
  productTitle: z.string().min(1).max(200),
  rationale: z.string().max(500),
  placementHint: z.string().max(80).optional(),
  suggestedCategory: z.string().max(80).optional(),
  productCategory: z.enum(["tech", "lifestyle", "general"]).optional(),
});

export type AiProductDiscoveryResult = z.infer<
  typeof aiProductDiscoveryResultSchema
>;

export const discoverAmazonProductJobResultSchema = z.object({
  productLinkId: z.string(),
  overlayId: z.string().optional(),
  productUrl: z.string().url(),
  searchQuery: z.string(),
  productTitle: z.string(),
  rationale: z.string(),
  affiliateNetwork: z.string(),
  usedProductApi: z.boolean(),
  externalProductId: z.string().optional(),
  attemptedNetworks: z.array(z.string()).optional(),
  imageStorageKey: z.string().optional(),
  reusedCatalog: z.boolean().optional(),
});

export type DiscoverAmazonProductJobResult = z.infer<
  typeof discoverAmazonProductJobResultSchema
>;
