import path from "node:path";
import { loadMonorepoEnvFiles } from "./load-env-files";

/** Load repo + web + docker .env for Next.js (server / build time). */
export const loadMonorepoEnv = (webDir: string): void => {
  const repoRoot = path.join(webDir, "../..");
  loadMonorepoEnvFiles(repoRoot);
};
