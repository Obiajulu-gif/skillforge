"use client";

import Link from "next/link";
import React from "react";
import { AlertCircle, CheckCircle2, Database, Loader2, Search, ShieldCheck } from "lucide-react";

import { useStacksWallet } from "@/RainbowKitSetup";
import { getPublicClientConfig } from "@/app/lib/stacks/client";
import { usePurchaseSkill } from "@/app/lib/hooks/usePurchaseSkill";
import { useSkills } from "@/app/lib/hooks/useSkills";
import { formatTokenAmount } from "@/app/lib/stacks/utils";

type PurchasePayload = {
  purchases: number[];
};

function trimPromptPreview(value: string, maxLength = 180) {
  const normalized = value.replace(/\s+/g, " ").trim();
  if (normalized.length <= maxLength) {
    return normalized;
  }

  return `${normalized.slice(0, maxLength).trimEnd()}...`;
}

export default function MarketplacePage() {
  const { address } = useStacksWallet();
  const { skills, isLoading, error, refetch } = useSkills();
  const { purchaseSkill, isPending, isSuccess, hash, error: purchaseError } = usePurchaseSkill();

  const [search, setSearch] = React.useState("");
  const [selectedSkill, setSelectedSkill] = React.useState<number | null>(null);
  const [purchased, setPurchased] = React.useState<Set<number>>(new Set());
  const [explorerBase, setExplorerBase] = React.useState("https://explorer.hiro.so");

  React.useEffect(() => {
    getPublicClientConfig().then((config) => setExplorerBase(config.explorerBaseUrl));
  }, []);

  React.useEffect(() => {
    async function loadPurchases() {
      if (!address) {
        setPurchased(new Set());
        return;
      }

      const response = await fetch(`/api/user/purchases?address=${encodeURIComponent(address)}`, { cache: "no-store" });
      if (!response.ok) {
        setPurchased(new Set());
        return;
      }

      const json = (await response.json()) as PurchasePayload;
      setPurchased(new Set(json.purchases ?? []));
    }

    loadPurchases().catch(() => setPurchased(new Set()));
  }, [address, isSuccess]);

  const filteredSkills = React.useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) {
      return skills.filter((skill) => skill.isActive);
    }

    return skills.filter((skill) => {
      if (!skill.isActive) {
        return false;
      }

      return (
        skill.name.toLowerCase().includes(query) ||
        skill.description.toLowerCase().includes(query) ||
        skill.tags.some((tag) => tag.toLowerCase().includes(query)) ||
        (skill.skillDocumentTitle?.toLowerCase().includes(query) ?? false) ||
        (skill.skillDocumentSummary?.toLowerCase().includes(query) ?? false) ||
        (skill.skillDocumentPreview?.toLowerCase().includes(query) ?? false) ||
        (skill.skillDocumentTags?.some((tag) => tag.toLowerCase().includes(query)) ?? false)
      );
    });
  }, [skills, search]);

  async function onPurchase(skillId: number, paymentAssetContractId: string) {
    if (!address || isPending) {
      return;
    }

    setSelectedSkill(skillId);
    try {
      await purchaseSkill(skillId, paymentAssetContractId);
      await refetch();
    } finally {
      setSelectedSkill(null);
    }
  }

  return (
    <main className="min-h-screen bg-black text-white">
      <div className="mx-auto max-w-6xl px-4 py-10">
        <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <h1 className="text-3xl font-black uppercase tracking-tight">Stacks Marketplace</h1>
            <p className="mt-2 text-sm text-slate-400">
              Buy and sell AI skills with sBTC/USDCx settlement and Leather wallet signatures.
            </p>
          </div>
          <div className="relative w-full md:w-80">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search listings or prompt text..."
              className="w-full rounded-sm border border-white/10 bg-white/5 py-2 pl-10 pr-3 text-sm text-white outline-none placeholder:text-slate-500 focus:border-[#00ffbd]"
            />
          </div>
        </div>

        {isLoading && (
          <div className="flex items-center justify-center py-20 text-slate-400">
            <Loader2 className="mr-3 h-5 w-5 animate-spin" />
            Loading listings...
          </div>
        )}

        {error && (
          <div className="rounded-sm border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-300">
            {(error as Error).message}
          </div>
        )}

        {!isLoading && !error && filteredSkills.length === 0 && (
          <div className="rounded-sm border border-white/10 bg-white/5 p-6 text-sm text-slate-300">
            No active listings found.
          </div>
        )}

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filteredSkills.map((skill) => {
            const skillId = Number(skill.skillId);
            const owned = purchased.has(skillId);
            const currentPending = isPending && selectedSkill === skillId;
            const price = formatTokenAmount(skill.pricePerUse, skill.paymentAssetDecimals);
            const promptPreview = trimPromptPreview(
              skill.skillDocumentPreview ?? skill.skillDocumentSummary ?? skill.fullDescription ?? skill.description,
            );

            return (
              <article key={skillId} className="flex h-full flex-col rounded-sm border border-white/10 bg-neutral-900/40 p-5">
                <div className="mb-3 flex items-center justify-between">
                  <span className="rounded-full border border-[#00ffbd]/40 bg-[#00ffbd]/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-[#00ffbd]">
                    #{skillId}
                  </span>
                  {owned && (
                    <span className="inline-flex items-center gap-1 rounded-full border border-emerald-400/30 bg-emerald-400/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-emerald-300">
                      <ShieldCheck className="h-3 w-3" />
                      Owned
                    </span>
                  )}
                </div>
                <h2 className="text-lg font-semibold">{skill.name}</h2>
                <p className="mt-2 text-sm text-slate-400">{skill.description}</p>
                <div className="mt-4 rounded-2xl border border-[#6dffc8]/20 bg-[#6dffc8]/10 p-3">
                  <div className="inline-flex items-center gap-1 rounded-full border border-[#6dffc8]/25 bg-black/15 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-[#9dffd9]">
                    <Database className="h-3 w-3" />
                    {skill.skillDocumentId ? "SKILL.md prompt" : "Listing brief"}
                  </div>
                  <h3 className="mt-3 text-sm font-semibold text-white">
                    {skill.skillDocumentTitle ?? `${skill.name} prompt`}
                  </h3>
                  <p className="mt-2 text-sm leading-6 text-slate-300">{promptPreview}</p>
                  {(skill.skillDocumentTags ?? skill.tags).length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-2">
                      {(skill.skillDocumentTags ?? skill.tags).slice(0, 3).map((tag) => (
                        <span
                          key={tag}
                          className="rounded-full border border-white/10 px-2 py-1 text-[9px] font-bold uppercase tracking-[0.16em] text-[#d7fbe9]"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
                <p className="mt-3 text-xs text-slate-500">
                  Seller: {skill.creator.slice(0, 7)}...{skill.creator.slice(-5)}
                </p>
                <p className="mt-1 text-xs text-slate-500">
                  Uses: {skill.totalCalls.toString()} | Asset: {skill.paymentAssetSymbol}
                </p>
                <div className="mt-auto pt-4">
                  <div className="flex items-center justify-between border-t border-white/10 pt-4">
                    <div>
                      <p className="text-lg font-bold text-white">
                        {price} {skill.paymentAssetSymbol}
                      </p>
                    </div>
                    <button
                      disabled={currentPending || owned || !address}
                      onClick={() => onPurchase(skillId, skill.paymentAssetContractId)}
                      className="rounded-sm border border-[#00ffbd]/40 bg-[#00ffbd]/10 px-4 py-2 text-xs font-bold uppercase tracking-wider text-[#00ffbd] disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {owned ? "Purchased" : currentPending ? "Signing..." : "Buy"}
                    </button>
                  </div>
                  <div>
                    <Link href={`/skills/skill-${skillId}`} className="mt-4 inline-block text-xs text-[#00ffbd] hover:underline">
                      View details
                    </Link>
                  </div>
                </div>
              </article>
            );
          })}
        </div>

        {purchaseError && (
          <div className="mt-6 flex items-start gap-2 rounded-sm border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-300">
            <AlertCircle className="mt-0.5 h-4 w-4" />
            {purchaseError.message}
          </div>
        )}

        {isSuccess && hash && (
          <div className="mt-6 flex items-start gap-2 rounded-sm border border-emerald-500/30 bg-emerald-500/10 p-4 text-sm text-emerald-300">
            <CheckCircle2 className="mt-0.5 h-4 w-4" />
            Purchase confirmed.{" "}
            <a
              href={`${explorerBase.replace(/\/$/, "")}/txid/${hash}`}
              target="_blank"
              rel="noreferrer"
              className="ml-1 underline"
            >
              View transaction
            </a>
          </div>
        )}
      </div>
    </main>
  );
}

