// Trigger GitHub Actions build - 2
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    unoptimized: true,
  },
  allowedDevOrigins: ['127.0.0.1', '192.168.219.102'],
};

export default nextConfig;
