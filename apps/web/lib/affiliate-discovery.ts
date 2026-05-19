import { hasAnyAffiliateNetworkConfigured, mapWorkspaceAffiliateSettings } from "@clipforge/shared";
import { isOverlaysEnabled } from "@/lib/overlay-feature";
import { enqueueJob } from "@/lib/queue";
import { prisma } from "@clipforge/database";

export const maybeEnqueueAffiliateDiscovery = async (input: {
  clipCandidateId: string;
  workspaceId: string;
  sourceVideoId: string;
}): Promise<{ enqueued: boolean }> => {
  if (!isOverlaysEnabled()) {
    return { enqueued: false };
  }

  const settings = await prisma.workspaceOverlaySettings.findUnique({
    where: { workspaceId: input.workspaceId },
  });

  if (
    settings === null ||
    settings.aiProductDiscoveryEnabled !== true ||
    settings.autoDiscoverOnApprove !== true
  ) {
    return { enqueued: false };
  }

  const affiliateSettings = mapWorkspaceAffiliateSettings(settings);
  if (!hasAnyAffiliateNetworkConfigured(affiliateSettings)) {
    return { enqueued: false };
  }

  await enqueueJob({
    workspaceId: input.workspaceId,
    type: "ai.discover_amazon_product",
    sourceVideoId: input.sourceVideoId,
    payload: {
      clipCandidateId: input.clipCandidateId,
      workspaceId: input.workspaceId,
      replaceExistingDraft: true,
      trigger: "auto_approve",
    },
  });

  return { enqueued: true };
};
