"use client";

import { useEffect, useState } from "react";
import { api, Grievance } from "@/lib/api";

export default function PriorityManagement() {
    const [complaints, setComplaints] = useState<Grievance[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchPriorityCases() {
            try {
                const data = await api.getAdminComplaints({ limit: 50 });
                setComplaints(data.complaints);
            } catch (err) {
                console.error("Priority fetch failed", err);
            } finally {
                setLoading(false);
            }
        }
        fetchPriorityCases();
    }, []);

    const counts = {
        high: complaints.filter(c => c.priority === 'urgent' || c.priority === 'high').length,
        medium: complaints.filter(c => c.priority === 'medium').length,
        low: complaints.filter(c => c.priority === 'low').length,
    };

    const renderPriorityBlock = (title: string, sub: string, color: string, count: number, criteria: string) => (
        <div className="space-y-4">
            <div className={`p-4 bg-${color}-600 text-white rounded-t-sm`}>
                <h4 className="text-xl font-black uppercase tracking-tight">{title} - {sub}</h4>
                <p className="text-[10px] font-bold opacity-80 uppercase tracking-widest mt-1">AI Criteria: {criteria}</p>
            </div>
            <div className="bg-white border border-gray-100 p-10 text-center shadow-lg min-h-[150px] flex flex-col items-center justify-center">
                {count === 0 ? (
                    <>
                        <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center text-2xl mb-4 font-black">
                            ✓
                        </div>
                        <p className="text-sm font-bold text-gray-400 italic">No {title.toLowerCase()} cases pending</p>
                    </>
                ) : (
                    <p className="text-sm font-black text-[#0D3967] uppercase tracking-widest">{count} {title} Cases Found</p>
                )}
            </div>
        </div>
    );

    return (
        <div className="space-y-10 pb-20 animate-in fade-in duration-500">
            {/* Page Header */}
            <div className="text-center">
                <h2 className="text-4xl font-black text-[#0D3967] tracking-tight uppercase">PRIORITY SESSION</h2>
                <p className="text-sm font-medium text-gray-500 mt-1 uppercase tracking-widest">
                    AI-Ranked Grievances Categorized by Urgency Level
                </p>
            </div>

            {/* AI Priority Summary */}
            <section>
                <div className="text-center mb-6">
                    <h3 className="text-sm font-black text-[#0D3967] tracking-[0.2em] uppercase border-b-2 border-gray-100 inline-block pb-1">AI PRIORITY SUMMARY</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-rose-50 border border-rose-100 p-6 text-center shadow-sm">
                        <p className="text-6xl font-black text-rose-600 tracking-tighter">{counts.high}</p>
                        <p className="text-[11px] font-black text-rose-900 uppercase tracking-widest mt-2">HIGH PRIORITY</p>
                        <p className="text-[9px] font-bold text-rose-700/60 uppercase mt-1">Immediate Action</p>
                    </div>
                    <div className="bg-amber-50 border border-amber-100 p-6 text-center shadow-sm">
                        <p className="text-6xl font-black text-amber-600 tracking-tighter">{counts.medium}</p>
                        <p className="text-[11px] font-black text-amber-900 uppercase tracking-widest mt-2">MEDIUM PRIORITY</p>
                        <p className="text-[9px] font-bold text-amber-700/60 uppercase mt-1">Action Within 48-72h</p>
                    </div>
                    <div className="bg-emerald-50 border border-emerald-100 p-6 text-center shadow-sm">
                        <p className="text-6xl font-black text-emerald-600 tracking-tighter">{counts.low}</p>
                        <p className="text-[11px] font-black text-emerald-900 uppercase tracking-widest mt-2">LOW PRIORITY</p>
                        <p className="text-[9px] font-bold text-emerald-700/60 uppercase mt-1">Routine Processing</p>
                    </div>
                </div>
                <p className="text-center text-[9px] font-bold text-gray-400 mt-4 uppercase tracking-widest italic leading-relaxed max-w-2xl mx-auto">
                    AI categorization is based on urgency keywords, waiting time, category severity, and potential public impact.
                </p>
            </section>

            {/* Urgency Blocks */}
            <div className="space-y-6">
                {renderPriorityBlock("HIGH PRIORITY", "IMMEDIATE ACTION REQUIRED", "red", counts.high, "Safety risk, emergency keywords, vulnerable population, extended waiting time")}
                {renderPriorityBlock("MEDIUM PRIORITY", "ACTION REQUIRED SOON", "orange", counts.medium, "Service disruption, repeated complaints, moderate public impact")}
                {renderPriorityBlock("LOW PRIORITY", "ROUTINE PROCESSING", "green", counts.low, "Informational requests, low risk, minor impact, standard processing")}
            </div>

            {/* AI Decision Factors */}
            <section>
                <div className="text-center mb-10">
                    <h3 className="text-sm font-black text-[#0D3967] tracking-[0.2em] uppercase border-b-2 border-gray-100 inline-block pb-1">AI DECISION FACTORS</h3>
                </div>
                <div className="flex flex-wrap justify-center gap-12 bg-white p-10 border border-gray-100 shadow-xl rounded-sm">
                    {[
                        { l: "Keyword Severity", s: "Emergency, danger, accident", i: "🏷️", c: "bg-blue-50 text-blue-600" },
                        { l: "Category Type", s: "Health, safety, utilities", i: "🛁", c: "bg-purple-50 text-purple-600" },
                        { l: "Waiting Time", s: "SLA compliance check", i: "⏳", c: "bg-amber-50 text-amber-600" },
                        { l: "Historical Patterns", s: "Repeated issues", i: "📈", c: "bg-emerald-50 text-emerald-600" },
                        { l: "Location Sensitivity", s: "High-traffic areas", i: "📍", c: "bg-rose-50 text-rose-600" },
                    ].map((f, i) => (
                        <div key={i} className="text-center max-w-[150px]">
                            <div className={`w-12 h-12 ${f.c} rounded-full flex items-center justify-center text-xl mx-auto mb-4 border border-white shadow-md`}>
                                {f.i}
                            </div>
                            <h5 className="text-[11px] font-black text-gray-700 uppercase tracking-tight">{f.l}</h5>
                            <p className="text-[9px] font-bold text-gray-400 uppercase mt-1 leading-tight">{f.s}</p>
                        </div>
                    ))}
                </div>
                <p className="text-center text-[9px] font-bold text-gray-400 mt-6 uppercase tracking-widest italic">
                    The AI system continuously analyzes incoming complaints and adjusts priority scores based on the above factors.
                </p>
            </section>
        </div>
    );
}
