import { apiError, apiSuccess } from "@/lib/api";
import { requireUser, requireWorkspace } from "@/lib/api-auth";
import { prisma, SourceStatus } from "@clipforge/database";
import { getSignedDownloadUrl } from "@clipforge/shared/server";

export const GET = async (
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) => {
  const authResult = await requireUser();
  if ("error" in authResult) {
    return authResult.error;
  }

  const { id } = await params;
  const source = await prisma.sourceVideo.findUnique({
    where: { id },
  });

  if (source === null) {
    return apiError("NOT_FOUND", "Source not found", 404);
  }

  const access = await requireWorkspace(authResult.userId, source.workspaceId);
  if ("error" in access) {
    return access.error;
  }

  const playableStatuses: SourceStatus[] = [
    SourceStatus.imported,
    SourceStatus.transcribing,
    SourceStatus.ready,
    SourceStatus.analyzing,
  ];

  if (source.storageKey === null) {
    return apiSuccess({
      status: source.status,
      playbackUrl: null,
    });
  }

  if (!playableStatuses.includes(source.status)) {
    return apiSuccess({
      status: source.status,
      playbackUrl: null,
    });
  }

  const playbackUrl = await getSignedDownloadUrl(source.storageKey, 3600);

  return apiSuccess({
    status: source.status,
    playbackUrl,
    expiresIn: 3600,
    durationSeconds: source.durationSeconds,
    width: source.width,
    height: source.height,
  });
};
