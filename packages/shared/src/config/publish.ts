export type PublishConfig = {
  tokenEncryptionKey: string | undefined;
  youtubeOAuthRedirectUri: string;
  authUrl: string;
};

export const getPublishConfig = (): PublishConfig => ({
  tokenEncryptionKey:
    process.env.TOKEN_ENCRYPTION_KEY !== undefined &&
    process.env.TOKEN_ENCRYPTION_KEY !== ""
      ? process.env.TOKEN_ENCRYPTION_KEY
      : process.env.AUTH_SECRET,
  youtubeOAuthRedirectUri:
    process.env.YOUTUBE_OAUTH_REDIRECT_URI ??
    "http://localhost:3000/api/accounts/callback/youtube",
  authUrl: process.env.AUTH_URL ?? "http://localhost:3000",
});

export const YOUTUBE_PUBLISH_SCOPES = [
  "https://www.googleapis.com/auth/youtube.upload",
  "https://www.googleapis.com/auth/youtube.readonly",
  "https://www.googleapis.com/auth/userinfo.email",
] as const;
