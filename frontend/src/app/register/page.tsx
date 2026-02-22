"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";

function getPasswordStrength(pw: string): { score: number; label: string; color: string } {
    let score = 0;
    if (pw.length >= 6) score++;
    if (pw.length >= 10) score++;
    if (/[A-Z]/.test(pw)) score++;
    if (/[0-9]/.test(pw)) score++;
    if (/[^A-Za-z0-9]/.test(pw)) score++;

    if (score <= 1) return { score, label: "WEAK", color: "bg-red-500" };
    if (score <= 2) return { score, label: "FAIR", color: "bg-amber-500" };
    if (score <= 3) return { score, label: "GOOD", color: "bg-blue-500" };
    return { score, label: "STRONG", color: "bg-emerald-500" };
}

export default function RegisterPage() {
    const router = useRouter();
    const [form, setForm] = useState({ name: "", email: "", phone: "", password: "", confirmPassword: "" });
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    const strength = useMemo(() => getPasswordStrength(form.password), [form.password]);
    const isValidEmail = (e: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);

    const update = (field: keyof typeof form, value: string) => {
        setForm((prev) => ({ ...prev, [field]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");

        if (!form.name.trim()) { setError("FULL NAME IS REQUIRED."); return; }
        if (!isValidEmail(form.email)) { setError("PLEASE ENTER A VALID EMAIL ADDRESS."); return; }
        if (form.password.length < 3) { setError("PASSWORD MUST BE AT LEAST 3 CHARACTERS."); return; }
        if (form.password !== form.confirmPassword) { setError("PASSWORDS DO NOT MATCH."); return; }

        setLoading(true);
        try {
            const res = await api.register({
                full_name: form.name,   // map form "name" → backend "full_name"
                email: form.email,
                password: form.password,
            });
            localStorage.setItem("token", res.access_token);
            localStorage.setItem("user", JSON.stringify(res.user));
            router.push(["admin", "super_admin"].includes(res.user.role) ? "/admin/dashboard" : "/dashboard");
        } catch (err: unknown) {
            const apiErr = err as { detail?: string };
            setError(apiErr.detail?.toUpperCase() || "REGISTRATION FAILED. PLEASE TRY AGAIN.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#F4F7F9] flex items-center justify-center py-20 px-4">
            <div className="w-full max-w-[500px]">
                {/* Official Branding */}
                <div className="text-center mb-10">
                    <div className="w-20 h-20 mx-auto mb-6 bg-primary-600 rounded-sm flex items-center justify-center shadow-xl border-t-4 border-accent-saffron">
                        <svg className="w-10 h-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                        </svg>
                    </div>
                    <h1 className="text-2xl font-black text-primary-900 tracking-tighter uppercase">CITIZEN REGISTRATION</h1>
                    <p className="text-[10px] font-bold text-gray-500 mt-2 uppercase tracking-[0.2em]">Create your digital grievance identity</p>
                </div>

                {/* Registration Container */}
                <div className="bg-white border border-gray-200 shadow-2xl p-10 relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-1 bg-primary-600"></div>

                    {error && (
                        <div className="mb-8 p-4 bg-red-50 border-l-4 border-red-600 text-red-700 text-[10px] font-black uppercase tracking-widest leading-relaxed">
                            REGISTRATION ERROR: {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="grid grid-cols-1 gap-6">
                            <div>
                                <label htmlFor="name" className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">FULL LEGAL NAME*</label>
                                <input id="name" type="text" value={form.name} onChange={(e) => update("name", e.target.value)} className="w-full p-4 border-2 border-gray-100 bg-gray-50/50 rounded-sm focus:border-primary-600 text-sm font-bold uppercase transition-all shadow-inner" placeholder="E.G. JOHN DOE" required />
                            </div>

                            <div>
                                <label htmlFor="reg-email" className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">EMAIL ADDRESS*</label>
                                <input id="reg-email" type="email" value={form.email} onChange={(e) => update("email", e.target.value)} className="w-full p-4 border-2 border-gray-100 bg-gray-50/50 rounded-sm focus:border-primary-600 text-sm font-bold uppercase transition-all shadow-inner" placeholder="CITIZEN@MAIL.CO" autoComplete="email" required />
                            </div>

                            <div>
                                <label htmlFor="phone" className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">MOBILE NUMBER (OPTIONAL)</label>
                                <input id="phone" type="tel" value={form.phone} onChange={(e) => update("phone", e.target.value)} className="w-full p-4 border-2 border-gray-100 bg-gray-50/50 rounded-sm focus:border-primary-600 text-sm font-bold uppercase transition-all shadow-inner" placeholder="+91 XXXXX XXXXX" />
                            </div>

                            <div>
                                <label htmlFor="reg-password" className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">SECRET PASSWORD*</label>
                                <div className="relative">
                                    <input
                                        id="reg-password"
                                        type={showPassword ? "text" : "password"}
                                        value={form.password}
                                        onChange={(e) => update("password", e.target.value)}
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
                                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M3 3l18 18" /></svg>
                                        ) : (
                                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                                        )}
                                    </button>
                                </div>
                                {form.password && (
                                    <div className="mt-3">
                                        <div className="flex gap-1 mb-2">
                                            {[1, 2, 3, 4, 5].map((i) => (
                                                <div key={i} className={`h-1 flex-1 rounded-full transition-all duration-500 ${i <= strength.score ? strength.color : "bg-gray-100"}`} />
                                            ))}
                                        </div>
                                        <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">
                                            SECURITY LEVEL: <span className={strength.label === 'STRONG' ? 'text-emerald-600' : 'text-primary-600'}>{strength.label}</span>
                                        </p>
                                    </div>
                                )}
                            </div>

                            <div>
                                <label htmlFor="confirm-password" className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">RE-ENTER PASSWORD*</label>
                                <input
                                    id="confirm-password"
                                    type="password"
                                    value={form.confirmPassword}
                                    onChange={(e) => update("confirmPassword", e.target.value)}
                                    className="w-full p-4 border-2 border-gray-100 bg-gray-50/50 rounded-sm focus:border-primary-600 text-sm font-bold uppercase transition-all shadow-inner"
                                    placeholder="••••••••"
                                    required
                                />
                            </div>
                        </div>

                        <button type="submit" disabled={loading} className="w-full py-5 bg-primary-600 text-white text-[11px] font-black uppercase tracking-[0.2em] hover:bg-primary-700 transition-all rounded-sm shadow-xl disabled:opacity-50 mt-4 active:scale-[0.98]">
                            {loading ? "INITIALIZING ACCOUNT..." : "CREATE CITIZEN PROFILE"}
                        </button>
                    </form>
                </div>

                <div className="text-center mt-10 space-y-4">
                    <p className="text-[11px] font-black text-gray-500 uppercase tracking-widest">
                        ALREADY HAVE AN ACCOUNT?{" "}
                        <Link href="/login" className="text-primary-600 hover:underline decoration-2 underline-offset-4 ml-2">
                            PROCEED TO LOGIN
                        </Link>
                    </p>
                    <div className="pt-8 border-t border-gray-200 text-[9px] font-bold text-gray-400 uppercase leading-relaxed max-w-sm mx-auto">
                        BY REGISTERING, YOU AGREE TO THE PORTAL&apos;S TERMS OF SERVICE AND PRIVACY PROTOCOLS FOR PUBLIC GRIEVANCE SUBMISSION.
                    </div>
                </div>
            </div>
        </div>
    );
}
