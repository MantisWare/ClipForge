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
  brandKitId: z.string().optional(),
  includeOverlays: z.boolean().default(false),
});

export const llmPlatformFitSchema = z.object({
  youtubeShorts: z.number().min(0).max(100),
  tiktok: z.number().min(0).max(100),
  instagramReels: z.number().min(0).max(100),
});

export const llmClipScoreSchema = z.object({
  windowId: z.string().min(1),
  overallScore: z.number().min(0).max(100),
  hookScore: z.number().min(0).max(100),
  standaloneScore: z.number().min(0).max(100),
  retentionScore: z.number().min(0).max(100),
  platformFit: llmPlatformFitSchema,
  suggestedStartAdjustmentMs: z.number(),
  suggestedEndAdjustmentMs: z.number(),
  suggestedHook: z.string(),
  suggestedTitle: z.string(),
  suggestedCaption: z.string(),
  suggestedHashtags: z.array(z.string()),
  reasonSelected: z.string(),
  warnings: z.array(z.string()).default([]),
});

export const scoreClipsResponseSchema = z.object({
  scores: z.array(llmClipScoreSchema),
  heuristicOnly: z.boolean().default(false),
});

export const updateClipSchema = z.object({
  workspaceId: z.string().min(1),
  suggestedHook: z.string().optional(),
  suggestedTitle: z.string().optional(),
  suggestedCaption: z.string().optional(),
  suggestedHashtags: z.array(z.string()).optional(),
  startMs: z.number().int().min(0).optional(),
  endMs: z.number().int().min(0).optional(),
});

export type GenerateCandidatesInput = z.infer<typeof generateCandidatesSchema>;
export type ApproveClipInput = z.infer<typeof approveClipSchema>;
export type RenderClipInput = z.infer<typeof renderClipSchema>;
export type UpdateClipInput = z.infer<typeof updateClipSchema>;
export type LlmClipScoreParsed = z.infer<typeof llmClipScoreSchema>;
