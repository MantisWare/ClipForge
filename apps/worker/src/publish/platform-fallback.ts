import { prisma, PublishJobStatus } from "@clipforge/database";

export const publishPlatformFallback = async (
  publishJobId: string,
  platform: string,
  capability: string,
): Promise<void> => {
  await prisma.publishJob.update({
    where: { id: publishJobId },
    data: {
      status: PublishJobStatus.requires_manual_action,
      errorMessage: `${platform} publishing requires manual upload (${capability}). Use Export / Download MP4 from the render preview page.`,
    },
  });
};
