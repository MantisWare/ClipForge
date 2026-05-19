import { apiError, apiSuccess, parseJsonBody } from "@/lib/api";
import { requireUser, requireWorkspaceEditor } from "@/lib/api-auth";
import { prisma, SourceStatus, SourceType } from "@clipforge/database";
import {
  buildSourceStorageKey,
  getSignedUploadUrl,
  presignUploadSchema,
} from "@clipforge/shared";

export const POST = async (request: Request) => {
  const authResult = await requireUser();
  if ("error" in authResult) {
    return authResult.error;
  }

  const body = await parseJsonBody<unknown>(request);
  const parsed = presignUploadSchema.safeParse(body);
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

  const source = await prisma.sourceVideo.create({
    data: {
      workspaceId: parsed.data.workspaceId,
      sourceType: SourceType.upload,
      sourceUrl: `upload://${parsed.data.filename}`,
      title: parsed.data.filename,
      rightsStatus: "unknown",
      rightsConfirmed: false,
      status: SourceStatus.pending,
    },
  });

  const storageKey = buildSourceStorageKey(
    parsed.data.workspaceId,
    source.id,
    parsed.data.filename,
  );

  const uploadUrl = await getSignedUploadUrl(
    storageKey,
    parsed.data.contentType,
    3600,
  );

  return apiSuccess({
    sourceVideoId: source.id,
    storageKey,
    uploadUrl,
    expiresIn: 3600,
  });
};
