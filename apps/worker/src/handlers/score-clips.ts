import { runScoreClips } from "../ai/score-clips.js";
import type { JobPayload } from "./types.js";

export const handleScoreClips = async (payload: JobPayload) => {
  const sourceVideoId =
    typeof payload.sourceVideoId === "string"
      ? payload.sourceVideoId
      : undefined;

  if (sourceVideoId === undefined) {
    throw new Error("sourceVideoId is required for ai.score_clips");
  }

  const workspaceId =
    typeof payload.workspaceId === "string" ? payload.workspaceId : "";

  const clipCount =
    typeof payload.clipCount === "number" ? payload.clipCount : undefined;

  await runScoreClips({
    sourceVideoId,
    workspaceId,
    clipCount,
  });
};
