"use client";

import { useCallback, useEffect, useState } from "react";

import { useStacksWallet } from "@/RainbowKitSetup";

type BalanceResponse = {
  balance: string;
  balanceFormatted: string;
  asset: string;
};

export function useWithdraw() {
  const { address } = useStacksWallet();
  const [balance, setBalance] = useState<bigint>(BigInt(0));
  const [balanceFormatted, setBalanceFormatted] = useState("0");
  const [error, setError] = useState<Error | null>(null);

  const refetch = useCallback(async () => {
    if (!address) {
      setBalance(BigInt(0));
      setBalanceFormatted("0");
      return;
    }

    try {
      const response = await fetch(`/api/user/balance?address=${encodeURIComponent(address)}`, { cache: "no-store" });
      if (!response.ok) {
        throw new Error("Failed to fetch balance");
      }

      const payload = (await response.json()) as BalanceResponse;
      setBalance(BigInt(payload.balance));
      setBalanceFormatted(payload.balanceFormatted);
    } catch (err) {
      setError(err instanceof Error ? err : new Error("Failed to fetch balance"));
    }
  }, [address]);

  useEffect(() => {
    refetch().catch(() => undefined);
  }, [refetch]);

  return {
    balance,
    balanceFormatted,
    withdraw: async () => {
      throw new Error("Direct withdrawal is not required in the SIP-010 settlement model");
    },
    isPending: false,
    isSuccess: false,
    error,
    refetch,
  };
}
