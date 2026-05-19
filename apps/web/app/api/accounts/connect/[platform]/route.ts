import { apiError } from "@/lib/api";
import { requireUser, requireWorkspace } from "@/lib/api-auth";
import { getPublishConfig, YOUTUBE_PUBLISH_SCOPES } from "@clipforge/shared";
import { NextResponse } from "next/server";

const PLATFORMS = ["youtube", "tiktok", "instagram"] as const;

export const GET = async (
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
  if (workspaceId === null || workspaceId === "") {
    return apiError("VALIDATION_ERROR", "workspaceId is required", 400);
  }

  const access = await requireWorkspace(authResult.userId, workspaceId);
  if ("error" in access) {
    return access.error;
  }

  if (platform === "youtube") {
    const clientId = process.env.AUTH_GOOGLE_ID;
    if (clientId === undefined || clientId === "") {
      return apiError(
        "NOT_IMPLEMENTED",
        "AUTH_GOOGLE_ID required for YouTube connect",
        503,
      );
    }

    const config = getPublishConfig();
    const state = Buffer.from(
      JSON.stringify({ workspaceId, userId: authResult.userId }),
    ).toString("base64url");

    const oauthParams = new URLSearchParams({
      client_id: clientId,
      redirect_uri: config.youtubeOAuthRedirectUri,
      response_type: "code",
      scope: YOUTUBE_PUBLISH_SCOPES.join(" "),
      access_type: "offline",
      prompt: "consent",
      state,
    });

    return NextResponse.redirect(
      `https://accounts.google.com/o/oauth2/v2/auth?${oauthParams.toString()}`,
    );
  }

  return apiError(
    "NOT_IMPLEMENTED",
    `${platform} OAuth connect is not yet available — use Export from render preview`,
    501,
  );
};
