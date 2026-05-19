import { apiError, apiSuccess } from "@/lib/api";
import { requireUser, requireWorkspace } from "@/lib/api-auth";
import {
  ClipStatus,
  prisma,
  PublishJobStatus,
  RenderStatus,
  SourceStatus,
} from "@clipforge/database";

export const GET = async (request: Request) => {
  const authResult = await requireUser();
  if ("error" in authResult) {
    return authResult.error;
  }

  const { searchParams } = new URL(request.url);
  const workspaceId = searchParams.get("workspaceId");
  const daysRaw = searchParams.get("days");
  const days =
    daysRaw !== null && daysRaw !== ""
      ? Number.parseInt(daysRaw, 10)
      : 30;

  if (workspaceId === null || workspaceId === "") {
    return apiError("VALIDATION_ERROR", "workspaceId is required", 400);
  }

  const access = await requireWorkspace(authResult.userId, workspaceId);
  if ("error" in access) {
    return access.error;
  }

  const since = new Date();
  since.setDate(since.getDate() - days);

  const [
    sourcesTotal,
    sourcesRecent,
    clipsTotal,
    clipsApproved,
    rendersReady,
    rendersRecent,
    publishAttempts,
    publishSuccess,
  ] = await Promise.all([
    prisma.sourceVideo.count({ where: { workspaceId } }),
    prisma.sourceVideo.count({
      where: { workspaceId, createdAt: { gte: since } },
    }),
    prisma.clipCandidate.count({
      where: { sourceVideo: { workspaceId } },
    }),
    prisma.clipCandidate.count({
      where: {
        sourceVideo: { workspaceId },
        status: { in: [ClipStatus.approved, ClipStatus.rendered, ClipStatus.published] },
      },
    }),
    prisma.renderedClip.count({
      where: { workspaceId, status: RenderStatus.ready },
    }),
    prisma.renderedClip.count({
      where: { workspaceId, createdAt: { gte: since } },
    }),
    prisma.publishJob.count({
      where: { workspaceId, createdAt: { gte: since } },
    }),
    prisma.publishJob.count({
      where: {
        workspaceId,
        createdAt: { gte: since },
        status: PublishJobStatus.published,
      },
    }),
  ]);

  const sourcesReady = await prisma.sourceVideo.count({
    where: { workspaceId, status: SourceStatus.ready },
  });

  return apiSuccess({
    periodDays: days,
    sources: {
      total: sourcesTotal,
      recent: sourcesRecent,
      ready: sourcesReady,
    },
    clips: { total: clipsTotal, approved: clipsApproved },
    renders: { ready: rendersReady, recent: rendersRecent },
    publishing: {
      attempts: publishAttempts,
      success: publishSuccess,
      successRate:
        publishAttempts > 0 ? publishSuccess / publishAttempts : null,
    },
  });
};
