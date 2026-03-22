import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: [
    "@health-tracker/api-client",
    "@health-tracker/design-tokens",
    "@health-tracker/types",
  ],
};

export default nextConfig;
