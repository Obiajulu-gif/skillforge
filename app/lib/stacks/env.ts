import { createNetwork } from "@stacks/network";

export type StacksNetwork = "devnet" | "testnet" | "mainnet";

const DEFAULT_CONTRACT_NAME = "skillforge-marketplace";
const DEVNET_DEPLOYER = "ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM";
const MAINNET_SBTC_CONTRACT_ID = "SM3VDXK3WZZSA84XXFKAFAF15NNZX32CTSG82JFQ4.sbtc-token";
const DEVNET_SBTC_CONTRACT_ID = MAINNET_SBTC_CONTRACT_ID;
const DEFAULT_EXPLORER_URL = "https://explorer.hiro.so";

function normalizeNetwork(value?: string): StacksNetwork {
  if (value === "mainnet" || value === "devnet" || value === "testnet") {
    return value;
  }
  return "devnet";
}

function splitContractId(contractOrAddress?: string, fallbackName?: string) {
  if (!contractOrAddress) {
    return { address: "", name: fallbackName ?? DEFAULT_CONTRACT_NAME };
  }

  if (!contractOrAddress.includes(".")) {
    return { address: contractOrAddress, name: fallbackName ?? DEFAULT_CONTRACT_NAME };
  }

  const [address, name] = contractOrAddress.split(".", 2);
  return { address, name };
}

function defaultStacksApiUrl(network: StacksNetwork) {
  if (network === "mainnet") {
    return "https://api.hiro.so";
  }

  if (network === "testnet") {
    return "https://api.testnet.hiro.so";
  }

  return "http://127.0.0.1:3999";
}

function defaultExplorerBaseUrl(network: StacksNetwork) {
  if (network === "devnet") {
    return "http://127.0.0.1:8000";
  }

  return DEFAULT_EXPLORER_URL;
}

export function getStacksConfig() {
  const stacksNetwork = normalizeNetwork(process.env.STACKS_NETWORK);
  const contractParts = splitContractId(
    process.env.CONTRACT_ID ?? process.env.CONTRACT_ADDRESS,
    process.env.CONTRACT_NAME,
  );

  const contractAddress =
    contractParts.address || (stacksNetwork === "devnet" ? DEVNET_DEPLOYER : "");
  const contractName = contractParts.name || DEFAULT_CONTRACT_NAME;
  const stacksApiUrl = process.env.STACKS_API_URL ?? defaultStacksApiUrl(stacksNetwork);
  const rpcUrl = process.env.RPC_URL ?? stacksApiUrl;
  const explorerBaseUrl = process.env.EXPLORER_URL ?? defaultExplorerBaseUrl(stacksNetwork);

  const sbtcContractId =
    process.env.SBTC_CONTRACT_ID ??
    (stacksNetwork === "mainnet"
      ? MAINNET_SBTC_CONTRACT_ID
      : stacksNetwork === "devnet"
        ? DEVNET_SBTC_CONTRACT_ID
        : "");
  const usdcxContractId =
    process.env.USDCX_CONTRACT_ID ??
    (stacksNetwork === "devnet" && contractAddress ? `${contractAddress}.mock-usdcx` : "");

  return {
    hiroApiKey: process.env.HIRO_API_KEY ?? "",
    stacksNetwork,
    stacksApiUrl,
    rpcUrl,
    explorerBaseUrl,
    contractAddress,
    contractName,
    contractId: contractAddress ? `${contractAddress}.${contractName}` : "",
    sbtcContractId,
    usdcxContractId,
    ipfsGateway: process.env.IPFS_GATEWAY ?? "https://gateway.pinata.cloud/ipfs/",
    walletPrivateKey: process.env.WALLET_PRIVATE_KEY ?? "",
    deployerMnemonic: process.env.DEPLOYER_MNEMONIC ?? "",
    appBaseUrl: process.env.APP_BASE_URL ?? "http://127.0.0.1:3000",
  };
}

export function getStacksNetworkClient() {
  const config = getStacksConfig();

  return createNetwork({
    network: config.stacksNetwork,
    client: {
      baseUrl: config.rpcUrl,
    },
    apiKey: config.hiroApiKey || undefined,
  });
}

export function getHiroHeaders() {
  const { hiroApiKey } = getStacksConfig();
  const headers: Record<string, string> = {};
  if (hiroApiKey) {
    headers["x-api-key"] = hiroApiKey;
  }
  return headers;
}
