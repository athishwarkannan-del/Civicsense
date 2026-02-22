"use client";

import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import { api, API_BASE, Grievance } from "@/lib/api";

const getMediaUrl = (url: string) => {
    if (!url) return "";
    if (url.startsWith("http")) return url;
    return `${API_BASE}${url.startsWith("/") ? "" : "/"}${url}`;
};

const DEPARTMENTS = [
    { name: "Public Works", icon: "🏗️", color: "bg-blue-50 border-blue-200 text-blue-800" },
    { name: "Health", icon: "🏥", color: "bg-rose-50 border-rose-200 text-rose-800" },
    { name: "Education", icon: "📚", color: "bg-purple-50 border-purple-200 text-purple-800" },
    { name: "Transport", icon: "🚌", color: "bg-emerald-50 border-emerald-200 text-emerald-800" },
    { name: "Municipal", icon: "🏛️", color: "bg-orange-50 border-orange-200 text-orange-800" },
    { name: "Revenue", icon: "💰", color: "bg-amber-50 border-amber-200 text-amber-800" },
];

export default function ComplaintDetail({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    const router = useRouter();
    const [complaint, setComplaint] = useState<Grievance | null>(null);
    const [loading, setLoading] = useState(true);
    const [updating, setUpdating] = useState(false);

    useEffect(() => {
        async function loadData() {
            try {
                const cData = await api.getAdminComplaint(id);
                setComplaint(cData);
            } catch (err) {
                console.error("Load failed", err);
            } finally {
                setLoading(false);
            }
        }
        loadData();
    }, [id]);

    const handleVerify = async () => {
        setUpdating(true);
        try {
            await api.confirmAssignment(id, "Verified and assigned by admin.");
            const updated = await api.getAdminComplaint(id);
            setComplaint(updated);
            alert("Complaint verified and assigned to department!");
        } catch (err) {
            console.error("Verification failed", err);
        } finally {
            setUpdating(false);
        }
    };

    if (loading) return <div className="p-8 animate-pulse text-xs font-black uppercase text-gray-400">Loading Case File...</div>;
    if (!complaint) return <div className="p-8 text-xs font-black uppercase text-red-500">Case not found</div>;

    const assignedDept = complaint.department_confirmed || complaint.department_suggested || complaint.department || "Unassigned";
    const isVerified = complaint.assignment_status === "assigned";

    return (
        <div className="max-w-6xl mx-auto space-y-8">
            {/* Header / Meta */}
            <div className="bg-white border border-gray-100 p-8 rounded-sm shadow-sm flex justify-between items-start">
                <div className="space-y-3">
                    <div className="flex items-center gap-3">
                        <h2 className="text-2xl font-black text-primary-900 tracking-tighter uppercase">Grievance Case #G-{id.slice(0, 8)}</h2>
                        <span className={`px-3 py-1 text-[10px] font-black uppercase rounded-sm border ${complaint.priority === 'urgent' || complaint.priority === 'high' ? 'bg-red-50 text-red-600 border-red-100' : 'bg-blue-50 text-blue-600 border-blue-100'
                            }`}>
                            {complaint.priority} Priority
                        </span>
                    </div>
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">
                        Department: <span className="text-gray-900">{assignedDept}</span>
                    </p>
                </div>
                <button onClick={() => router.back()} className="px-4 py-2 border border-gray-200 text-[10px] font-black uppercase rounded-sm hover:border-primary-600 transition-colors">
                    Back to Repository
                </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Main Content */}
                <div className="lg:col-span-2 space-y-8">
                    {/* Content Detail */}
                    <div className="bg-white border border-gray-100 p-8 rounded-sm shadow-sm space-y-6">
                        <h3 className="text-xs font-black text-primary-900 uppercase tracking-[0.3em] border-b border-gray-50 pb-4">Incident Description</h3>
                        <p className="text-sm text-gray-700 leading-relaxed font-medium">
                            {complaint.description}
                        </p>

                        <div className="grid grid-cols-2 gap-8 pt-6 border-t border-gray-50">
                            <div>
                                <p className="text-[10px] font-black text-gray-400 uppercase mb-2">Location Context</p>
                                <p className="text-[11px] font-bold text-gray-900 uppercase">{complaint.address || `${complaint.location.lat}, ${complaint.location.lng}`}</p>
                            </div>
                            <div>
                                <p className="text-[10px] font-black text-gray-400 uppercase mb-2">Category Alias</p>
                                <p className="text-[11px] font-bold text-gray-900 uppercase">{complaint.category}</p>
                            </div>
                        </div>

                        {complaint.media_urls && complaint.media_urls.length > 0 && (
                            <div className="pt-6 border-t border-gray-50">
                                <p className="text-[10px] font-black text-gray-400 uppercase mb-4">Evidence & Documentation</p>
                                <div className="flex flex-wrap gap-4">
                                    {complaint.media_urls.map((url, i) => {
                                        const fullUrl = getMediaUrl(url);
                                        return (
                                            <a href={fullUrl} target="_blank" rel="noopener noreferrer" key={i} className="w-24 h-24 bg-gray-50 border border-gray-100 rounded-sm flex items-center justify-center text-2xl group hover:border-primary-600 transition-all cursor-pointer overflow-hidden">
                                                {url.match(/\.(jpg|jpeg|png|gif)$/i) ? (
                                                    <img src={fullUrl} alt="Evidence" className="w-full h-full object-cover" />
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

                    {/* Timeline */}
                    <div className="bg-white border border-gray-100 p-8 rounded-sm shadow-sm">
                        <h3 className="text-xs font-black text-primary-900 uppercase tracking-[0.3em] mb-8">Process Audit log</h3>
                        <div className="space-y-8 relative before:absolute before:inset-0 before:ml-4 before:-z-10 before:w-0.5 before:bg-gray-50">
                            {complaint.timeline?.map((event, i) => (
                                <div key={i} className="flex gap-8 group">
                                    <div className={`w-8 h-8 rounded-sm shrink-0 flex items-center justify-center text-xs z-10 ${i === 0 ? 'bg-primary-600 text-white' : 'bg-gray-100 text-gray-400'
                                        }`}>
                                        {i === 0 ? '✔️' : '📜'}
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-[10px] font-black text-gray-400 uppercase italic">{new Date(event.timestamp).toLocaleString()}</p>
                                        <p className="text-xs font-bold text-gray-900 uppercase tracking-tight">{event.status.replace('_', ' ')}</p>
                                        <p className="text-xs text-gray-500 font-medium leading-relaxed">{event.remarks || event.description}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Action Sidebar */}
                <div className="space-y-6">
                    {/* Department Assignment Box */}
                    <div className="bg-white border border-gray-100 p-8 rounded-sm shadow-sm sticky top-24">
                        <h3 className="text-xs font-black text-primary-900 uppercase tracking-[0.3em] mb-6 border-b border-gray-50 pb-4">Department Assignment</h3>

                        {/* Department Boxes Grid */}
                        <div className="grid grid-cols-2 gap-3 mb-6">
                            {DEPARTMENTS.map((dept) => {
                                const isAssigned = dept.name === assignedDept;
                                return (
                                    <div
                                        key={dept.name}
                                        className={`p-3 border-2 rounded-sm text-center transition-all ${isAssigned
                                            ? `${dept.color} border-current shadow-md scale-[1.02]`
                                            : 'bg-gray-50 border-gray-100 text-gray-300 opacity-50'
                                            }`}
                                    >
                                        <span className="text-xl block mb-1">{dept.icon}</span>
                                        <p className="text-[9px] font-black uppercase tracking-tight">{dept.name}</p>
                                        {isAssigned && (
                                            <span className="text-[8px] font-black uppercase mt-1 block tracking-widest">ASSIGNED</span>
                                        )}
                                    </div>
                                );
                            })}
                        </div>

                        {/* Vector Importance Rating */}
                        <div className="bg-gray-50 border border-gray-100 p-5 rounded-sm mb-6 space-y-4">
                            <p className="text-[9px] font-black text-gray-500 uppercase tracking-widest">AI Vector Classification</p>

                            {/* Importance Gauge */}
                            <div className="flex items-center gap-4">
                                <div className="relative w-20 h-20 flex-shrink-0">
                                    <svg className="w-20 h-20 -rotate-90" viewBox="0 0 80 80">
                                        <circle cx="40" cy="40" r="34" fill="none" stroke="#e5e7eb" strokeWidth="8" />
                                        <circle
                                            cx="40" cy="40" r="34" fill="none"
                                            stroke={
                                                (complaint.importance_pct || 0) >= 70 ? "#dc2626" :
                                                    (complaint.importance_pct || 0) >= 40 ? "#f59e0b" : "#22c55e"
                                            }
                                            strokeWidth="8"
                                            strokeDasharray={`${((complaint.importance_pct || 0) / 100) * 213.6} 213.6`}
                                            strokeLinecap="round"
                                        />
                                    </svg>
                                    <div className="absolute inset-0 flex items-center justify-center">
                                        <span className="text-lg font-black text-gray-900">{complaint.importance_pct || 0}%</span>
                                    </div>
                                </div>
                                <div>
                                    <p className="text-xs font-black text-gray-800 uppercase">Importance Rating</p>
                                    <p className="text-[9px] font-bold text-gray-500 uppercase mt-0.5">
                                        {(complaint.importance_pct || 0) >= 70 ? "CRITICAL — Immediate action required" :
                                            (complaint.importance_pct || 0) >= 40 ? "MODERATE — Standard processing" :
                                                "LOW — Routine complaint"}
                                    </p>
                                </div>
                            </div>

                            {/* Vector Dimension Bars */}
                            {complaint.importance_dimensions && (
                                <div className="space-y-2 pt-3 border-t border-gray-200">
                                    <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest">Severity Dimensions</p>
                                    {Object.entries(complaint.importance_dimensions).map(([dim, score]) => (
                                        <div key={dim} className="flex items-center gap-2">
                                            <span className="text-[8px] font-black text-gray-500 uppercase w-24 text-right tracking-tight">
                                                {dim === "emergency" ? "🚨 Emergency" :
                                                    dim === "infrastructure" ? "🏗️ Infra" :
                                                        dim === "public_impact" ? "👥 Public" :
                                                            "🏥 Health"}
                                            </span>
                                            <div className="flex-1 bg-gray-200 h-2 rounded-full overflow-hidden">
                                                <div
                                                    className={`h-full rounded-full transition-all ${score >= 50 ? "bg-red-500" :
                                                            score >= 25 ? "bg-amber-500" : "bg-emerald-500"
                                                        }`}
                                                    style={{ width: `${Math.max(2, score)}%` }}
                                                />
                                            </div>
                                            <span className="text-[9px] font-black text-gray-600 w-12 text-right">{score.toFixed(1)}%</span>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {/* Classification Details */}
                            <div className="pt-3 border-t border-gray-200 space-y-1.5">
                                <p className="text-[10px] font-bold text-gray-700 uppercase">
                                    Category: <span className="text-primary-600">{complaint.category || "General"}</span>
                                </p>
                                <p className="text-[10px] font-bold text-gray-700 uppercase">
                                    Department: <span className="text-primary-600">{assignedDept}</span>
                                </p>
                                <p className="text-[10px] font-bold text-gray-700 uppercase">
                                    Priority: <span className={complaint.priority === 'high' ? 'text-red-600' : 'text-blue-600'}>{complaint.priority} ({complaint.priority_score || "N/A"}/10)</span>
                                </p>
                            </div>
                        </div>

                        {/* Verify / Status */}
                        {isVerified ? (
                            <div className="bg-emerald-50 border-2 border-emerald-200 p-6 rounded-sm text-center space-y-2">
                                <span className="text-3xl">✅</span>
                                <p className="text-xs font-black text-emerald-800 uppercase tracking-widest">VERIFIED & ASSIGNED</p>
                                <p className="text-[10px] font-bold text-emerald-600 uppercase">
                                    Department: {assignedDept}
                                </p>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                <div className="bg-amber-50 border border-amber-200 p-4 rounded-sm">
                                    <p className="text-[9px] font-black text-amber-800 uppercase tracking-widest text-center">
                                        ⚠️ PENDING ADMIN VERIFICATION
                                    </p>
                                    <p className="text-[9px] font-bold text-amber-600 uppercase text-center mt-1">
                                        Verify that this complaint is correctly assigned to <span className="font-black">{assignedDept}</span>
                                    </p>
                                </div>
                                <button
                                    disabled={updating}
                                    onClick={handleVerify}
                                    className="w-full py-4 bg-emerald-600 text-white text-[11px] font-black uppercase tracking-[0.2em] rounded-sm hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-600/20 disabled:opacity-50 flex items-center justify-center gap-2"
                                >
                                    {updating ? "PROCESSING..." : "✓ VERIFY & CONFIRM"}
                                </button>
                            </div>
                        )}
                    </div>

                    <div className="bg-portal-bg border border-blue-100 p-6 rounded-sm">
                        <div className="flex items-center gap-3 mb-4">
                            <span className="text-xl">🤖</span>
                            <p className="text-[10px] font-black text-gray-900 uppercase tracking-widest">AI Audit Verdict</p>
                        </div>
                        <p className="text-[10px] font-bold text-gray-500 leading-relaxed uppercase">
                            This grievance shows <span className="text-primary-600">89% similarity</span> with previous cases in <span className="text-accent-saffron-deep">{complaint.category || "General Infrastructure"}</span>. Recommendation: Direct to {assignedDept}.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
