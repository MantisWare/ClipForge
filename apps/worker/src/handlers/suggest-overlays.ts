import { runSuggestOverlays } from "../ai/suggest-overlays.js";
import type { JobPayload } from "./types.js";

export const handleSuggestOverlays = async (payload: JobPayload) => {
  await runSuggestOverlays(payload);
};
