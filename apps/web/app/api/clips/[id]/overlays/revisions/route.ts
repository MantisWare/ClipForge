import { apiError, apiSuccess } from "@/lib/api";
import { requireUser, requireWorkspace } from "@/lib/api-auth";
import { isOverlaysEnabled, overlaysDisabledResponse } from "@/lib/overlay-feature";
import { loadClipForWorkspace } from "@/lib/clip-access";
import { prisma } from "@clipforge/database";

export const GET = async (
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

  const { searchParams } = new URL(request.url);
  const workspaceId = searchParams.get("workspaceId");
  if (workspaceId === null || workspaceId === "") {
    return apiError("VALIDATION_ERROR", "workspaceId is required", 400);
  }

  const access = await requireWorkspace(authResult.userId, workspaceId);
  if ("error" in access) {
    return access.error;
  }

  const { id } = await params;
  const loaded = await loadClipForWorkspace(id);
  if ("error" in loaded) {
    return loaded.error;
  }

  if (loaded.workspaceId !== workspaceId) {
    return apiError("FORBIDDEN", "Clip not in workspace", 403);
  }

  const revisions = await prisma.clipOverlayRevision.findMany({
    where: { clipCandidateId: id },
    orderBy: { createdAt: "desc" },
    take: 20,
  });

  return apiSuccess(revisions);
};
