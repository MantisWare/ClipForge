import { apiError, apiSuccess, parseJsonBody } from "@/lib/api";
import { requireUser, requireWorkspaceEditor } from "@/lib/api-auth";
import { enqueueJob } from "@/lib/queue";
import { prisma, SourceStatus } from "@clipforge/database";
import { startTranscribeSchema } from "@clipforge/shared";

const RETRYABLE_STATUSES: SourceStatus[] = [
  SourceStatus.imported,
  SourceStatus.ready,
  SourceStatus.failed,
];

export const POST = async (
  request: Request,
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

  const body = await parseJsonBody<unknown>(request);
  const parsed = startTranscribeSchema.safeParse(body ?? {});
  if (!parsed.success) {
    return apiError("VALIDATION_ERROR", parsed.error.message, 400, parsed.error.flatten());
  }

  if (source.storageKey === null) {
    return apiError("VALIDATION_ERROR", "Source must be imported before transcription", 400);
  }

  if (source.status === SourceStatus.transcribing) {
    return apiError(
      "VALIDATION_ERROR",
      "Transcription already in progress",
      409,
    );
  }

  if (
    source.status === SourceStatus.pending ||
    source.status === SourceStatus.importing
  ) {
    return apiError(
      "VALIDATION_ERROR",
      "Source must finish importing before transcription",
      400,
    );
  }

  if (
    !RETRYABLE_STATUSES.includes(source.status) &&
    parsed.data.force !== true
  ) {
    return apiError(
      "VALIDATION_ERROR",
      `Cannot transcribe source in status: ${source.status}`,
      400,
    );
  }

  const job = await enqueueJob({
    workspaceId: source.workspaceId,
    type: "media.extract_audio",
    sourceVideoId: source.id,
    payload: {
      sourceVideoId: source.id,
      workspaceId: source.workspaceId,
    },
  });

  return apiSuccess({ job, message: "Transcription queued" }, 202);
};
