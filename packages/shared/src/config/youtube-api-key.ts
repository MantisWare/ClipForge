/** Resolve YouTube Data API key from common env var names (trimmed). */
export const resolveYoutubeApiKey = (): string | undefined => {
  const names = [
    "YOUTUBE_API_KEY",
    "GOOGLE_API_KEY",
    "YOUTUBE_DATA_API_KEY",
  ] as const;

  for (const name of names) {
    const raw = process.env[name];
    if (raw === undefined) {
      continue;
    }
    const trimmed = raw.trim();
    if (trimmed !== "") {
      return trimmed;
    }
  }

  return undefined;
};
