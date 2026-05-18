import { apiError, apiSuccess, parseJsonBody } from "@/lib/api";
import { requireUser, requireWorkspace } from "@/lib/api-auth";
import { enqueueJob } from "@/lib/queue";
import { prisma, PublishJobStatus, Platform } from "@clipforge/database";
import { publishInstagramSchema } from "@clipforge/shared";

export const POST = async (request: Request) => {
  const authResult = await requireUser();
  if ("error" in authResult) {
    return authResult.error;
  }

  const body = await parseJsonBody<unknown>(request);
  const parsed = publishInstagramSchema.safeParse(body);
  if (!parsed.success) {
    return apiError("VALIDATION_ERROR", parsed.error.message, 400);
  }

  const access = await requireWorkspace(
    authResult.userId,
    parsed.data.workspaceId,
  );
  if ("error" in access) {
    return access.error;
  }

  const publishJob = await prisma.publishJob.create({
    data: {
      renderedClipId: parsed.data.renderedClipId,
      workspaceId: parsed.data.workspaceId,
      platform: Platform.instagram,
      connectedAccountId: parsed.data.connectedAccountId,
      caption: parsed.data.caption,
      hashtags: parsed.data.hashtags,
      visibility: parsed.data.visibility,
      status: PublishJobStatus.queued,
    },
  });

  const job = await enqueueJob({
    workspaceId: parsed.data.workspaceId,
    type: "publish.instagram",
    payload: { publishJobId: publishJob.id, fallback: "export" },
  });

  return apiSuccess({ publishJob, job, stub: true }, 202);
};
