import { prisma, PublishJobStatus } from "@clipforge/database";
import { publishPlatformFallback } from "../publish/platform-fallback.js";
import { publishToYouTube } from "../publish/youtube.js";
import type { JobPayload } from "./types.js";

export const handlePublish = async (
  payload: JobPayload,
  jobName?: string,
) => {
  const publishJobId =
    typeof payload.publishJobId === "string" ? payload.publishJobId : undefined;

  if (publishJobId === undefined) {
    throw new Error("publishJobId is required for publish jobs");
  }

  const job = await prisma.publishJob.findUnique({
    where: { id: publishJobId },
    include: { connectedAccount: true, renderedClip: true },
  });

  if (job === null) {
    throw new Error(`Publish job not found: ${publishJobId}`);
  }

  if (job.renderedClip.status !== "ready") {
    throw new Error("Rendered clip must be ready before publishing");
  }

  await prisma.publishJob.update({
    where: { id: publishJobId },
    data: { status: PublishJobStatus.publishing },
  });

  try {
    const platform =
      jobName !== undefined
        ? jobName.replace("publish.", "")
        : job.platform;

    if (platform === "youtube") {
      await publishToYouTube(publishJobId);
      return;
    }

    if (platform === "tiktok") {
      await publishPlatformFallback(
        publishJobId,
        "TikTok",
        job.connectedAccount?.publishCapability ?? "PRIVATE_ONLY",
      );
      return;
    }

    if (platform === "instagram") {
      await publishPlatformFallback(
        publishJobId,
        "Instagram",
        job.connectedAccount?.publishCapability ?? "REQUIRES_AUDIT",
      );
      return;
    }

    throw new Error(`Unknown publish platform: ${platform}`);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Publish failed";
    await prisma.publishJob.update({
      where: { id: publishJobId },
      data: {
        status: PublishJobStatus.failed,
        errorMessage: message,
      },
    });
    throw error;
  }
};
