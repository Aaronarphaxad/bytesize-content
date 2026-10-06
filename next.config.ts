import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // Keystatic's API routes need the Node runtime.
  serverExternalPackages: ['@keystatic/core', '@keystatic/next'],
};

export default nextConfig;
