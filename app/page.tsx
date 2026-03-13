"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";
import {
  ArrowRight,
  Bot,
  Cable,
  Coins,
  LockKeyhole,
  Orbit,
  Radar,
  ShieldCheck,
  Sparkles,
  Waves,
  Workflow,
} from "lucide-react";

const stats = [
  { value: "3", label: "Settlement rails live", detail: "Marketplace contract plus two payment assets on Stacks testnet." },
  { value: "402", label: "Protocol-first checkout", detail: "Skill execution only unlocks after verified on-chain purchase." },
  { value: "<60s", label: "Creator publish flow", detail: "Encrypt metadata, pin to IPFS, sign once, and list immediately." },
  { value: "1", label: "Unified runtime", detail: "Wallet connection, listing creation, and gated execution in one surface." },
];

const rails = [
  {
    title: "Encrypted metadata pipeline",
    copy:
      "Creator instructions are encrypted before storage, pushed to IPFS, and resolved through a gateway so listings stay portable.",
    icon: LockKeyhole,
  },
  {
    title: "Stacks-native purchase rail",
    copy:
      "Listings settle with SIP-010 assets, then the contract becomes the source of truth for access control and entitlement checks.",
    icon: Coins,
  },
  {
    title: "x402 execution gate",
    copy:
      "Execution endpoints challenge the client, validate payment intent, confirm the transaction, and only then run the purchased skill.",
    icon: Cable,
  },
];

const workflow = [
  {
    step: "01",
    title: "Compose and encrypt",
    copy:
      "The creator dashboard packages the listing name, copy, and private instructions, then encrypts the instructions before publishing metadata.",
  },
  {
    step: "02",
    title: "List with on-chain pricing",
    copy:
      "A wallet-signed contract call registers the listing, stores the selected payment asset, and exposes the offer to buyers immediately.",
  },
  {
    step: "03",
    title: "Verify and execute",
    copy:
      "Buyers settle through Stacks, access is checked on-chain, and the runtime releases the purchased skill behind an x402-style payment gate.",
  },
];

const protocolCards = [
  {
    title: "Marketplace state",
    detail:
      "Listing price, seller, payment asset, and access history stay on-chain so the purchase ledger is explicit and queryable.",
  },
  {
    title: "Operator visibility",
    detail:
      "The interface surfaces live contract IDs, gateway-backed metadata, and wallet network controls so creators can see the actual operating context.",
  },
  {
    title: "Production posture",
    detail:
      "Pinata-backed metadata, persistent encryption keys, and server-side AI execution credentials keep the runtime deployable beyond local dev.",
  },
];

const timeline = [
  "Wallet signs the listing or purchase call.",
  "Stacks contract settles and records access.",
  "x402 header proves payment intent to the server.",
  "Runtime verifies on-chain access before execution.",
];

export default function HomePage() {
  const pageRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    let cancelled = false;
    let revertAnimation: (() => void) | undefined;

    const runAnimation = async () => {
      if (!pageRef.current || window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
        return;
      }

      const { gsap } = await import("gsap");
      const { ScrollTrigger } = await import("gsap/ScrollTrigger");

      if (cancelled || !pageRef.current) {
        return;
      }

      gsap.registerPlugin(ScrollTrigger);

      const ctx = gsap.context(() => {
        const heroItems = gsap.utils.toArray<HTMLElement>("[data-hero-item]");
        gsap.fromTo(
          heroItems,
          { opacity: 0, y: 36 },
          { opacity: 1, y: 0, duration: 0.9, stagger: 0.12, ease: "power3.out" },
        );

        const floating = gsap.utils.toArray<HTMLElement>("[data-float]");
        floating.forEach((item, index) => {
          gsap.to(item, {
            y: index % 2 === 0 ? -16 : 16,
            x: index % 3 === 0 ? 12 : -10,
            rotate: index % 2 === 0 ? 4 : -4,
            duration: 5.5 + index,
            repeat: -1,
            yoyo: true,
            ease: "sine.inOut",
          });
        });

        const lines = gsap.utils.toArray<HTMLElement>("[data-line]");
        lines.forEach((line, index) => {
          gsap.fromTo(
            line,
            { scaleX: 0, transformOrigin: "left center" },
            { scaleX: 1, duration: 1.1, delay: 0.55 + index * 0.1, ease: "power2.out" },
          );
        });

        gsap.to("[data-radar]", {
          rotate: 360,
          duration: 26,
          repeat: -1,
          ease: "none",
        });

        gsap.to("[data-glow]", {
          opacity: 0.85,
          duration: 2.6,
          repeat: -1,
          yoyo: true,
          ease: "sine.inOut",
        });

        const sections = gsap.utils.toArray<HTMLElement>("[data-section]");
        sections.forEach((section) => {
          const reveals = section.querySelectorAll<HTMLElement>("[data-reveal]");
          if (!reveals.length) {
            return;
          }

          gsap.fromTo(
            reveals,
            { opacity: 0, y: 28 },
            {
              opacity: 1,
              y: 0,
              duration: 0.8,
              stagger: 0.12,
              ease: "power2.out",
              scrollTrigger: {
                trigger: section,
                start: "top 78%",
                once: true,
              },
            },
          );
        });
      }, pageRef);

      revertAnimation = () => ctx.revert();
    };

    runAnimation().catch(() => undefined);

    return () => {
      cancelled = true;
      revertAnimation?.();
    };
  }, []);

  return (
    <main ref={pageRef} className="landing-shell text-white">
      <section className="relative overflow-hidden px-4 pb-20 pt-10 sm:px-6 lg:px-8">
        <div className="landing-noise" aria-hidden="true" />
        <div className="landing-orb left-[-10%] top-20 h-64 w-64 bg-[#6dffc8]/18" data-glow />
        <div className="landing-orb right-[-8%] top-28 h-72 w-72 bg-[#ffb168]/14" data-glow />

        <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[minmax(0,1.2fr)_minmax(340px,0.8fr)] lg:items-center">
          <div className="max-w-3xl">
            <div
              data-hero-item
              className="inline-flex items-center gap-3 rounded-full border border-[#6dffc8]/25 bg-[#6dffc8]/8 px-4 py-2 text-[11px] font-black uppercase tracking-[0.24em] text-[#b9ffe1]"
            >
              <span className="h-2 w-2 rounded-full bg-[#6dffc8] shadow-[0_0_18px_rgba(109,255,200,0.95)]" />
              Stacks x402 agent commerce
            </div>

            <h1
              data-hero-item
              className="font-display mt-6 max-w-4xl text-5xl font-black uppercase tracking-[-0.04em] text-white sm:text-6xl lg:text-7xl"
            >
              Turn premium AI skills into a wallet-signed product surface.
            </h1>

            <p data-hero-item className="mt-6 max-w-2xl text-lg leading-8 text-[#c4d4ce] sm:text-xl">
              SkillForge combines Stacks contracts, encrypted listing metadata, and x402-gated execution so creators can
              publish skills that feel like products, not prompt scraps.
            </p>

            <div data-hero-item className="mt-8 flex flex-wrap items-center gap-4">
              <Link
                href="/marketplace"
                className="inline-flex items-center gap-2 rounded-full border border-[#ffb168]/30 bg-[linear-gradient(135deg,rgba(255,177,104,0.28),rgba(109,255,200,0.16))] px-6 py-3 text-[11px] font-black uppercase tracking-[0.2em] text-white shadow-[0_16px_40px_rgba(255,177,104,0.18)] transition-transform duration-300 hover:-translate-y-1"
              >
                Open Marketplace
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/dashboard"
                className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-6 py-3 text-[11px] font-black uppercase tracking-[0.2em] text-[#d8e5df] transition-colors hover:border-white/25 hover:bg-white/8"
              >
                Publish a skill
              </Link>
            </div>

            <div data-hero-item className="mt-10 grid gap-4 sm:grid-cols-3">
              {[
                "Encrypted IPFS metadata",
                "SIP-010 payment asset routing",
                "On-chain access verification",
              ].map((item) => (
                <div key={item} className="landing-chip justify-between">
                  <span>{item}</span>
                  <span className="h-2 w-2 rounded-full bg-[#6dffc8]" />
                </div>
              ))}
            </div>
          </div>

          <div className="relative">
            <div
              data-hero-item
              data-float
              className="landing-panel-strong relative overflow-hidden rounded-[32px] p-6 shadow-[0_24px_90px_rgba(0,0,0,0.28)]"
            >
              <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#6dffc8]/60 to-transparent" data-line />
              <div className="absolute -right-10 -top-10 h-36 w-36 rounded-full bg-[#6dffc8]/10 blur-3xl" />
              <div className="absolute -bottom-16 right-8 h-40 w-40 rounded-full bg-[#ffb168]/10 blur-3xl" />

              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-[#95aba4]">Runtime Deck</p>
                  <h2 className="font-display mt-3 text-2xl font-black uppercase tracking-[-0.03em] text-white">
                    Creator to execution loop
                  </h2>
                </div>
                <div className="relative flex h-16 w-16 items-center justify-center rounded-full border border-white/10 bg-white/5">
                  <Radar className="h-7 w-7 text-[#9dffd9]" data-radar />
                </div>
              </div>

              <div className="mt-8 grid gap-4">
                {[
                  { label: "Metadata", value: "Encrypted + pinned", icon: LockKeyhole },
                  { label: "Settlement", value: "Stacks SIP-010", icon: Coins },
                  { label: "Access", value: "Verified on-chain", icon: ShieldCheck },
                ].map((item, index) => {
                  const Icon = item.icon;

                  return (
                    <div
                      key={item.label}
                      data-float={index === 1 ? true : undefined}
                      className="flex items-center gap-4 rounded-[24px] border border-white/10 bg-[rgba(255,255,255,0.04)] px-4 py-4"
                    >
                      <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-white/10 bg-black/20 text-[#9dffd9]">
                        <Icon className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-[#8fa59d]">{item.label}</p>
                        <p className="mt-1 text-sm font-semibold text-white">{item.value}</p>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="mt-8 rounded-[28px] border border-white/10 bg-black/20 p-5">
                <div className="flex items-center justify-between">
                  <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-[#8fa59d]">Execution graph</p>
                  <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-[#b9ffe1]">testnet ready</p>
                </div>
                <div className="mt-4 grid gap-3 sm:grid-cols-3">
                  {["Create listing", "Confirm purchase", "Release runtime"].map((item) => (
                    <div key={item} className="rounded-2xl border border-white/8 bg-white/5 px-3 py-4 text-sm font-semibold text-[#dce7e1]">
                      {item}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div
              data-hero-item
              data-float
              className="landing-panel absolute -bottom-8 left-4 hidden max-w-xs rounded-[28px] p-5 lg:block"
            >
              <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-[#8fa59d]">Signal</p>
              <p className="mt-3 text-sm leading-6 text-[#dce7e1]">
                Publish with a signed contract call, then let the runtime challenge buyers with payment proofs instead of soft trust.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section id="overview" data-section className="px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div data-reveal className="flex items-center gap-3">
            <span className="landing-kicker">Overview</span>
            <span className="landing-divider" />
          </div>

          <div className="mt-8 grid gap-5 lg:grid-cols-4">
            {stats.map((stat) => (
              <article key={stat.label} data-reveal className="landing-panel rounded-[28px] p-6">
                <p className="font-display text-5xl font-black tracking-[-0.05em] text-white">{stat.value}</p>
                <p className="mt-4 text-[11px] font-black uppercase tracking-[0.22em] text-[#b9ffe1]">{stat.label}</p>
                <p className="mt-3 text-sm leading-7 text-[#b7c8c2]">{stat.detail}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="protocol" data-section className="px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
          <div data-reveal>
            <span className="landing-kicker">Protocol framing</span>
            <h2 className="font-display mt-5 max-w-xl text-4xl font-black uppercase tracking-[-0.04em] text-white sm:text-5xl">
              A landing page that explains the machine, not just the headline.
            </h2>
            <p className="mt-5 max-w-xl text-base leading-8 text-[#c0d0ca]">
              The product story here is operational: metadata is encrypted, settlement is on-chain, and runtime execution is locked
              behind payment verification. The interface should make that visible at first glance.
            </p>

            <div className="mt-8 space-y-4">
              {protocolCards.map((card) => (
                <div key={card.title} data-reveal className="landing-panel rounded-[24px] p-5">
                  <p className="text-[11px] font-black uppercase tracking-[0.22em] text-[#d7fbe9]">{card.title}</p>
                  <p className="mt-3 text-sm leading-7 text-[#b7c8c2]">{card.detail}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="grid gap-5">
            {rails.map((rail) => {
              const Icon = rail.icon;

              return (
                <article key={rail.title} data-reveal className="landing-panel-strong rounded-[28px] p-6">
                  <div className="flex items-start gap-4">
                    <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-[#9dffd9]">
                      <Icon className="h-6 w-6" />
                    </div>
                    <div>
                      <h3 className="font-display text-2xl font-black uppercase tracking-[-0.03em] text-white">{rail.title}</h3>
                      <p className="mt-3 max-w-xl text-sm leading-7 text-[#c4d4ce]">{rail.copy}</p>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      <section data-section className="px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div data-reveal className="flex items-center gap-3">
            <span className="landing-kicker">Flow</span>
            <span className="landing-divider" />
          </div>

          <div className="mt-8 grid gap-5 lg:grid-cols-3">
            {workflow.map((item) => (
              <article key={item.step} data-reveal className="landing-panel rounded-[28px] p-6">
                <div className="flex items-center justify-between">
                  <span className="font-display text-4xl font-black tracking-[-0.05em] text-[#9dffd9]">{item.step}</span>
                  <Workflow className="h-5 w-5 text-[#ffb168]" />
                </div>
                <h3 className="font-display mt-8 text-2xl font-black uppercase tracking-[-0.03em] text-white">{item.title}</h3>
                <p className="mt-4 text-sm leading-7 text-[#c0d0ca]">{item.copy}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="execution" data-section className="px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)]">
          <div data-reveal className="landing-panel rounded-[30px] p-6">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-[#9dffd9]">
                <Orbit className="h-5 w-5" />
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-[#8fa59d]">Runtime challenge</p>
                <h3 className="font-display mt-1 text-2xl font-black uppercase tracking-[-0.03em] text-white">
                  Purchase before compute
                </h3>
              </div>
            </div>

            <div className="mt-8 space-y-4">
              {timeline.map((item) => (
                <div key={item} data-reveal className="flex gap-4 rounded-2xl border border-white/8 bg-white/5 px-4 py-4">
                  <span className="mt-1 h-2.5 w-2.5 rounded-full bg-[#6dffc8] shadow-[0_0_16px_rgba(109,255,200,0.95)]" />
                  <p className="text-sm leading-7 text-[#d7e2dd]">{item}</p>
                </div>
              ))}
            </div>
          </div>

          <div data-reveal className="landing-panel-strong relative overflow-hidden rounded-[34px] p-6 sm:p-8">
            <div className="absolute inset-x-8 top-0 h-px bg-gradient-to-r from-transparent via-[#6dffc8]/70 to-transparent" data-line />
            <div className="grid gap-6 md:grid-cols-[1.1fr_0.9fr]">
              <div>
                <span className="landing-kicker">Execution architecture</span>
                <h3 className="font-display mt-5 text-4xl font-black uppercase tracking-[-0.04em] text-white">
                  Payment-gated AI with enough detail to feel real.
                </h3>
                <p className="mt-5 max-w-xl text-base leading-8 text-[#c6d5cf]">
                  The landing page should explain why SkillForge is not just another AI storefront. The asset registry, wallet path,
                  metadata pipeline, and x402 runtime all need visible separation so the product feels deliberate.
                </p>
              </div>

              <div className="space-y-4">
                {[
                  { title: "Wallet rail", icon: Waves, copy: "Network switching and signed contract calls stay native to the Stacks wallet flow." },
                  { title: "Execution rail", icon: Bot, copy: "Runtime requests can stay simulated or swap to Gemini-backed output when configured." },
                  { title: "Observability rail", icon: Sparkles, copy: "Explainers, states, and system chips make each protocol step legible for creators and buyers." },
                ].map((item) => {
                  const Icon = item.icon;

                  return (
                    <div key={item.title} data-reveal className="rounded-[24px] border border-white/10 bg-[rgba(255,255,255,0.05)] p-5">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-2xl border border-white/10 bg-black/20 text-[#ffb168]">
                          <Icon className="h-[18px] w-[18px]" />
                        </div>
                        <p className="text-[11px] font-black uppercase tracking-[0.22em] text-white">{item.title}</p>
                      </div>
                      <p className="mt-3 text-sm leading-7 text-[#c0d0ca]">{item.copy}</p>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section data-section className="px-4 pb-24 pt-12 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div
            data-reveal
            className="landing-panel-strong relative overflow-hidden rounded-[36px] px-6 py-8 sm:px-8 sm:py-10 lg:px-12"
          >
            <div className="absolute -left-12 top-8 h-40 w-40 rounded-full bg-[#6dffc8]/10 blur-3xl" data-glow />
            <div className="absolute bottom-0 right-0 h-44 w-44 rounded-full bg-[#ffb168]/10 blur-3xl" data-glow />
            <div className="grid gap-8 lg:grid-cols-[1.2fr_0.8fr] lg:items-end">
              <div>
                <span className="landing-kicker">Launch surface</span>
                <h2 className="font-display mt-5 max-w-3xl text-4xl font-black uppercase tracking-[-0.04em] text-white sm:text-5xl">
                  Move from a placeholder hero to a page that sells the full operating model.
                </h2>
                <p className="mt-5 max-w-2xl text-base leading-8 text-[#cad8d2]">
                  You now have a stronger nav, a layered landing story, and GSAP-driven motion that emphasizes structure instead of random flourish.
                </p>
              </div>

              <div className="flex flex-col gap-4 sm:flex-row lg:justify-end">
                <Link
                  href="/marketplace"
                  className="inline-flex items-center justify-center gap-2 rounded-full border border-[#ffb168]/30 bg-[linear-gradient(135deg,rgba(255,177,104,0.3),rgba(109,255,200,0.16))] px-6 py-3 text-[11px] font-black uppercase tracking-[0.2em] text-white shadow-[0_16px_40px_rgba(255,177,104,0.18)] transition-transform duration-300 hover:-translate-y-1"
                >
                  Explore listings
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <Link
                  href="/dashboard"
                  className="inline-flex items-center justify-center gap-2 rounded-full border border-white/15 bg-white/5 px-6 py-3 text-[11px] font-black uppercase tracking-[0.2em] text-[#d8e5df] transition-colors hover:border-white/25 hover:bg-white/8"
                >
                  Open creator deck
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
