import { runApplyOverlays } from "../render/run-apply-overlays.js";
import type { JobPayload } from "./types.js";

export const handleRenderApplyOverlays = async (payload: JobPayload) => {
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
      "renderedClipId and clipCandidateId are required for render.apply_overlays",
    );
  }

  await runApplyOverlays({
    renderedClipId,
    clipCandidateId,
    workspaceId,
  });
};
