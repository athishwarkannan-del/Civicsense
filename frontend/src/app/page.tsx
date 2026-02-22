"use client";

import Link from "next/link";
import { useLanguage } from "@/components/LanguageProvider";
import HomeSlider from "@/components/HomeSlider";

export default function HomePage() {
    const { t, locale } = useLanguage();

    const QUICK_ACTIONS = [
        { title: t("actions.lodge_title"), icon: "📝", href: "/lodge-grievance", desc: t("actions.lodge_desc") },
        { title: t("actions.status_title"), icon: "📍", href: "/track-status", desc: t("actions.status_desc") },
        { title: t("actions.appeal_title"), icon: "⏰", href: "/track-status", desc: t("actions.appeal_desc") },
    ];

    const STATS = [
        { label: t("stats.resolved"), value: "48,291", color: "text-accent-green" },
        { label: t("stats.received"), value: "52,104", color: "text-primary-600" },
        { label: t("stats.disposal"), value: "4 Days", color: "text-accent-saffron-deep" },
    ];

    return (
        <div className="bg-portal-bg">
            {/* ─── Hero Slider ────────────────────────────── */}
            <HomeSlider />

            {/* ─── Quick Actions ───────────────────────────────────── */}
            <section className="max-w-7xl mx-auto px-4 py-12 relative z-20">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {QUICK_ACTIONS.map((action) => (
                        <Link key={action.title} href={action.href} className="bg-white p-8 border border-gray-200 shadow-xl hover:shadow-2xl transition-all group border-b-4 border-b-transparent hover:border-b-primary-600">
                            <div className="text-4xl mb-6 group-hover:scale-110 transition-transform block">{action.icon}</div>
                            <h3 className="text-base font-black text-gray-900 mb-3 tracking-wide uppercase">{action.title}</h3>
                            <p className="text-xs text-gray-500 font-medium leading-relaxed">{action.desc}</p>
                            <div className="mt-6 flex items-center text-primary-600 text-[10px] font-black tracking-widest uppercase gap-2">
                                {locale === "ta" ? "இங்கே கிளிக் செய்யவும்" : locale === "hi" ? "यहाँ क्लिक करें" : "Click Here"} <span className="text-lg group-hover:translate-x-1 transition-transform">→</span>
                            </div>
                        </Link>
                    ))}
                </div>
            </section>

            {/* ─── Stats Bar ────────────────────────────────────────── */}
            <section className="py-16 sm:py-24 bg-white border-b border-gray-100">
                <div className="max-w-7xl mx-auto px-4">
                    <div className="text-center mb-12">
                        <h2 className="text-xs font-black tracking-[0.4em] text-gray-400 mb-2 uppercase">{t("stats.title")}</h2>
                        <p className="text-2xl font-black text-primary-600 tracking-tighter uppercase">{t("stats.subtitle")}</p>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 text-center bg-portal-bg-wash p-10 border border-blue-50">
                        {STATS.map((stat) => (
                            <div key={stat.label}>
                                <div className={`text-4xl lg:text-5xl font-black ${stat.color} mb-2 tracking-tighter`}>{stat.value}</div>
                                <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{stat.label}</div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ─── Info Sections ────────────────────────────────────── */}
            <section className="py-20 bg-portal-bg-wash overflow-hidden">
                <div className="max-w-7xl mx-auto px-4">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-start">
                        <div>
                            <h2 className="text-xs font-black tracking-[0.4em] text-accent-green mb-4 uppercase">{t("about.title")}</h2>
                            <h3 className="text-3xl font-black text-gray-900 mb-6 leading-tight tracking-tight uppercase">
                                {t("branding.tagline")}
                            </h3>
                            <div className="space-y-4 text-sm text-gray-600 font-medium leading-relaxed">
                                <p>{t("about.p1")}</p>
                                <p>{t("about.p2")}</p>
                            </div>
                        </div>
                        <div className="relative">
                            <div className="absolute inset-0 bg-primary-600/5 -rotate-3 scale-110 -z-10 rounded-sm" />
                            <div className="bg-white border border-gray-200 p-8 shadow-2xl relative overflow-hidden">
                                <h4 className="text-base font-black text-gray-900 mb-6 border-b border-gray-100 pb-4 uppercase">
                                    {locale === "ta" ? "சமீபத்திய முன்முயற்சிகள் மற்றும் செய்திகள்" : locale === "hi" ? "नवीनतम पहल और समाचार" : "Latest Initiatives & News"}
                                </h4>
                                <div className="space-y-8">
                                    {[
                                        { d: "22 FEB 2026", t: locale === "ta" ? "AI-ஆல் இயங்கும் தானியங்கி வகைப்படுத்தலின் அறிமுகம்" : locale === "hi" ? "एआई-आधारित ऑटो-वर्गीकरण का परिचय" : "Introduction of AI-Powered Auto-Classification", desc: locale === "ta" ? "கணினி இப்போது விரைவான ரூட்டிங்கிற்கு மேம்பட்ட இயந்திர கற்றலைப் பயன்படுத்துகிறது." : locale === "hi" ? "सिस्टम अब तेजी से रूटिंग के लिए उन्नत मशीन लर्निंग का उपयोग करता है।" : "System now uses advanced machine learning for faster routing." },
                                        { d: "15 FEB 2026", t: locale === "ta" ? "மாநில போர்ட்டல்களுடன் ஒருங்கிணைப்பு" : locale === "hi" ? "राज्य पोर्टलों के साथ एकीकरण" : "Integration with State Portals", desc: locale === "ta" ? "மத்திய மற்றும் மாநிலங்களுக்கு இடையே இப்போது தடையற்ற புகார் பரிமாற்றம்." : locale === "hi" ? "अब केंद्र और राज्यों के बीच शिकायतों का निर्பாध हस्तांतरण।" : "Now seamless grievance transfer between Center and State." }
                                    ].map(news => (
                                        <div key={news.t} className="flex gap-6 group">
                                            <div className="shrink-0 text-center">
                                                <p className="text-xs font-black text-primary-600 block">{news.d.split(' ')[0]}</p>
                                                <p className="text-[10px] font-bold text-gray-400 block">{news.d.split(' ')[1]}</p>
                                            </div>
                                            <div>
                                                <h5 className="text-xs font-black text-gray-900 mb-1 group-hover:text-primary-600 transition-colors uppercase tracking-wide cursor-pointer">{news.t}</h5>
                                                <p className="text-[11px] text-gray-500 leading-relaxed">{news.desc}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                                <button className="w-full mt-10 py-3 border border-primary-600 text-primary-600 text-[10px] font-black uppercase tracking-widest hover:bg-primary-600 hover:text-white transition-all">
                                    {locale === "ta" ? "அனைத்து அறிவிப்புகளையும் படிக்கவும்" : locale === "hi" ? "सभी अपडेट पढ़ें" : "READ ALL UPDATES"}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </section>
        </div>
    );
}
