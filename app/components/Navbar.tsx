"use client";

import React, { useEffect, useState, useSyncExternalStore } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowLeft, ChevronRight, Menu, Sparkles, Terminal, X } from "lucide-react";

import { RainbowWalletConnect } from "@/RainbowWalletConnect";

interface NavbarProps {
    backLink?: { href: string; label: string };
    showDeck?: boolean;
}

type NavItem = {
    href: string;
    label: string;
};

const APP_ITEMS: NavItem[] = [
    { href: "/marketplace", label: "Marketplace" },
    { href: "/dashboard", label: "Creators" },
];

const HOME_ITEMS: NavItem[] = [
    { href: "/#overview", label: "Overview" },
    { href: "/#protocol", label: "Protocol" },
    { href: "/#execution", label: "Execution" },
];

function subscribeHashChange(onStoreChange: () => void) {
    if (typeof window === "undefined") {
        return () => {};
    }

    window.addEventListener("hashchange", onStoreChange);
    return () => window.removeEventListener("hashchange", onStoreChange);
}

function getHashSnapshot() {
    if (typeof window === "undefined") {
        return "";
    }

    return window.location.hash;
}

function isActivePath(pathname: string, hash: string, href: string) {
    if (href.startsWith("/#")) {
        return pathname === "/" && hash === href.slice(1);
    }

    return pathname === href || pathname.startsWith(`${href}/`);
}

export function Navbar({ backLink, showDeck = false }: NavbarProps) {
    const pathname = usePathname();
    const [menuPathname, setMenuPathname] = useState<string | null>(null);
    const [isScrolled, setIsScrolled] = useState(false);
    const activeHash = useSyncExternalStore(subscribeHashChange, getHashSnapshot, () => "");

    useEffect(() => {
        const onScroll = () => setIsScrolled(window.scrollY > 12);

        onScroll();
        window.addEventListener("scroll", onScroll, { passive: true });

        return () => window.removeEventListener("scroll", onScroll);
    }, []);

    const navItems = showDeck ? [...HOME_ITEMS, ...APP_ITEMS] : APP_ITEMS;
    const network = (process.env.NEXT_PUBLIC_STACKS_NETWORK ?? "devnet").toUpperCase();
    const isMenuOpen = menuPathname === pathname;

    const openMenu = () => {
        setMenuPathname(pathname);
    };

    const closeMenu = () => {
        setMenuPathname(null);
    };

    return (
        <nav
            className={`sticky top-0 z-50 w-full border-b transition-all duration-300 ${
                isScrolled
                    ? "border-white/10 bg-[rgba(6,11,13,0.88)] shadow-[0_18px_60px_rgba(0,0,0,0.45)] backdrop-blur-2xl"
                    : "border-white/5 bg-[rgba(6,11,13,0.72)] backdrop-blur-xl"
            }`}
        >
            <div className="mx-auto flex h-20 max-w-7xl items-center justify-between gap-6 px-4 sm:px-6">
                <div className="flex min-w-0 items-center gap-4 lg:gap-8">
                    <Link href="/" className="group flex shrink-0 items-center gap-3">
                        <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-[#6dffc8]/35 bg-[linear-gradient(135deg,rgba(109,255,200,0.18),rgba(255,168,77,0.12))] text-[#9dffd9] shadow-[0_0_30px_rgba(109,255,200,0.18)] transition-transform duration-300 group-hover:-translate-y-0.5">
                            <Terminal className="h-5 w-5" />
                        </div>
                        <div className="min-w-0">
                            <p className="font-display text-lg font-black uppercase tracking-[0.18em] text-white sm:text-xl">
                                SkillForge
                            </p>
                            <p className="hidden text-[10px] font-semibold uppercase tracking-[0.28em] text-[#9bb2ac] sm:block">
                                Agent Commerce on Stacks
                            </p>
                        </div>
                    </Link>

                    <div className="hidden items-center gap-2 xl:flex">
                        {navItems.map((item) => {
                            const active = isActivePath(pathname, activeHash, item.href);

                            return (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    className={`rounded-full px-4 py-2 text-[11px] font-bold uppercase tracking-[0.22em] transition-all ${
                                        active
                                            ? "bg-white/10 text-white shadow-[inset_0_0_0_1px_rgba(255,255,255,0.08)]"
                                            : "text-[#91a69f] hover:bg-white/5 hover:text-[#d8fff0]"
                                    }`}
                                >
                                    {item.label}
                                </Link>
                            );
                        })}
                    </div>
                </div>

                <div className="hidden items-center gap-3 lg:flex">
                    {backLink && (
                        <Link
                            href={backLink.href}
                            className="inline-flex items-center gap-2 rounded-full border border-white/10 px-4 py-2 text-[10px] font-bold uppercase tracking-[0.24em] text-[#95aba4] transition-colors hover:text-white"
                        >
                            <ArrowLeft className="h-3.5 w-3.5" />
                            {backLink.label}
                        </Link>
                    )}

                    <div className="hidden items-center gap-3 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-[10px] font-bold uppercase tracking-[0.24em] text-[#d7fbe9] xl:flex">
                        <span className="h-2 w-2 rounded-full bg-[#6dffc8] shadow-[0_0_16px_rgba(109,255,200,0.95)]" />
                        {network}
                        <span className="text-[#95aba4]">Live Contract Rail</span>
                    </div>

                    <Link
                        href="/marketplace"
                        className="hidden items-center gap-2 rounded-full border border-[#ffb168]/30 bg-[linear-gradient(135deg,rgba(255,177,104,0.24),rgba(109,255,200,0.14))] px-4 py-2 text-[11px] font-black uppercase tracking-[0.2em] text-white shadow-[0_12px_30px_rgba(255,177,104,0.14)] transition-transform duration-300 hover:-translate-y-0.5 xl:inline-flex"
                    >
                        <Sparkles className="h-3.5 w-3.5" />
                        Launch App
                    </Link>

                    <RainbowWalletConnect />
                </div>

                <button
                    onClick={openMenu}
                    className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-white transition-colors hover:border-white/20 hover:bg-white/10 lg:hidden"
                    aria-label="Open navigation"
                    type="button"
                >
                    <Menu className="h-5 w-5" />
                </button>
            </div>

            {isMenuOpen && (
                <>
                    <button
                        aria-label="Close mobile navigation backdrop"
                        onClick={closeMenu}
                        className="fixed inset-0 z-[60] bg-black/70 backdrop-blur-sm lg:hidden"
                        type="button"
                    />

                    <div className="fixed inset-y-0 right-0 z-[70] flex h-screen w-[min(90vw,360px)] flex-col border-l border-white/10 bg-[linear-gradient(180deg,rgba(6,11,13,0.98),rgba(5,8,9,0.98))] p-6 shadow-[0_24px_80px_rgba(0,0,0,0.45)] lg:hidden">
                        <div className="flex items-start justify-between gap-4">
                            <div>
                                <p className="font-display text-lg font-black uppercase tracking-[0.18em] text-white">
                                    SkillForge
                                </p>
                                <p className="mt-1 text-[10px] font-semibold uppercase tracking-[0.26em] text-[#95aba4]">
                                    {network} control surface
                                </p>
                            </div>

                            <button
                                onClick={closeMenu}
                                className="flex h-10 w-10 items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-white"
                                aria-label="Close mobile navigation"
                                type="button"
                            >
                                <X className="h-5 w-5" />
                            </button>
                        </div>

                        <div className="mt-8 rounded-[28px] border border-white/10 bg-white/5 p-4">
                            <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-[#95aba4]">
                                Live Surface
                            </p>
                            <p className="mt-3 text-sm leading-6 text-[#d0ddd7]">
                                Browse listings, publish paid skills, and route AI execution through Stacks-native payment gates.
                            </p>
                        </div>

                        <div className="mt-8 flex flex-col gap-2">
                            {navItems.map((item) => (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    onClick={closeMenu}
                                    className="flex items-center justify-between rounded-2xl border border-white/8 bg-white/5 px-4 py-3 text-sm font-bold uppercase tracking-[0.18em] text-white transition-colors hover:border-white/15 hover:bg-white/8"
                                >
                                    {item.label}
                                    <ChevronRight className="h-4 w-4 text-[#88eec0]" />
                                </Link>
                            ))}
                        </div>

                        <div className="mt-6">
                            <Link
                                href="/marketplace"
                                onClick={closeMenu}
                                className="flex items-center justify-center gap-2 rounded-2xl border border-[#ffb168]/30 bg-[linear-gradient(135deg,rgba(255,177,104,0.2),rgba(109,255,200,0.12))] px-4 py-3 text-[11px] font-black uppercase tracking-[0.22em] text-white"
                            >
                                <Sparkles className="h-3.5 w-3.5" />
                                Open Marketplace
                            </Link>
                        </div>

                        <div className="mt-auto space-y-4 pt-8">
                            <div className="rounded-[24px] border border-white/10 bg-white/5 p-4">
                                <RainbowWalletConnect />
                            </div>

                            <div className="flex items-center justify-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-[10px] font-bold uppercase tracking-[0.24em] text-[#d7fbe9]">
                                <span className="h-2 w-2 rounded-full bg-[#6dffc8] shadow-[0_0_16px_rgba(109,255,200,0.95)]" />
                                Contracts Online
                            </div>
                        </div>
                    </div>
                </>
            )}
        </nav>
    );
}
