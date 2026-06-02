import { getImportConfig } from "@clipforge/shared";
import { execFile } from "node:child_process";
import { mkdir } from "node:fs/promises";
import { join } from "node:path";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);

export const downloadYouTubeVideo = async (
  sourceUrl: string,
  destDir: string,
): Promise<string> => {
  const config = getImportConfig();
  await mkdir(destDir, { recursive: true });

  const outputTemplate = join(destDir, "source.%(ext)s");

  const args = [
    "--no-playlist",
    "--no-warnings",
    "--retries",
    "3",
    "--fragment-retries",
    "3",
    "-f",
    "bv*[ext=mp4]+ba[ext=m4a]/b[ext=mp4]/bv*+ba/b",
    "--merge-output-format",
    "mp4",
    "--extractor-args",
    "youtube:player_client=android,web",
    "-o",
    outputTemplate,
    sourceUrl,
  ];

  const cookiesFromBrowser = process.env.YTDLP_COOKIES_FROM_BROWSER?.trim();
  if (cookiesFromBrowser !== undefined && cookiesFromBrowser !== "") {
    args.unshift("--cookies-from-browser", cookiesFromBrowser);
  }

  const cookiesFile = process.env.YTDLP_COOKIES_FILE?.trim();
  if (cookiesFile !== undefined && cookiesFile !== "") {
    args.unshift("--cookies", cookiesFile);
  }

  try {
    await execFileAsync(config.ytdlpPath, args, {
      timeout: 600_000,
      maxBuffer: 10 * 1024 * 1024,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "yt-dlp download failed";
    if (message.includes("ENOENT")) {
      throw new Error(
        `yt-dlp not found (tried "${config.ytdlpPath}"). Install it (macOS: brew install yt-dlp) or set YTDLP_PATH in .env to the full binary path.`,
      );
    }
    throw new Error(`YouTube download failed: ${message}`);
  }

  const { readdir } = await import("node:fs/promises");
  const files = await readdir(destDir);
  const videoFile = files.find((f) => f.startsWith("source."));
  if (videoFile === undefined) {
    throw new Error("yt-dlp did not produce an output file");
  }

  return join(destDir, videoFile);
};
