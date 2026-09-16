import type { NextConfig } from "next";
import os from "os";

function getLocalDevOrigins(): string[] {
  const origins: string[] = [
    "localhost",
    "localhost:3000",
    "127.0.0.1",
    "127.0.0.1:3000",
  ];
  try {
    const interfaces = os.networkInterfaces();
    for (const name of Object.keys(interfaces)) {
      for (const iface of interfaces[name] || []) {
        if (iface.family === "IPv4" && !iface.internal) {
          origins.push(iface.address);
          origins.push(`${iface.address}:3000`);
        }
      }
    }
  } catch (e) {
    // fallback if OS inspection fails
  }
  return origins;
}

const nextConfig: NextConfig = {
  output: "export",
  trailingSlash: true,
  images: {
    unoptimized: true,
  },
  // Allow dynamic LAN network access for development and HMR across all local IP addresses
  allowedDevOrigins: getLocalDevOrigins(),
};

export default nextConfig;

