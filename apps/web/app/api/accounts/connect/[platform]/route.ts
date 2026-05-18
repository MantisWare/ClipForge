import { apiError, apiSuccess } from "@/lib/api";
import { requireUser } from "@/lib/api-auth";

const PLATFORMS = ["youtube", "tiktok", "instagram"] as const;

export const POST = async (
  request: Request,
  { params }: { params: Promise<{ platform: string }> },
) => {
  const authResult = await requireUser();
  if ("error" in authResult) {
    return authResult.error;
  }

  const { platform } = await params;
  if (!PLATFORMS.includes(platform as (typeof PLATFORMS)[number])) {
    return apiError("VALIDATION_ERROR", "Invalid platform", 400);
  }

  const { searchParams } = new URL(request.url);
  const workspaceId = searchParams.get("workspaceId");

  return apiSuccess({
    platform,
    workspaceId,
    oauthUrl: null,
    message: `OAuth connect for ${platform} — implement in Phase 6`,
    stub: true,
  });
};
