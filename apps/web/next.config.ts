import type { NextConfig } from "next";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { loadMonorepoEnv } from "./lib/load-monorepo-env";

const webDir = path.dirname(fileURLToPath(import.meta.url));
loadMonorepoEnv(webDir);

const nextConfig: NextConfig = {
  // Electron dev shell loads 127.0.0.1 while Next serves on localhost:PORT.
  allowedDevOrigins: ["127.0.0.1", "localhost"],
  transpilePackages: ["@clipforge/database", "@clipforge/shared"],
  webpack: (config) => {
    // Monorepo packages use .js extensions in TypeScript imports (Node ESM).
    config.resolve.extensionAlias = {
      ".js": [".ts", ".tsx", ".js"],
      ".mjs": [".mts", ".mjs"],
      ".cjs": [".cts", ".cjs"],
    };
    return config;
  },
};

export default nextConfig;
