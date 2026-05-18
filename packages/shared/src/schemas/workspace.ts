import { z } from "zod";

export const createWorkspaceSchema = z.object({
  name: z.string().min(1).max(100),
});

export type CreateWorkspaceInput = z.infer<typeof createWorkspaceSchema>;
