import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["tests/**/*.test.ts"],
    globals: true,
    environment: "node",
    testTimeout: 120_000,
    hookTimeout: 120_000,
  },
});
