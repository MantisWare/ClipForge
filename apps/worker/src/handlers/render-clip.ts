import { runRenderClip } from "../render/run-render-clip.js";
import type { JobPayload } from "./types.js";

export const handleRenderClip = async (payload: JobPayload) => {
  const renderedClipId =
    typeof payload.renderedClipId === "string"
      ? payload.renderedClipId
      : undefined;
  const clipCandidateId =
    typeof payload.clipCandidateId === "string"
      ? payload.clipCandidateId
      : undefined;
  const workspaceId =
    typeof payload.workspaceId === "string" ? payload.workspaceId : "";

  if (renderedClipId === undefined || clipCandidateId === undefined) {
    throw new Error(
      "renderedClipId and clipCandidateId are required for render.clip",
    );
  }

  const includeOverlays =
    payload.includeOverlays === true || payload.includeOverlays === "true";
  const brandKitId =
    typeof payload.brandKitId === "string" ? payload.brandKitId : undefined;

  await runRenderClip({
    renderedClipId,
    clipCandidateId,
    workspaceId,
    includeOverlays,
    brandKitId,
  });
};
