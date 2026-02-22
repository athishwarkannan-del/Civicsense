"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";

export default function LoginPage() {
    const router = useRouter();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    const isValidEmail = (e: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");

        if (!isValidEmail(email)) {
            setError("PLEASE ENTER A VALID EMAIL ADDRESS.");
            return;
        }
        if (password.length < 3) {
            setError("PASSWORD MUST BE AT LEAST 3 CHARACTERS.");
            return;
        }

        setLoading(true);
        try {
            const res = await api.login(email, password);
            localStorage.setItem("token", res.access_token);
            // Store user with normalized shape for getCurrentUser() helper
            localStorage.setItem("user", JSON.stringify(res.user));
            router.push(["admin", "super_admin"].includes(res.user.role) ? "/admin/dashboard" : "/dashboard");
        } catch (err: unknown) {
            const apiErr = err as { detail?: string };
            setError(apiErr.detail?.toUpperCase() || "INVALID EMAIL OR PASSWORD. PLEASE TRY AGAIN.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#F4F7F9] flex items-center justify-center py-20 px-4">
            <div className="w-full max-w-[440px]">
                {/* Official Seal / Branding */}
                <div className="text-center mb-10">
                    <div className="w-20 h-20 mx-auto mb-6 bg-primary-600 rounded-sm flex items-center justify-center shadow-xl border-t-4 border-accent-saffron">
                        <svg className="w-10 h-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                        </svg>
                    </div>
                    <h1 className="text-2xl font-black text-primary-900 tracking-tighter uppercase">CITIZEN LOGIN</h1>
                    <p className="text-[10px] font-bold text-gray-500 mt-2 uppercase tracking-[0.2em]">Centralized Public Grievance Redressal System</p>
                </div>

                {/* Login Container */}
                <div className="bg-white border border-gray-200 shadow-2xl p-10 relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-1 bg-primary-600"></div>

                    {error && (
                        <div className="mb-8 p-4 bg-red-50 border-l-4 border-red-600 text-red-700 text-[10px] font-black uppercase tracking-widest leading-relaxed">
                            SYSTEM ERROR: {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div>
                            <label htmlFor="email" className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">
                                USER EMAIL ADDRESS*
                            </label>
                            <input
                                id="email"
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full p-4 border-2 border-gray-100 bg-gray-50/50 rounded-sm focus:border-primary-600 text-sm font-bold uppercase transition-all shadow-inner placeholder:text-gray-300"
                                placeholder="E.G. CITIZEN@INFOMAIL.GOV"
                                required
                            />
                        </div>

                        <div>
                            <div className="flex justify-between items-center mb-2">
                                <label htmlFor="password" className="block text-[10px] font-black text-gray-400 uppercase tracking-widest">
                                    SECRET PASSWORD*
                                </label>
                                <button type="button" className="text-[9px] font-black text-primary-600 uppercase hover:underline">RECOVER ACCESS</button>
                            </div>
                            <div className="relative">
                                <input
                                    id="password"
                                    type={showPassword ? "text" : "password"}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="w-full p-4 border-2 border-gray-100 bg-gray-50/50 rounded-sm focus:border-primary-600 text-sm font-bold uppercase transition-all shadow-inner"
                                    placeholder="••••••••"
                                    required
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-primary-600 transition-colors"
                                >
                                    {showPassword ? (
                                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L6.5 6.5m7.378 7.378L17.5 17.5M3 3l18 18" /></svg>
                                    ) : (
                                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                                    )}
                                </button>
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full py-5 bg-primary-600 text-white text-[11px] font-black uppercase tracking-[0.2em] hover:bg-primary-700 transition-all rounded-sm shadow-xl disabled:opacity-50 mt-4 active:scale-[0.98]"
                        >
                            {loading ? "AUTHENTICATING..." : "AUTHORIZE ACCESS"}
                        </button>
                    </form>
                </div>

                <div className="text-center mt-10 space-y-4">
                    <p className="text-[11px] font-black text-gray-500 uppercase tracking-widest">
                        NEW CITIZEN USER?{" "}
                        <Link href="/register" className="text-primary-600 hover:underline decoration-2 underline-offset-4 ml-2">
                            REGISTER ACCOUNT
                        </Link>
                    </p>
                    <div className="pt-8 border-t border-gray-200">
                        <p className="text-[9px] font-bold text-gray-400 uppercase leading-relaxed">
                            This is a secure government portal. Unauthorized access is strictly prohibited and subject to legal action under IT Act.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
