import { z } from "zod";

export const batchGenerateSchema = z.object({
  workspaceId: z.string().min(1),
  sourceVideoId: z.string().min(1),
});

export const batchRenderSchema = z.object({
  workspaceId: z.string().min(1),
  clipCandidateIds: z.array(z.string().min(1)).min(1).max(20),
  renderPreset: z.string().optional(),
  captionStyleId: z.string().optional(),
});
