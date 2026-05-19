import { runTranscribe } from "../media/transcribe-persist.js";
import type { JobPayload } from "./types.js";

export const handleTranscribe = async (payload: JobPayload) => {
  const sourceVideoId =
    typeof payload.sourceVideoId === "string"
      ? payload.sourceVideoId
      : undefined;

  if (sourceVideoId === undefined) {
    throw new Error("sourceVideoId is required for media.transcribe");
  }

  const workspaceId =
    typeof payload.workspaceId === "string" ? payload.workspaceId : "";

  const audioStorageKey =
    typeof payload.audioStorageKey === "string"
      ? payload.audioStorageKey
      : undefined;

  await runTranscribe({
    sourceVideoId,
    workspaceId,
    audioStorageKey,
  });
};
