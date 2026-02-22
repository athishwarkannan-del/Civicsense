"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { api, API_BASE, type Grievance } from "@/lib/api";

const getMediaUrl = (url: string) => {
    if (!url) return "";
    if (url.startsWith("http")) return url;
    return `${API_BASE}${url.startsWith("/") ? "" : "/"}${url}`;
};

const STATUS_BADGE: Record<string, string> = {
    pending: "badge-pending",
    in_progress: "badge-in-progress",
    resolved: "badge-resolved",
    rejected: "badge-rejected",
    escalated: "badge-escalated",
};

export default function ComplaintDetailPage() {
    const params = useParams();
    const router = useRouter();
    const id = params.id as string;
    const [g, setG] = useState<Grievance | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!id) return;
        api.getGrievance(id)
            .then(setG)
            .catch(() => router.push("/dashboard"))
            .finally(() => setLoading(false));
    }, [id, router]);

    if (loading) {
        return (
            <div className="min-h-screen bg-[#F4F7F9] py-16 px-4">
                <div className="max-w-4xl mx-auto space-y-8 animate-pulse">
                    <div className="h-20 bg-white border-t-4 border-gray-200"></div>
                    <div className="h-64 bg-white border border-gray-200"></div>
                </div>
            </div>
        );
    }

    if (!g) return null;

    return (
        <div className="min-h-screen bg-[#F4F7F9] py-12 px-4 italic-none">
            <div className="max-w-4xl mx-auto">
                {/* Header Back Button */}
                <div className="mb-6">
                    <button
                        onClick={() => router.back()}
                        className="text-[10px] font-black text-gray-400 uppercase tracking-widest hover:text-primary-600 flex items-center gap-2 transition-colors"
                    >
                        ← RETURNING TO RECORDS
                    </button>
                </div>

                {/* Complaint Header */}
                <div className="bg-white border-t-4 border-accent-saffron shadow-sm p-8 mb-8 flex flex-col md:flex-row justify-between items-center gap-6">
                    <div>
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">REGISTRATION NUMBER</p>
                        <h1 className="text-3xl font-black text-primary-900 tracking-tighter uppercase">{g.id}</h1>
                    </div>
                    <div className="flex flex-col items-center md:items-end">
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">CURRENT STATUS</p>
                        <span className={STATUS_BADGE[g.status] || "badge bg-gray-100 text-gray-800"}>
                            {(g.status || "pending").replace("_", " ")}
                        </span>
                    </div>
                </div>

                {/* Main Content Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Left Column: Details */}
                    <div className="lg:col-span-2 space-y-8">
                        <div className="bg-white border border-gray-200 shadow-sm p-8">
                            <h2 className="text-[11px] font-black text-primary-600 uppercase tracking-widest mb-6 border-b border-gray-100 pb-3">GRIEVANCE DESCRIPTION</h2>
                            <p className="text-sm font-bold text-gray-800 leading-relaxed uppercase whitespace-pre-wrap">
                                {g.description}
                            </p>

                            <div className="mt-10 grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div>
                                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">CATEGORY / SUBJECT</p>
                                    <p className="text-xs font-black text-gray-800 uppercase">{g.category}</p>
                                </div>
                                <div>
                                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">INCIDENT LOCATION</p>
                                    <p className="text-xs font-black text-gray-800 uppercase">{g.address || (g.location ? `${g.location.lat}, ${g.location.lng}` : "NOT SPECIFIED")}</p>
                                </div>
                            </div>
                        </div>

                        {/* Official Notes / Remarks */}
                        {(g.remarks || g.assigned_officer) && (
                            <div className="bg-white border border-gray-200 shadow-sm p-8">
                                <h2 className="text-[11px] font-black text-primary-600 uppercase tracking-widest mb-6 border-b border-gray-100 pb-3">OFFICIAL PROCESSING NOTES</h2>
                                <div className="space-y-6">
                                    {g.assigned_officer && (
                                        <div>
                                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">ASSIGNED NODAL OFFICER</p>
                                            <p className="text-xs font-black text-primary-900 uppercase">{g.assigned_officer}</p>
                                        </div>
                                    )}
                                    {g.remarks && (
                                        <div>
                                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">OFFICIAL REMARKS</p>
                                            <div className="bg-amber-50 border border-amber-100 p-4 text-xs font-bold text-amber-900 uppercase">
                                                {g.remarks}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Evidence Viewer */}
                        {g.media_urls && g.media_urls.length > 0 && (
                            <div className="bg-white border border-gray-200 shadow-sm p-8">
                                <h2 className="text-[11px] font-black text-primary-600 uppercase tracking-widest mb-6 border-b border-gray-100 pb-3">ATTACHED EVIDENCE</h2>
                                <div className="flex flex-wrap gap-4">
                                    {g.media_urls.map((url, i) => {
                                        const fullUrl = getMediaUrl(url);
                                        return (
                                            <a href={fullUrl} target="_blank" rel="noopener noreferrer" key={i} className="w-24 h-24 bg-gray-50 border border-gray-200 rounded-sm flex items-center justify-center text-2xl hover:border-primary-600 transition-all overflow-hidden group">
                                                {url.match(/\.(jpg|jpeg|png|gif)$/i) ? (
                                                    <img src={fullUrl} alt="Evidence" className="w-full h-full object-cover group-hover:scale-110 transition-transform" />
                                                ) : (
                                                    "📄"
                                                )}
                                            </a>
                                        );
                                    })}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Right Column: Timeline & Meta */}
                    <div className="space-y-8">
                        {/* Summary Card */}
                        <div className="bg-primary-900 text-white p-8 rounded-sm shadow-xl">
                            <h3 className="text-[11px] font-black uppercase tracking-widest mb-6 border-b border-white/10 pb-3">METADATA</h3>
                            <div className="space-y-4">
                                <div>
                                    <p className="text-[9px] font-bold text-white/50 uppercase">FILED ON</p>
                                    <p className="text-xs font-bold">{new Date(g.created_at).toLocaleDateString(undefined, { day: '2-digit', month: 'long', year: 'numeric' }).toUpperCase()}</p>
                                </div>
                                <div>
                                    <p className="text-[9px] font-bold text-white/50 uppercase">LAST UPDATED</p>
                                    <p className="text-xs font-bold">{new Date(g.updated_at).toLocaleDateString(undefined, { day: '2-digit', month: 'long', year: 'numeric' }).toUpperCase()}</p>
                                </div>
                                <div>
                                    <p className="text-[9px] font-bold text-white/50 uppercase">NODAL DEPARTMENT</p>
                                    <p className="text-xs font-bold">{(g.department || "General").toUpperCase()}</p>
                                </div>
                                <div>
                                    <p className="text-[9px] font-bold text-white/50 uppercase">CASE PRIORITY</p>
                                    <span className={`inline-block px-2 py-0.5 mt-1 text-[9px] font-black uppercase rounded-sm ${['high', 'urgent'].includes(g.priority) ? 'bg-accent-saffron text-primary-900' : 'bg-white/20'}`}>
                                        {g.priority}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Small Timeline */}
                        {g.timeline && g.timeline.length > 0 && (
                            <div className="bg-white border border-gray-200 p-8 shadow-sm">
                                <h3 className="text-[11px] font-black text-primary-600 uppercase tracking-widest mb-8 border-b border-gray-100 pb-3">TIMELINE</h3>
                                <div className="space-y-0 relative pl-6">
                                    <div className="absolute left-[3px] top-2 bottom-2 w-[2px] bg-gray-100" />
                                    {g.timeline.map((ev, i) => (
                                        <div key={i} className="relative pb-8 last:pb-0 group">
                                            <div className={`absolute -left-8 w-4 h-4 rounded-full border-2 border-white shadow-sm z-10 transition-transform group-hover:scale-125 ${i === 0 ? "bg-primary-600" : "bg-gray-200"}`} />
                                            <div>
                                                <p className="text-[10px] font-black text-gray-800 uppercase leading-tight mb-1">{ev.header}</p>
                                                <p className="text-[9px] font-bold text-gray-400 uppercase italic">
                                                    {new Date(ev.timestamp).toLocaleDateString()}
                                                    {ev.created_by && ` • BY: ${ev.created_by.toUpperCase()}`}
                                                </p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        <button
                            onClick={() => window.print()}
                            className="w-full py-4 bg-white border-2 border-primary-600 text-primary-600 text-[10px] font-black uppercase tracking-widest hover:bg-primary-600 hover:text-white transition-all shadow-md flex items-center justify-center gap-3"
                        >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                            </svg>
                            PRINT OFFICIAL RECORD
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
