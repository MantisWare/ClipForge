import { apiError, apiSuccess } from "@/lib/api";
import { requireUser, requireWorkspaceEditor } from "@/lib/api-auth";
import { enqueueJob } from "@/lib/queue";
import { prisma, SourceStatus } from "@clipforge/database";

export const POST = async (
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) => {
  const authResult = await requireUser();
  if ("error" in authResult) {
    return authResult.error;
  }

  const { id } = await params;
  const source = await prisma.sourceVideo.findUnique({ where: { id } });

  if (source === null) {
    return apiError("NOT_FOUND", "Source not found", 404);
  }

  const access = await requireWorkspaceEditor(
    authResult.userId,
    source.workspaceId,
  );
  if ("error" in access) {
    return access.error;
  }

  if (source.status !== SourceStatus.failed) {
    return apiError(
      "VALIDATION_ERROR",
      "Only failed sources can be re-imported",
      400,
    );
  }

  await prisma.sourceVideo.update({
    where: { id },
    data: { status: SourceStatus.pending },
  });

  const job = await enqueueJob({
    workspaceId: source.workspaceId,
    type: "source.import",
    sourceVideoId: source.id,
    payload: {
      sourceVideoId: source.id,
      workspaceId: source.workspaceId,
    },
  });

  return apiSuccess({ job, message: "Import queued" }, 202);
};
