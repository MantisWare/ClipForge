import { apiSuccess } from "@/lib/api";
import { discoverQuerySchema, RIGHTS_WARNING } from "@clipforge/shared";

export const GET = async (request: Request) => {
  const { searchParams } = new URL(request.url);
  const parsed = discoverQuerySchema.safeParse({
    region: searchParams.get("region") ?? "US",
    category: searchParams.get("category") ?? undefined,
    maxResults: searchParams.get("maxResults") ?? 20,
  });

  const query = parsed.success ? parsed.data : { region: "US", maxResults: 20 };

  const stubItems = Array.from({ length: Math.min(query.maxResults, 5) }, (_, i) => ({
    id: `stub-${i + 1}`,
    title: `Popular video example ${i + 1}`,
    channel: "Example Channel",
    views: 1_000_000 - i * 100_000,
    duration: "12:34",
    publishedAt: new Date().toISOString(),
    thumbnailUrl: null,
    rightsStatus: "permission_required" as const,
  }));

  return apiSuccess({
    items: stubItems,
    region: query.region,
    rightsWarning: RIGHTS_WARNING,
    stub: true,
    message: "Connect YOUTUBE_API_KEY in Phase 7 for live data",
  });
};
