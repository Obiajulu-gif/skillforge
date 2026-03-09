import path from "node:path";

import { deploymentPlanFilename, resolveNetwork, runCommand, spawnCommand, waitForJson } from "./shared";

async function main() {
  const network = resolveNetwork();
  if (network !== "devnet") {
    process.stdout.write("Runtime check is optimized for local devnet. Set STACKS_NETWORK=devnet to run it.\n");
    return;
  }

  const appPort = Number(process.env.RUNTIME_CHECK_PORT ?? 3100);
  const appBaseUrl = `http://127.0.0.1:${appPort}`;

  runCommand("clarinet", ["deployments", "generate", "--devnet"], process.cwd());
  const planPath = path.join("deployments", deploymentPlanFilename(network));

  const clarinetProcess = spawnCommand(
    "clarinet",
    ["integrate", "--no-dashboard", "-p", planPath],
  );
  clarinetProcess.stdout.on("data", chunk => process.stdout.write(chunk.toString()));
  clarinetProcess.stderr.on("data", chunk => process.stderr.write(chunk.toString()));

  try {
    await waitForJson("http://127.0.0.1:3999/v2/info", 180_000);

    const appProcess = spawnCommand(
      process.execPath,
      ["./node_modules/next/dist/bin/next", "start", "-p", String(appPort)],
      process.cwd(),
      {
        ...process.env,
        PORT: String(appPort),
        APP_BASE_URL: appBaseUrl,
        STACKS_NETWORK: "devnet",
        STACKS_API_URL: "http://127.0.0.1:3999",
        RPC_URL: "http://127.0.0.1:3999",
        CONTRACT_ADDRESS: "ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM",
        CONTRACT_NAME: "skillforge-marketplace",
      },
    );
    appProcess.stdout.on("data", chunk => process.stdout.write(chunk.toString()));
    appProcess.stderr.on("data", chunk => process.stderr.write(chunk.toString()));

    try {
      const config = await waitForJson<{ contractId: string }>(`${appBaseUrl}/api/config`, 180_000);
      const listings = await waitForJson<{ listings: unknown[] }>(`${appBaseUrl}/api/marketplace/listings`, 120_000);

      process.stdout.write(
        `Runtime check passed. Loaded config for ${config.contractId} and ${listings.listings.length} listing(s).\n`,
      );
    } finally {
      appProcess.kill("SIGTERM");
    }
  } finally {
    clarinetProcess.kill("SIGTERM");
  }
}

main().catch(error => {
  process.stderr.write(`${error instanceof Error ? error.message : "Unknown error"}\n`);
  process.exit(1);
});
