import "dotenv/config";

import { spawn, spawnSync } from "node:child_process";
import { cp, mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import { getStacksConfig, type StacksNetwork } from "@/app/lib/stacks/env";

export const projectRoot = process.cwd();
export const clarinetManifestPath = path.join(projectRoot, "Clarinet.toml");

export function deploymentPlanFilename(network: StacksNetwork) {
  return `default.${network}-plan.yaml`;
}

export function resolveNetwork() {
  return getStacksConfig().stacksNetwork;
}

export function resolveNetworkFlag(network: StacksNetwork) {
  return `--${network}`;
}

export function runCommand(command: string, args: string[], cwd = projectRoot, env = process.env) {
  const result = spawnSync(command, args, {
    cwd,
    env,
    encoding: "utf8",
  });

  if (result.stdout) {
    process.stdout.write(result.stdout);
  }
  if (result.stderr) {
    process.stderr.write(result.stderr);
  }
  if (result.status !== 0) {
    throw new Error(`${command} ${args.join(" ")} failed with exit code ${result.status ?? 1}`);
  }

  return result;
}

export function spawnCommand(command: string, args: string[], cwd = projectRoot, env = process.env) {
  return spawn(command, args, {
    cwd,
    env,
    stdio: "pipe",
  });
}

export async function createDeploymentWorkspace(network: StacksNetwork) {
  if (network === "devnet") {
    return {
      workspace: projectRoot,
      cleanup: async () => {},
    };
  }

  const tempRoot = await mkdtemp(path.join(os.tmpdir(), `skillforge-${network}-`));

  await cp(path.join(projectRoot, "Clarinet.toml"), path.join(tempRoot, "Clarinet.toml"));
  await cp(path.join(projectRoot, "contracts"), path.join(tempRoot, "contracts"), { recursive: true });
  await cp(path.join(projectRoot, "settings"), path.join(tempRoot, "settings"), { recursive: true });

  if (network !== "devnet") {
    const mnemonic = process.env.DEPLOYER_MNEMONIC?.trim();
    if (!mnemonic) {
      throw new Error(`DEPLOYER_MNEMONIC is required for ${network} deployment flows`);
    }

    const settingsFile = path.join(tempRoot, "settings", `${capitalize(network)}.toml`);
    const current = await readFile(settingsFile, "utf8");
    await writeFile(
      settingsFile,
      current.replace("<SET VIA TEMP DEPLOY WORKSPACE>", mnemonic.replace(/"/g, '\\"')),
      "utf8",
    );
  }

  return {
    workspace: tempRoot,
    cleanup: async () => rm(tempRoot, { recursive: true, force: true }),
  };
}

export async function persistDeploymentPlan(network: StacksNetwork, workspace: string) {
  const source = path.join(workspace, "deployments", deploymentPlanFilename(network));
  const targetDir = path.join(projectRoot, "deployments");
  const target = path.join(targetDir, deploymentPlanFilename(network));
  if (workspace === projectRoot) {
    return target;
  }
  await mkdir(targetDir, { recursive: true });
  await cp(source, target, { force: true });
  return target;
}

export async function resolveContractIdFromPlan(planPath: string, contractName: string) {
  const plan = await readFile(planPath, "utf8");
  const blocks = plan.split("[[transactions]]");

  for (const block of blocks) {
    const hasContractName =
      block.includes(`contract-name = "${contractName}"`) ||
      block.includes(`contract_name = "${contractName}"`);

    if (!hasContractName) {
      continue;
    }

    const senderMatch = block.match(/(?:emulated-sender|sender)\s*=\s*"([^"]+)"/i);
    if (senderMatch?.[1]) {
      return `${senderMatch[1]}.${contractName}`;
    }
  }

  return "";
}

export async function waitForJson<T>(url: string, timeoutMs = 120_000) {
  const deadline = Date.now() + timeoutMs;
  let lastError: unknown;

  while (Date.now() < deadline) {
    try {
      const response = await fetch(url, { cache: "no-store" });
      if (response.ok) {
        return (await response.json()) as T;
      }
      lastError = new Error(`Unexpected status ${response.status} from ${url}`);
    } catch (error) {
      lastError = error;
    }

    await new Promise(resolve => setTimeout(resolve, 2_000));
  }

  throw lastError instanceof Error ? lastError : new Error(`Timed out waiting for ${url}`);
}

function capitalize(value: string) {
  return value.charAt(0).toUpperCase() + value.slice(1);
}
