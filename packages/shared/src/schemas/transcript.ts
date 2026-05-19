import { z } from "zod";

export const startTranscribeSchema = z.object({
  force: z.boolean().optional(),
});

export type StartTranscribeInput = z.infer<typeof startTranscribeSchema>;
