"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { getCurrentUser, logout } from "@/lib/api";

const ADMIN_NAV = [
    { name: "DASHBOARD", href: "/admin/dashboard" },
    { name: "COMPLAINTS", href: "/admin/complaints" },
    { name: "PRIORITY", href: "/admin/priority" },
    { name: "ANALYTICS", href: "/admin/analytics" },
    { name: "TEAM", href: "/admin/team" },
    { name: "HELP", href: "/admin/help" },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
    const router = useRouter();
    const pathname = usePathname();
    const [isAuthorized, setIsAuthorized] = useState(false);
    const [loading, setLoading] = useState(true);
    const [user, setUser] = useState<any>(null);

    useEffect(() => {
        const currentUser = getCurrentUser();
        setUser(currentUser);

        if (pathname === "/admin") {
            setIsAuthorized(true);
            setLoading(false);
            return;
        }

        if (!currentUser || !["admin", "super_admin"].includes(currentUser.role)) {
            router.push("/login?admin=true");
        } else {
            setIsAuthorized(true);
        }
        setLoading(false);
    }, [router, pathname]);

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-12 h-12 border-4 border-primary-600 border-t-transparent rounded-full animate-spin"></div>
                    <p className="text-gray-500 font-bold uppercase tracking-widest text-xs">Verifying Access...</p>
                </div>
            </div>
        );
    }

    if (!isAuthorized) return null;

    const isLoginPage = pathname === "/admin";
    if (isLoginPage) return <>{children}</>;

    return (
        <div className="min-h-screen bg-[#F4F7F9] flex flex-col">
            {/* Tier 1: Top Accessibility Bar (Official Burgundy) */}
            <div className="bg-portal-utility py-1">
                <div className="max-w-7xl mx-auto px-4 flex justify-between items-center text-[10px] font-bold text-white/90">
                    <div className="flex gap-4">
                        <span className="uppercase tracking-wider">Government of India | भारत सरकार</span>
                    </div>
                    <div className="flex gap-4 items-center">
                        <span className="uppercase">Screen Reader</span>
                        <span className="border-l border-white/20 h-3" />
                        <select className="bg-transparent border-none outline-none cursor-pointer uppercase">
                            <option value="en">English</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* Tier 2: Main Logo Bar */}
            <div className="bg-portal-maroon py-4 sm:py-6 relative z-10">
                <div className="max-w-7xl mx-auto px-4 flex items-center justify-between">
                    <div className="flex items-center gap-6">
                        <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-lg border-2 border-accent-gold">
                            <span className="text-2xl font-black text-primary-900 leading-none">C</span>
                        </div>
                        <div className="text-left border-white/20">
                            <h1 className="text-xl sm:text-2xl font-black text-white leading-tight tracking-tight uppercase">
                                Civic Sense Portal
                            </h1>
                            <p className="text-[10px] font-bold text-white/60 leading-tight uppercase tracking-wider mt-0.5 opacity-80">
                                AI-Powered Public Grievance Redressal System
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-8">
                        <nav className="hidden lg:flex items-center gap-6 text-[11px] font-black text-white/80 uppercase tracking-widest">
                            <Link href="/" className="hover:text-accent-gold transition-colors">Home</Link>
                            <Link href="/lodge-grievance" className="hover:text-accent-gold transition-colors">Lodge Grievance</Link>
                            <Link href="/track-status" className="hover:text-accent-gold transition-colors">Track Status</Link>
                            <Link href="/help" className="hover:text-accent-gold transition-colors">Help</Link>
                        </nav>

                        <div className="flex items-center gap-4 border-l border-white/10 pl-8">
                            <div className="flex items-center gap-2">
                                <span className="text-xl">👤</span>
                                <span className="text-[11px] font-black text-white uppercase tracking-widest">{user?.role === 'super_admin' ? 'Super Admin' : 'Admin'}</span>
                            </div>
                            <div className="bg-accent-gold px-3 py-2 rounded-sm flex items-center gap-2 shadow-xl border-t border-white/30">
                                <span className="text-lg">👑</span>
                                <span className="text-[11px] font-black text-primary-900 uppercase">Admin</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Admin Header Section */}
            <div className="bg-white py-6 border-b border-gray-200">
                <div className="max-w-7xl mx-auto px-4 text-center">
                    <h2 className="text-3xl font-black text-primary-900 tracking-tighter uppercase">ADMIN DASHBOARD</h2>
                    <p className="text-xs font-bold text-gray-500 mt-1 uppercase tracking-[0.2em]">System Overview and Operational Status</p>
                </div>
            </div>

            {/* Tabbed Navigation Bar */}
            <div className="bg-[#0D3967] border-b border-white/10 shadow-lg">
                <div className="max-w-7xl mx-auto px-4 flex">
                    {ADMIN_NAV.map((item) => {
                        const isActive = pathname.startsWith(item.href);
                        return (
                            <Link
                                key={item.name}
                                href={item.href}
                                className={`px-8 py-4 text-[11px] font-black tracking-[0.2em] transition-all border-r border-white/5 relative ${isActive ? "bg-white text-primary-900" : "text-white/70 hover:bg-white/5 hover:text-white"}`}
                            >
                                {item.name}
                                {isActive && (
                                    <span className="absolute bottom-0 left-0 w-full h-[3px] bg-accent-gold" />
                                )}
                            </Link>
                        );
                    })}
                </div>
            </div>

            {/* Main Content Area */}
            <main className="flex-1 max-w-7xl mx-auto w-full p-8">
                {children}
            </main>

            {/* Support Footer Overlay (as seen in image) */}
            <div className="fixed bottom-4 left-4 z-50">
                <div className="bg-red-600 text-white rounded-full px-4 py-2 flex items-center gap-2 shadow-2xl cursor-pointer hover:scale-105 transition-transform">
                    <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center font-black">N</div>
                    <span className="text-[10px] font-black uppercase tracking-widest">3 Issues</span>
                    <span className="text-lg">×</span>
                </div>
            </div>
        </div>
    );
}
