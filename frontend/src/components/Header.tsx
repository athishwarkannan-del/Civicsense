"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { getCurrentUser, logout, type User } from "@/lib/api";
import { useLanguage } from "./LanguageProvider";

export default function Header() {
    const pathname = usePathname();
    const { locale, setLocale, t } = useLanguage();
    const [user, setUser] = useState<User | null>(null);
    const [menuOpen, setMenuOpen] = useState(false);

    const NAV_LINKS = [
        { href: "/", label: t("nav.home") },
        { href: "/lodge-grievance", label: t("nav.lodge") },
        { href: "/track-status", label: t("nav.status") },
        { href: "/help", label: t("nav.help") },
    ];

    useEffect(() => {
        setUser(getCurrentUser());
    }, [pathname]); // re-check on every route change

    const isActive = (href: string) => {
        if (href === "/") return pathname === "/";
        return pathname.startsWith(href);
    };

    return (
        <header className="z-50 shadow-md">
            {/* Tier 1: Top Accessibility Bar (Official Burgundy) */}
            <div className="bg-portal-utility py-1 hidden sm:block">
                <div className="max-w-7xl mx-auto px-4 flex justify-between items-center text-[10px] font-bold text-white/90">
                    <div className="flex gap-4">
                        <Link href="https://india.gov.in" target="_blank" className="hover:text-accent-saffron transition-colors">{t("common.government")}</Link>
                        <span className="border-l border-white/20 h-3" />
                        <span>{t("common.ministry")}</span>
                    </div>
                    <div className="flex gap-4 items-center">
                        <div className="flex gap-2 border-r border-white/20 pr-4">
                            <button
                                onClick={() => setLocale("en")}
                                className={`hover:text-accent-saffron transition-colors ${locale === "en" ? "text-accent-gold" : ""}`}
                            >
                                English
                            </button>
                            <button
                                onClick={() => setLocale("hi")}
                                className={`hover:text-accent-saffron transition-colors ${locale === "hi" ? "text-accent-gold" : ""}`}
                            >
                                हिंदी
                            </button>
                            <button
                                onClick={() => setLocale("ta")}
                                className={`hover:text-accent-saffron transition-colors ${locale === "ta" ? "text-accent-gold" : ""}`}
                            >
                                தமிழ்
                            </button>
                        </div>
                        <button className="px-1.5 py-0.5 border border-white/30 rounded-sm hover:bg-white/10">A-</button>
                        <button className="px-1.5 py-0.5 border border-white/30 rounded-sm font-bold hover:bg-white/10">A</button>
                        <button className="px-1.5 py-0.5 border border-white/30 rounded-sm hover:bg-white/10">A+</button>
                    </div>
                </div>
            </div>

            {/* Tier 2: Main Logo Bar */}
            <div className="bg-white py-4 sm:py-6 relative z-10 border-b border-gray-100">
                <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div className="flex items-center gap-6">
                        {/* Official Branding Logo */}
                        <div className="w-12 sm:w-20">
                            <img
                                src="/images/logo/logo.png"
                                alt="Civic Sense Portal Logo"
                                className="w-full h-auto object-contain"
                            />
                        </div>
                        <div className="text-center sm:text-left border-l sm:pl-6 border-gray-200">
                            <h1 className="text-xl sm:text-3xl font-black text-primary-600 leading-tight tracking-tight uppercase">
                                {t("branding.title")} <span className="text-accent-saffron-deep">{t("branding.highlight")}</span>
                            </h1>
                            <p className="text-[10px] sm:text-[12px] font-bold text-gray-600 leading-tight uppercase tracking-wider mt-1 opacity-80">
                                {t("branding.tagline")}
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        {user ? (
                            /* ── LOGGED-IN: welcome + logout only ── */
                            <div className="flex items-center gap-3">
                                <Link
                                    href={["admin", "super_admin"].includes(user.role) ? "/admin/dashboard" : "/dashboard"}
                                    className="flex items-center gap-3 bg-primary-50 border border-primary-100 hover:border-primary-300 px-4 py-2 rounded-sm transition-all group"
                                >
                                    <div className="w-9 h-9 bg-primary-600 text-white flex items-center justify-center font-black text-sm rounded-sm border-b-2 border-primary-800 shrink-0">
                                        {(user.full_name || user.email)?.charAt(0).toUpperCase() || "U"}
                                    </div>
                                    <div className="hidden sm:block text-left">
                                        <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest leading-none">Welcome back</p>
                                        <p className="text-[13px] font-black text-primary-700 uppercase leading-tight mt-0.5 group-hover:text-primary-900 transition-colors">
                                            {user.full_name || user.email?.split("@")[0]}
                                        </p>
                                    </div>
                                </Link>

                                <button
                                    onClick={logout}
                                    className="flex items-center gap-2 px-4 py-2.5 border-2 border-red-200 text-red-600 hover:bg-red-600 hover:text-white hover:border-red-600 text-[10px] font-black uppercase tracking-widest rounded-sm transition-all"
                                >
                                    <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h6a2 2 0 012 2v1" />
                                    </svg>
                                    <span className="hidden sm:inline">Logout</span>
                                </button>
                            </div>
                        ) : (
                            /* ── LOGGED-OUT: login + register + admin ── */
                            <div className="flex gap-2">
                                <Link href="/login" className="btn-secondary !text-[11px] !px-4 hover:border-accent-saffron hover:text-accent-saffron text-primary-600 border-primary-600">{t("auth.signin")}</Link>
                                <Link href="/register" className="btn-primary !text-[11px] !px-4 shadow-lg shadow-primary-600/20 !bg-accent-gold !text-primary-900 !border-0 font-black">{t("auth.signup")}</Link>
                                <Link href="/admin" className="px-4 py-2 border border-primary-600 text-primary-600 text-[11px] font-black hover:bg-primary-600 hover:text-white transition-all rounded-sm hidden lg:block">
                                    {locale === "ta" ? "நிர்வாகி உள்நுழைவு" : locale === "hi" ? "एडमिन लॉगिन" : "ADMIN LOGIN"}
                                </Link>
                            </div>
                        )}
                        <button className="sm:hidden p-2 text-primary-600 border border-primary-600 rounded-sm" onClick={() => setMenuOpen(!menuOpen)}>
                            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M4 6h16M4 12h16M4 18h16" /></svg>
                        </button>
                    </div>
                </div>
            </div>

            {/* Tier 3: Primary Navigation Bar (Official Indigo/Maroon) */}
            <nav className="bg-primary-900 text-white hidden sm:block overflow-hidden shadow-lg border-b border-white/10">
                <div className="max-w-7xl mx-auto px-4 flex whitespace-nowrap overflow-x-auto no-scrollbar">
                    {NAV_LINKS.map((link) => (
                        <Link
                            key={link.href}
                            href={link.href}
                            className={`px-6 py-4 text-[12px] font-black tracking-widest transition-all duration-150 border-r border-white/5 hover:bg-primary-800 relative ${isActive(link.href) ? "bg-primary-800" : ""}`}
                        >
                            {link.label}
                            {isActive(link.href) && (
                                <span className="absolute bottom-0 left-0 w-full h-1 bg-accent-saffron" />
                            )}
                        </Link>
                    ))}
                    {["admin", "super_admin"].includes(user?.role || "") && (
                        <Link href="/admin/dashboard" className="px-6 py-4 text-[12px] font-black tracking-widest bg-accent-gold text-primary-900 ml-auto hover:bg-white transition-colors">
                            {t("nav.admin")}
                        </Link>
                    )}
                </div>
            </nav>

            {/* Mobile Nav */}
            {menuOpen && (
                <div className="sm:hidden bg-primary-700 text-white border-t border-primary-500 animate-fade-in absolute w-full z-50 shadow-2xl">
                    <div className="flex flex-col py-2">
                        {NAV_LINKS.map((link) => (
                            <Link key={link.href} href={link.href} onClick={() => setMenuOpen(false)} className={`px-4 py-4 text-xs font-bold border-b border-primary-600 ${isActive(link.href) ? "bg-primary-800" : ""}`}>
                                {link.label}
                            </Link>
                        ))}
                    </div>
                </div>
            )}
        </header>
    );
}
