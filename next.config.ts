import path from "node:path";
import { createRequire } from "node:module";

import type { NextConfig } from "next";

const require = createRequire(import.meta.url);

const nextConfig: NextConfig = {
  webpack(config) {
    config.resolve ??= {};
    const unstorageRoot = path.dirname(require.resolve("unstorage"));

    config.resolve.alias = {
      ...(config.resolve.alias ?? {}),
      "@stacks/connect$": require.resolve("@stacks/connect/dist/index.js"),
      "unstorage$": path.join(unstorageRoot, "index.cjs"),
    };

    return config;
  },
};

export default nextConfig;
