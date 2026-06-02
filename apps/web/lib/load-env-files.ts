/**
 * Next.js config env loader (no @clipforge/shared import — avoids next.config.ts resolution issues).
 * Keep in sync with packages/shared/src/server/load-env-files.ts
 */
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

const resolveYoutubeApiKey = (): string | undefined => {
  const names = ["YOUTUBE_API_KEY", "GOOGLE_API_KEY", "YOUTUBE_DATA_API_KEY"] as const;
  for (const name of names) {
    const raw = process.env[name]?.trim();
    if (raw !== undefined && raw !== "") {
      return raw;
    }
  }
  return undefined;
};

const DOCKER_INFRA_KEYS = new Set([
  "DATABASE_URL",
  "REDIS_URL",
  "S3_ENDPOINT",
  "S3_PUBLIC_URL",
  "S3_REGION",
  "S3_ACCESS_KEY",
  "S3_SECRET_KEY",
  "S3_BUCKET",
]);

const parseDotenv = (content: string): Record<string, string> => {
  const out: Record<string, string> = {};
  for (const line of content.split("\n")) {
    const trimmed = line.trim();
    if (trimmed === "" || trimmed.startsWith("#")) {
      continue;
    }
    const eq = trimmed.indexOf("=");
    if (eq < 0) {
      continue;
    }
    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    if (
      (value.startsWith("\"") && value.endsWith("\"")) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    out[key] = value;
  }
  return out;
};

const applyDotenvFile = (
  filePath: string,
  options?: { skipKeys?: Set<string> },
): void => {
  if (!existsSync(filePath)) {
    return;
  }
  const skip = options?.skipKeys ?? new Set<string>();
  const parsed = parseDotenv(readFileSync(filePath, "utf8"));
  for (const [key, value] of Object.entries(parsed)) {
    if (!skip.has(key)) {
      process.env[key] = value;
    }
  }
};

export const loadMonorepoEnvFiles = (repoRoot: string): void => {
  applyDotenvFile(join(repoRoot, ".env"));

  const dockerEnvPath = join(repoRoot, "infra/docker.env");
  const useDocker = process.env.CLIPFORGE_DOCKER === "1";

  if (useDocker && existsSync(dockerEnvPath)) {
    applyDotenvFile(dockerEnvPath);
    applyDotenvFile(join(repoRoot, "apps/web/.env"), {
      skipKeys: DOCKER_INFRA_KEYS,
    });
  } else {
    applyDotenvFile(join(repoRoot, "apps/web/.env"));
  }

  const youtubeKey = resolveYoutubeApiKey();
  if (youtubeKey !== undefined) {
    process.env.YOUTUBE_API_KEY = youtubeKey;
  }

  // .env often pins AUTH_URL to :3000; dev server runs on PORT (4000+).
  const port = process.env.PORT?.trim();
  if (port !== undefined && port !== "") {
    const base = `http://localhost:${port}`;
    process.env.AUTH_URL = base;
    process.env.YOUTUBE_OAUTH_REDIRECT_URI = `${base}/api/accounts/callback/youtube`;
  }
};
