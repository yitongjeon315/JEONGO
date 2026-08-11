// Trigger GitHub Actions build - 2
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    unoptimized: true,
  },
  allowedDevOrigins: ['192.168.219.104']
};

export default nextConfig;
