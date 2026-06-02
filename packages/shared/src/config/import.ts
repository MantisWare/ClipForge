import { resolveYtdlpPath } from "./resolve-ytdlp-path";
import { resolveYoutubeApiKey } from "./youtube-api-key";

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
    ytdlpPath: resolveYtdlpPath(),
    youtubeApiKey: resolveYoutubeApiKey(),
  };
};

export const buildSourceStorageKey = (
  workspaceId: string,
  sourceVideoId: string,
  filename = "source.mp4",
): string =>
  ["workspaces", workspaceId, "sources", sourceVideoId, filename].join("/");
