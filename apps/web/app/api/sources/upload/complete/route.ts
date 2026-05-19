import { apiError, apiSuccess, parseJsonBody } from "@/lib/api";
import { requireUser, requireWorkspaceEditor } from "@/lib/api-auth";
import { enqueueJob } from "@/lib/queue";
import { prisma, SourceStatus } from "@clipforge/database";
import { completeUploadSchema } from "@clipforge/shared";

export const POST = async (request: Request) => {
  const authResult = await requireUser();
  if ("error" in authResult) {
    return authResult.error;
  }

  const body = await parseJsonBody<unknown>(request);
  const parsed = completeUploadSchema.safeParse(body);
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

  const prefix = `workspaces/${parsed.data.workspaceId}/sources/`;
  if (!parsed.data.storageKey.startsWith(prefix)) {
    return apiError("VALIDATION_ERROR", "Invalid storage key for workspace", 400);
  }

  const sourceVideoId = parsed.data.storageKey
    .slice(prefix.length)
    .split("/")[0];

  if (sourceVideoId === undefined || sourceVideoId === "") {
    return apiError("VALIDATION_ERROR", "Could not parse source id from storage key", 400);
  }

  const source = await prisma.sourceVideo.findUnique({
    where: { id: sourceVideoId },
  });

  if (source === null || source.workspaceId !== parsed.data.workspaceId) {
    return apiError("NOT_FOUND", "Source not found", 404);
  }

  const updated = await prisma.sourceVideo.update({
    where: { id: sourceVideoId },
    data: {
      storageKey: parsed.data.storageKey,
      title: parsed.data.title ?? source.title,
      status: SourceStatus.pending,
    },
  });

  const job = await enqueueJob({
    workspaceId: parsed.data.workspaceId,
    type: "source.import",
    sourceVideoId: updated.id,
    payload: {
      sourceVideoId: updated.id,
      workspaceId: parsed.data.workspaceId,
      skipDownload: true,
      storageKey: parsed.data.storageKey,
    },
  });

  return apiSuccess({ source: updated, job }, 200);
};
