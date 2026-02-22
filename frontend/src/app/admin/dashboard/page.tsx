"use client";

import { useEffect, useState } from "react";
import { api, AdminStats, Grievance } from "@/lib/api";
import Link from "next/link";

export default function AdminDashboard() {
    const [stats, setStats] = useState<AdminStats | null>(null);
    const [pendingComplaints, setPendingComplaints] = useState<Grievance[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchData() {
            try {
                const [statsData, complaintsData] = await Promise.all([
                    api.getAdminStats(),
                    api.getAdminComplaints({ assignment_status: "pending_confirmation", limit: 3 })
                ]);
                setStats(statsData);
                setPendingComplaints(complaintsData.complaints);
            } catch (err) {
                console.error("Failed to fetch dashboard data", err);
            } finally {
                setLoading(false);
            }
        }
        fetchData();
    }, []);

    const metrics = [
        { label: "Total Grievances", value: stats?.total_grievances || 0, icon: "📋", color: "text-blue-600 border-blue-100" },
        { label: "Pending Verification", value: stats?.pending_confirmation || 0, icon: "⚖️", color: "text-rose-600 border-rose-100" },
        { label: "Resolved Cases", value: stats?.resolved || 0, icon: "✅", color: "text-emerald-600 border-emerald-100" },
        { label: "Avg. Disposal Time", value: `${stats?.avg_resolution_time || 0} Days`, icon: "⚡", color: "text-purple-600 border-purple-100" },
    ];

    const departments = [
        { name: "Public Works", icon: "🏗️", count: stats?.department_wise?.["Public Works"] || 0, color: "bg-blue-50 text-blue-700 border-blue-100" },
        { name: "Health", icon: "🏥", count: stats?.department_wise?.["Health"] || 0, color: "bg-rose-50 text-rose-700 border-rose-100" },
        { name: "Education", icon: "📚", count: stats?.department_wise?.["Education"] || 0, color: "bg-purple-50 text-purple-700 border-purple-100" },
        { name: "Transport", icon: "🚌", count: stats?.department_wise?.["Transport"] || 0, color: "bg-emerald-50 text-emerald-700 border-emerald-100" },
        { name: "Municipal", icon: "🏛️", count: stats?.department_wise?.["Municipal"] || 0, color: "bg-orange-50 text-orange-700 border-orange-100" },
        { name: "Revenue", icon: "💰", count: stats?.department_wise?.["Revenue"] || 0, color: "bg-amber-50 text-amber-700 border-amber-100" },
    ];

    return (
        <div className="space-y-12 pb-20">
            {/* Pending Verification Section */}
            {pendingComplaints.length > 0 && (
                <section className="animate-in fade-in slide-in-from-top-4 duration-700">
                    <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-3">
                            <span className="text-2xl">⚖️</span>
                            <h3 className="text-lg font-black text-rose-900 tracking-widest uppercase">URGENT: PENDING VERIFICATION</h3>
                        </div>
                        <Link href="/admin/complaints?status=pending_confirmation" className="text-[10px] font-black text-rose-600 uppercase tracking-widest border-b-2 border-rose-200 hover:border-rose-600 transition-all">
                            View All {stats?.pending_confirmation} Critical Cases
                        </Link>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {pendingComplaints.map((c) => (
                            <div key={c.id} className="bg-white border-l-4 border-rose-600 p-6 shadow-sm hover:shadow-md transition-all flex flex-col justify-between">
                                <div>
                                    <div className="flex justify-between items-start mb-4">
                                        <span className="text-[9px] font-black bg-rose-50 text-rose-600 px-2 py-0.5 rounded-sm uppercase tracking-tighter">
                                            ID: G-{c.id.slice(0, 8)}
                                        </span>
                                        <span className="text-[9px] font-black text-gray-400 uppercase italic">
                                            {new Date(c.created_at).toLocaleDateString()}
                                        </span>
                                    </div>
                                    <h4 className="text-xs font-black text-gray-900 uppercase leading-tight mb-2 line-clamp-1">{c.title || c.description.slice(0, 40)}</h4>
                                    <p className="text-[10px] font-bold text-gray-500 uppercase leading-relaxed line-clamp-2 mb-4">
                                        {c.description}
                                    </p>
                                    <div className="flex items-center gap-2 mb-6">
                                        <span className="w-1.5 h-1.5 rounded-full bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.6)]"></span>
                                        <p className="text-[9px] font-black text-rose-900 uppercase tracking-widest">
                                            SUGGESTED DEPT: {c.department_suggested || c.department}
                                        </p>
                                    </div>
                                </div>
                                <Link
                                    href={`/admin/complaints/${c.id}`}
                                    className="w-full py-2 bg-rose-600 text-white text-[9px] font-black text-center uppercase tracking-widest rounded-sm hover:bg-rose-900 transition-all shadow-lg shadow-rose-600/10"
                                >
                                    VERIFY CASE
                                </Link>
                            </div>
                        ))}
                    </div>
                </section>
            )}

            {/* KPI Section */}
            <section>
                <div className="text-center mb-8">
                    <h3 className="text-lg font-black text-primary-900 tracking-widest uppercase">KEY PERFORMANCE INDICATORS</h3>
                    <div className="w-24 h-1 bg-accent-gold mx-auto mt-2"></div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {metrics.map((m) => (
                        <div key={m.label} className="bg-white border border-gray-100 p-8 shadow-sm hover:shadow-md transition-all text-center group">
                            <div className="text-4xl mb-4 group-hover:scale-110 transition-transform">{m.icon}</div>
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">{m.label}</p>
                            <p className="text-3xl font-black text-gray-900 tracking-tighter">
                                {loading ? "..." : m.value}
                            </p>
                        </div>
                    ))}
                </div>
            </section>

            {/* AI Intelligence Section */}
            <section>
                <div className="text-center mb-6">
                    <h3 className="text-lg font-black text-primary-900 tracking-widest uppercase">AI SYSTEM INTELLIGENCE</h3>
                </div>

                <div className={`p-6 border-l-8 border-emerald-500 rounded-sm shadow-sm transition-all ${loading ? 'bg-gray-50 border-gray-300' : 'bg-emerald-50/50'}`}>
                    <div className="flex items-center gap-4">
                        <div className={`w-3 h-3 rounded-full animate-pulse ${loading ? 'bg-gray-400' : 'bg-emerald-500'}`}></div>
                        <h4 className="text-xl font-black text-primary-900 uppercase tracking-tight">
                            SYSTEM STATUS: <span className={loading ? "text-gray-500" : "text-emerald-600"}>{loading ? "LOADING" : "ONLINE"}</span>
                        </h4>
                    </div>
                    <p className="text-xs font-bold text-gray-500 mt-1 uppercase tracking-widest ml-7">
                        {loading ? "Fetching system data..." : "AI Engine operational. Real-time classification and priority scoring active."}
                    </p>
                </div>
            </section>

            {/* Government Departments Section */}
            <section>
                <div className="text-center mb-8">
                    <h3 className="text-lg font-black text-primary-900 tracking-widest uppercase">GOVERNMENT DEPARTMENTS</h3>
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">Direct access to departmental pipelines</p>
                </div>

                <div className="grid grid-cols-2 lg:grid-cols-3 gap-6">
                    {departments.map((dept) => (
                        <Link
                            key={dept.name}
                            href={`/admin/complaints?department=${encodeURIComponent(dept.name)}`}
                            className={`flex items-center justify-between p-6 border rounded-sm shadow-sm hover:shadow-md transition-all group ${dept.color}`}
                        >
                            <div className="flex items-center gap-4">
                                <span className="text-2xl group-hover:scale-110 transition-transform">{dept.icon}</span>
                                <div className="text-left">
                                    <p className="text-xs font-black uppercase tracking-tight">{dept.name}</p>
                                    <p className="text-[9px] font-bold opacity-60 uppercase">GOVERNMENT DEPARTMENT</p>
                                </div>
                            </div>
                            <div className="text-right">
                                <p className="text-xl font-black tabular-nums">{dept.count}</p>
                                <p className="text-[8px] font-black opacity-40 uppercase tracking-tighter">ACTIVE CASES</p>
                            </div>
                        </Link>
                    ))}
                </div>
            </section>

            {/* Quick Actions Section */}
            <section>
                <div className="text-center mb-8">
                    <h3 className="text-lg font-black text-primary-900 tracking-widest uppercase">QUICK ACTIONS</h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {/* Manage Complaints */}
                    <div className="bg-white p-10 border border-gray-100 shadow-sm text-center flex flex-col items-center">
                        <h4 className="text-lg font-black text-primary-900 uppercase tracking-tight mb-4">MANAGE COMPLAINTS</h4>
                        <p className="text-xs font-medium text-gray-500 leading-relaxed mb-8 uppercase tracking-wide">
                            View, assign, and update citizen grievances in the central registry
                        </p>
                        <Link
                            href="/admin/complaints"
                            className="bg-[#0D3967] text-white px-8 py-3 text-[10px] font-black uppercase tracking-widest rounded-full hover:bg-primary-900 transition-all shadow-lg"
                        >
                            OPEN REGISTRY
                        </Link>
                    </div>

                    {/* Priority Session */}
                    <div className="bg-rose-50/30 p-10 border border-rose-100 shadow-sm text-center flex flex-col items-center">
                        <h4 className="text-lg font-black text-rose-900 uppercase tracking-tight mb-4">PRIORITY SESSION</h4>
                        <p className="text-xs font-medium text-rose-700/70 leading-relaxed mb-8 uppercase tracking-wide">
                            Handle AI-ranked critical grievances requiring immediate officer action
                        </p>
                        <Link
                            href="/admin/priority"
                            className="bg-rose-600 text-white px-8 py-3 text-[10px] font-black uppercase tracking-widest rounded-full hover:bg-rose-700 transition-all shadow-lg"
                        >
                            START SESSION
                        </Link>
                    </div>

                    {/* Analytics */}
                    <div className="bg-white p-10 border border-gray-100 shadow-sm text-center flex flex-col items-center">
                        <h4 className="text-lg font-black text-primary-900 uppercase tracking-tight mb-4">ANALYTICS AND REPORTS</h4>
                        <p className="text-xs font-medium text-gray-500 leading-relaxed mb-8 uppercase tracking-wide">
                            View department performance charts and export system data
                        </p>
                        <Link
                            href="/admin/analytics"
                            className="bg-[#0D3967] text-white px-8 py-3 text-[10px] font-black uppercase tracking-widest rounded-full hover:bg-primary-900 transition-all shadow-lg"
                        >
                            VIEW REPORTS
                        </Link>
                    </div>
                </div>
            </section>
        </div>
    );
}
