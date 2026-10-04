import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@umkm/core-frontend", "@umkm/planner-engine"],
};

export default nextConfig;
