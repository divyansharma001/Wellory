import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: [
    "@health-tracker/api-client",
    "@health-tracker/design-tokens",
    "@health-tracker/types",
  ],
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: "http://localhost:3000/api/:path*",
      },
      {
        source: "/health",
        destination: "http://localhost:3000/health",
      },
    ];
  },
};

export default nextConfig;
