"use client";

import Link from "next/link";
import { useLanguage } from "./LanguageProvider";

const FOOTER_LINKS = {
    Links: [
        { href: "#", label: "National Portal of India" },
        { href: "#", label: "MyGov.in" },
        { href: "#", label: "Digital India" },
    ],
    Support: [
        { href: "/help", label: "FAQs/Help" },
        { href: "#", label: "User Manual" },
        { href: "#", label: "Contact Us" },
    ],
    Policies: [
        { href: "#", label: "Privacy Policy" },
        { href: "#", label: "Copyright Policy" },
        { href: "#", label: "Hyperlinking Policy" },
        { href: "#", label: "Security Policy" },
    ],
};

export default function Footer() {
    const { t } = useLanguage();
    return (
        <footer className="bg-primary-600 text-white pt-12 pb-6 border-t-[6px] border-accent-saffron">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-12 border-b border-primary-800 pb-12">
                    {/* Brand */}
                    <div className="lg:col-span-1">
                        <h2 className="text-xl font-black tracking-tighter mb-4">
                            {t("branding.title")} <span className="text-accent-gold">{t("branding.highlight")}</span>
                        </h2>
                        <p className="text-xs text-blue-100/70 leading-relaxed mb-6 font-medium">
                            {t("about.p1")}
                        </p>
                        <div className="flex gap-2">
                            <div className="w-8 h-8 bg-white/10 rounded-sm flex items-center justify-center hover:bg-accent-gold transition-colors cursor-pointer text-white text-xs font-bold transition-all">FB</div>
                            <div className="w-8 h-8 bg-white/10 rounded-sm flex items-center justify-center hover:bg-accent-gold transition-colors cursor-pointer text-white text-xs font-bold transition-all">TW</div>
                            <div className="w-8 h-8 bg-white/10 rounded-sm flex items-center justify-center hover:bg-accent-gold transition-colors cursor-pointer text-white text-xs font-bold transition-all">LI</div>
                        </div>
                    </div>

                    {/* Links */}
                    {Object.entries(FOOTER_LINKS).map(([title, links]) => (
                        <div key={title}>
                            <h3 className="text-sm font-black uppercase tracking-widest text-accent-saffron mb-5">
                                {title}
                            </h3>
                            <ul className="space-y-3">
                                {links.map((link) => (
                                    <li key={link.label}>
                                        <Link
                                            href={link.href}
                                            className="text-xs text-blue-50 font-medium hover:text-accent-saffron hover:underline underline-offset-4 transition-all"
                                        >
                                            {link.label}
                                        </Link>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    ))}
                </div>

                <div className="flex flex-col md:flex-row justify-between items-center gap-6">
                    <div className="text-center md:text-right">
                        <p className="text-[10px] text-blue-100/50 font-medium italic">
                            Content Owned by Department of Administrative Reforms & Public Grievances
                        </p>
                        <p className="text-xs font-bold text-blue-200/40 mt-1 uppercase tracking-tighter">
                            © {new Date().getFullYear()} CIVIC SENSE PORTAL - GOVERNMENT OF INDIA
                        </p>
                    </div>
                </div>
            </div>
        </footer>
    );
}
