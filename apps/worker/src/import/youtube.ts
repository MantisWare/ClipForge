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
    "-f",
    "best[ext=mp4]/best",
    "--merge-output-format",
    "mp4",
    "-o",
    outputTemplate,
    sourceUrl,
  ];

  try {
    await execFileAsync(config.ytdlpPath, args, {
      timeout: 600_000,
      maxBuffer: 10 * 1024 * 1024,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "yt-dlp download failed";
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
