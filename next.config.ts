import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  // reactCompiler: true, // Disabled temporarily to debug
  // Webpack will be used instead of Turbopack to avoid UTF-8 path bug
  webpack: (config) => {
    return config;
  },
  turbopack: {}, // Empty config to silence Turbopack/webpack conflict
};

export default nextConfig;
