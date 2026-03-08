"use client";

import Link from "next/link";

export default function HomePage() {
  return (
    <main className="min-h-screen bg-black text-white">
      <section className="mx-auto flex max-w-6xl flex-col items-start px-4 py-24">
        <p className="rounded-full border border-[#00ffbd]/30 bg-[#00ffbd]/10 px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-[#00ffbd]">
          Stacks x402 Agentic Commerce
        </p>
        <h1 className="mt-6 text-5xl font-black uppercase tracking-tight sm:text-6xl">
          SkillForge on Stacks
        </h1>
        <p className="mt-5 max-w-2xl text-lg text-slate-300">
          Buy and sell AI skill listings with Leather wallet signatures, SIP-010 assets (sBTC and optional USDCx), and
          x402 payment-gated execution endpoints.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Link
            href="/marketplace"
            className="rounded-sm border border-[#00ffbd]/40 bg-[#00ffbd]/10 px-5 py-3 text-xs font-bold uppercase tracking-wider text-[#00ffbd]"
          >
            Open Marketplace
          </Link>
          <Link href="/dashboard" className="rounded-sm border border-white/20 px-5 py-3 text-xs font-bold uppercase tracking-wider">
            Open Dashboard
          </Link>
        </div>
      </section>
    </main>
  );
}
