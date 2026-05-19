import { apiError, apiSuccess, parseJsonBody } from "@/lib/api";
import { requireUser, requireWorkspaceEditor } from "@/lib/api-auth";
import { buildPublishMetadataForRendered } from "@/lib/publish-description";
import { assertRenderedClipReady } from "@/lib/publish-validation";
import { enqueueJob } from "@/lib/queue";
import { prisma, PublishJobStatus, Platform } from "@clipforge/database";
import { publishYouTubeSchema } from "@clipforge/shared";

export const POST = async (request: Request) => {
  const authResult = await requireUser();
  if ("error" in authResult) {
    return authResult.error;
  }

  const body = await parseJsonBody<unknown>(request);
  const parsed = publishYouTubeSchema.safeParse(body);
  if (!parsed.success) {
    return apiError("VALIDATION_ERROR", parsed.error.message, 400);
  }

  const access = await requireWorkspaceEditor(
    authResult.userId,
    parsed.data.workspaceId,
  );
  if ("error" in access) {
    return access.error;
  }

  const renderedCheck = await assertRenderedClipReady(parsed.data.renderedClipId);
  if ("error" in renderedCheck) {
    return renderedCheck.error;
  }

  const metadata = await buildPublishMetadataForRendered(
    parsed.data.renderedClipId,
    parsed.data.workspaceId,
    parsed.data.caption,
    parsed.data.hashtags,
  );

  const publishJob = await prisma.publishJob.create({
    data: {
      renderedClipId: parsed.data.renderedClipId,
      workspaceId: parsed.data.workspaceId,
      platform: Platform.youtube,
      connectedAccountId: parsed.data.connectedAccountId,
      title: parsed.data.title,
      caption: metadata.description,
      hashtags: parsed.data.hashtags,
      visibility: parsed.data.visibility,
      scheduledFor: parsed.data.scheduledFor
        ? new Date(parsed.data.scheduledFor)
        : undefined,
      status: PublishJobStatus.queued,
    },
  });

  const job = await enqueueJob({
    workspaceId: parsed.data.workspaceId,
    type: "publish.youtube",
    payload: { publishJobId: publishJob.id },
  });

  return apiSuccess({ publishJob, job }, 202);
};
