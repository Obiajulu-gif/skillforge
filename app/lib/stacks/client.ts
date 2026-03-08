export type WalletNetwork = "mainnet" | "testnet" | "devnet";

export type PublicClientConfig = {
  stacksNetwork: WalletNetwork;
  contractId: string;
  sbtcContractId: string;
  usdcxContractId: string;
  explorerBaseUrl: string;
};

const DEFAULT_CONFIG: PublicClientConfig = {
  stacksNetwork: (process.env.NEXT_PUBLIC_STACKS_NETWORK as WalletNetwork | undefined) ?? "devnet",
  contractId: process.env.NEXT_PUBLIC_CONTRACT_ID ?? "",
  sbtcContractId: process.env.NEXT_PUBLIC_SBTC_CONTRACT_ID ?? "",
  usdcxContractId: process.env.NEXT_PUBLIC_USDCX_CONTRACT_ID ?? "",
  explorerBaseUrl: process.env.NEXT_PUBLIC_EXPLORER_URL ?? "http://127.0.0.1:8000",
};

export async function getPublicClientConfig() {
  try {
    const response = await fetch("/api/config", { cache: "no-store" });
    if (!response.ok) {
      return DEFAULT_CONFIG;
    }

    const json = (await response.json()) as Partial<PublicClientConfig>;
    return {
      ...DEFAULT_CONFIG,
      ...json,
    };
  } catch {
    return DEFAULT_CONFIG;
  }
}

export function splitContractId(contractId: string) {
  const [address, contractName] = contractId.split(".", 2);
  return { address, contractName };
}
