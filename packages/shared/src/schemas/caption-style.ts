import { z } from "zod";

const assTemplateSchema = z.object({
  fontName: z.string().optional(),
  fontSize: z.number().int().positive().optional(),
  primaryColor: z.string().optional(),
  outlineColor: z.string().optional(),
  backColor: z.string().optional(),
  bold: z.boolean().optional(),
  outline: z.number().int().nonnegative().optional(),
  shadow: z.number().int().nonnegative().optional(),
});

export const createCaptionStyleSchema = z.object({
  workspaceId: z.string().min(1),
  brandKitId: z.string().optional(),
  name: z.string().min(1).max(100),
  presetKey: z.string().min(1).max(50),
  assTemplate: assTemplateSchema.optional(),
  isDefault: z.boolean().optional(),
});

export const updateCaptionStyleSchema = z.object({
  workspaceId: z.string().min(1),
  name: z.string().min(1).max(100).optional(),
  brandKitId: z.string().nullable().optional(),
  assTemplate: assTemplateSchema.optional(),
  isDefault: z.boolean().optional(),
});
