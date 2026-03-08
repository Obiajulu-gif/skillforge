import { fileURLToPath } from "node:url";

import { projectRoot, runCommand } from "./shared";

function main() {
  const [mode] = process.argv.slice(2);

  if (mode === "check") {
    runCommand("clarinet", ["check", "--manifest-path", "Clarinet.toml"], projectRoot);
    return;
  }

  if (mode === "test") {
    process.stdout.write("Clarinet v3 contract tests run through Vitest and @stacks/clarinet-sdk.\n");
    runCommand(process.execPath, ["./node_modules/vitest/vitest.mjs", "run", "--config", "vitest.config.ts"], projectRoot);
    return;
  }

  throw new Error(`Unsupported command: ${mode ?? "<none>"}`);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  main();
}
