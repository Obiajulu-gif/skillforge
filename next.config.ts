import { createRequire } from "node:module";

import type { NextConfig } from "next";

const require = createRequire(import.meta.url);

const nextConfig: NextConfig = {
  webpack(config) {
    config.resolve ??= {};
    config.resolve.alias = {
      ...(config.resolve.alias ?? {}),
      "@stacks/connect$": require.resolve("@stacks/connect/dist/index.js"),
    };

    return config;
  },
};

export default nextConfig;
