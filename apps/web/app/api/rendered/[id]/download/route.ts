import { apiError, apiSuccess } from "@/lib/api";
import { requireUser, requireWorkspace } from "@/lib/api-auth";
import { prisma, RenderStatus } from "@clipforge/database";
import { getSignedDownloadUrl } from "@clipforge/shared/server";

export const GET = async (
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) => {
  const authResult = await requireUser();
  if ("error" in authResult) {
    return authResult.error;
  }

  const { id } = await params;
  const rendered = await prisma.renderedClip.findUnique({
    where: { id },
  });

  if (rendered === null) {
    return apiError("NOT_FOUND", "Rendered clip not found", 404);
  }

  const access = await requireWorkspace(
    authResult.userId,
    rendered.workspaceId,
  );
  if ("error" in access) {
    return access.error;
  }

  if (rendered.status !== RenderStatus.ready) {
    return apiError("VALIDATION_ERROR", "Rendered clip is not ready", 400);
  }

  const { searchParams } = new URL(request.url);
  const variant = searchParams.get("variant");

  let key = rendered.storageKey;
  if (variant === "clean") {
    key = rendered.cleanStorageKey ?? rendered.storageKey;
  } else if (variant === "monetized") {
    key = rendered.storageKey;
  } else if (
    rendered.cleanStorageKey !== null &&
    rendered.cleanStorageKey !== rendered.storageKey
  ) {
    key = rendered.storageKey;
  }

  if (key === null) {
    return apiError("VALIDATION_ERROR", "No video file available", 400);
  }

  const downloadUrl = await getSignedDownloadUrl(key, 600);
  const suffix = variant === "clean" ? "-clean" : "";

  return apiSuccess({
    downloadUrl,
    expiresIn: 600,
    filename: `clipforge-${id}${suffix}.mp4`,
    variant: variant ?? "default",
  });
};
