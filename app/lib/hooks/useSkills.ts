"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import type { MarketplaceListing } from "@/app/lib/stacks/types";

export interface SkillWithMetadata {
  skillId: bigint;
  name: string;
  description: string;
  category: string;
  creator: string;
  pricePerUse: bigint;
  isActive: boolean;
  totalCalls: bigint;
  metadataURI: string;
  image?: string;
  tags: string[];
  fullDescription?: string;
  paymentAssetContractId: string;
  paymentAssetSymbol: string;
  paymentAssetName: string;
  paymentAssetDecimals: number;
}

function mapListingToSkill(listing: MarketplaceListing): SkillWithMetadata {
  return {
    skillId: BigInt(listing.id),
    name: listing.name,
    description: listing.description,
    category: listing.category,
    creator: listing.seller,
    pricePerUse: BigInt(listing.price),
    isActive: listing.isActive,
    totalCalls: BigInt(listing.purchaseCount),
    metadataURI: listing.metadataUri,
    image: listing.image,
    tags: listing.tags ?? [],
    fullDescription: listing.fullDescription,
    paymentAssetContractId: listing.paymentAssetContractId,
    paymentAssetSymbol: listing.paymentAsset.symbol,
    paymentAssetName: listing.paymentAsset.name,
    paymentAssetDecimals: listing.paymentAsset.decimals,
  };
}

export function useSkills() {
  const [skills, setSkills] = useState<SkillWithMetadata[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const loadSkills = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/marketplace/listings", { cache: "no-store" });
      if (!response.ok) {
        throw new Error(`Failed to fetch listings (${response.status})`);
      }

      const body = (await response.json()) as { listings: MarketplaceListing[] };
      const mapped = (body.listings ?? []).map(mapListingToSkill).sort((a, b) => Number(b.skillId - a.skillId));
      setSkills(mapped);
    } catch (err) {
      setError(err instanceof Error ? err : new Error("Failed to load listings"));
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadSkills().catch(() => undefined);
  }, [loadSkills]);

  return {
    skills,
    isLoading,
    error,
    refetch: loadSkills,
  };
}

export function useSkill(skillId: number | undefined) {
  const { skills, isLoading, error, refetch } = useSkills();
  const skill = useMemo(() => {
    if (skillId === undefined) {
      return null;
    }
    return skills.find((entry) => Number(entry.skillId) === skillId) ?? null;
  }, [skills, skillId]);

  return {
    skill,
    isLoading,
    error,
    refetch,
  };
}

export function useTotalSkills() {
  const { skills } = useSkills();
  return {
    totalSkills: skills.length,
  };
}
