import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    // Increase body size limit for API routes
    serverActions: {
      bodySizeLimit: '10mb',
    },
  },
};

export default nextConfig;
