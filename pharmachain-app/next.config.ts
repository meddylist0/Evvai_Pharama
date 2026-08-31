import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    unoptimized: true,
  },
  // Allow LAN network access for development and HMR
  allowedDevOrigins: [
    "192.168.0.154",
    "192.168.0.154:3000",
    "localhost:3000",
    "127.0.0.1:3000",
  ],
};

export default nextConfig;
