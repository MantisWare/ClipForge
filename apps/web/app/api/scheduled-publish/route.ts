import { apiError, apiSuccess, parseJsonBody } from "@/lib/api";
import { requireUser, requireWorkspaceEditor } from "@/lib/api-auth";
import { assertRenderedClipReady } from "@/lib/publish-validation";
import { enqueueJobDelayed } from "@/lib/queue";
import { Platform, prisma, ScheduledPublishStatus } from "@clipforge/database";
import { createScheduledPublishSchema } from "@clipforge/shared";

const platformMap: Record<string, Platform> = {
  youtube: Platform.youtube,
  tiktok: Platform.tiktok,
  instagram: Platform.instagram,
};

export const POST = async (request: Request) => {
  const authResult = await requireUser();
  if ("error" in authResult) {
    return authResult.error;
  }

  const body = await parseJsonBody<unknown>(request);
  const parsed = createScheduledPublishSchema.safeParse(body);
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

  const scheduledFor = new Date(parsed.data.scheduledFor);
  if (scheduledFor.getTime() <= Date.now()) {
    return apiError(
      "VALIDATION_ERROR",
      "scheduledFor must be in the future",
      400,
    );
  }

  const platform = platformMap[parsed.data.platform];
  if (platform === undefined) {
    return apiError("VALIDATION_ERROR", "Invalid platform", 400);
  }

  const scheduled = await prisma.scheduledPublish.create({
    data: {
      workspaceId: parsed.data.workspaceId,
      renderedClipId: parsed.data.renderedClipId,
      connectedAccountId: parsed.data.connectedAccountId,
      platform,
      title: parsed.data.title,
      caption: parsed.data.caption,
      hashtags: parsed.data.hashtags ?? [],
      visibility: parsed.data.visibility,
      scheduledFor,
      status: ScheduledPublishStatus.scheduled,
    },
  });

  const delayMs = scheduledFor.getTime() - Date.now();
  const job = await enqueueJobDelayed(
    {
      workspaceId: parsed.data.workspaceId,
      type: "publish.scheduled",
      payload: { scheduledPublishId: scheduled.id },
    },
    delayMs,
  );

  return apiSuccess({ scheduled, job }, 201);
};
