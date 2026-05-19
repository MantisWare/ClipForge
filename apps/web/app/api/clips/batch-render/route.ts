import { apiError, apiSuccess, parseJsonBody } from "@/lib/api";
import { requireUser, requireWorkspaceEditor } from "@/lib/api-auth";
import { assertRenderQuota } from "@/lib/quotas";
import { enqueueJob } from "@/lib/queue";
import { ClipStatus, prisma, RenderStatus } from "@clipforge/database";
import { batchRenderSchema, getBatchConfig } from "@clipforge/shared";

export const POST = async (request: Request) => {
  const authResult = await requireUser();
  if ("error" in authResult) {
    return authResult.error;
  }

  const body = await parseJsonBody<unknown>(request);
  const parsed = batchRenderSchema.safeParse(body);
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

  const batchConfig = getBatchConfig();
  if (parsed.data.clipCandidateIds.length > batchConfig.maxBatchClips) {
    return apiError(
      "VALIDATION_ERROR",
      `Maximum ${batchConfig.maxBatchClips} clips per batch`,
      400,
    );
  }

  const quota = await assertRenderQuota(parsed.data.workspaceId);
  if ("error" in quota) {
    return quota.error;
  }

  const clips = await prisma.clipCandidate.findMany({
    where: {
      id: { in: parsed.data.clipCandidateIds },
      status: ClipStatus.approved,
    },
    include: { sourceVideo: true },
  });

  if (clips.length !== parsed.data.clipCandidateIds.length) {
    return apiError(
      "VALIDATION_ERROR",
      "All clips must exist and be approved",
      400,
    );
  }

  for (const clip of clips) {
    if (clip.sourceVideo.workspaceId !== parsed.data.workspaceId) {
      return apiError("FORBIDDEN", "Clip not in workspace", 403);
    }
  }

  const renderedItems: { renderedClipId: string; clipCandidateId: string }[] =
    [];

  for (const clip of clips) {
    const rendered = await prisma.renderedClip.create({
      data: {
        clipCandidateId: clip.id,
        workspaceId: parsed.data.workspaceId,
        renderPreset: parsed.data.renderPreset ?? "vertical_1080x1920",
        captionStyleId: parsed.data.captionStyleId,
        status: RenderStatus.queued,
      },
    });
    renderedItems.push({
      renderedClipId: rendered.id,
      clipCandidateId: clip.id,
    });
  }

  const job = await enqueueJob({
    workspaceId: parsed.data.workspaceId,
    type: "batch.render",
    payload: {
      workspaceId: parsed.data.workspaceId,
      items: renderedItems,
    },
  });

  return apiSuccess({ job, renderedItems }, 202);
};
