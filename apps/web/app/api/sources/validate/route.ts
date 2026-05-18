import { apiError, apiSuccess, parseJsonBody } from "@/lib/api";
import { requireUser, requireWorkspace } from "@/lib/api-auth";
import { validateSourceSchema, parseSourceUrl } from "@clipforge/shared";

export const POST = async (request: Request) => {
  const authResult = await requireUser();
  if ("error" in authResult) {
    return authResult.error;
  }

  const body = await parseJsonBody<unknown>(request);
  const parsed = validateSourceSchema.safeParse(body);
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

  const source = parseSourceUrl(parsed.data.sourceUrl);
  if (source === null) {
    return apiError("VALIDATION_ERROR", "Unsupported or invalid URL", 400);
  }

  return apiSuccess({
    sourceType: source.sourceType,
    sourceUrl: source.sourceUrl,
    sourcePlatformId: source.sourcePlatformId,
    title: `Video ${source.sourcePlatformId ?? ""}`.trim(),
    thumbnailUrl: null,
    durationSeconds: null,
    stub: true,
  });
};
