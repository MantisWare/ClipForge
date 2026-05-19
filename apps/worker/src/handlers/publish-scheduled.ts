import { prisma, Platform, PublishJobStatus, ScheduledPublishStatus } from "@clipforge/database";
import { publishToYouTube } from "../publish/youtube.js";
import type { JobPayload } from "./types.js";

export const handlePublishScheduled = async (payload: JobPayload) => {
  const scheduledPublishId =
    typeof payload.scheduledPublishId === "string"
      ? payload.scheduledPublishId
      : undefined;

  if (scheduledPublishId === undefined) {
    throw new Error("scheduledPublishId is required");
  }

  const scheduled = await prisma.scheduledPublish.findUnique({
    where: { id: scheduledPublishId },
    include: { renderedClip: true },
  });

  if (scheduled === null) {
    throw new Error(`Scheduled publish not found: ${scheduledPublishId}`);
  }

  if (scheduled.status === ScheduledPublishStatus.cancelled) {
    return;
  }

  if (scheduled.status === ScheduledPublishStatus.published) {
    return;
  }

  if (scheduled.platform !== Platform.youtube) {
    await prisma.scheduledPublish.update({
      where: { id: scheduledPublishId },
      data: {
        status: ScheduledPublishStatus.failed,
        errorMessage:
          "Only YouTube scheduled publish is automated; use export for other platforms",
      },
    });
    return;
  }

  const publishJob = await prisma.publishJob.create({
    data: {
      renderedClipId: scheduled.renderedClipId,
      workspaceId: scheduled.workspaceId,
      platform: scheduled.platform,
      connectedAccountId: scheduled.connectedAccountId,
      title: scheduled.title,
      caption: scheduled.caption,
      hashtags: scheduled.hashtags,
      visibility: scheduled.visibility,
      scheduledFor: scheduled.scheduledFor,
      status: PublishJobStatus.queued,
    },
  });

  try {
    await publishToYouTube(publishJob.id);
    await prisma.scheduledPublish.update({
      where: { id: scheduledPublishId },
      data: {
        status: ScheduledPublishStatus.published,
        publishJobId: publishJob.id,
      },
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Scheduled publish failed";
    await prisma.scheduledPublish.update({
      where: { id: scheduledPublishId },
      data: {
        status: ScheduledPublishStatus.failed,
        publishJobId: publishJob.id,
        errorMessage: message,
      },
    });
    throw error;
  }
};
