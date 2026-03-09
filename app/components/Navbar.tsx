'use client'

import React, { useState } from "react";
import Link from "next/link";
import { Terminal, ArrowLeft, Menu, X } from "lucide-react";

import { RainbowWalletConnect } from "@/RainbowWalletConnect";

interface NavbarProps {
    backLink?: { href: string; label: string };
    showDeck?: boolean;
}

export function Navbar({ backLink, showDeck = false }: NavbarProps) {
    void showDeck;
    const [isMenuOpen, setIsMenuOpen] = useState(false);

    return (
        <nav className="sticky top-0 z-50 w-full border-b border-white/5 bg-black/80 backdrop-blur-xl supports-[backdrop-filter]:bg-black/20">
            <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-6">
                <div className="flex items-center gap-12">
                    <Link href="/" className="group flex items-center gap-3 transition-opacity hover:opacity-80">
                        <div className="flex h-9 w-9 items-center justify-center rounded-sm border-2 border-[#00ffbd] text-[#00ffbd] shadow-[0_0_10px_rgba(0,255,189,0.2)]">
                            <Terminal className="h-5 w-5" />
                        </div>
                        <span className="font-display text-xl font-black uppercase tracking-tighter text-white">SkillForge</span>
                    </Link>

                    <div className="hidden items-center gap-8 lg:flex">
                        <Link href="/marketplace" className="text-[11px] font-bold uppercase tracking-[0.2em] text-slate-400 transition-colors hover:text-[#00ffbd]">Marketplace</Link>
                        <Link href="/dashboard" className="text-[11px] font-bold uppercase tracking-[0.2em] text-slate-400 transition-colors hover:text-[#00ffbd]">Creators</Link>
                    </div>
                </div>

                <div className="flex items-center gap-6">
                    {backLink && (
                        <Link href={backLink.href} className="hidden items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-slate-500 transition-colors hover:text-white md:flex">
                            <ArrowLeft className="h-3 w-3" />
                            {backLink.label}
                        </Link>
                    )}

                    <div className="hidden items-center gap-2 rounded-sm border border-white/10 bg-white/5 px-3 py-1.5 backdrop-blur-md sm:flex">
                        <span className="h-1.5 w-1.5 rounded-full bg-[#00ffbd] shadow-[0_0_8px_#00ffbd]" />
                        <span className="text-[9px] font-bold uppercase tracking-[0.2em] text-slate-400">System Online</span>
                    </div>

                    <div className="flex items-center gap-4">
                        <div className="hidden sm:block">
                            <RainbowWalletConnect />
                        </div>

                        <button
                            onClick={() => setIsMenuOpen(!isMenuOpen)}
                            className="flex h-10 w-10 items-center justify-center rounded-sm border border-white/10 bg-white/5 text-white lg:hidden"
                        >
                            {isMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
                        </button>
                    </div>
                </div>
            </div>

            {isMenuOpen && (
                <>
                    <button
                        aria-label="Close mobile navigation"
                        onClick={() => setIsMenuOpen(false)}
                        className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm lg:hidden"
                    />

                    <div className="fixed inset-y-0 right-0 z-[70] flex h-screen w-[280px] flex-col gap-8 border-l border-white/10 bg-black p-8 shadow-2xl lg:hidden">
                        <div className="mb-4 flex items-center justify-between">
                            <button onClick={() => setIsMenuOpen(false)} className="text-slate-500 transition-colors hover:text-white">
                                <X className="h-5 w-5" />
                            </button>
                        </div>

                        <div className="flex flex-col gap-6">
                            <Link
                                href="/marketplace"
                                onClick={() => setIsMenuOpen(false)}
                                className="text-sm font-bold uppercase tracking-[0.2em] text-slate-400 transition-colors hover:text-[#00ffbd]"
                            >
                                Marketplace
                            </Link>
                            <Link
                                href="/dashboard"
                                onClick={() => setIsMenuOpen(false)}
                                className="text-sm font-bold uppercase tracking-[0.2em] text-slate-400 transition-colors hover:text-[#00ffbd]"
                            >
                                Creators
                            </Link>
                        </div>

                        <div className="mt-auto space-y-6">
                            <div className="sm:hidden">
                                <RainbowWalletConnect />
                            </div>

                            <div className="flex items-center justify-center gap-2 rounded-sm border border-white/10 bg-white/5 py-3">
                                <span className="h-1.5 w-1.5 rounded-full bg-[#00ffbd] shadow-[0_0_8px_#00ffbd]" />
                                <span className="text-[9px] font-bold uppercase tracking-[0.2em] text-slate-400">System Online</span>
                            </div>
                        </div>
                    </div>
                </>
            )}
        </nav>
    );
}
