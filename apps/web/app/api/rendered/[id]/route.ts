import { apiError, apiSuccess } from "@/lib/api";
import { requireUser, requireWorkspace } from "@/lib/api-auth";
import { prisma, RenderStatus } from "@clipforge/database";
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
  const rendered = await prisma.renderedClip.findUnique({
    where: { id },
    include: {
      clipCandidate: {
        include: { sourceVideo: true },
      },
    },
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

  let playbackUrl: string | null = null;
  if (
    rendered.status === RenderStatus.ready &&
    rendered.storageKey !== null
  ) {
    playbackUrl = await getSignedDownloadUrl(rendered.storageKey, 3600);
  }

  return apiSuccess({
    ...rendered,
    playbackUrl,
  });
};
