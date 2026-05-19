import { apiError, apiSuccess, parseJsonBody } from "@/lib/api";
import { requireUser, requireWorkspace } from "@/lib/api-auth";
import {
  assessSourceRisk,
  fetchYouTubeMetadata,
  getImportConfig,
  parseSourceUrl,
  validateSourceSchema,
} from "@clipforge/shared";

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

  const config = getImportConfig();

  if (source.sourceType === "youtube" && source.sourcePlatformId !== undefined) {
    if (config.youtubeApiKey === undefined) {
      return apiSuccess({
        sourceType: source.sourceType,
        sourceUrl: source.sourceUrl,
        sourcePlatformId: source.sourcePlatformId,
        title: `YouTube video ${source.sourcePlatformId}`,
        thumbnailUrl: null,
        durationSeconds: null,
        warning: "YOUTUBE_API_KEY not set — metadata is limited",
      });
    }

    try {
      const metadata = await fetchYouTubeMetadata(
        source.sourcePlatformId,
        config.youtubeApiKey,
      );
      const risk = assessSourceRisk({
        sourceType: source.sourceType,
        sourceUrl: source.sourceUrl,
        title: metadata.title,
        channel: metadata.channelName,
      });
      return apiSuccess({
        sourceType: source.sourceType,
        sourceUrl: source.sourceUrl,
        sourcePlatformId: source.sourcePlatformId,
        ...metadata,
        rightsStatus: risk.rightsStatus,
        riskLevel: risk.level,
        riskHints: risk.hints,
      });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "YouTube metadata failed";
      return apiError("VALIDATION_ERROR", message, 400);
    }
  }

  const risk = assessSourceRisk({
    sourceType: source.sourceType,
    sourceUrl: source.sourceUrl,
    title: source.sourcePlatformId ?? source.sourceUrl,
  });
  return apiSuccess({
    sourceType: source.sourceType,
    sourceUrl: source.sourceUrl,
    sourcePlatformId: source.sourcePlatformId,
    title: source.sourcePlatformId ?? source.sourceUrl,
    thumbnailUrl: null,
    durationSeconds: null,
    rightsStatus: risk.rightsStatus,
    riskLevel: risk.level,
    riskHints: risk.hints,
  });
};
