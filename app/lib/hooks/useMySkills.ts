"use client";

import { useMemo } from "react";

import { useStacksWallet } from "@/RainbowKitSetup";

import { useSkills } from "./useSkills";

export function useMySkills() {
  const { address } = useStacksWallet();
  const { skills, isLoading, error, refetch } = useSkills();

  const mine = useMemo(() => {
    if (!address) {
      return [];
    }

    return skills.filter((skill) => skill.creator === address);
  }, [skills, address]);

  return {
    skillIds: mine.map((skill) => skill.skillId),
    skills: mine,
    isLoading,
    error,
    refetch,
  };
}
