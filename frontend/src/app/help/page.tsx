"use client";

import { useState } from "react";

const FAQS = [
    { q: "How do I lodge a grievance?", a: "Click 'Lodge Grievance' in the navigation, fill in the multi-step form with your complaint details, evidence, and personal information. Our AI will classify and route it to the right department." },
    { q: "How can I track my complaint?", a: "Go to 'Track Status' and enter your complaint ID. You'll see the current status, assigned officer, and a timeline of all updates." },
    { q: "What types of grievances can I file?", a: "You can file complaints related to Roads & Transport, Water Supply, Electricity, Sanitation, Healthcare, Education, Public Safety, and more." },
    { q: "How long does resolution take?", a: "Resolution time depends on the issue complexity. Average resolution time is 4.2 days. You'll receive updates at each stage." },
    { q: "Is my information secure?", a: "Yes. All data is encrypted and handled per government data protection guidelines. Your personal information is only shared with the relevant authorities." },
    { q: "Can I upload evidence?", a: "Yes. You can upload images and record audio descriptions to support your grievance." },
    { q: "How does AI classification work?", a: "Our AI analyzes your description to automatically detect the category, department, priority level, and relevant keywords for faster routing." },
];

export default function HelpPage() {
    const [open, setOpen] = useState<number | null>(null);

    return (
        <div className="min-h-[80vh] py-12 px-4">
            <div className="max-w-3xl mx-auto">
                <div className="text-center mb-12">
                    <h1 className="text-3xl font-bold text-gray-900">Help Center</h1>
                    <p className="text-gray-500 mt-2">Find answers to common questions about the GrievanceAI platform.</p>
                </div>

                {/* FAQ */}
                <div className="space-y-3 mb-12">
                    {FAQS.map((faq, i) => (
                        <div key={i} className="card !p-0 overflow-hidden">
                            <button
                                onClick={() => setOpen(open === i ? null : i)}
                                className="w-full flex items-center justify-between p-5 text-left hover:bg-gray-50 transition-colors"
                                aria-expanded={open === i}
                            >
                                <span className="text-sm font-semibold text-gray-900 pr-4">{faq.q}</span>
                                <svg className={`w-5 h-5 text-gray-400 shrink-0 transition-transform ${open === i ? "rotate-180" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                                </svg>
                            </button>
                            {open === i && (
                                <div className="px-5 pb-5 text-sm text-gray-600 leading-relaxed animate-fade-in">{faq.a}</div>
                            )}
                        </div>
                    ))}
                </div>

                {/* Contact */}
                <div className="card-elevated p-8 text-center">
                    <h2 className="text-xl font-bold text-gray-900 mb-2">Still need help?</h2>
                    <p className="text-gray-500 text-sm mb-6">Contact our support team for personalized assistance.</p>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        {[
                            { icon: "📧", label: "Email", value: "support@grievanceai.gov.in" },
                            { icon: "📞", label: "Phone", value: "1800-XXX-XXXX (Toll-Free)" },
                            { icon: "🕐", label: "Hours", value: "Mon-Fri, 9AM - 6PM IST" },
                        ].map((c) => (
                            <div key={c.label} className="p-4 bg-gray-50 rounded-xl">
                                <div className="text-2xl mb-2">{c.icon}</div>
                                <p className="text-xs text-gray-500">{c.label}</p>
                                <p className="text-sm font-medium text-gray-900 mt-0.5">{c.value}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
