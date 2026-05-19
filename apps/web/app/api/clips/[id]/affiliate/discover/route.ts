import { apiError, apiSuccess, parseJsonBody } from "@/lib/api";
import { requireUser, requireWorkspaceEditor } from "@/lib/api-auth";
import { loadClipForWorkspace, requireApprovedClip } from "@/lib/clip-access";
import { isOverlaysEnabled, overlaysDisabledResponse } from "@/lib/overlay-feature";
import { enqueueJob } from "@/lib/queue";
import {
  discoverAmazonProductSchema,
  hasAnyAffiliateNetworkConfigured,
  mapWorkspaceAffiliateSettings,
} from "@clipforge/shared";
import { prisma } from "@clipforge/database";

export const POST = async (
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) => {
  if (!isOverlaysEnabled()) {
    return overlaysDisabledResponse();
  }

  const authResult = await requireUser();
  if ("error" in authResult) {
    return authResult.error;
  }

  const { id } = await params;
  const body = await parseJsonBody<unknown>(request);
  const parsed = discoverAmazonProductSchema.safeParse(body);
  if (!parsed.success) {
    return apiError("VALIDATION_ERROR", parsed.error.message, 400);
  }

  const loaded = await loadClipForWorkspace(id);
  if ("error" in loaded) {
    return loaded.error;
  }

  const access = await requireWorkspaceEditor(
    authResult.userId,
    parsed.data.workspaceId,
  );
  if ("error" in access) {
    return access.error;
  }

  if (loaded.workspaceId !== parsed.data.workspaceId) {
    return apiError("FORBIDDEN", "Clip not in workspace", 403);
  }

  const statusError = requireApprovedClip(loaded.clip.status);
  if (statusError !== null) {
    return statusError;
  }

  const settings = await prisma.workspaceOverlaySettings.findUnique({
    where: { workspaceId: parsed.data.workspaceId },
  });

  if (settings === null || settings.aiProductDiscoveryEnabled !== true) {
    return apiError(
      "VALIDATION_ERROR",
      "Enable AI product discovery in Monetization settings",
      400,
    );
  }

  const affiliateSettings = mapWorkspaceAffiliateSettings(settings);
  if (!hasAnyAffiliateNetworkConfigured(affiliateSettings)) {
    return apiError(
      "VALIDATION_ERROR",
      "Configure at least one affiliate network in Monetization settings",
      400,
    );
  }

  const job = await enqueueJob({
    workspaceId: parsed.data.workspaceId,
    type: "ai.discover_amazon_product",
    sourceVideoId: loaded.clip.sourceVideoId,
    payload: {
      clipCandidateId: id,
      workspaceId: parsed.data.workspaceId,
      replaceExistingDraft: parsed.data.replaceExistingDraft ?? true,
    },
  });

  return apiSuccess({ job }, 202);
};
