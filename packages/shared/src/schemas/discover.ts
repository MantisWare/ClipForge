import { z } from "zod";

export const discoverQuerySchema = z.object({
  region: z.string().default("US"),
  category: z.string().optional(),
  keyword: z.string().optional(),
  maxResults: z.coerce.number().int().min(1).max(50).default(20),
});

export type DiscoverQueryInput = z.infer<typeof discoverQuerySchema>;
