import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@clipforge/database", "@clipforge/shared"],
};

export default nextConfig;
