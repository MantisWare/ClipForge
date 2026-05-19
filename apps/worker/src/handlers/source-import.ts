import { runSourceImport } from "../import/pipeline.js";
import type { JobPayload } from "./types.js";

export const handleSourceImport = async (payload: JobPayload) => {
  const sourceVideoId =
    typeof payload.sourceVideoId === "string"
      ? payload.sourceVideoId
      : undefined;

  if (sourceVideoId === undefined) {
    throw new Error("sourceVideoId is required for source.import");
  }

  const workspaceId =
    typeof payload.workspaceId === "string" ? payload.workspaceId : "";

  await runSourceImport({
    sourceVideoId,
    workspaceId,
    skipDownload: payload.skipDownload === true,
    storageKey:
      typeof payload.storageKey === "string" ? payload.storageKey : undefined,
  });
};
