import { z } from "zod";

export const createScheduledPublishSchema = z.object({
  workspaceId: z.string().min(1),
  renderedClipId: z.string().min(1),
  platform: z.enum(["youtube", "tiktok", "instagram"]),
  connectedAccountId: z.string().optional(),
  title: z.string().max(100).optional(),
  caption: z.string().max(5000).optional(),
  hashtags: z.array(z.string()).optional(),
  visibility: z.enum(["public", "private", "unlisted", "draft"]).default("public"),
  scheduledFor: z.string().datetime(),
});

export const updateScheduledPublishSchema = z.object({
  workspaceId: z.string().min(1),
  scheduledFor: z.string().datetime().optional(),
  status: z.enum(["scheduled", "cancelled"]).optional(),
  title: z.string().max(100).optional(),
  caption: z.string().max(5000).optional(),
});
