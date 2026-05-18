import { apiError, apiSuccess, parseJsonBody } from "@/lib/api";
import { requireUser, requireWorkspace } from "@/lib/api-auth";
import { enqueueJob } from "@/lib/queue";
import { prisma, SourceStatus, SourceType } from "@clipforge/database";
import { importSourceSchema, parseSourceUrl } from "@clipforge/shared";

export const POST = async (request: Request) => {
  const authResult = await requireUser();
  if ("error" in authResult) {
    return authResult.error;
  }

  const body = await parseJsonBody<unknown>(request);
  const parsed = importSourceSchema.safeParse(body);
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

  const detected = parseSourceUrl(parsed.data.sourceUrl);
  if (detected === null) {
    return apiError("VALIDATION_ERROR", "Unsupported or invalid URL", 400);
  }

  const sourceType = (parsed.data.sourceType ??
    detected.sourceType) as SourceType;

  const source = await prisma.sourceVideo.create({
    data: {
      workspaceId: parsed.data.workspaceId,
      sourceType,
      sourceUrl: parsed.data.sourceUrl,
      sourcePlatformId: detected.sourcePlatformId,
      title: parsed.data.title,
      description: parsed.data.description,
      rightsStatus: "unknown",
      rightsConfirmed: false,
      status: SourceStatus.pending,
    },
  });

  const job = await enqueueJob({
    workspaceId: parsed.data.workspaceId,
    type: "source.import",
    sourceVideoId: source.id,
    payload: { sourceVideoId: source.id },
  });

  return apiSuccess({ source, job }, 201);
};
