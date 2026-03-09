import path from "node:path";

import { getStacksConfig } from "@/app/lib/stacks/env";

import {
  createDeploymentWorkspace,
  deploymentPlanFilename,
  persistDeploymentPlan,
  projectRoot,
  resolveContractIdFromPlan,
  resolveNetwork,
  resolveNetworkFlag,
  runCommand,
} from "./shared";

async function main() {
  const args = new Set(process.argv.slice(2));
  const planOnly = args.has("--plan-only");
  const network = resolveNetwork();
  const config = getStacksConfig();
  const networkFlag = resolveNetworkFlag(network);

  const { workspace, cleanup } = await createDeploymentWorkspace(network);

  try {
    const generateArgs = ["deployments", "generate", networkFlag];
    if (network === "testnet" || network === "mainnet") {
      generateArgs.push("--low-cost");
    }

    runCommand("clarinet", generateArgs, workspace);

    const planPath = await persistDeploymentPlan(network, workspace);
    process.stdout.write(`Deployment plan written to ${planPath}\n`);

    if (planOnly) {
      return;
    }

    const workspacePlanPath = path.join(workspace, "deployments", deploymentPlanFilename(network));
    runCommand(
      "clarinet",
      ["deployments", "apply", networkFlag, "--no-dashboard", "-p", workspacePlanPath],
      workspace,
    );

    const resolvedContractId =
      config.contractId ||
      (await resolveContractIdFromPlan(workspacePlanPath, config.contractName));

    if (resolvedContractId) {
      const { address, contractName } = resolvedContractId.includes(".")
        ? {
            address: resolvedContractId.split(".", 2)[0],
            contractName: resolvedContractId.split(".", 2)[1],
          }
        : { address: "", contractName: config.contractName };

      process.env.CONTRACT_ID = resolvedContractId;
      process.env.CONTRACT_ADDRESS = address;
      process.env.CONTRACT_NAME = contractName;
    }

    runCommand(
      process.execPath,
      ["./node_modules/tsx/dist/cli.mjs", "./scripts/post-deploy-check.ts"],
      projectRoot,
      {
        ...process.env,
        DEPLOYMENT_PLAN_PATH: path.join(projectRoot, "deployments", deploymentPlanFilename(network)),
      },
    );
  } finally {
    await cleanup();
  }
}

main().catch(error => {
  process.stderr.write(`${error instanceof Error ? error.message : "Unknown error"}\n`);
  process.exit(1);
});
