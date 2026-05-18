import { z } from "zod";

const publishBaseSchema = z.object({
  renderedClipId: z.string().min(1),
  workspaceId: z.string().min(1),
  connectedAccountId: z.string().optional(),
  title: z.string().optional(),
  caption: z.string().optional(),
  hashtags: z.array(z.string()).default([]),
  visibility: z
    .enum(["public", "private", "unlisted", "draft"])
    .default("public"),
  scheduledFor: z.string().datetime().optional(),
});

export const publishYouTubeSchema = publishBaseSchema;
export const publishTikTokSchema = publishBaseSchema;
export const publishInstagramSchema = publishBaseSchema;

export type PublishYouTubeInput = z.infer<typeof publishYouTubeSchema>;
