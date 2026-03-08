"use client";

import { Cl, Pc } from "@stacks/transactions";
import { useCallback, useState } from "react";

import { useStacksWallet } from "@/RainbowKitSetup";
import { getPublicClientConfig, splitContractId } from "@/app/lib/stacks/client";
import { useSkills } from "@/app/lib/hooks/useSkills";

function splitTokenId(contractId: string) {
  const { address, contractName } = splitContractId(contractId);
  if (!address || !contractName) {
    throw new Error(`Invalid contract id: ${contractId}`);
  }
  return { address, contractName };
}

export function usePurchaseSkill() {
  const { requestContractCall } = useStacksWallet();
  const { skills } = useSkills();

  const [hash, setHash] = useState<string | null>(null);
  const [transactionId, setTransactionId] = useState<string | null>(null);
  const [isPending, setIsPending] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const purchaseSkill = useCallback(
    async (skillId: number, paymentAssetContractId: string) => {
      setIsPending(true);
      setIsSuccess(false);
      setError(null);

      try {
        const config = await getPublicClientConfig();
        if (!config.contractId) {
          throw new Error("Marketplace contract ID is not configured");
        }

        const tokenParts = splitTokenId(paymentAssetContractId);
        const listing = skills.find(skill => Number(skill.skillId) === skillId);
        if (!listing) {
          throw new Error("Listing is unavailable");
        }

        const result = await requestContractCall({
          contract: config.contractId as `${string}.${string}`,
          functionName: "purchase-listing",
          functionArgs: [Cl.uint(skillId), Cl.contractPrincipal(tokenParts.address, tokenParts.contractName)],
          postConditions: [
            Pc.origin()
              .willSendEq(listing.pricePerUse)
              .ft(paymentAssetContractId as `${string}.${string}`, tokenParts.contractName),
          ],
          postConditionMode: "deny",
        });

        setHash(result.txid);
        setTransactionId(result.txid);
        setIsSuccess(true);
      } catch (err) {
        setError(err instanceof Error ? err : new Error("Unable to complete purchase"));
        throw err;
      } finally {
        setIsPending(false);
      }
    },
    [requestContractCall, skills],
  );

  return {
    purchaseSkill,
    hash,
    transactionId,
    isPending,
    isSuccess,
    error,
  };
}
