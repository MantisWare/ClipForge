import { z } from "zod";

const hexColor = z
  .string()
  .regex(/^#[0-9A-Fa-f]{6}$/, "Expected hex color like #FFFFFF");

export const createBrandKitSchema = z.object({
  workspaceId: z.string().min(1),
  name: z.string().min(1).max(100),
  primaryColor: hexColor.default("#FFFFFF"),
  secondaryColor: hexColor.optional(),
  fontFamily: z.string().min(1).max(80).default("Inter"),
  hookFontSize: z.number().int().min(24).max(96).default(48),
  isDefault: z.boolean().optional(),
});

export const updateBrandKitSchema = z.object({
  workspaceId: z.string().min(1),
  name: z.string().min(1).max(100).optional(),
  primaryColor: hexColor.optional(),
  secondaryColor: hexColor.nullable().optional(),
  fontFamily: z.string().min(1).max(80).optional(),
  hookFontSize: z.number().int().min(24).max(96).optional(),
  isDefault: z.boolean().optional(),
  logoStorageKey: z.string().nullable().optional(),
});

export const brandKitLogoPresignSchema = z.object({
  workspaceId: z.string().min(1),
  contentType: z.enum(["image/png", "image/jpeg", "image/webp"]),
});
