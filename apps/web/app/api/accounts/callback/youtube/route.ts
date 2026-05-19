import { encryptToken } from "@/lib/token-crypto";
import { getPublishConfig, YOUTUBE_PUBLISH_SCOPES } from "@clipforge/shared";
import { prisma, Platform } from "@clipforge/database";
import { NextResponse } from "next/server";

type OAuthState = {
  workspaceId: string;
  userId: string;
};

type TokenResponse = {
  access_token: string;
  refresh_token?: string;
  expires_in?: number;
};

export const GET = async (request: Request) => {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const stateRaw = searchParams.get("state");
  const error = searchParams.get("error");

  if (error !== null) {
    return NextResponse.redirect(
      new URL(`/accounts?error=${encodeURIComponent(error)}`, request.url),
    );
  }

  if (code === null || stateRaw === null) {
    return NextResponse.redirect(
      new URL("/accounts?error=missing_code", request.url),
    );
  }

  let state: OAuthState;
  try {
    state = JSON.parse(
      Buffer.from(stateRaw, "base64url").toString("utf8"),
    ) as OAuthState;
  } catch {
    return NextResponse.redirect(
      new URL("/accounts?error=invalid_state", request.url),
    );
  }

  const clientId = process.env.AUTH_GOOGLE_ID;
  const clientSecret = process.env.AUTH_GOOGLE_SECRET;
  if (clientId === undefined || clientSecret === undefined || clientId === "") {
    return NextResponse.redirect(
      new URL("/accounts?error=oauth_not_configured", request.url),
    );
  }

  const config = getPublishConfig();

  const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: config.youtubeOAuthRedirectUri,
      grant_type: "authorization_code",
    }),
  });

  if (!tokenRes.ok) {
    return NextResponse.redirect(
      new URL("/accounts?error=token_exchange_failed", request.url),
    );
  }

  const tokens = (await tokenRes.json()) as TokenResponse;

  const channelRes = await fetch(
    "https://www.googleapis.com/youtube/v3/channels?part=snippet&mine=true",
    {
      headers: { Authorization: `Bearer ${tokens.access_token}` },
    },
  );

  let accountName = "YouTube Channel";
  let externalAccountId = "unknown";

  if (channelRes.ok) {
    const channelData = (await channelRes.json()) as {
      items?: Array<{ id?: string; snippet?: { title?: string } }>;
    };
    const channel = channelData.items?.[0];
    if (channel?.id !== undefined) {
      externalAccountId = channel.id;
    }
    if (channel?.snippet?.title !== undefined) {
      accountName = channel.snippet.title;
    }
  }

  const tokenExpiresAt =
    tokens.expires_in !== undefined
      ? new Date(Date.now() + tokens.expires_in * 1000)
      : null;

  await prisma.connectedAccount.upsert({
    where: {
      workspaceId_platform_externalAccountId: {
        workspaceId: state.workspaceId,
        platform: Platform.youtube,
        externalAccountId,
      },
    },
    create: {
      workspaceId: state.workspaceId,
      platform: Platform.youtube,
      accountName,
      externalAccountId,
      accessTokenEncrypted: encryptToken(tokens.access_token),
      refreshTokenEncrypted:
        tokens.refresh_token !== undefined
          ? encryptToken(tokens.refresh_token)
          : null,
      tokenExpiresAt,
      scopes: [...YOUTUBE_PUBLISH_SCOPES],
      status: "connected",
      publishCapability: "DIRECT_POST_READY",
    },
    update: {
      accountName,
      accessTokenEncrypted: encryptToken(tokens.access_token),
      refreshTokenEncrypted:
        tokens.refresh_token !== undefined
          ? encryptToken(tokens.refresh_token)
          : null,
      tokenExpiresAt,
      status: "connected",
      publishCapability: "DIRECT_POST_READY",
    },
  });

  return NextResponse.redirect(
    new URL("/accounts?connected=youtube", config.authUrl),
  );
};
