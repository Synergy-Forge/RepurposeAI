import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  output: process.env.CI === 'true' ? "standalone" : undefined,
};

export default nextConfig;