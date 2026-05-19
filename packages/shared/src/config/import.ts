export type ImportConfig = {
  maxSourceBytes: number;
  tempDir: string;
  ytdlpPath: string;
  youtubeApiKey: string | undefined;
};

export const getImportConfig = (): ImportConfig => {
  const maxRaw = process.env.MAX_SOURCE_BYTES;
  const maxSourceBytes =
    maxRaw !== undefined && maxRaw !== ""
      ? Number.parseInt(maxRaw, 10)
      : 2_147_483_648;

  return {
    maxSourceBytes: Number.isNaN(maxSourceBytes)
      ? 2_147_483_648
      : maxSourceBytes,
    tempDir: process.env.IMPORT_TEMP_DIR ?? "/tmp/clipforge",
    ytdlpPath: process.env.YTDLP_PATH ?? "yt-dlp",
    youtubeApiKey:
      process.env.YOUTUBE_API_KEY !== undefined &&
      process.env.YOUTUBE_API_KEY !== ""
        ? process.env.YOUTUBE_API_KEY
        : undefined,
  };
};

export const buildSourceStorageKey = (
  workspaceId: string,
  sourceVideoId: string,
  filename = "source.mp4",
): string =>
  ["workspaces", workspaceId, "sources", sourceVideoId, filename].join("/");
