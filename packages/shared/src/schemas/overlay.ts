import { z } from "zod";

export const overlayTypeSchema = z.enum([
  "end_slate",
  "product_pin",
  "affiliate_bar",
  "sponsor_segment",
  "promo_code",
  "qr_card",
  "image",
]);

export const overlayComplianceSchema = z.enum([
  "none",
  "affiliate",
  "sponsored",
  "ad",
]);

export const overlayPositionSchema = z.object({
  anchor: z
    .enum([
      "top_left",
      "top_right",
      "bottom_left",
      "bottom_right",
      "center",
      "bottom_center",
    ])
    .default("bottom_right"),
  marginPx: z.number().int().min(0).default(80),
  x: z.number().min(0).max(1).optional(),
  y: z.number().min(0).max(1).optional(),
  width: z.number().min(0).max(1).optional(),
  height: z.number().min(0).max(1).optional(),
});

export const overlayStyleSchema = z
  .record(z.string(), z.unknown())
  .default({});

export const createOverlayTemplateSchema = z.object({
  workspaceId: z.string().min(1),
  name: z.string().min(1).max(120),
  overlayType: overlayTypeSchema,
  config: z.record(z.string(), z.unknown()).default({}),
});

export const updateOverlayTemplateSchema = z.object({
  workspaceId: z.string().min(1),
  name: z.string().min(1).max(120).optional(),
  config: z.record(z.string(), z.unknown()).optional(),
});

export const createProductLinkSchema = z.object({
  workspaceId: z.string().min(1),
  title: z.string().min(1).max(200),
  url: z.string().url(),
  imageUrl: z.string().url().optional(),
  priceLabel: z.string().max(40).optional(),
  affiliateNetwork: z.string().max(64).optional(),
  disclosureText: z.string().max(500).optional(),
  active: z.boolean().default(true),
});

export const updateProductLinkSchema = z.object({
  workspaceId: z.string().min(1),
  title: z.string().min(1).max(200).optional(),
  url: z.string().url().optional(),
  imageUrl: z.string().url().nullable().optional(),
  priceLabel: z.string().max(40).nullable().optional(),
  affiliateNetwork: z.string().max(64).nullable().optional(),
  disclosureText: z.string().max(500).nullable().optional(),
  active: z.boolean().optional(),
});

export const clipOverlayItemSchema = z.object({
  id: z.string().optional(),
  overlayType: overlayTypeSchema,
  templateId: z.string().optional(),
  productLinkId: z.string().optional(),
  startMs: z.number().int().min(0),
  endMs: z.number().int().min(0),
  position: overlayPositionSchema.default({ anchor: "bottom_right", marginPx: 80 }),
  style: overlayStyleSchema,
  compliance: overlayComplianceSchema.default("none"),
  sortOrder: z.number().int().default(0),
  isDraft: z.boolean().default(false),
});

export const replaceClipOverlaysSchema = z.object({
  workspaceId: z.string().min(1),
  overlays: z.array(clipOverlayItemSchema).max(5),
});

export const suggestOverlaysSchema = z.object({
  workspaceId: z.string().min(1),
});

export const confirmOverlayDraftsSchema = z.object({
  workspaceId: z.string().min(1),
});

export const applyOverlayPackSchema = z.object({
  workspaceId: z.string().min(1),
  clipCandidateIds: z.array(z.string().min(1)).min(1).max(50),
  templateIds: z.array(z.string().min(1)).min(1).max(10),
});

export const attachOverlayPackSchema = z.object({
  workspaceId: z.string().min(1),
  templateIds: z.array(z.string().min(1)).min(1).max(10),
});

export const importProductLinksCsvSchema = z.object({
  workspaceId: z.string().min(1),
  csv: z.string().min(1),
});

export type OverlayType = z.infer<typeof overlayTypeSchema>;
export type OverlayCompliance = z.infer<typeof overlayComplianceSchema>;
export type ClipOverlayItem = z.infer<typeof clipOverlayItemSchema>;
