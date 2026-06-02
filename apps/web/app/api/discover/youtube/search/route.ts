import { apiError, apiSuccess } from "@/lib/api";
import { requireUser } from "@/lib/api-auth";
import {
  discoverQuerySchema,
  fetchYouTubeSearch,
  getImportConfig,
  RIGHTS_WARNING,
} from "@clipforge/shared";

export const GET = async (request: Request) => {
  const authResult = await requireUser();
  if ("error" in authResult) {
    return authResult.error;
  }

  const { searchParams } = new URL(request.url);
  const parsed = discoverQuerySchema.safeParse({
    region: searchParams.get("region") ?? "US",
    keyword: searchParams.get("keyword") ?? undefined,
    maxResults: searchParams.get("maxResults") ?? 20,
  });

  if (!parsed.success) {
    return apiError("VALIDATION_ERROR", parsed.error.message, 400);
  }

  const config = getImportConfig();
  if (config.youtubeApiKey === undefined) {
    return apiError(
      "NOT_IMPLEMENTED",
      "YouTube Data API key missing. Set YOUTUBE_API_KEY in the repo root .env or apps/web/.env (YouTube Data API v3 enabled), then restart the dev server.",
      503,
    );
  }

  const keyword = parsed.data.keyword ?? "trending";

  try {
    const items = await fetchYouTubeSearch(config.youtubeApiKey, {
      keyword,
      region: parsed.data.region,
      maxResults: parsed.data.maxResults,
    });

    return apiSuccess({
      items,
      keyword,
      rightsWarning: RIGHTS_WARNING,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "YouTube search failed";
    return apiError("INTERNAL_ERROR", message, 500);
  }
};
