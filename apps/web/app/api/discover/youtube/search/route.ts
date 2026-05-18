import { apiSuccess } from "@/lib/api";
import { discoverQuerySchema, RIGHTS_WARNING } from "@clipforge/shared";

export const GET = async (request: Request) => {
  const { searchParams } = new URL(request.url);
  const parsed = discoverQuerySchema.safeParse({
    region: searchParams.get("region") ?? "US",
    keyword: searchParams.get("keyword") ?? undefined,
    maxResults: searchParams.get("maxResults") ?? 20,
  });

  const keyword = parsed.success ? (parsed.data.keyword ?? "trending") : "trending";

  const stubItems = [
    {
      id: "search-stub-1",
      title: `Results for "${keyword}"`,
      channel: "Example Channel",
      views: 500_000,
      duration: "8:20",
      publishedAt: new Date().toISOString(),
      thumbnailUrl: null,
      rightsStatus: "unknown" as const,
    },
  ];

  return apiSuccess({
    items: stubItems,
    keyword,
    rightsWarning: RIGHTS_WARNING,
    stub: true,
  });
};
