"use client";

import { useEffect, useState, useCallback, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { api, Grievance } from "@/lib/api";

const STATUS_TABS = [
    { label: "ALL", value: "" },
    { label: "VERIFICATION", value: "pending_confirmation" },
    { label: "NEW", value: "pending" },
    { label: "ASSIGNED", value: "assigned" },
    { label: "IN PROGRESS", value: "in_progress" },
    { label: "RESOLVED", value: "resolved" },
];

const PRIORITY_OPTIONS = ["low", "medium", "high", "urgent"];

function ComplaintsContent() {
    const searchParams = useSearchParams();
    const deptParam = searchParams.get("department") || "";

    const [complaints, setComplaints] = useState<Grievance[]>([]);
    const [total, setTotal] = useState(0);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [filters, setFilters] = useState({
        status: "",
        priority: "",
        department: deptParam,
        page: 1,
        limit: 10,
    });

    // Update department filter if URL param changes
    useEffect(() => {
        if (deptParam) {
            setFilters(prev => ({ ...prev, department: deptParam, page: 1 }));
        }
    }, [deptParam]);

    const fetchComplaints = useCallback(async () => {
        setLoading(true);
        try {
            // Map our UI status tabs to backend params
            let apiStatus = filters.status;
            let assignmentStatus = "";

            if (filters.status === "pending_confirmation") {
                apiStatus = "";
                assignmentStatus = "pending_confirmation";
            }

            const data = await api.getAdminComplaints({
                status: apiStatus,
                assignment_status: assignmentStatus,
                priority: filters.priority,
                department: filters.department,
                page: filters.page,
                limit: filters.limit,
                search
            });
            setComplaints(data.complaints);
            setTotal(data.total);
        } catch (err) {
            console.error("Failed to fetch complaints", err);
        } finally {
            setLoading(false);
        }
    }, [filters, search]);

    useEffect(() => {
        fetchComplaints();
    }, [fetchComplaints]);

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            {/* Page Header */}
            <div className="text-center">
                <h2 className="text-4xl font-black text-[#0D3967] tracking-tight uppercase">MANAGE COMPLAINTS</h2>
                <p className="text-sm font-medium text-gray-500 mt-1 uppercase tracking-widest">
                    View, assign, and update citizen grievances
                </p>
            </div>

            {/* Filter & Search Bar */}
            <div className="bg-white border-t-4 border-[#0D3967] shadow-lg p-6 flex flex-col md:flex-row gap-6 items-end">
                <div className="flex-1 space-y-2">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">SEARCH</label>
                    <div className="flex gap-2">
                        <input
                            type="text"
                            placeholder="Complaint ID, keyword, location..."
                            className="flex-1 px-4 py-2 border border-gray-200 rounded-sm text-xs font-bold focus:border-[#0D3967] outline-none placeholder:text-gray-300 placeholder:italic"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>
                </div>

                <div className="w-full md:w-48 space-y-2">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">DEPARTMENT</label>
                    <select
                        className="w-full px-4 py-2 border border-gray-200 bg-white rounded-sm text-xs font-bold focus:border-[#0D3967] outline-none"
                        value={filters.department}
                        onChange={(e) => setFilters(prev => ({ ...prev, department: e.target.value, page: 1 }))}
                    >
                        <option value="">All Departments</option>
                        <option value="Public Works">Public Works</option>
                        <option value="Health">Health</option>
                        <option value="Education">Education</option>
                        <option value="Transport">Transport</option>
                        <option value="Municipal">Municipal</option>
                        <option value="Revenue">Revenue</option>
                    </select>
                </div>

                <div className="w-full md:w-32 space-y-2">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">PRIORITY</label>
                    <select
                        className="w-full px-4 py-2 border border-gray-200 bg-white rounded-sm text-xs font-bold focus:border-[#0D3967] outline-none"
                        value={filters.priority}
                        onChange={(e) => setFilters(prev => ({ ...prev, priority: e.target.value, page: 1 }))}
                    >
                        <option value="">All</option>
                        {PRIORITY_OPTIONS.map(p => <option key={p} value={p}>{p.toUpperCase()}</option>)}
                    </select>
                </div>

                <button
                    onClick={fetchComplaints}
                    className="bg-[#0D3967] text-white px-8 py-2 text-[11px] font-black uppercase tracking-widest rounded-sm hover:bg-primary-900 transition-all shadow-md"
                >
                    SEARCH
                </button>
            </div>

            {/* Status Tabs */}
            <div className="flex border-b border-gray-200 overflow-x-auto">
                {STATUS_TABS.map((tab) => (
                    <button
                        key={tab.label}
                        onClick={() => setFilters(prev => ({ ...prev, status: tab.value, page: 1 }))}
                        className={`px-8 py-3 text-[11px] font-black tracking-widest transition-all whitespace-nowrap relative ${filters.status === tab.value
                            ? "bg-[#0D3967] text-white"
                            : "bg-gray-50 text-gray-400 hover:bg-gray-100"}`}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* Data Table */}
            <div className="bg-white shadow-xl border border-gray-100 overflow-hidden">
                <table className="w-full text-left border-collapse">
                    <thead className="bg-[#f8fafc] border-b-2 border-gray-100">
                        <tr>
                            <th className="px-6 py-4 text-[10px] font-black text-[#0D3967] uppercase tracking-widest">ID</th>
                            <th className="px-6 py-4 text-[10px] font-black text-[#0D3967] uppercase tracking-widest">CATEGORY</th>
                            <th className="px-6 py-4 text-[10px] font-black text-[#0D3967] uppercase tracking-widest">DEPARTMENT</th>
                            <th className="px-6 py-4 text-[10px] font-black text-[#0D3967] uppercase tracking-widest">PRIORITY</th>
                            <th className="px-6 py-4 text-[10px] font-black text-[#0D3967] uppercase tracking-widest text-center">STATUS</th>
                            <th className="px-6 py-4 text-[10px] font-black text-[#0D3967] uppercase tracking-widest text-right">ACTION</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                        {loading && !complaints.length ? (
                            [1, 2, 3, 4, 5].map(i => (
                                <tr key={i} className="animate-pulse">
                                    <td colSpan={6} className="px-6 py-8"><div className="h-4 bg-gray-50 rounded-sm"></div></td>
                                </tr>
                            ))
                        ) : complaints.length === 0 ? (
                            <tr>
                                <td colSpan={6} className="px-6 py-12 text-center">
                                    <p className="text-sm font-medium text-gray-400 italic">No complaints found matching current filters.</p>
                                    <p className="text-[10px] font-black text-gray-300 uppercase mt-2">Showing 0 record(s)</p>
                                </td>
                            </tr>
                        ) : (
                            complaints.map((c) => (
                                <tr key={c.id} className="hover:bg-gray-50/50 transition-colors group">
                                    <td className="px-6 py-4">
                                        <span className="text-[10px] font-black text-[#0D3967] uppercase tracking-tight">G-{c.id.slice(0, 8)}</span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <p className="text-[11px] font-bold text-gray-700 uppercase">{c.description.slice(0, 40)}...</p>
                                        <p className="text-[9px] font-black text-gray-400 uppercase tracking-tighter mt-0.5">{c.category}</p>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className="text-[10px] font-black text-primary-600 uppercase tracking-tight">
                                            {c.department_confirmed || c.department_suggested || c.department || "—"}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`text-[9px] font-black px-2 py-0.5 rounded-sm border uppercase ${c.priority === 'urgent' ? 'bg-red-50 text-red-600 border-red-100' :
                                            c.priority === 'high' ? 'bg-amber-50 text-amber-600 border-amber-100' :
                                                c.priority === 'medium' ? 'bg-blue-50 text-blue-600 border-blue-100' : 'bg-green-50 text-green-600 border-green-100'
                                            }`}>
                                            {c.priority}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-center">
                                        <span className={`text-[9px] font-black px-3 py-1 rounded-sm uppercase tracking-widest ${c.status === 'resolved' ? 'bg-emerald-600 text-white' :
                                            c.status === 'pending' ? 'bg-amber-500 text-white' :
                                                c.status === 'assigned' ? 'bg-blue-600 text-white' :
                                                    c.status === 'in_progress' ? 'bg-blue-600 text-white' : 'bg-gray-500 text-white'
                                            }`}>
                                            {(c.status || "pending").replace('_', ' ')}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex items-center justify-end gap-2">
                                            {c.assignment_status === 'pending_confirmation' && (
                                                <button
                                                    onClick={async (e) => {
                                                        e.preventDefault();
                                                        try {
                                                            await api.confirmAssignment(c.id, "Verified by admin.");
                                                            fetchComplaints();
                                                        } catch (err) {
                                                            console.error("Verify failed", err);
                                                        }
                                                    }}
                                                    className="bg-emerald-600 text-white px-4 py-1.5 text-[9px] font-black uppercase tracking-widest rounded-sm hover:bg-emerald-700 transition-all shadow-sm"
                                                >
                                                    ✓ VERIFY
                                                </button>
                                            )}
                                            <Link
                                                href={`/admin/complaints/${c.id}`}
                                                className="bg-[#0D3967] text-white px-4 py-1.5 text-[9px] font-black uppercase tracking-widest rounded-sm hover:bg-black transition-all shadow-sm"
                                            >
                                                VIEW
                                            </Link>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* Pagination / Footer Info */}
            <div className="text-center p-4">
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">
                    Showing {complaints.length} record(s)
                </p>
                <div className="flex justify-center gap-4 mt-4">
                    <button
                        disabled={filters.page === 1}
                        onClick={() => setFilters(prev => ({ ...prev, page: prev.page - 1 }))}
                        className="px-6 py-2 bg-white border border-gray-200 text-[10px] font-black uppercase tracking-widest rounded-sm hover:border-[#0D3967] disabled:opacity-30 transition-all"
                    >
                        PREVIOUS
                    </button>
                    <button
                        disabled={filters.page * filters.limit >= total}
                        onClick={() => setFilters(prev => ({ ...prev, page: prev.page + 1 }))}
                        className="px-6 py-2 bg-white border border-gray-200 text-[10px] font-black uppercase tracking-widest rounded-sm hover:border-[#0D3967] disabled:opacity-30 transition-all"
                    >
                        NEXT
                    </button>
                </div>
            </div>
        </div>
    );
}

export default function AdminComplaints() {
    return (
        <Suspense fallback={<div className="p-8 text-xs font-black uppercase text-gray-400">Loading Registry...</div>}>
            <ComplaintsContent />
        </Suspense>
    );
}
