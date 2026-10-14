import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  trailingSlash: true,
  turbopack: { root: process.cwd() },
  experimental: { cpus: 1 },
  images: { unoptimized: true },
};

export default nextConfig;
