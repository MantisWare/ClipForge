/**
 * Resolve yt-dlp binary path (no Node built-ins — safe for Next.js client bundles).
 * start.sh sets YTDLP_PATH when yt-dlp is found on the machine.
 */
export const resolveYtdlpPath = (): string => {
  const fromEnv = process.env.YTDLP_PATH?.trim();
  if (fromEnv !== undefined && fromEnv !== "") {
    return fromEnv;
  }
  return "yt-dlp";
};
