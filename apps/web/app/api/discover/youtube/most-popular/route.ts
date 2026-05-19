import { apiError, apiSuccess } from "@/lib/api";
import { requireUser } from "@/lib/api-auth";
import {
  discoverQuerySchema,
  fetchYouTubeMostPopular,
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
    category: searchParams.get("category") ?? undefined,
    maxResults: searchParams.get("maxResults") ?? 20,
  });

  if (!parsed.success) {
    return apiError("VALIDATION_ERROR", parsed.error.message, 400);
  }

  const config = getImportConfig();
  if (config.youtubeApiKey === undefined) {
    return apiError(
      "NOT_IMPLEMENTED",
      "YOUTUBE_API_KEY is required for discovery",
      503,
    );
  }

  try {
    const items = await fetchYouTubeMostPopular(config.youtubeApiKey, {
      region: parsed.data.region,
      categoryId: parsed.data.category,
      maxResults: parsed.data.maxResults,
    });

    return apiSuccess({
      items,
      region: parsed.data.region,
      rightsWarning: RIGHTS_WARNING,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "YouTube mostPopular failed";
    return apiError("INTERNAL_ERROR", message, 500);
  }
};
