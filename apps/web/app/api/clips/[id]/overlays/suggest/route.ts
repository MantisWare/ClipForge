import { apiError, apiSuccess, parseJsonBody } from "@/lib/api";
import { requireUser, requireWorkspaceEditor } from "@/lib/api-auth";
import { loadClipForWorkspace, requireApprovedClip } from "@/lib/clip-access";
import { isOverlaysEnabled, overlaysDisabledResponse } from "@/lib/overlay-feature";
import { enqueueJob } from "@/lib/queue";
import { suggestOverlaysSchema } from "@clipforge/shared";

export const POST = async (
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) => {
  if (!isOverlaysEnabled()) {
    return overlaysDisabledResponse();
  }

  const authResult = await requireUser();
  if ("error" in authResult) {
    return authResult.error;
  }

  const { id } = await params;
  const body = await parseJsonBody<unknown>(request);
  const parsed = suggestOverlaysSchema.safeParse(body);
  if (!parsed.success) {
    return apiError("VALIDATION_ERROR", parsed.error.message, 400);
  }

  const loaded = await loadClipForWorkspace(id);
  if ("error" in loaded) {
    return loaded.error;
  }

  const access = await requireWorkspaceEditor(
    authResult.userId,
    parsed.data.workspaceId,
  );
  if ("error" in access) {
    return access.error;
  }

  if (loaded.workspaceId !== parsed.data.workspaceId) {
    return apiError("FORBIDDEN", "Clip not in workspace", 403);
  }

  const statusError = requireApprovedClip(loaded.clip.status);
  if (statusError !== null) {
    return statusError;
  }

  const job = await enqueueJob({
    workspaceId: parsed.data.workspaceId,
    type: "ai.suggest_overlays",
    sourceVideoId: loaded.clip.sourceVideoId,
    payload: {
      clipCandidateId: id,
      workspaceId: parsed.data.workspaceId,
    },
  });

  return apiSuccess({ job }, 202);
};
