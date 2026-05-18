import { apiError, apiSuccess } from "@/lib/api";
import { requireUser, requireWorkspace } from "@/lib/api-auth";
import { enqueueJob } from "@/lib/queue";
import { prisma, PublishJobStatus, Platform } from "@clipforge/database";
import type { JobTypeName } from "@clipforge/shared";

const platformToJob: Record<Platform, JobTypeName> = {
  youtube: "publish.youtube",
  tiktok: "publish.tiktok",
  instagram: "publish.instagram",
};

export const POST = async (
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) => {
  const authResult = await requireUser();
  if ("error" in authResult) {
    return authResult.error;
  }

  const { id } = await params;
  const publishJob = await prisma.publishJob.findUnique({ where: { id } });
  if (publishJob === null) {
    return apiError("NOT_FOUND", "Publish job not found", 404);
  }

  const access = await requireWorkspace(
    authResult.userId,
    publishJob.workspaceId,
  );
  if ("error" in access) {
    return access.error;
  }

  await prisma.publishJob.update({
    where: { id },
    data: { status: PublishJobStatus.queued, errorMessage: null },
  });

  const job = await enqueueJob({
    workspaceId: publishJob.workspaceId,
    type: platformToJob[publishJob.platform],
    payload: { publishJobId: publishJob.id, retry: true },
  });

  return apiSuccess({ publishJob, job });
};
