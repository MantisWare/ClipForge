import { apiError, apiSuccess } from "@/lib/api";
import { requireUser, requireWorkspace } from "@/lib/api-auth";
import { prisma, PublishJobStatus } from "@clipforge/database";

export const GET = async (request: Request) => {
  const authResult = await requireUser();
  if ("error" in authResult) {
    return authResult.error;
  }

  const { searchParams } = new URL(request.url);
  const workspaceId = searchParams.get("workspaceId");
  const fromRaw = searchParams.get("from");
  const toRaw = searchParams.get("to");

  if (workspaceId === null || workspaceId === "") {
    return apiError("VALIDATION_ERROR", "workspaceId is required", 400);
  }

  const access = await requireWorkspace(authResult.userId, workspaceId);
  if ("error" in access) {
    return access.error;
  }

  const from =
    fromRaw !== null && fromRaw !== ""
      ? new Date(fromRaw)
      : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const to =
    toRaw !== null && toRaw !== ""
      ? new Date(toRaw)
      : new Date(Date.now() + 60 * 24 * 60 * 60 * 1000);

  const scheduled = await prisma.scheduledPublish.findMany({
    where: {
      workspaceId,
      scheduledFor: { gte: from, lte: to },
    },
    include: {
      renderedClip: {
        include: {
          clipCandidate: { select: { suggestedTitle: true } },
        },
      },
    },
    orderBy: { scheduledFor: "asc" },
  });

  const published = await prisma.publishJob.findMany({
    where: {
      workspaceId,
      scheduledFor: { gte: from, lte: to },
      status: {
        in: [
          PublishJobStatus.published,
          PublishJobStatus.failed,
          PublishJobStatus.queued,
          PublishJobStatus.publishing,
        ],
      },
    },
    orderBy: { scheduledFor: "asc" },
  });

  return apiSuccess({ scheduled, published });
};
