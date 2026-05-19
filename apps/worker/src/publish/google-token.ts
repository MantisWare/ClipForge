import { decryptToken, encryptToken } from "@clipforge/shared";
import type { ConnectedAccount } from "@clipforge/database";
import { prisma } from "@clipforge/database";

type TokenResponse = {
  access_token: string;
  expires_in?: number;
};

const refreshGoogleAccessToken = async (
  refreshToken: string,
): Promise<TokenResponse> => {
  const clientId = process.env.AUTH_GOOGLE_ID;
  const clientSecret = process.env.AUTH_GOOGLE_SECRET;
  if (clientId === undefined || clientSecret === undefined || clientId === "") {
    throw new Error("Google OAuth is not configured");
  }

  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token: refreshToken,
      grant_type: "refresh_token",
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Google token refresh failed: ${res.status} ${text}`);
  }

  return (await res.json()) as TokenResponse;
};

export const ensureGoogleAccessToken = async (
  account: ConnectedAccount,
): Promise<string> => {
  const expiresAt = account.tokenExpiresAt;
  const bufferMs = 60_000;
  const needsRefresh =
    expiresAt !== null && expiresAt.getTime() - Date.now() < bufferMs;

  if (!needsRefresh) {
    return decryptToken(account.accessTokenEncrypted);
  }

  if (account.refreshTokenEncrypted === null) {
    return decryptToken(account.accessTokenEncrypted);
  }

  const refreshToken = decryptToken(account.refreshTokenEncrypted);
  const tokens = await refreshGoogleAccessToken(refreshToken);
  const tokenExpiresAt =
    tokens.expires_in !== undefined
      ? new Date(Date.now() + tokens.expires_in * 1000)
      : null;

  await prisma.connectedAccount.update({
    where: { id: account.id },
    data: {
      accessTokenEncrypted: encryptToken(tokens.access_token),
      tokenExpiresAt,
    },
  });

  return tokens.access_token;
};
