"use client";

import { connect, disconnect, getLocalStorage, isConnected, request } from "@stacks/connect";
import type { ClarityValue, PostCondition, PostConditionModeName } from "@stacks/transactions";
import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

type WalletNetwork = "mainnet" | "testnet" | "devnet";

type ContractCallParams = {
  contract: `${string}.${string}`;
  functionName: string;
  functionArgs: ClarityValue[];
  postConditions?: Array<string | PostCondition>;
  postConditionMode?: PostConditionModeName;
};

type SignMessageResult = {
  signature: string;
  publicKey?: string;
};

type StacksWalletContextValue = {
  address: string | null;
  btcAddress: string | null;
  network: WalletNetwork;
  isConnecting: boolean;
  isConnected: boolean;
  connectWallet: () => Promise<void>;
  disconnectWallet: () => void;
  switchNetwork: (network: WalletNetwork) => void;
  refreshAccounts: () => Promise<void>;
  requestContractCall: (params: ContractCallParams) => Promise<{ txid: string }>;
  signMessage: (message: string) => Promise<SignMessageResult>;
};

type AddressEntry = {
  address: string;
};

const DEFAULT_NETWORK = (process.env.NEXT_PUBLIC_STACKS_NETWORK as WalletNetwork | undefined) ?? "devnet";
const NETWORK_STORAGE_KEY = "skillforge.stacks.network";

const StacksWalletContext = createContext<StacksWalletContextValue | null>(null);

function pickStacksAddress(addresses?: AddressEntry[]) {
  if (!addresses || addresses.length === 0) {
    return null;
  }
  return addresses.find(entry => entry.address.startsWith("S"))?.address ?? null;
}

function pickBtcAddress(addresses?: AddressEntry[]) {
  if (!addresses || addresses.length === 0) {
    return null;
  }
  return (
    addresses.find(
      entry =>
        entry.address.startsWith("bc1") ||
        entry.address.startsWith("tb1") ||
        entry.address.startsWith("bcrt1"),
    )?.address ?? null
  );
}

export const RainbowKitSetup = ({ children }: { children: React.ReactNode }) => {
  const [network, setNetwork] = useState<WalletNetwork>(DEFAULT_NETWORK);
  const [address, setAddress] = useState<string | null>(null);
  const [btcAddress, setBtcAddress] = useState<string | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [connected, setConnected] = useState(false);

  const refreshAccounts = useCallback(async () => {
    try {
      const response = (await request("getAddresses", { network })) as { addresses?: AddressEntry[] };
      const stx = pickStacksAddress(response.addresses);
      const btc = pickBtcAddress(response.addresses);

      setAddress(stx);
      setBtcAddress(btc);
      setConnected(Boolean(stx));
    } catch {
      const local = getLocalStorage();
      const stx = pickStacksAddress(local?.addresses?.stx);
      const btc = pickBtcAddress(local?.addresses?.btc);

      setAddress(stx);
      setBtcAddress(btc);
      setConnected(Boolean(stx));
    }
  }, [network]);

  useEffect(() => {
    const persisted = typeof window !== "undefined" ? window.localStorage.getItem(NETWORK_STORAGE_KEY) : null;
    if (persisted === "mainnet" || persisted === "testnet" || persisted === "devnet") {
      setNetwork(persisted);
    }
  }, []);

  useEffect(() => {
    if (typeof window !== "undefined") {
      window.localStorage.setItem(NETWORK_STORAGE_KEY, network);
    }
  }, [network]);

  useEffect(() => {
    if (isConnected()) {
      refreshAccounts().catch(() => undefined);
    }
  }, [network, refreshAccounts]);

  const connectWallet = useCallback(async () => {
    setIsConnecting(true);
    try {
      await connect({
        forceWalletSelect: true,
        approvedProviderIds: ["LeatherProvider"],
        network,
      });
      await refreshAccounts();
    } finally {
      setIsConnecting(false);
    }
  }, [network, refreshAccounts]);

  const disconnectWallet = useCallback(() => {
    disconnect();
    setAddress(null);
    setBtcAddress(null);
    setConnected(false);
  }, []);

  const switchNetwork = useCallback((nextNetwork: WalletNetwork) => {
    setNetwork(nextNetwork);
  }, []);

  const requestContractCall = useCallback(
    async ({ contract, functionName, functionArgs, postConditions, postConditionMode }: ContractCallParams) => {
      const response = (await request({}, "stx_callContract", {
        contract,
        functionName,
        functionArgs,
        network,
        postConditions,
        postConditionMode,
      })) as { txid?: string; transaction?: string };

      if (!response.txid) {
        throw new Error("Wallet did not return a transaction id");
      }

      return { txid: response.txid };
    },
    [network],
  );

  const signMessage = useCallback(async (message: string) => {
    const response = (await request("stx_signMessage", { message })) as SignMessageResult;
    return response;
  }, []);

  const value = useMemo<StacksWalletContextValue>(
    () => ({
      address,
      btcAddress,
      network,
      isConnecting,
      isConnected: connected,
      connectWallet,
      disconnectWallet,
      switchNetwork,
      refreshAccounts,
      requestContractCall,
      signMessage,
    }),
    [
      address,
      btcAddress,
      network,
      isConnecting,
      connected,
      connectWallet,
      disconnectWallet,
      switchNetwork,
      refreshAccounts,
      requestContractCall,
      signMessage,
    ],
  );

  return <StacksWalletContext.Provider value={value}>{children}</StacksWalletContext.Provider>;
};

export function useStacksWallet() {
  const context = useContext(StacksWalletContext);
  if (!context) {
    throw new Error("useStacksWallet must be used inside RainbowKitSetup");
  }
  return context;
}
