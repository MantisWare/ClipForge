import { apiError, apiSuccess, parseJsonBody } from "@/lib/api";
import { requireUser, requireWorkspace } from "@/lib/api-auth";
import { enqueueJob } from "@/lib/queue";
import { prisma } from "@clipforge/database";
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

  const access = await requireWorkspace(
    authResult.userId,
    parsed.data.workspaceId,
  );
  if ("error" in access) {
    return access.error;
  }

  const source = await prisma.sourceVideo.findUnique({
    where: { id: parsed.data.sourceVideoId },
  });
  if (source === null) {
    return apiError("NOT_FOUND", "Source not found", 404);
  }

  const job = await enqueueJob({
    workspaceId: parsed.data.workspaceId,
    type: "ai.score_clips",
    sourceVideoId: source.id,
    payload: { clipCount: parsed.data.clipCount },
  });

  return apiSuccess({ job, message: "Candidate generation queued" }, 202);
};
