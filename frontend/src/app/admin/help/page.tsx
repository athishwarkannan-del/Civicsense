"use client";

import { useState } from "react";

const USER_ISSUES = [
    { id: "USR-001", user: "citizen_45", page: "Lodge Grievance", type: "Upload Failed", severity: "HIGH", desc: "Image upload stuck at 50%", time: "02:45:00", status: "OPEN" },
    { id: "USR-002", user: "Anonymous", page: "Track Status", type: "UI Error", severity: "MEDIUM", desc: "Status timeline not loading", time: "02:30:00", status: "ACKNOWLEDGED" },
    { id: "USR-003", user: "citizen_78", page: "Lodge Grievance", type: "Voice Note Failed", severity: "HIGH", desc: "Voice recording stops after 10 seconds", time: "01:15:00", status: "OPEN" },
    { id: "USR-004", user: "citizen_12", page: "Login", type: "Language Issue", severity: "LOW", desc: "Tamil translation missing on login page", time: "23:45:00", status: "FIXED" },
    { id: "USR-005", user: "Anonymous", page: "Upload", type: "Upload Failed", severity: "MEDIUM", desc: "PDF file rejected unexpectedly", time: "22:00:00", status: "ACKNOWLEDGED" },
];

const AI_INSIGHTS = [
    { title: "Voice Processing", module: "Speech-to-Text Engine", count: 23, insight: "Voice notes in regional languages (Tamil, Telugu) have 35% higher failure rate. Recommend expanding language model training dataset.", icon: "🎙️" },
    { title: "File Upload", module: "Media Handler", count: 15, insight: "Large image files (>5MB) timeout frequently. Recommend implementing chunked upload or client-side compression.", icon: "📁" },
    { title: "Location Services", module: "Map Component", count: 8, insight: "GPS location fetch fails on older Android devices. Consider adding manual pincode fallback.", icon: "📍" },
    { title: "Language Detection", module: "NLP Classifier", count: 12, insight: "Mixed-language complaints (Hindi+English) often misclassified. Recommend hybrid language model.", icon: "🌐" },
];

export default function AdminHelpPage() {
    return (
        <div className="space-y-12 pb-20 animate-in fade-in duration-500">
            {/* Page Header */}
            <div className="text-center">
                <h2 className="text-4xl font-black text-[#0D3967] tracking-tight uppercase">USER-REPORTED ISSUES AND SYSTEM ERRORS</h2>
                <p className="text-sm font-medium text-gray-500 mt-1 uppercase tracking-widest">
                    Real-time issues faced by citizens while using the portal
                </p>
            </div>

            {/* Reported Issues Table */}
            <section className="bg-white shadow-xl border border-gray-100 overflow-hidden">
                <table className="w-full text-left border-collapse">
                    <thead className="bg-[#f8fafc] border-b-2 border-gray-100">
                        <tr>
                            <th className="px-6 py-4 text-[10px] font-black text-[#0D3967] uppercase tracking-widest">ISSUE ID</th>
                            <th className="px-6 py-4 text-[10px] font-black text-[#0D3967] uppercase tracking-widest">USER</th>
                            <th className="px-6 py-4 text-[10px] font-black text-[#0D3967] uppercase tracking-widest">PAGE</th>
                            <th className="px-6 py-4 text-[10px] font-black text-[#0D3967] uppercase tracking-widest">ERROR TYPE</th>
                            <th className="px-6 py-4 text-[10px] font-black text-[#0D3967] uppercase tracking-widest">SEVERITY</th>
                            <th className="px-6 py-4 text-[10px] font-black text-[#0D3967] uppercase tracking-widest">DESCRIPTION</th>
                            <th className="px-6 py-4 text-[10px] font-black text-[#0D3967] uppercase tracking-widest">TIME</th>
                            <th className="px-6 py-4 text-[10px] font-black text-[#0D3967] uppercase tracking-widest text-center">STATUS</th>
                            <th className="px-6 py-4 text-[10px] font-black text-[#0D3967] uppercase tracking-widest text-right">ACTION</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                        {USER_ISSUES.map((issue) => (
                            <tr key={issue.id} className="hover:bg-gray-50/50 transition-colors group">
                                <td className="px-6 py-4 text-[10px] font-black text-[#0D3967]">{issue.id}</td>
                                <td className="px-6 py-4 text-[10px] font-bold text-gray-500 uppercase">{issue.user}</td>
                                <td className="px-6 py-4 text-[10px] font-bold text-gray-500 uppercase">{issue.page}</td>
                                <td className="px-6 py-4 text-[10px] font-bold text-gray-500 uppercase">{issue.type}</td>
                                <td className="px-6 py-4">
                                    <span className={`text-[9px] font-black px-2 py-0.5 rounded-sm uppercase tracking-tighter ${issue.severity === 'HIGH' ? 'bg-rose-50 text-rose-600 border border-rose-100' :
                                            issue.severity === 'MEDIUM' ? 'bg-amber-50 text-amber-600 border border-amber-100' :
                                                'bg-blue-50 text-blue-600 border border-blue-100'
                                        }`}>
                                        {issue.severity}
                                    </span>
                                </td>
                                <td className="px-6 py-4 text-[10px] font-bold text-gray-700 uppercase leading-tight">{issue.desc}</td>
                                <td className="px-6 py-4 text-[10px] font-bold text-gray-400 tabular-nums">{issue.time}</td>
                                <td className="px-6 py-4 text-center">
                                    <span className={`text-[9px] font-black px-2 py-0.5 rounded-sm uppercase ${issue.status === 'OPEN' ? 'bg-rose-600 text-white' :
                                            issue.status === 'FIXED' ? 'bg-emerald-600 text-white' :
                                                'bg-amber-500 text-white'
                                        }`}>
                                        {issue.status}
                                    </span>
                                </td>
                                <td className="px-6 py-4 text-right">
                                    <button className={`text-[9px] font-black uppercase tracking-widest px-3 py-1.5 rounded-sm transition-all shadow-sm ${issue.status === 'OPEN' ? 'bg-amber-50 text-amber-600 border border-amber-200 hover:bg-amber-600 hover:text-white' :
                                            issue.status === 'FIXED' ? 'bg-blue-50 text-blue-600 border border-blue-200' :
                                                'bg-emerald-50 text-emerald-600 border border-emerald-200 hover:bg-emerald-600 hover:text-white'
                                        }`}>
                                        {issue.status === 'OPEN' ? 'ACKNOWLEDGE' : issue.status === 'FIXED' ? 'RESOLVED' : 'MARK FIXED'}
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </section>

            {/* AI assisted section */}
            <section>
                <div className="text-center mb-10">
                    <h3 className="text-2xl font-black text-[#0D3967] tracking-tight uppercase">SYSTEM DETECTED ERRORS (AI ASSISTED)</h3>
                    <p className="text-sm font-medium text-gray-500 mt-1 uppercase tracking-widest">Automated error detection with AI-powered recommendations</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {AI_INSIGHTS.map((col) => (
                        <div key={col.title} className="bg-white border border-gray-100 shadow-xl p-8 relative overflow-hidden group">
                            <div className="flex justify-between items-start mb-6">
                                <div>
                                    <h4 className="text-xl font-black text-gray-900 uppercase tracking-tight">{col.title}</h4>
                                    <p className="text-[10px] font-bold text-gray-400 uppercase mt-0.5 tracking-widest italic">Module: {col.module}</p>
                                </div>
                                <div className="text-center">
                                    <p className="text-4xl font-black text-rose-600 tracking-tighter leading-none">{col.count}</p>
                                    <p className="text-[8px] font-black text-rose-900 uppercase tracking-tighter mt-1">OCCURRENCES</p>
                                </div>
                            </div>
                            <div className="bg-[#0D3967] p-5 flex gap-4 shadow-inner relative">
                                <span className="text-xl shrink-0 opacity-100 group-hover:scale-110 transition-transform">💡</span>
                                <div className="space-y-1">
                                    <p className="text-[10px] font-black text-white uppercase tracking-[0.2em]">AI INSIGHT</p>
                                    <p className="text-[11px] font-medium text-blue-100 leading-relaxed uppercase tracking-tight">
                                        {col.insight}
                                    </p>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </section>

            {/* Status summaries */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                {[
                    { label: "OPEN ISSUES", val: "2", color: "rose" },
                    { label: "IN PROGRESS", val: "2", color: "amber" },
                    { label: "FIXED", val: "1", color: "emerald" },
                    { label: "SYSTEM ERRORS", val: "58", color: "blue" },
                ].map((s) => (
                    <div key={s.label} className={`bg-white border-b-4 border-${s.color}-600 p-8 shadow-xl text-center group`}>
                        <p className={`text-5xl font-black text-${s.color}-600 tracking-tighter group-hover:scale-110 transition-transform`}>{s.val}</p>
                        <p className={`text-[11px] font-black text-${s.color}-900 uppercase tracking-widest mt-2`}>{s.label}</p>
                    </div>
                ))}
            </div>

            {/* FAQs */}
            <section>
                <div className="text-center mb-10">
                    <h3 className="text-2xl font-black text-[#0D3967] tracking-tight uppercase border-b-2 border-gray-100 inline-block pb-2">ADMIN FAQS AND GUIDELINES</h3>
                </div>
                <div className="bg-white p-12 border border-gray-100 shadow-xl space-y-10">
                    {[
                        { q: "How do I assign a complaint to a department?", a: "Navigate to Manage Complaints, click on 'View' for any complaint, then use the 'Assign Department' button to select the appropriate department." },
                        { q: "What does HIGH priority mean?", a: "HIGH priority complaints are flagged by AI due to safety-related keywords, emergency situations, or vulnerable population involvement. These require action within 24 hours." },
                        { q: "How do I export complaint data?", a: "Go to Analytics and Reports, scroll to the Export Center section, and click 'Export CSV' to download all complaint data." },
                        { q: "Who do I contact for technical issues?", a: "For technical issues, contact the IT Support team at support@civicsense.gov.in or raise a ticket through the internal helpdesk system." },
                    ].map((faq, i) => (
                        <div key={i} className="space-y-3">
                            <h5 className="text-sm font-black text-gray-900 uppercase tracking-tight leading-none">{faq.q}</h5>
                            <p className="text-xs font-medium text-gray-500 leading-relaxed uppercase tracking-widest">
                                {faq.a}
                            </p>
                        </div>
                    ))}
                </div>
            </section>
        </div>
    );
}
