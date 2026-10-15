import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  trailingSlash: true,
  turbopack: { root: process.cwd() },
  experimental: { cpus: 1 },
  images: { unoptimized: true },
  async rewrites() { return [
    { source: "/program/:programId/revision/:reviewId", destination: "/program/revision" },
    { source: "/program/:programId", destination: "/program" },
    { source: "/agreement/:offerId", destination: "/agreement" },
  ]; },
};

export default nextConfig;
