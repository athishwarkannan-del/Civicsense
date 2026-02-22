"use client";

import { useEffect, useState } from "react";
import { api, AdminStats } from "@/lib/api";
import {
    PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend,
    ComposedChart, Bar, Line, Area, XAxis, YAxis, CartesianGrid
} from "recharts";

const COLORS = ["#0D3967", "#10B981", "#F59E0B", "#EF4444", "#8B5CF6", "#EC4899", "#06B6D4"];

export default function AdminAnalytics() {
    const [stats, setStats] = useState<AdminStats | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchAnalytics() {
            try {
                const data = await api.getAnalytics();
                setStats(data);
            } catch (err) {
                console.error("Analytics fetch failed", err);
            } finally {
                setLoading(false);
            }
        }
        fetchAnalytics();
    }, []);

    const resolutionRate = stats ? ((stats.resolved / (stats.total_grievances || 1)) * 100).toFixed(1) : "0";

    // Data for Department Pie Chart
    const pieData = stats?.by_department
        ? stats.by_department.map(d => ({ name: d.department, value: d.count }))
        : stats?.department_wise
            ? Object.entries(stats.department_wise).map(([name, value]) => ({ name, value }))
            : [];

    // Data for Trend Chart (Bar + Line)
    const trendData = stats?.trend?.map((t, idx, arr) => {
        const accumulated = arr.slice(0, idx + 1).reduce((sum, curr) => sum + curr.count, 0);
        return {
            name: t.date,
            volume: t.count,
            accumulated: accumulated
        };
    }) || [];

    if (loading) return (
        <div className="flex items-center justify-center h-screen bg-gray-50">
            <div className="text-center">
                <div className="w-12 h-12 border-4 border-[#0D3967] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                <p className="text-[10px] font-black text-[#0D3967] uppercase tracking-widest">LOADING INTELLIGENCE...</p>
            </div>
        </div>
    );

    return (
        <div className="space-y-12 pb-20 animate-in fade-in duration-500 max-w-7xl mx-auto px-4">
            {/* Page Header */}
            <div className="text-center pt-8">
                <h2 className="text-4xl font-black text-[#0D3967] tracking-tight uppercase">ANALYTICS & REPORTS</h2>
                <div className="flex items-center justify-center gap-4 mt-2">
                    <div className="h-[2px] w-12 bg-[#0D3967]/20" />
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.4em]">
                        DATA-DRIVEN GOVERNANCE INSIGHTS
                    </p>
                    <div className="h-[2px] w-12 bg-[#0D3967]/20" />
                </div>
            </div>

            {/* Top Grid: Highlights */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                {[
                    { label: "TOTAL GRIEVANCES", value: stats?.total_grievances, color: "text-[#0D3967]" },
                    { label: "PENDING ACTION", value: stats?.pending, color: "text-amber-500" },
                    { label: "RESOLVED CASES", value: stats?.resolved, color: "text-emerald-500" },
                    { label: "RESOLUTION RATE", value: `${resolutionRate}%`, color: "text-blue-600" },
                ].map((stat, i) => (
                    <div key={i} className="bg-white border-b-4 border-[#0D3967]/10 p-6 shadow-sm hover:border-[#0D3967] transition-all group">
                        <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest mb-1 group-hover:text-[#0D3967] transition-colors">{stat.label}</p>
                        <p className={`text-2xl font-black ${stat.color} tracking-tighter`}>{stat.value}</p>
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-1 gap-8">
                {/* Department Load: Solo Pie Chart */}
                <div className="bg-white border border-gray-100 shadow-2xl p-12 rounded-sm text-center">
                    <div className="flex flex-col items-center gap-3 mb-12">
                        <div className="h-1 w-20 bg-[#0D3967] mb-2" />
                        <h3 className="text-xl font-black text-[#0D3967] uppercase tracking-widest">DEPARTMENT LOAD DISTRIBUTION</h3>
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-0.5">Comprehensive Volumetric Analysis across all departments</p>
                    </div>
                    {pieData.length > 0 ? (
                        <div className="h-[500px] w-full max-w-4xl mx-auto">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={pieData}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={100}
                                        outerRadius={180}
                                        paddingAngle={5}
                                        dataKey="value"
                                        animationDuration={1500}
                                    >
                                        {pieData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip
                                        contentStyle={{ backgroundColor: "#fff", borderRadius: "0px", border: "2px solid #0D3967", fontSize: "12px", fontWeight: "900", textTransform: "uppercase" }}
                                    />
                                    <Legend
                                        verticalAlign="bottom"
                                        layout="horizontal"
                                        align="center"
                                        wrapperStyle={{ paddingTop: "40px" }}
                                        formatter={(v) => <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">{v}</span>}
                                    />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                    ) : (
                        <div className="h-[400px] flex items-center justify-center border-2 border-dashed border-gray-100">
                            <p className="text-[10px] font-black text-gray-300 uppercase tracking-widest">NO DATA AVAILABLE</p>
                        </div>
                    )}
                </div>
            </div>

            {/* System Performance Insights */}
            <section className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Resolution Progress */}
                <div className="bg-emerald-50 border-l-8 border-emerald-500 p-8 shadow-sm flex gap-6">
                    <div className="w-14 h-14 bg-white rounded-full flex items-center justify-center text-2xl shadow-sm border border-emerald-100 shrink-0">📈</div>
                    <div>
                        <h4 className="text-[10px] font-black text-emerald-900 uppercase tracking-widest mb-1">EFFICIENCY BENCHMARK</h4>
                        <p className="text-xs font-medium text-emerald-800 leading-relaxed uppercase tracking-tight">
                            The system has achieved a <span className="font-black text-lg">{resolutionRate}%</span> resolution rate in the last 30 days.
                        </p>
                    </div>
                </div>

                {/* AI Insights Bar */}
                <div className="bg-[#0D3967] p-8 flex items-center gap-8 shadow-2xl relative overflow-hidden">
                    <div className="w-14 h-14 bg-white/10 rounded-full flex items-center justify-center text-3xl shrink-0 border border-white/20">💡</div>
                    <div>
                        <h4 className="text-[10px] font-black text-blue-100 uppercase tracking-widest mb-1">AI STRATEGIC INSIGHT</h4>
                        <p className="text-xs font-bold text-white/70 leading-relaxed uppercase tracking-[0.1em]">
                            {stats?.pending_ai_confirmation && stats.pending_ai_confirmation > 0
                                ? `NOTICE: ${stats.pending_ai_confirmation} GRIEVANCES REQUIRE CONFIRMATION ASAP.`
                                : "SYSTEM OPTIMAL: ALL GRIEVANCES CLASSIFIED AND ASSIGNED CORRECTLY."}
                        </p>
                    </div>
                </div>
            </section>

            {/* Export Center (Minimal) */}
            <section className="pt-12 border-t-2 border-gray-100 flex justify-between items-center">
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">GENERATED ON: {new Date().toLocaleDateString()}</p>
                <div className="flex gap-4">
                    <button className="px-6 py-3 bg-gray-100 text-gray-600 text-[10px] font-black uppercase tracking-widest hover:bg-[#0D3967] hover:text-white transition-all">CSV EXPORT</button>
                    <button className="px-6 py-3 bg-[#0D3967] text-white text-[10px] font-black uppercase tracking-widest hover:bg-black transition-all">PDF REPORT</button>
                </div>
            </section>
        </div>
    );
}
