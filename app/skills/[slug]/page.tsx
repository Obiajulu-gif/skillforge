"use client";

import Link from "next/link";
import React from "react";
import { CheckCircle2, Loader2 } from "lucide-react";

import { useStacksWallet } from "@/RainbowKitSetup";
import { usePurchaseSkill } from "@/app/lib/hooks/usePurchaseSkill";
import { useSkills } from "@/app/lib/hooks/useSkills";
import { formatTokenAmount } from "@/app/lib/stacks/utils";

export default function SkillPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = React.use(params);
  const skillId = React.useMemo(() => {
    const match = slug.match(/(\d+)$/);
    return match ? Number(match[1]) : null;
  }, [slug]);

  const { address } = useStacksWallet();
  const { skills, isLoading } = useSkills();
  const { purchaseSkill, hash, isPending, isSuccess, error } = usePurchaseSkill();
  const [isBuying, setIsBuying] = React.useState(false);

  const skill = React.useMemo(() => {
    if (skillId === null) {
      return null;
    }
    return skills.find((entry) => Number(entry.skillId) === skillId) ?? null;
  }, [skillId, skills]);

  async function onBuy() {
    if (!skill || isPending || !address) {
      return;
    }

    setIsBuying(true);
    try {
      await purchaseSkill(Number(skill.skillId), skill.paymentAssetContractId);
    } finally {
      setIsBuying(false);
    }
  }

  if (isLoading) {
    return (
      <main className="min-h-screen bg-black text-white">
        <div className="mx-auto flex max-w-5xl items-center justify-center py-24 text-slate-300">
          <Loader2 className="mr-3 h-5 w-5 animate-spin" />
          Loading listing...
        </div>
      </main>
    );
  }

  if (!skill) {
    return (
      <main className="min-h-screen bg-black text-white">
        <div className="mx-auto max-w-3xl py-24 text-center">
          <h1 className="text-2xl font-bold">Listing Not Found</h1>
          <p className="mt-2 text-slate-400">The requested listing does not exist.</p>
          <Link href="/marketplace" className="mt-6 inline-block text-[#00ffbd] hover:underline">
            Back to marketplace
          </Link>
        </div>
      </main>
    );
  }

  const price = formatTokenAmount(skill.pricePerUse, skill.paymentAssetDecimals);

  return (
    <main className="min-h-screen bg-black text-white">
      <div className="mx-auto max-w-4xl px-4 py-10">
        <Link href="/marketplace" className="text-xs uppercase tracking-wider text-slate-400 hover:text-[#00ffbd]">
          Back to marketplace
        </Link>
        <div className="mt-6 rounded-sm border border-white/10 bg-neutral-900/40 p-6">
          <p className="text-xs text-slate-500">Listing #{String(skill.skillId)}</p>
          <h1 className="mt-2 text-3xl font-bold">{skill.name}</h1>
          <p className="mt-4 text-slate-300">{skill.fullDescription || skill.description}</p>
          <div className="mt-6 grid gap-4 border-t border-white/10 pt-6 text-sm text-slate-300 sm:grid-cols-2">
            <p>
              Seller: <span className="font-mono">{skill.creator}</span>
            </p>
            <p>
              Payment Asset: {skill.paymentAssetName} ({skill.paymentAssetSymbol})
            </p>
            <p>Price: {price} {skill.paymentAssetSymbol}</p>
            <p>Total Purchases: {skill.totalCalls.toString()}</p>
          </div>

          <div className="mt-8 flex items-center gap-3">
            <button
              onClick={onBuy}
              disabled={!address || isBuying || isPending}
              className="rounded-sm border border-[#00ffbd]/50 bg-[#00ffbd]/10 px-5 py-3 text-xs font-bold uppercase tracking-wider text-[#00ffbd] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {!address ? "Connect Leather Wallet" : isBuying || isPending ? "Signing transaction..." : "Buy Listing"}
            </button>
            {isSuccess && (
              <span className="inline-flex items-center gap-1 text-emerald-300">
                <CheckCircle2 className="h-4 w-4" />
                Success
              </span>
            )}
          </div>

          {hash && <p className="mt-3 text-xs text-slate-400">Transaction: {hash}</p>}
          {error && <p className="mt-3 text-xs text-red-300">{error.message}</p>}
        </div>
      </div>
    </main>
  );
}
