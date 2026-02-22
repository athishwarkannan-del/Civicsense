"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";

export default function AdminLoginPage() {
    const router = useRouter();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        setLoading(true);
        try {
            const res = await api.login(email, password);
            if (!["admin", "super_admin"].includes(res.user.role)) { setError("Access denied. Admin credentials required."); setLoading(false); return; }
            localStorage.setItem("token", res.access_token);
            localStorage.setItem("user", JSON.stringify(res.user));
            router.push("/admin/dashboard");
        } catch (err: unknown) {
            const apiErr = err as { detail?: string };
            setError(apiErr.detail || "Invalid credentials.");
        } finally { setLoading(false); }
    };

    return (
        <div className="min-h-[80vh] flex items-center justify-center py-12 px-4">
            <div className="w-full max-w-md">
                <div className="text-center mb-8">
                    <div className="w-16 h-16 mx-auto mb-4 rounded-2xl gradient-primary flex items-center justify-center shadow-lg shadow-primary-600/25">
                        <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                        </svg>
                    </div>
                    <h1 className="text-2xl font-bold text-gray-900">Admin Access</h1>
                    <p className="text-gray-500 mt-1">Sign in with admin credentials</p>
                </div>
                <div className="card-elevated p-8">
                    {error && <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm" role="alert">{error}</div>}
                    <form onSubmit={handleSubmit} className="space-y-5">
                        <div>
                            <label htmlFor="admin-email" className="block text-sm font-medium text-gray-700 mb-1.5">Email</label>
                            <input id="admin-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="input-field" placeholder="admin@grievanceai.gov.in" required />
                        </div>
                        <div>
                            <label htmlFor="admin-password" className="block text-sm font-medium text-gray-700 mb-1.5">Password</label>
                            <input id="admin-password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="input-field" placeholder="Enter admin password" required />
                        </div>
                        <button type="submit" disabled={loading} className="btn-primary w-full !py-3.5">
                            {loading ? "Signing in..." : "Sign In as Admin"}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
}
