import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Suppress "Slow filesystem" warning pada drive D: di Windows
  outputFileTracingRoot: process.cwd(),
};

export default nextConfig;
