import { apiError, apiSuccess } from "@/lib/api";
import { requireUser, requireWorkspaceEditor } from "@/lib/api-auth";
import { requeueExistingJob } from "@/lib/queue";
import { prisma, JobStatus } from "@clipforge/database";
import { PRISMA_TO_JOB_TYPE } from "@clipforge/shared";

export const POST = async (
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) => {
  const authResult = await requireUser();
  if ("error" in authResult) {
    return authResult.error;
  }

  const { id } = await params;
  const job = await prisma.job.findUnique({ where: { id } });
  if (job === null) {
    return apiError("NOT_FOUND", "Job not found", 404);
  }

  const access = await requireWorkspaceEditor(
    authResult.userId,
    job.workspaceId,
  );
  if ("error" in access) {
    return access.error;
  }

  if (job.status !== JobStatus.failed) {
    return apiError(
      "VALIDATION_ERROR",
      "Only failed jobs can be retried",
      400,
    );
  }

  if (job.attempts >= job.maxAttempts) {
    return apiError(
      "VALIDATION_ERROR",
      "Maximum retry attempts reached",
      400,
    );
  }

  const jobTypeName = PRISMA_TO_JOB_TYPE[job.type];
  if (jobTypeName === undefined) {
    return apiError("INTERNAL_ERROR", "Unknown job type", 500);
  }

  const payload =
    typeof job.payload === "object" && job.payload !== null
      ? (job.payload as Record<string, unknown>)
      : {};

  await prisma.job.update({
    where: { id },
    data: {
      status: JobStatus.queued,
      errorMessage: null,
      completedAt: null,
      startedAt: null,
    },
  });

  const requeued = await requeueExistingJob(id, jobTypeName, {
    jobId: id,
    workspaceId: job.workspaceId,
    sourceVideoId: job.sourceVideoId ?? undefined,
    ...payload,
  });

  return apiSuccess({ job: requeued });
};
