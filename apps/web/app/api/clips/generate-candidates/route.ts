import { apiError, apiSuccess, parseJsonBody } from "@/lib/api";
import { requireUser, requireWorkspaceEditor } from "@/lib/api-auth";
import { enqueueJob } from "@/lib/queue";
import { prisma, SourceStatus } from "@clipforge/database";
import { generateCandidatesSchema } from "@clipforge/shared";

export const POST = async (request: Request) => {
  const authResult = await requireUser();
  if ("error" in authResult) {
    return authResult.error;
  }

  const body = await parseJsonBody<unknown>(request);
  const parsed = generateCandidatesSchema.safeParse(body);
  if (!parsed.success) {
    return apiError("VALIDATION_ERROR", parsed.error.message, 400, parsed.error.flatten());
  }

  const access = await requireWorkspaceEditor(
    authResult.userId,
    parsed.data.workspaceId,
  );
  if ("error" in access) {
    return access.error;
  }

  const source = await prisma.sourceVideo.findUnique({
    where: { id: parsed.data.sourceVideoId },
    include: { transcriptSegments: { take: 1 } },
  });
  if (source === null) {
    return apiError("NOT_FOUND", "Source not found", 404);
  }

  if (source.workspaceId !== parsed.data.workspaceId) {
    return apiError("FORBIDDEN", "Source not in workspace", 403);
  }

  if (source.status === SourceStatus.analyzing) {
    return apiError(
      "VALIDATION_ERROR",
      "Clip generation already in progress",
      409,
    );
  }

  if (
    source.status !== SourceStatus.ready &&
    source.status !== SourceStatus.failed
  ) {
    return apiError(
      "VALIDATION_ERROR",
      `Source must be ready before generating clips (current: ${source.status})`,
      400,
    );
  }

  if (source.transcriptSegments.length === 0) {
    return apiError(
      "VALIDATION_ERROR",
      "Transcript required before generating clips",
      400,
    );
  }

  const job = await enqueueJob({
    workspaceId: parsed.data.workspaceId,
    type: "ai.score_clips",
    sourceVideoId: source.id,
    payload: {
      sourceVideoId: source.id,
      workspaceId: parsed.data.workspaceId,
      clipCount: parsed.data.clipCount,
    },
  });

  return apiSuccess({ job, message: "Candidate generation queued" }, 202);
};
