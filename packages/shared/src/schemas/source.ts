import { z } from "zod";

export const validateSourceSchema = z.object({
  sourceUrl: z.string().url("A valid URL is required"),
  workspaceId: z.string().min(1),
});

export const importSourceSchema = z.object({
  sourceUrl: z.string().url(),
  workspaceId: z.string().min(1),
  sourceType: z.enum(["youtube", "vimeo", "direct_url", "upload"]).optional(),
  title: z.string().optional(),
  description: z.string().optional(),
});

export type ValidateSourceInput = z.infer<typeof validateSourceSchema>;
export type ImportSourceInput = z.infer<typeof importSourceSchema>;
