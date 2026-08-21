import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  basePath: '/before',
  images: { unoptimized: true },
  allowedDevOrigins: ['127.0.0.1', '192.168.219.102'],
};

export default nextConfig;
