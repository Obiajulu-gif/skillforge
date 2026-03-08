"use client";

import { Cl } from "@stacks/transactions";
import { useCallback, useState } from "react";

import { useStacksWallet } from "@/RainbowKitSetup";
import { getPublicClientConfig, splitContractId } from "@/app/lib/stacks/client";

type RegisterSkillInput = {
  paymentAssetContractId: string;
  price: string | number | bigint;
  metadataURI: string;
};

function toUnsigned(value: string | number | bigint) {
  const normalized = typeof value === "string" ? value.trim() : value.toString();
  if (!/^\d+$/.test(normalized)) {
    throw new Error("Price must be an unsigned integer in token base units");
  }
  return BigInt(normalized);
}

export function useRegisterSkill() {
  const { requestContractCall } = useStacksWallet();

  const [hash, setHash] = useState<string | null>(null);
  const [isPending, setIsPending] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const registerSkill = useCallback(
    async (input: RegisterSkillInput) => {
      setIsPending(true);
      setIsSuccess(false);
      setError(null);

      try {
        const config = await getPublicClientConfig();
        if (!config.contractId) {
          throw new Error("Marketplace contract ID is not configured");
        }

        const { address, contractName } = splitContractId(input.paymentAssetContractId);
        if (!address || !contractName) {
          throw new Error(`Invalid payment asset contract id: ${input.paymentAssetContractId}`);
        }

        const tx = await requestContractCall({
          contract: config.contractId,
          functionName: "create-listing",
          functionArgs: [
            Cl.contractPrincipal(address, contractName),
            Cl.uint(toUnsigned(input.price)),
            Cl.stringAscii(input.metadataURI),
          ],
        });

        setHash(tx.txid);
        setIsSuccess(true);
        return tx;
      } catch (err) {
        const parsed = err instanceof Error ? err : new Error("Unable to create listing");
        setError(parsed);
        throw parsed;
      } finally {
        setIsPending(false);
      }
    },
    [requestContractCall],
  );

  return {
    registerSkill,
    hash,
    isPending,
    isSuccess,
    error,
  };
}
