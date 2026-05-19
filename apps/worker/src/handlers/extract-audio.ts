import { runExtractAudio } from "../media/extract-audio.js";
import type { JobPayload } from "./types.js";

export const handleExtractAudio = async (payload: JobPayload) => {
  const sourceVideoId =
    typeof payload.sourceVideoId === "string"
      ? payload.sourceVideoId
      : undefined;

  if (sourceVideoId === undefined) {
    throw new Error("sourceVideoId is required for media.extract_audio");
  }

  const workspaceId =
    typeof payload.workspaceId === "string" ? payload.workspaceId : "";

  const audioStorageKey =
    typeof payload.audioStorageKey === "string"
      ? payload.audioStorageKey
      : undefined;

  await runExtractAudio({
    sourceVideoId,
    workspaceId,
    audioStorageKey,
  });
};
