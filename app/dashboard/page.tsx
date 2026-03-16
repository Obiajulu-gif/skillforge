"use client";

import React from "react";
import { Cl } from "@stacks/transactions";
import {
  AlertCircle,
  BookOpen,
  CheckCircle2,
  Database,
  ExternalLink,
  Loader2,
  RefreshCw,
  ShieldCheck,
  Wallet,
} from "lucide-react";

import { useStacksWallet } from "@/RainbowKitSetup";
import { SkillDocumentInspector } from "@/app/components/dashboard/SkillDocumentInspector";
import { SkillDocumentStudio } from "@/app/components/dashboard/SkillDocumentStudio";
import { getPublicClientConfig } from "@/app/lib/stacks/client";
import { fetchSkillDocument, useSkillDocuments } from "@/app/lib/hooks/useSkillDocuments";
import { useMySkills } from "@/app/lib/hooks/useMySkills";
import { useRegisterSkill } from "@/app/lib/hooks/useRegisterSkill";
import { useSkills } from "@/app/lib/hooks/useSkills";
import type { SkillDocumentDetail, SkillDocumentSummary } from "@/app/lib/skill-documents/types";
import { formatTokenAmount } from "@/app/lib/stacks/utils";

type PurchasesResponse = {
  purchases: number[];
};

type AssetOption = {
  label: string;
  contractId: string;
};

function parseTags(value: string) {
  return Array.from(
    new Set(
      value
        .split(",")
        .map(tag => tag.trim())
        .filter(Boolean),
    ),
  );
}

function shortAddress(address: string) {
  if (address.length < 12) {
    return address;
  }

  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

function buildStarterMarkdown(name: string, description: string, category: string, tags: string[]) {
  const safeName = name.trim() || "Untitled Skill";
  const safeDescription = description.trim() || "Describe what this skill does and when an operator should use it.";
  const normalizedTags = tags.length > 0 ? tags : ["stacks", "x402", "wallet"];

  return [
    `# ${safeName}`,
    "",
    safeDescription,
    "",
    "## Ideal Use Cases",
    "",
    `- ${category || "General"} workflows that need explicit, repeatable outputs`,
    "- Wallet-connected agent commerce flows",
    "- Teams that want an operator-facing runbook instead of a loose prompt",
    "",
    "## Inputs",
    "",
    "- Goal",
    "- Context",
    "- Constraints",
    "- Desired format",
    "",
    "## Workflow",
    "",
    "1. Read the request and identify the highest-priority objective.",
    "2. Ask only for missing information that blocks execution.",
    "3. Produce a direct answer followed by concrete next steps.",
    "4. Keep the output concise, structured, and ready to use.",
    "",
    "## Tags",
    "",
    ...normalizedTags.map(tag => `- ${tag}`),
    "",
    "## Output Contract",
    "",
    "- Return the answer first.",
    "- Use plain language and explicit actions.",
    "- Avoid filler, hedging, and generic phrasing.",
  ].join("\n");
}

function formatDate(value: string) {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return value;
  }

  return parsed.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export default function DashboardPage() {
  const { address, requestContractCall } = useStacksWallet();
  const { registerSkill, isPending: isRegistering, isSuccess, hash, error: registerError } = useRegisterSkill();
  const { skills: mySkills, refetch: refetchMine } = useMySkills();
  const { skills: allSkills, refetch: refetchAll } = useSkills();
  const { documents: templateDocuments, isLoading: templatesLoading } = useSkillDocuments("seed");
  const { documents: myDocuments, refetch: refetchDocuments, isLoading: isDocumentsLoading } = useSkillDocuments(
    address ?? undefined,
    Boolean(address),
  );

  const [name, setName] = React.useState("");
  const [description, setDescription] = React.useState("");
  const [instructions, setInstructions] = React.useState("");
  const [price, setPrice] = React.useState("1000");
  const [category, setCategory] = React.useState("Marketing");
  const [tagsInput, setTagsInput] = React.useState("stacks, x402, leather");
  const [skillMarkdown, setSkillMarkdown] = React.useState(
    buildStarterMarkdown("", "", "Marketing", ["stacks", "x402", "leather"]),
  );
  const [metadataStatus, setMetadataStatus] = React.useState<string | null>(null);
  const [activeTxByListing, setActiveTxByListing] = React.useState<Record<number, boolean>>({});
  const [purchases, setPurchases] = React.useState<Set<number>>(new Set());
  const [assetOptions, setAssetOptions] = React.useState<AssetOption[]>([]);
  const [selectedAsset, setSelectedAsset] = React.useState("");
  const [explorerBase, setExplorerBase] = React.useState("https://explorer.hiro.so");
  const [activeDocument, setActiveDocument] = React.useState<SkillDocumentDetail | null>(null);
  const [activeDocumentLabel, setActiveDocumentLabel] = React.useState("SKILL.md");
  const [isDocumentLoading, setIsDocumentLoading] = React.useState(false);
  const [documentError, setDocumentError] = React.useState<string | null>(null);
  const [selectedTemplateId, setSelectedTemplateId] = React.useState<string | null>(null);
  const [copiedDocument, setCopiedDocument] = React.useState(false);

  const tags = React.useMemo(() => parseTags(tagsInput), [tagsInput]);

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
        setSelectedAsset(current => current || nextAssets[0].contractId);
      }
      setExplorerBase(config.explorerBaseUrl);
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

  async function loadDocument(
    documentId: string,
    options?: {
      owner?: string;
      buyer?: string;
      listingId?: number;
      label?: string;
    },
  ) {
    try {
      setIsDocumentLoading(true);
      setDocumentError(null);
      const document = await fetchSkillDocument(documentId, {
        owner: options?.owner,
        buyer: options?.buyer,
        listingId: options?.listingId,
      });
      setActiveDocument(document);
      setActiveDocumentLabel(options?.label ?? document.title);
    } catch (error) {
      setDocumentError(error instanceof Error ? error.message : "Unable to load SKILL.md");
    } finally {
      setIsDocumentLoading(false);
    }
  }

  async function handleLoadTemplate(document: SkillDocumentSummary) {
    setSelectedTemplateId(document.id);
    setName(document.title);
    setDescription(document.summary);
    setCategory(document.category);
    setTagsInput(document.tags.join(", "));

    try {
      const detail = await fetchSkillDocument(document.id, { owner: "seed" });
      setSkillMarkdown(detail.markdown);
      setInstructions(
        `Execute the ${document.title} skill. Follow the SKILL.md contract, keep outputs concise, and return structured deliverables.`,
      );
      setActiveDocument(detail);
      setActiveDocumentLabel(`${document.title} template`);
    } catch (error) {
      setDocumentError(error instanceof Error ? error.message : "Unable to load template body");
    }
  }

  async function handleCreateListing() {
    if (!address) {
      setMetadataStatus("Connect Leather wallet first.");
      return;
    }
    if (!name.trim() || !description.trim() || !instructions.trim()) {
      setMetadataStatus("Name, description, and private execution instructions are required.");
      return;
    }
    if (!selectedAsset) {
      setMetadataStatus("Select a payment asset (sBTC or USDCx).");
      return;
    }
    if (!skillMarkdown.trim()) {
      setMetadataStatus("Add a SKILL.md document before publishing.");
      return;
    }

    try {
      setMetadataStatus("Saving SKILL.md to Supabase...");
      const skillDocumentResponse = await fetch("/api/skills/documents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ownerAddress: address,
          title: name,
          category,
          summary: description,
          tags,
          markdown: skillMarkdown,
          templateKey: selectedTemplateId ?? undefined,
          paymentAssetContractId: selectedAsset,
        }),
      });

      const skillDocumentBody = (await skillDocumentResponse.json().catch(() => null)) as
        | { document?: SkillDocumentSummary; details?: string }
        | null;

      if (!skillDocumentResponse.ok || !skillDocumentBody?.document) {
        throw new Error(skillDocumentBody?.details ?? "Failed to store SKILL.md in Supabase");
      }

      const document = skillDocumentBody.document;

      setMetadataStatus("Uploading encrypted listing metadata...");
      const ipfsResponse = await fetch("/api/ipfs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          description,
          instructions,
          category,
          tags,
          skillDocumentId: document.id,
          skillDocumentTitle: document.title,
          skillDocumentSummary: document.summary,
          skillDocumentPreview: document.preview,
          skillDocumentCategory: document.category,
          skillDocumentTags: document.tags,
          skillDocumentOwner: document.ownerWallet,
        }),
      });

      if (!ipfsResponse.ok) {
        const text = await ipfsResponse.text();
        throw new Error(text || "Failed to upload listing metadata");
      }

      const { ipfsUrl } = (await ipfsResponse.json()) as { ipfsUrl: string };
      setMetadataStatus("Submitting create-listing transaction...");

      await registerSkill({
        paymentAssetContractId: selectedAsset,
        price,
        metadataURI: ipfsUrl,
      });

      setMetadataStatus("Listing created. SKILL.md saved in Supabase and linked to the on-chain listing.");
      setName("");
      setDescription("");
      setInstructions("");
      setPrice("1000");
      setCategory("Marketing");
      setTagsInput("stacks, x402, leather");
      setSkillMarkdown(buildStarterMarkdown("", "", "Marketing", ["stacks", "x402", "leather"]));
      setSelectedTemplateId(null);
      await Promise.all([refetchMine(), refetchAll(), refetchDocuments()]);
      await loadDocument(document.id, { owner: address, label: `${document.title} in Supabase` });
    } catch (err) {
      setMetadataStatus(err instanceof Error ? err.message : "Failed to create listing");
    }
  }

  async function setListingState(listingId: number, isActive: boolean) {
    try {
      setActiveTxByListing(prev => ({ ...prev, [listingId]: true }));
      const config = await getPublicClientConfig();
      if (!config.contractId) {
        throw new Error("Contract ID not configured");
      }

      await requestContractCall({
        contract: config.contractId as `${string}.${string}`,
        functionName: "set-listing-status",
        functionArgs: [Cl.uint(listingId), Cl.bool(isActive)],
      });

      await Promise.all([refetchMine(), refetchAll()]);
    } finally {
      setActiveTxByListing(prev => ({ ...prev, [listingId]: false }));
    }
  }

  async function copyActiveDocument() {
    if (!activeDocument?.markdown || typeof navigator === "undefined" || !navigator.clipboard) {
      return;
    }

    await navigator.clipboard.writeText(activeDocument.markdown);
    setCopiedDocument(true);
    window.setTimeout(() => setCopiedDocument(false), 1_500);
  }

  const purchasedListings = React.useMemo(() => {
    return allSkills.filter(skill => purchases.has(Number(skill.skillId)));
  }, [allSkills, purchases]);

  const dashboardStats = [
    { label: "Templates", value: String(templateDocuments.length), detail: "Seeded starter files" },
    { label: "My library", value: address ? String(myDocuments.length) : "--", detail: address ? "Supabase SKILL.md files" : "Connect wallet" },
    { label: "Listings", value: String(mySkills.length), detail: "Published on-chain" },
    { label: "Purchases", value: String(purchasedListings.length), detail: "Unlocked by wallet" },
  ];

  return (
    <main className="min-h-screen bg-black text-white">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
        <div className="grid gap-6 xl:grid-cols-[minmax(0,1.12fr)_360px]">
          <div className="space-y-6">
            <section className="rounded-[30px] border border-white/10 bg-[linear-gradient(155deg,rgba(12,19,21,0.96),rgba(5,8,9,0.94))] p-6 shadow-[0_18px_70px_rgba(0,0,0,0.28)]">
              <div className="grid gap-6 xl:grid-cols-[minmax(0,1.15fr)_minmax(280px,0.85fr)]">
                <div>
                  <h1 className="font-display text-4xl font-black uppercase tracking-[-0.05em] text-white">
                    Creator Dashboard
                  </h1>
                  <p className="mt-3 max-w-3xl text-base leading-8 text-[#c4d4ce]">
                    Store Clawhub-style <span className="font-semibold text-white">SKILL.md</span> files in Supabase,
                    link them into IPFS metadata, publish listings with your connected Leather wallet, and keep x402
                    execution locked to on-chain access.
                  </p>

                  <div className="mt-6 grid gap-3 md:grid-cols-3">
                    {[
                      { label: "Wallet rail", value: address ? shortAddress(address) : "Connect wallet", icon: Wallet },
                      { label: "Storage rail", value: "Supabase skill-documents", icon: Database },
                      { label: "Access rail", value: "x402 + Stacks purchase checks", icon: ShieldCheck },
                    ].map((item) => {
                      const Icon = item.icon;
                      return (
                        <div key={item.label} className="rounded-[22px] border border-white/10 bg-white/5 p-4">
                          <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-2xl border border-white/10 bg-black/20 text-[#8bffd4]">
                              <Icon className="h-4 w-4" />
                            </div>
                            <div>
                              <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-[#8fa59d]">
                                {item.label}
                              </p>
                              <p className="mt-1 text-sm font-semibold text-white">{item.value}</p>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-2">
                  {dashboardStats.map((item) => (
                    <div key={item.label} className="rounded-[22px] border border-white/10 bg-black/25 p-4">
                      <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-[#8fa59d]">{item.label}</p>
                      <p className="mt-3 text-3xl font-black uppercase tracking-[-0.05em] text-white">{item.value}</p>
                      <p className="mt-2 text-sm text-[#b6c8c1]">{item.detail}</p>
                    </div>
                  ))}
                </div>
              </div>
            </section>

            {!address && (
              <div className="rounded-[24px] border border-yellow-500/30 bg-yellow-500/10 p-4 text-sm text-yellow-100">
                Connect your Leather wallet to publish, store, and retrieve SKILL.md assets from your Supabase-backed
                library.
              </div>
            )}

            <section className="grid gap-6 2xl:grid-cols-[minmax(0,0.72fr)_minmax(0,1.28fr)]">
              <div className="rounded-[28px] border border-white/10 bg-[rgba(255,255,255,0.04)] p-5">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-[#8fa59d]">
                      Listing metadata
                    </p>
                    <h2 className="font-display mt-3 text-xl font-black uppercase tracking-[-0.03em] text-white">
                      Publish a paid skill
                    </h2>
                  </div>
                  <span className="rounded-full border border-[#ffb168]/25 bg-[#ffb168]/10 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-[#ffd7ad]">
                    Wallet + x402
                  </span>
                </div>

                <div className="mt-5 grid gap-3 md:grid-cols-2">
                  <input
                    value={name}
                    onChange={(event) => setName(event.target.value)}
                    placeholder="Skill name"
                    className="rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-sm text-white outline-none placeholder:text-slate-500 focus:border-[#6dffc8]/60"
                  />
                  <select
                    value={category}
                    onChange={(event) => setCategory(event.target.value)}
                    className="rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-sm text-white outline-none focus:border-[#6dffc8]/60"
                  >
                    {["Marketing", "DevOps", "Coding", "Sales", "Operations", "Research"].map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                  <input
                    value={price}
                    onChange={(event) => setPrice(event.target.value)}
                    placeholder="Price in token base units"
                    className="rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-sm text-white outline-none placeholder:text-slate-500 focus:border-[#6dffc8]/60"
                  />
                  <select
                    value={selectedAsset}
                    onChange={(event) => setSelectedAsset(event.target.value)}
                    className="rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-sm text-white outline-none focus:border-[#6dffc8]/60"
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
                    placeholder="Public marketplace description"
                    className="md:col-span-2 rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-sm text-white outline-none placeholder:text-slate-500 focus:border-[#6dffc8]/60"
                  />
                </div>

                <textarea
                  value={instructions}
                  onChange={(event) => setInstructions(event.target.value)}
                  placeholder="Private execution instructions for the x402-gated runtime"
                  className="mt-3 h-40 w-full rounded-[24px] border border-white/10 bg-black/40 px-4 py-3 text-sm text-white outline-none placeholder:text-slate-500 focus:border-[#6dffc8]/60"
                />

                <button
                  disabled={!address || isRegistering}
                  onClick={() => handleCreateListing().catch(() => undefined)}
                  className="mt-5 rounded-full border border-[#ffb168]/30 bg-[linear-gradient(135deg,rgba(255,177,104,0.22),rgba(109,255,200,0.16))] px-6 py-3 text-[11px] font-black uppercase tracking-[0.2em] text-white shadow-[0_14px_36px_rgba(255,177,104,0.14)] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {isRegistering ? "Signing listing..." : "Store SKILL.md + publish listing"}
                </button>

                {metadataStatus && <p className="mt-4 text-sm text-[#d2dfda]">{metadataStatus}</p>}
                {registerError && (
                  <p className="mt-3 inline-flex items-center gap-2 text-sm text-red-300">
                    <AlertCircle className="h-4 w-4" />
                    {registerError.message}
                  </p>
                )}
                {isSuccess && hash && (
                  <p className="mt-3 inline-flex items-center gap-2 text-sm text-emerald-300">
                    <CheckCircle2 className="h-4 w-4" />
                    Listing transaction confirmed.
                    <a
                      href={`${explorerBase.replace(/\/$/, "")}/txid/${hash}`}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 underline underline-offset-4"
                    >
                      View on explorer
                      <ExternalLink className="h-3.5 w-3.5" />
                    </a>
                  </p>
                )}
              </div>

              <SkillDocumentStudio
                category={category}
                onCategoryChange={setCategory}
                tagsInput={tagsInput}
                onTagsInputChange={setTagsInput}
                skillMarkdown={skillMarkdown}
                onSkillMarkdownChange={setSkillMarkdown}
                onRebuildDraft={() => setSkillMarkdown(buildStarterMarkdown(name, description, category, tags))}
                templateDocuments={templateDocuments}
                templatesLoading={templatesLoading}
                selectedTemplateId={selectedTemplateId}
                onLoadTemplate={(document) => {
                  handleLoadTemplate(document).catch(() => undefined);
                }}
              />
            </section>

            <section className="rounded-[28px] border border-white/10 bg-[rgba(255,255,255,0.04)] p-5">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-[#8fa59d]">Supabase library</p>
                <h2 className="font-display mt-3 text-xl font-black uppercase tracking-[-0.03em] text-white">
                  Retrieve stored SKILL.md files
                </h2>
              </div>
              <button
                onClick={() => refetchDocuments().catch(() => undefined)}
                className="inline-flex items-center gap-2 rounded-full border border-white/10 px-4 py-2 text-[10px] font-bold uppercase tracking-[0.18em] text-[#d7fbe9]"
                type="button"
              >
                <RefreshCw className="h-3.5 w-3.5" />
                Refresh
              </button>
            </div>

            {!address && <p className="mt-5 text-sm text-[#b6c8c1]">Connect a wallet to load your personal library.</p>}
            {address && isDocumentsLoading && (
              <div className="mt-5 inline-flex items-center gap-2 text-sm text-[#b6c8c1]">
                <Loader2 className="h-4 w-4 animate-spin" />
                Loading Supabase documents...
              </div>
            )}
            {address && !isDocumentsLoading && myDocuments.length === 0 && (
              <p className="mt-5 text-sm text-[#b6c8c1]">No SKILL.md files stored for this wallet yet.</p>
            )}

            <div className="mt-5 grid gap-4 lg:grid-cols-2 2xl:grid-cols-3">
              {myDocuments.map((document) => (
                <article key={document.id} className="rounded-[22px] border border-white/10 bg-black/25 p-4">
                  <div className="flex h-full flex-col gap-4">
                    <div className="min-w-0">
                      <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-[#8bffd4]">{document.category}</p>
                      <h3 className="mt-2 text-base font-semibold text-white">{document.title}</h3>
                      <p className="mt-2 text-sm leading-6 text-[#b6c8c1]">{document.summary}</p>
                      <p className="mt-3 text-xs text-[#7f9790]">
                        Updated {formatDate(document.updatedAt)} | {document.lineCount} lines | owner {shortAddress(document.ownerWallet)}
                      </p>
                    </div>
                    <button
                      onClick={() =>
                        loadDocument(document.id, { owner: address ?? undefined, label: document.title }).catch(
                          () => undefined,
                        )
                      }
                      className="mt-auto inline-flex w-fit items-center gap-2 rounded-full border border-[#6dffc8]/30 bg-[#6dffc8]/10 px-4 py-2 text-[10px] font-bold uppercase tracking-[0.18em] text-[#b9ffe1]"
                      type="button"
                    >
                      <BookOpen className="h-3.5 w-3.5" />
                      Open file
                    </button>
                  </div>
                </article>
              ))}
            </div>
            </section>

            <section className="grid gap-6 lg:grid-cols-2">
              <div className="rounded-[28px] border border-white/10 bg-[rgba(255,255,255,0.04)] p-5">
                <div className="mb-4 flex items-center justify-between gap-4">
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-[#8fa59d]">On-chain listings</p>
                    <h2 className="font-display mt-3 text-xl font-black uppercase tracking-[-0.03em] text-white">My listings</h2>
                  </div>
                  <button
                    onClick={() => Promise.all([refetchMine(), refetchAll(), refetchDocuments()]).catch(() => undefined)}
                    className="inline-flex items-center gap-2 rounded-full border border-white/10 px-4 py-2 text-[10px] font-bold uppercase tracking-[0.18em] text-[#d7fbe9]"
                    type="button"
                  >
                    <RefreshCw className="h-3.5 w-3.5" />
                    Refresh
                  </button>
                </div>

                {mySkills.length === 0 && <p className="text-sm text-[#b6c8c1]">No listings published yet.</p>}

                <div className="space-y-3">
                  {mySkills.map((skill) => {
                    const listingId = Number(skill.skillId);
                    const pending = Boolean(activeTxByListing[listingId]);

                    return (
                      <article key={listingId} className="rounded-[22px] border border-white/10 bg-black/25 p-4">
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                          <div className="min-w-0">
                            <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-[#8bffd4]">Listing #{listingId}</p>
                            <h3 className="mt-2 text-base font-semibold text-white">{skill.name}</h3>
                            <p className="mt-2 text-sm leading-6 text-[#b6c8c1]">{skill.description}</p>
                            <p className="mt-3 text-xs text-[#7f9790]">
                              {formatTokenAmount(skill.pricePerUse, skill.paymentAssetDecimals)} {skill.paymentAssetSymbol} | purchases {skill.totalCalls.toString()}
                            </p>
                            {skill.skillDocumentId && (
                              <button
                                type="button"
                                onClick={() => loadDocument(skill.skillDocumentId as string, { owner: address ?? undefined, label: `${skill.name} SKILL.md` }).catch(() => undefined)}
                                className="mt-3 inline-flex items-center gap-2 text-xs text-[#8bffd4]"
                              >
                                <Database className="h-3.5 w-3.5" />
                                Open linked SKILL.md
                              </button>
                            )}
                          </div>
                          <button
                            disabled={pending}
                            onClick={() => setListingState(listingId, !skill.isActive).catch(() => undefined)}
                            className="inline-flex shrink-0 items-center gap-2 rounded-full border border-white/15 px-4 py-2 text-[10px] font-bold uppercase tracking-[0.18em] text-[#d7fbe9] disabled:opacity-50"
                            type="button"
                          >
                            {pending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
                            {pending ? "Signing" : skill.isActive ? "Unpublish" : "Publish"}
                          </button>
                        </div>
                      </article>
                    );
                  })}
                </div>
              </div>

              <div className="rounded-[28px] border border-white/10 bg-[rgba(255,255,255,0.04)] p-5">
                <div className="mb-4">
                  <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-[#8fa59d]">Purchased access</p>
                  <h2 className="font-display mt-3 text-xl font-black uppercase tracking-[-0.03em] text-white">My purchases</h2>
                </div>

                {purchasedListings.length === 0 && <p className="text-sm text-[#b6c8c1]">No purchases yet.</p>}

                <div className="space-y-3">
                  {purchasedListings.map((skill) => (
                    <article key={skill.skillId.toString()} className="rounded-[22px] border border-white/10 bg-black/25 p-4">
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                        <div className="min-w-0">
                          <h3 className="text-base font-semibold text-white">{skill.name}</h3>
                          <p className="mt-2 text-sm leading-6 text-[#b6c8c1]">{skill.description}</p>
                          <p className="mt-3 text-xs text-[#7f9790]">Seller {shortAddress(skill.creator)} | x402 execution stays locked to on-chain access</p>
                        </div>
                        <button
                          type="button"
                          disabled={!skill.skillDocumentId || !address}
                          onClick={() => loadDocument(skill.skillDocumentId as string, { buyer: address ?? undefined, listingId: Number(skill.skillId), label: `${skill.name} purchase` }).catch(() => undefined)}
                          className="inline-flex shrink-0 items-center gap-2 rounded-full border border-[#6dffc8]/30 bg-[#6dffc8]/10 px-4 py-2 text-[10px] font-bold uppercase tracking-[0.18em] text-[#b9ffe1] disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          <BookOpen className="h-3.5 w-3.5" />
                          {skill.skillDocumentId ? "Retrieve SKILL.md" : "No SKILL.md"}
                        </button>
                      </div>
                    </article>
                  ))}
                </div>
              </div>
            </section>
          </div>

          <aside className="space-y-6 xl:sticky xl:top-24 xl:self-start">
            <SkillDocumentInspector
              activeDocument={activeDocument}
              activeDocumentLabel={activeDocumentLabel}
              isDocumentLoading={isDocumentLoading}
              documentError={documentError}
              copiedDocument={copiedDocument}
              onCopy={() => { copyActiveDocument().catch(() => undefined); }}
            />

            <section className="rounded-[28px] border border-white/10 bg-[rgba(255,255,255,0.04)] p-5">
              <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-[#8fa59d]">Workspace notes</p>
              <div className="mt-4 space-y-3 text-sm leading-6 text-[#b6c8c1]">
                <p>Template loads update the editor immediately, so you can publish from the same panel without losing context.</p>
                <p>The marketplace now surfaces prompt previews from linked SKILL.md files, not just the short listing description.</p>
                <p>Purchased SKILL.md files remain previewable here, but full content stays gated by connected wallet ownership.</p>
              </div>
            </section>
          </aside>
        </div>
      </div>
    </main>
  );
}

