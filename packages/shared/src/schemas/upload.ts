import { z } from "zod";

export const presignUploadSchema = z.object({
  workspaceId: z.string().min(1),
  filename: z.string().min(1).max(255),
  contentType: z.string().min(1).default("video/mp4"),
});

export const completeUploadSchema = z.object({
  workspaceId: z.string().min(1),
  storageKey: z.string().min(1),
  title: z.string().optional(),
});

export type PresignUploadInput = z.infer<typeof presignUploadSchema>;
export type CompleteUploadInput = z.infer<typeof completeUploadSchema>;
