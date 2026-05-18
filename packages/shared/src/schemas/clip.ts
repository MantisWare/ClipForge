import { z } from "zod";

export const generateCandidatesSchema = z.object({
  sourceVideoId: z.string().min(1),
  workspaceId: z.string().min(1),
  clipCount: z.number().int().min(1).max(20).default(10),
});

export const approveClipSchema = z.object({
  workspaceId: z.string().min(1),
});

export const rejectClipSchema = z.object({
  workspaceId: z.string().min(1),
  reason: z.string().optional(),
});

export const renderClipSchema = z.object({
  workspaceId: z.string().min(1),
  renderPreset: z.string().default("vertical_1080x1920"),
  captionStyleId: z.string().optional(),
});

export type GenerateCandidatesInput = z.infer<typeof generateCandidatesSchema>;
export type ApproveClipInput = z.infer<typeof approveClipSchema>;
export type RenderClipInput = z.infer<typeof renderClipSchema>;
