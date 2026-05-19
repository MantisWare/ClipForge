import { z } from "zod";

export const updateWorkspaceOverlaySettingsSchema = z.object({
  defaultDisclosureText: z.string().max(1000).nullable().optional(),
  defaultLocale: z.string().max(16).optional(),
  urlAllowlist: z.array(z.string().max(253)).optional(),
  requireDisclosureOnExport: z.boolean().optional(),
  renderWebhookUrl: z.string().url().nullable().optional(),
});

export type UpdateWorkspaceOverlaySettingsInput = z.infer<
  typeof updateWorkspaceOverlaySettingsSchema
>;
