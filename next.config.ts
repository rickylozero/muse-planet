import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // The WebDev Preview proxy rebases the dev HMR origin to loopback.
  // Keep this exact-host allowlist scoped to Next.js development resources.
  allowedDevOrigins: ["127.0.0.1"],
};

export default nextConfig;
