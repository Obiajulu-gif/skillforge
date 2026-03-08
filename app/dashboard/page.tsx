"use client";

import React from "react";
import { Cl } from "@stacks/transactions";
import { AlertCircle, CheckCircle2, Loader2, RefreshCw } from "lucide-react";

import { useStacksWallet } from "@/RainbowKitSetup";
import { getPublicClientConfig } from "@/app/lib/stacks/client";
import { useMySkills } from "@/app/lib/hooks/useMySkills";
import { useRegisterSkill } from "@/app/lib/hooks/useRegisterSkill";
import { useSkills } from "@/app/lib/hooks/useSkills";
import { formatTokenAmount } from "@/app/lib/stacks/utils";

type PurchasesResponse = {
  purchases: number[];
};

type AssetOption = {
  label: string;
  contractId: string;
};

export default function DashboardPage() {
  const { address, requestContractCall } = useStacksWallet();
  const { registerSkill, isPending: isRegistering, isSuccess, hash, error: registerError } = useRegisterSkill();
  const { skills: mySkills, refetch: refetchMine } = useMySkills();
  const { skills: allSkills, refetch: refetchAll } = useSkills();

  const [name, setName] = React.useState("");
  const [description, setDescription] = React.useState("");
  const [instructions, setInstructions] = React.useState("");
  const [price, setPrice] = React.useState("1000");
  const [metadataStatus, setMetadataStatus] = React.useState<string | null>(null);
  const [activeTxByListing, setActiveTxByListing] = React.useState<Record<number, boolean>>({});
  const [purchases, setPurchases] = React.useState<Set<number>>(new Set());
  const [assetOptions, setAssetOptions] = React.useState<AssetOption[]>([]);
  const [selectedAsset, setSelectedAsset] = React.useState("");

  React.useEffect(() => {
    getPublicClientConfig().then((config) => {
      const nextAssets: AssetOption[] = [];
      if (config.sbtcContractId) {
        nextAssets.push({ label: "sBTC", contractId: config.sbtcContractId });
      }
      if (config.usdcxContractId) {
        nextAssets.push({ label: "USDCx", contractId: config.usdcxContractId });
      }
      if (nextAssets.length > 0) {
        setAssetOptions(nextAssets);
        setSelectedAsset(nextAssets[0].contractId);
      }
    });
  }, []);

  React.useEffect(() => {
    async function loadPurchases() {
      if (!address) {
        setPurchases(new Set());
        return;
      }

      const response = await fetch(`/api/user/purchases?address=${encodeURIComponent(address)}`, { cache: "no-store" });
      if (!response.ok) {
        setPurchases(new Set());
        return;
      }

      const body = (await response.json()) as PurchasesResponse;
      setPurchases(new Set(body.purchases ?? []));
    }

    loadPurchases().catch(() => setPurchases(new Set()));
  }, [address, isSuccess]);

  async function handleCreateListing() {
    if (!address) {
      setMetadataStatus("Connect Leather wallet first.");
      return;
    }
    if (!name.trim() || !description.trim() || !instructions.trim()) {
      setMetadataStatus("Name, description, and instructions are required.");
      return;
    }
    if (!selectedAsset) {
      setMetadataStatus("Select a payment asset (sBTC or USDCx).");
      return;
    }

    try {
      setMetadataStatus("Uploading metadata to IPFS...");
      const ipfsResponse = await fetch("/api/ipfs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          description,
          instructions,
          category: "Agentic",
          tags: ["Stacks", "x402"],
        }),
      });

      if (!ipfsResponse.ok) {
        const text = await ipfsResponse.text();
        throw new Error(text || "Failed to upload metadata to IPFS");
      }

      const { ipfsUrl } = (await ipfsResponse.json()) as { ipfsUrl: string };
      setMetadataStatus("Submitting create-listing transaction...");

      await registerSkill({
        paymentAssetContractId: selectedAsset,
        price,
        metadataURI: ipfsUrl,
      });

      setMetadataStatus("Listing created successfully.");
      setName("");
      setDescription("");
      setInstructions("");
      await Promise.all([refetchMine(), refetchAll()]);
    } catch (err) {
      setMetadataStatus(err instanceof Error ? err.message : "Failed to create listing");
    }
  }

  async function setListingState(listingId: number, isActive: boolean) {
    try {
      setActiveTxByListing((prev) => ({ ...prev, [listingId]: true }));
      const config = await getPublicClientConfig();
      if (!config.contractId) {
        throw new Error("Contract ID not configured");
      }

      await requestContractCall({
        contract: config.contractId,
        functionName: "set-listing-status",
        functionArgs: [Cl.uint(listingId), Cl.bool(isActive)],
      });

      await Promise.all([refetchMine(), refetchAll()]);
    } finally {
      setActiveTxByListing((prev) => ({ ...prev, [listingId]: false }));
    }
  }

  const purchasedListings = React.useMemo(() => {
    return allSkills.filter((skill) => purchases.has(Number(skill.skillId)));
  }, [allSkills, purchases]);

  return (
    <main className="min-h-screen bg-black text-white">
      <div className="mx-auto max-w-6xl px-4 py-10">
        <h1 className="text-3xl font-black uppercase tracking-tight">Creator Dashboard</h1>
        <p className="mt-2 text-sm text-slate-400">
          Publish skill listings with on-chain pricing and manage listing status directly from Leather.
        </p>

        {!address && (
          <div className="mt-6 rounded-sm border border-yellow-500/30 bg-yellow-500/10 p-4 text-sm text-yellow-200">
            Connect your Leather wallet to publish and manage listings.
          </div>
        )}

        <section className="mt-8 rounded-sm border border-white/10 bg-neutral-900/40 p-6">
          <h2 className="text-lg font-semibold">Create Listing</h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <input
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="Listing name"
              className="rounded-sm border border-white/10 bg-black/50 px-3 py-2 text-sm"
            />
            <input
              value={price}
              onChange={(event) => setPrice(event.target.value)}
              placeholder="Price in token base units"
              className="rounded-sm border border-white/10 bg-black/50 px-3 py-2 text-sm"
            />
            <select
              value={selectedAsset}
              onChange={(event) => setSelectedAsset(event.target.value)}
              className="rounded-sm border border-white/10 bg-black/50 px-3 py-2 text-sm"
            >
              {assetOptions.map((option) => (
                <option key={option.contractId} value={option.contractId}>
                  {option.label} ({option.contractId})
                </option>
              ))}
            </select>
            <input
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              placeholder="Public description"
              className="rounded-sm border border-white/10 bg-black/50 px-3 py-2 text-sm"
            />
          </div>
          <textarea
            value={instructions}
            onChange={(event) => setInstructions(event.target.value)}
            placeholder="Private instructions (encrypted before IPFS upload)"
            className="mt-3 h-28 w-full rounded-sm border border-white/10 bg-black/50 px-3 py-2 text-sm"
          />
          <button
            disabled={!address || isRegistering}
            onClick={() => handleCreateListing().catch(() => undefined)}
            className="mt-4 rounded-sm border border-[#00ffbd]/40 bg-[#00ffbd]/10 px-4 py-2 text-xs font-bold uppercase tracking-wider text-[#00ffbd] disabled:opacity-50"
          >
            {isRegistering ? "Submitting..." : "Create Listing"}
          </button>

          {metadataStatus && <p className="mt-3 text-xs text-slate-300">{metadataStatus}</p>}
          {registerError && (
            <p className="mt-2 inline-flex items-center gap-1 text-xs text-red-300">
              <AlertCircle className="h-3 w-3" />
              {registerError.message}
            </p>
          )}
          {isSuccess && hash && (
            <p className="mt-2 inline-flex items-center gap-1 text-xs text-emerald-300">
              <CheckCircle2 className="h-3 w-3" />
              Transaction: {hash}
            </p>
          )}
        </section>

        <section className="mt-8 rounded-sm border border-white/10 bg-neutral-900/40 p-6">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold">My Listings</h2>
            <button
              onClick={() => Promise.all([refetchMine(), refetchAll()]).catch(() => undefined)}
              className="inline-flex items-center gap-1 text-xs text-slate-400 hover:text-white"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              Refresh
            </button>
          </div>
          {mySkills.length === 0 && <p className="text-sm text-slate-400">No listings published yet.</p>}
          <div className="space-y-3">
            {mySkills.map((skill) => {
              const listingId = Number(skill.skillId);
              const pending = Boolean(activeTxByListing[listingId]);
              return (
                <article key={listingId} className="rounded-sm border border-white/10 bg-black/40 p-4">
                  <p className="text-xs text-slate-500">Listing #{listingId}</p>
                  <h3 className="mt-1 text-base font-semibold">{skill.name}</h3>
                  <p className="mt-2 text-sm text-slate-400">{skill.description}</p>
                  <p className="mt-2 text-xs text-slate-500">
                    {formatTokenAmount(skill.pricePerUse, skill.paymentAssetDecimals)} {skill.paymentAssetSymbol} | Purchases:{" "}
                    {skill.totalCalls.toString()}
                  </p>
                  <button
                    disabled={pending}
                    onClick={() => setListingState(listingId, !skill.isActive).catch(() => undefined)}
                    className="mt-3 rounded-sm border border-white/15 px-3 py-1.5 text-xs font-semibold uppercase tracking-wider text-slate-200"
                  >
                    {pending ? (
                      <span className="inline-flex items-center gap-1">
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        Signing
                      </span>
                    ) : skill.isActive ? (
                      "Unpublish"
                    ) : (
                      "Publish"
                    )}
                  </button>
                </article>
              );
            })}
          </div>
        </section>

        <section className="mt-8 rounded-sm border border-white/10 bg-neutral-900/40 p-6">
          <h2 className="text-lg font-semibold">My Purchases</h2>
          {purchasedListings.length === 0 && <p className="mt-3 text-sm text-slate-400">No purchases yet.</p>}
          <div className="mt-3 space-y-3">
            {purchasedListings.map((skill) => (
              <article key={skill.skillId.toString()} className="rounded-sm border border-white/10 bg-black/40 p-4">
                <h3 className="text-sm font-semibold">{skill.name}</h3>
                <p className="mt-1 text-xs text-slate-400">{skill.description}</p>
              </article>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
