"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { api, getCurrentUser, type Grievance } from "@/lib/api";

const STATUS_OPTIONS = ["all", "pending", "in_progress", "resolved", "rejected", "escalated"];

const STATUS_BADGE: Record<string, string> = {
    pending: "badge-pending",
    in_progress: "badge-in-progress",
    resolved: "badge-resolved",
    rejected: "badge-rejected",
    escalated: "badge-escalated",
};

export default function DashboardPage() {
    const router = useRouter();
    const [user, setUser] = useState<any>(null);
    const [grievances, setGrievances] = useState<Grievance[]>([]);
    const [total, setTotal] = useState(0);
    const [loading, setLoading] = useState(true);
    const [status, setStatus] = useState("all");
    const [page, setPage] = useState(1);
    const limit = 10;

    const fetchGrievances = useCallback(async () => {
        const currUser = getCurrentUser();
        if (!currUser) { router.push("/login"); return; }
        setUser(currUser);

        setLoading(true);
        try {
            const res = await api.getUserGrievances(currUser.email, {
                status: status === "all" ? undefined : status,
                page,
                limit,
            });
            setGrievances(res.grievances);
            setTotal(res.total);
        } catch { /* auth redirect handled by api */ }
        finally { setLoading(false); }
    }, [status, page, router]);

    useEffect(() => {
        fetchGrievances();
    }, [fetchGrievances]);

    const totalPages = Math.ceil(total / limit);

    // Derived stats for the dashboard (approximate for UI)
    const stats = {
        total: total,
        pending: grievances.filter(g => g.status === 'pending').length, // Simplification for demo
        resolved: grievances.filter(g => g.status === 'resolved').length
    };

    return (
        <div className="min-h-screen bg-portal-bg py-12 px-4">
            <div className="max-w-6xl mx-auto">
                {/* Dashboard Header */}
                <div className="bg-white border-t-4 border-accent-saffron shadow-sm p-8 mb-8 flex flex-col md:flex-row justify-between items-center gap-6">
                    <div>
                        <h1 className="text-2xl font-black text-primary-600 tracking-tighter uppercase">CITIZEN DASHBOARD</h1>
                        <p className="text-[11px] font-bold text-gray-500 uppercase tracking-widest mt-1">
                            Welcome, <span className="text-primary-900">{user?.full_name || 'CITIZEN'}</span> • Manage your grievances
                        </p>
                    </div>
                    <Link href="/lodge-grievance" className="w-full md:w-auto px-10 py-4 bg-primary-600 text-white text-[10px] font-black uppercase tracking-widest hover:bg-primary-700 transition-all rounded-sm shadow-lg flex items-center justify-center gap-3">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                        </svg>
                        LODGE NEW GRIEVANCE
                    </Link>
                </div>

                {/* Quick Stats */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    <div className="bg-white border border-gray-200 p-6 flex items-center gap-5 shadow-sm">
                        <div className="w-12 h-12 bg-primary-50 text-primary-600 flex items-center justify-center rounded-sm">
                            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>
                        </div>
                        <div>
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">TOTAL FILED</p>
                            <p className="text-2xl font-black text-primary-900 leading-tight">{total}</p>
                        </div>
                    </div>
                    <div className="bg-white border border-gray-200 p-6 flex items-center gap-5 shadow-sm">
                        <div className="w-12 h-12 bg-amber-50 text-amber-600 flex items-center justify-center rounded-sm">
                            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                        </div>
                        <div>
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">PENDING ACTION</p>
                            <p className="text-2xl font-black text-amber-600 leading-tight">{stats.pending}</p>
                        </div>
                    </div>
                    <div className="bg-white border border-gray-200 p-6 flex items-center gap-5 shadow-sm">
                        <div className="w-12 h-12 bg-emerald-50 text-emerald-600 flex items-center justify-center rounded-sm">
                            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                        </div>
                        <div>
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">SUCCESSFULLY RESOLVED</p>
                            <p className="text-2xl font-black text-emerald-600 leading-tight">{stats.resolved}</p>
                        </div>
                    </div>
                </div>

                {/* Filter Bar */}
                <div className="bg-gray-200/50 p-2 mb-8 flex flex-wrap gap-1 rounded-sm">
                    {STATUS_OPTIONS.map((s) => (
                        <button
                            key={s}
                            onClick={() => { setStatus(s); setPage(1); }}
                            className={`px-6 py-3 text-[10px] font-black uppercase tracking-widest transition-all rounded-sm ${s === status
                                ? "bg-primary-600 text-white shadow-md scale-[1.02]"
                                : "text-gray-500 hover:bg-white hover:text-primary-600"
                                }`}
                        >
                            {s === "all" ? "ALL GRIEVANCES" : s.replace("_", " ")}
                        </button>
                    ))}
                </div>

                {/* Grievance List */}
                {loading ? (
                    <div className="space-y-4 animate-pulse">
                        {[1, 2, 3].map((n) => (
                            <div key={n} className="h-32 bg-white border border-gray-200 rounded-sm" />
                        ))}
                    </div>
                ) : grievances.length === 0 ? (
                    <div className="bg-white border-2 border-dashed border-gray-200 p-20 text-center rounded-sm">
                        <p className="text-[11px] font-black text-gray-400 uppercase tracking-[0.2em] mb-4">NO RECORDS FOUND</p>
                        <p className="text-sm text-gray-400 mb-8 uppercase">You haven&apos;t filed any grievances matching this filter.</p>
                        <Link href="/lodge-grievance" className="text-primary-600 text-xs font-black uppercase underline decoration-2 underline-offset-4">File a new grievance now</Link>
                    </div>
                ) : (
                    <div className="space-y-4">
                        <div className="hidden lg:grid grid-cols-12 gap-4 px-8 mb-2 text-[10px] font-black text-gray-400 uppercase tracking-widest">
                            <div className="col-span-2">REG. NUMBER</div>
                            <div className="col-span-5">SUBJECT / DESCRIPTION</div>
                            <div className="col-span-2">CATEGORY</div>
                            <div className="col-span-2">STATUS</div>
                            <div className="col-span-1 text-right">ACTION</div>
                        </div>

                        {grievances.map((g) => (
                            <div key={g.id} className="bg-white border border-gray-200 shadow-sm hover:border-primary-600/30 transition-all group overflow-hidden">
                                <Link href={`/dashboard/complaint/${g.id}`} className="grid grid-cols-1 lg:grid-cols-12 gap-4 p-8 items-center">
                                    <div className="col-span-2">
                                        <p className="text-[10px] font-black text-primary-600 mb-1">REG. NO.</p>
                                        <p className="text-sm font-black text-gray-900 tracking-tight">{g.id}</p>
                                        <p className="text-[9px] font-bold text-gray-400 mt-1 uppercase">{new Date(g.created_at).toLocaleDateString()}</p>
                                    </div>
                                    <div className="col-span-5">
                                        <p className="text-sm font-black text-gray-800 uppercase line-clamp-1 group-hover:text-primary-600 transition-colors">{g.category}</p>
                                        <p className="text-xs text-gray-500 line-clamp-1 mt-1 uppercase">{g.description}</p>
                                    </div>
                                    <div className="col-span-2">
                                        <p className="text-[10px] font-black text-gray-400 uppercase mb-1">DEPT.</p>
                                        <p className="text-[11px] font-bold text-gray-800 uppercase">{g.department}</p>
                                    </div>
                                    <div className="col-span-2">
                                        <span className={STATUS_BADGE[g.status] || "badge bg-gray-100 text-gray-800"}>
                                            {g.status.replace("_", " ")}
                                        </span>
                                    </div>
                                    <div className="col-span-1 text-right">
                                        <span className="inline-flex items-center justify-center w-8 h-8 rounded-full border border-gray-100 group-hover:border-primary-600/30 text-gray-300 group-hover:text-primary-600 transition-all">
                                            →
                                        </span>
                                    </div>
                                </Link>
                            </div>
                        ))}
                    </div>
                )}

                {/* Pagination */}
                {totalPages > 1 && (
                    <div className="flex items-center justify-between mt-12 bg-white border border-gray-200 p-4 rounded-sm">
                        <button
                            onClick={() => setPage((p) => Math.max(1, p - 1))}
                            disabled={page === 1}
                            className="px-6 py-2 border border-gray-200 text-[10px] font-black text-gray-500 uppercase tracking-widest rounded-sm hover:bg-gray-50 disabled:opacity-30"
                        >
                            PREVIOUS
                        </button>
                        <div className="flex gap-2">
                            {Array.from({ length: totalPages }).map((_, i) => (
                                <button
                                    key={i + 1}
                                    onClick={() => setPage(i + 1)}
                                    className={`w-8 h-8 flex items-center justify-center text-[10px] font-black rounded-sm border transition-all ${page === i + 1 ? "bg-primary-600 text-white border-primary-600" : "text-gray-400 border-gray-100 hover:border-gray-300"}`}
                                >
                                    {i + 1}
                                </button>
                            ))}
                        </div>
                        <button
                            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                            disabled={page === totalPages}
                            className="px-6 py-2 border border-gray-200 text-[10px] font-black text-gray-500 uppercase tracking-widest rounded-sm hover:bg-gray-50 disabled:opacity-30"
                        >
                            NEXT
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
