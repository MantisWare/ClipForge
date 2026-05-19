import { apiError, apiSuccess } from "@/lib/api";
import { requireUser, requireWorkspace } from "@/lib/api-auth";
import { loadClipForWorkspace } from "@/lib/clip-access";
import { isOverlaysEnabled, overlaysDisabledResponse } from "@/lib/overlay-feature";
import { generateCtaVariants } from "@clipforge/shared";

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
  const productTitle = searchParams.get("productTitle");

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

  const variants = generateCtaVariants({
    hook: loaded.clip.suggestedHook,
    productTitle: productTitle ?? undefined,
  });

  return apiSuccess({ variants });
};
