"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { api, type Grievance } from "@/lib/api";

const STATUS_CONFIG: Record<string, { color: string; bg: string; label: string; border: string }> = {
    pending: { color: "text-amber-800", bg: "bg-amber-100", label: "PENDING", border: "border-amber-200" },
    in_progress: { color: "text-blue-800", bg: "bg-blue-100", label: "IN PROGRESS", border: "border-blue-200" },
    resolved: { color: "text-emerald-800", bg: "bg-emerald-100", label: "RESOLVED", border: "border-emerald-200" },
    rejected: { color: "text-red-800", bg: "bg-red-100", label: "REJECTED", border: "border-red-200" },
    escalated: { color: "text-purple-800", bg: "bg-purple-100", label: "ESCALATED", border: "border-purple-200" },
};

export default function TrackStatusPage() {
    const router = useRouter();
    const [complaintId, setComplaintId] = useState("");
    const [grievance, setGrievance] = useState<Grievance | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const printRef = useRef<HTMLDivElement>(null);

    const handleSearch = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!complaintId.trim()) return;

        setLoading(true);
        setError("");
        setGrievance(null);

        try {
            const res = await api.getGrievance(complaintId.trim());
            setGrievance(res);
        } catch (err: unknown) {
            const apiErr = err as { detail?: string };
            setError(apiErr.detail || "Grievance registration number not found. Please verify and try again.");
        } finally {
            setLoading(false);
        }
    };

    const handlePrint = () => {
        const content = printRef.current;
        if (!content) return;
        const win = window.open("", "_blank");
        if (!win) return;
        win.document.write(`
      <html><head><title>Grievance Details - ${grievance?.id}</title>
      <style>
        body{font-family:'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;padding:40px;color:#333; line-height: 1.6;}
        .header{border-bottom: 2px solid #003366; padding-bottom: 10px; margin-bottom: 30px;}
        .label{font-size: 10px; font-weight: bold; color: #666; text-transform: uppercase; margin-bottom: 2px;}
        .value{font-size: 14px; font-weight: 700; color: #000; margin-bottom: 15px;}
        .section-title{font-size: 12px; font-weight: 900; color: #003366; text-transform: uppercase; border-bottom: 1px solid #eee; padding-bottom: 5px; margin-top: 30px; margin-bottom: 15px;}
        .footer{margin-top: 50px; font-size: 10px; color: #999; text-align: center; border-top: 1px solid #eee; padding-top: 20px;}
      </style></head>
      <body>
        <div class="header">
            <h1 style="color: #003366; margin: 0; font-size: 20px;">GRIEVANCE STATUS REPORT</h1>
            <p style="margin: 5px 0 0; font-size: 10px; color: #666;">Generated via CPGRAMS AI Portal</p>
        </div>
        ${content.innerHTML}
        <div class="footer">
            This is a computer generated document and does not require a physical signature.
        </div>
      </body></html>
    `);
        win.document.close();
        win.print();
    };

    const statusInfo = grievance ? STATUS_CONFIG[grievance.status] || STATUS_CONFIG.pending : null;

    return (
        <div className="min-h-screen bg-portal-bg py-16 px-4">
            <div className="max-w-3xl mx-auto">
                {/* Header Section */}
                <div className="bg-white border-t-4 border-accent-saffron shadow-sm p-8 mb-8">
                    <h1 className="text-2xl font-black text-primary-600 tracking-tighter uppercase">VIEW STATUS</h1>
                    <p className="text-[11px] font-bold text-gray-500 uppercase tracking-widest mt-1">Track the progress of your registered grievance</p>
                </div>

                {/* Search Interface */}
                <div className="bg-white border border-gray-200 shadow-md p-8 mb-8">
                    <form onSubmit={handleSearch} className="flex flex-col md:flex-row gap-4">
                        <div className="flex-1">
                            <label htmlFor="reg-no" className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2">Registration Number*</label>
                            <input
                                id="reg-no"
                                type="text"
                                value={complaintId}
                                onChange={(e) => setComplaintId(e.target.value)}
                                placeholder="ENTER REGISTRATION NUMBER (E.G. GRV-2025-XXXXX)"
                                className="w-full p-4 border-2 border-gray-100 bg-gray-50/50 rounded-sm focus:border-primary-600 text-sm font-bold uppercase transition-all shadow-inner"
                                required
                            />
                        </div>
                        <div className="md:pt-6">
                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full md:w-auto px-10 py-4 bg-primary-600 text-white text-[10px] font-black uppercase tracking-widest hover:bg-primary-700 transition-all rounded-sm shadow-lg disabled:opacity-50"
                            >
                                {loading ? "TRACKING..." : "SEARCH"}
                            </button>
                        </div>
                    </form>
                    <div className="mt-6 flex flex-wrap gap-4 text-[10px] font-bold text-gray-400 uppercase italic">
                        <span>Need Help?</span>
                        <button onClick={() => router.push('/help')} className="text-primary-600 hover:underline">Forgot Registration Number?</button>
                        <span>•</span>
                        <button onClick={() => router.push('/lodge-grievance')} className="text-primary-600 hover:underline">Lodge New Grievance</button>
                    </div>
                </div>

                {error && (
                    <div className="p-5 bg-red-50 border-l-4 border-red-600 text-red-700 text-[11px] font-black uppercase tracking-wider mb-8 animate-fade-in">
                        SYSTEM ERROR: {error}
                    </div>
                )}

                {/* Result Display */}
                {grievance && statusInfo && (
                    <div className="animate-slide-up">
                        <div ref={printRef} className="bg-white border border-gray-200 shadow-xl overflow-hidden mb-8">
                            {/* Status Banner */}
                            <div className={`p-6 border-b border-gray-100 flex justify-between items-center ${statusInfo.bg}`}>
                                <div>
                                    <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1">CURRENT STATUS</p>
                                    <h2 className={`text-xl font-black tracking-tighter ${statusInfo.color}`}>{statusInfo.label}</h2>
                                </div>
                                <div className="text-right">
                                    <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1">REGISTRATION NO.</p>
                                    <p className="text-sm font-black text-primary-900 tracking-tight">{grievance.id}</p>
                                </div>
                            </div>

                            <div className="p-8 space-y-10">
                                {/* Basic Info Grid */}
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                                    <div>
                                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">CATEGORY</p>
                                        <p className="text-xs font-black text-gray-800 uppercase leading-none">{grievance.category}</p>
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">NODAL DEPARTMENT</p>
                                        <p className="text-xs font-black text-gray-800 uppercase leading-none">{grievance.department}</p>
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">FILED DATE</p>
                                        <p className="text-xs font-black text-gray-800 uppercase leading-none">{new Date(grievance.created_at).toLocaleDateString(undefined, { day: '2-digit', month: 'short', year: 'numeric' }).toUpperCase()}</p>
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">PRIORITY</p>
                                        <span className={`inline-block px-2 py-0.5 text-[10px] font-black uppercase rounded-sm ${['urgent', 'high'].includes(grievance.priority) ? 'bg-red-600 text-white' : 'bg-primary-600 text-white'}`}>
                                            {grievance.priority}
                                        </span>
                                    </div>
                                </div>

                                {/* Detailed Description */}
                                <div className="bg-gray-50 border border-gray-100 p-6 rounded-sm">
                                    <p className="text-[10px] font-black text-primary-600 uppercase tracking-widest mb-4 border-b border-primary-100 pb-2">Grievance Description</p>
                                    <p className="text-sm font-medium text-gray-700 leading-relaxed uppercase">{grievance.description}</p>
                                </div>

                                {/* Location Details */}
                                <div className="p-6 border border-gray-100 rounded-sm">
                                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4">INCIDENT LOCATION</p>
                                    <p className="text-xs font-bold text-gray-800 uppercase">{grievance.address || (grievance.location ? `${grievance.location.lat}, ${grievance.location.lng}` : "NOT SPECIFIED")}</p>
                                </div>

                                {/* Official Timeline */}
                                {grievance.timeline && grievance.timeline.length > 0 && (
                                    <div>
                                        <p className="text-[10px] font-black text-primary-600 uppercase tracking-widest mb-8 border-b border-primary-100 pb-2">Status History & Timeline</p>
                                        <div className="space-y-0 relative pl-8">
                                            <div className="absolute left-[3px] top-4 bottom-4 w-[2px] bg-gray-200" />
                                            {grievance.timeline.map((event, i) => (
                                                <div key={i} className="relative pb-10 last:pb-0 group">
                                                    <div className={`absolute -left-[35px] w-4 h-4 rounded-full z-10 border-4 border-white shadow-sm transition-transform group-hover:scale-125 ${i === 0 ? "bg-primary-600" : "bg-gray-300"}`} />
                                                    <div>
                                                        <div className="flex items-center gap-3 mb-1">
                                                            <p className="text-[11px] font-black text-gray-800 uppercase leading-none">{event.header}</p>
                                                            <span className="text-[9px] font-black text-gray-400 uppercase leading-none">{new Date(event.timestamp).toLocaleDateString()}</span>
                                                        </div>
                                                        <p className="text-[10px] text-gray-500 mb-2">{event.description}</p>
                                                        <p className="text-[9px] font-bold text-primary-600/60 uppercase italic">ACTION BY: {(event.created_by || "System").toUpperCase()}</p>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Additional Actions */}
                        <div className="flex flex-col sm:flex-row gap-4">
                            <button
                                onClick={handlePrint}
                                className="flex-1 px-8 py-4 bg-white border-2 border-primary-600 text-primary-600 text-[10px] font-black uppercase tracking-widest hover:bg-primary-600 hover:text-white transition-all rounded-sm flex items-center justify-center gap-3"
                            >
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                                </svg>
                                PRINT REPORT
                            </button>
                            <button
                                onClick={() => router.push('/dashboard')}
                                className="flex-1 px-8 py-4 bg-primary-600 text-white text-[10px] font-black uppercase tracking-widest hover:bg-primary-700 transition-all rounded-sm flex items-center justify-center gap-3 shadow-xl"
                            >
                                GO TO DASHBOARD
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
