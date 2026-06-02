import { apiError, apiSuccess } from "@/lib/api";
import { requireUser, requireWorkspace } from "@/lib/api-auth";
import { JobStatus, prisma } from "@clipforge/database";

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

  const lastFailedJob = await prisma.job.findFirst({
    where: {
      sourceVideoId: id,
      status: JobStatus.failed,
    },
    orderBy: { completedAt: "desc" },
    select: {
      id: true,
      type: true,
      errorMessage: true,
      completedAt: true,
    },
  });

  return apiSuccess({
    ...source,
    lastFailure:
      lastFailedJob !== null &&
      lastFailedJob.errorMessage !== null &&
      lastFailedJob.errorMessage !== ""
        ? {
            jobId: lastFailedJob.id,
            jobType: lastFailedJob.type,
            message: lastFailedJob.errorMessage,
            completedAt: lastFailedJob.completedAt,
          }
        : null,
  });
};
