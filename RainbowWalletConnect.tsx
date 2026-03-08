"use client";

import { Loader2 } from "lucide-react";

import { useStacksWallet } from "@/RainbowKitSetup";

function shortAddress(address: string) {
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

export const RainbowWalletConnect = () => {
  const { address, network, isConnecting, isConnected, connectWallet, disconnectWallet, switchNetwork } = useStacksWallet();

  if (!isConnected || !address) {
    return (
      <button
        onClick={() => connectWallet().catch(() => undefined)}
        type="button"
        disabled={isConnecting}
        className="h-10 rounded-sm border-2 border-[#00ffbd] bg-transparent px-6 text-xs font-black uppercase tracking-widest text-[#00ffbd] transition-all hover:bg-[#00ffbd]/10 disabled:opacity-60"
      >
        {isConnecting ? (
          <span className="inline-flex items-center gap-2">
            <Loader2 className="h-3 w-3 animate-spin" />
            Connecting
          </span>
        ) : (
          "Connect Leather"
        )}
      </button>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <select
        value={network}
        onChange={(event) => switchNetwork(event.target.value as "mainnet" | "testnet" | "devnet")}
        className="h-10 rounded-sm border border-white/10 bg-white/5 px-3 text-xs font-semibold uppercase tracking-wide text-slate-200"
      >
        <option value="mainnet">Mainnet</option>
        <option value="testnet">Testnet</option>
        <option value="devnet">Devnet</option>
      </select>
      <button
        onClick={disconnectWallet}
        type="button"
        className="h-10 rounded-sm border border-[#00ffbd]/30 bg-[#00ffbd]/5 px-4 text-xs font-bold text-white transition-all hover:border-[#00ffbd]/50 hover:bg-[#00ffbd]/10"
      >
        {shortAddress(address)}
      </button>
    </div>
  );
};
