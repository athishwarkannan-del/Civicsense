"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { api, type ChatMessage } from "@/lib/api";

/**
 * Render assistant message content with clickable navigation links.
 * Detects markdown links like [Page Name](/path) and converts them to
 * clickable elements that use Next.js router.push().
 */
function MessageContent({
    content,
    onNavigate,
}: {
    content: string;
    onNavigate: (path: string) => void;
}) {
    // Split content by markdown link pattern [text](/path)
    const parts = content.split(/(\[[^\]]+\]\(\/[^)]+\))/g);

    return (
        <>
            {parts.map((part, i) => {
                const linkMatch = part.match(/\[([^\]]+)\]\((\/[^)]+)\)/);
                if (linkMatch) {
                    const [, label, path] = linkMatch;
                    return (
                        <button
                            key={i}
                            onClick={() => onNavigate(path)}
                            className="inline text-primary-600 font-semibold underline underline-offset-2 decoration-primary-300 hover:decoration-primary-600 transition-colors cursor-pointer"
                        >
                            {label}
                        </button>
                    );
                }
                return <span key={i}>{part}</span>;
            })}
        </>
    );
}

export default function Chatbot() {
    const router = useRouter();
    const [open, setOpen] = useState(false);
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [input, setInput] = useState("");
    const [loading, setLoading] = useState(false);
    const [quickReplies, setQuickReplies] = useState<string[]>([
        "How do I file a grievance?",
        "Track my complaint",
        "What departments are available?",
        "Contact support",
    ]);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = useCallback(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, []);

    useEffect(() => {
        scrollToBottom();
    }, [messages, scrollToBottom]);

    const handleNavigate = (path: string) => {
        router.push(path);
        setOpen(false);
    };

    const sendMessage = async (text: string) => {
        if (!text.trim() || loading) return;

        const userMsg: ChatMessage = { role: "user", content: text.trim() };
        const newMessages = [...messages, userMsg];
        setMessages(newMessages);
        setInput("");
        setQuickReplies([]);
        setLoading(true);

        try {
            const res = await api.sendChatMessage(newMessages);
            setMessages((prev) => [
                ...prev,
                { role: "assistant", content: res.reply },
            ]);
            if (res.quick_replies) {
                setQuickReplies(res.quick_replies);
            }
        } catch {
            setMessages((prev) => [
                ...prev,
                {
                    role: "assistant",
                    content:
                        "Sorry, I am experiencing issues. Please try again later or contact support.",
                },
            ]);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        sendMessage(input);
    };

    return (
        <>
            {/* Toggle Button */}
            <button
                onClick={() => setOpen(!open)}
                className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full gradient-primary text-white shadow-xl shadow-primary-600/30 hover:shadow-2xl hover:scale-105 transition-all duration-300 flex items-center justify-center"
                aria-label={open ? "Close chatbot" : "Open chatbot"}
            >
                {open ? (
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                ) : (
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    </svg>
                )}
            </button>

            {/* Chat Window */}
            {open && (
                <div
                    className="fixed bottom-24 right-6 z-50 w-[380px] max-w-[calc(100vw-2rem)] h-[520px] bg-white rounded-2xl shadow-2xl border border-gray-200 flex flex-col overflow-hidden animate-fade-in"
                    role="dialog"
                    aria-label="AI Assistant"
                >
                    {/* Header */}
                    <div className="gradient-primary px-5 py-4 text-white flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 3.104v5.714a2.25 2.25 0 01-.659 1.591L5 14.5M9.75 3.104c-.251.023-.501.05-.75.082m.75-.082a24.301 24.301 0 014.5 0m0 0v5.714c0 .597.237 1.17.659 1.591L19 14.5M14.25 3.104c.251.023.501.05.75.082M19 14.5l-2.47 2.47a3.18 3.18 0 01-2.28.93H9.75a3.18 3.18 0 01-2.28-.93L5 14.5m14 0V19a2 2 0 01-2 2H7a2 2 0 01-2-2v-4.5" />
                            </svg>
                        </div>
                        <div>
                            <h3 className="font-semibold text-sm">GrievanceAI Assistant</h3>
                            <p className="text-xs text-white/70">AI-powered help • Powered by Mistral</p>
                        </div>
                    </div>

                    {/* Messages */}
                    <div className="flex-1 overflow-y-auto p-4 space-y-4">
                        {messages.length === 0 && (
                            <div className="text-center py-6">
                                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-primary-50 flex items-center justify-center">
                                    <svg className="w-8 h-8 text-primary-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                                    </svg>
                                </div>
                                <p className="text-sm font-semibold text-gray-800 mb-1">
                                    Hi! I&apos;m your GrievanceAI Assistant 👋
                                </p>
                                <p className="text-xs text-gray-500 leading-relaxed max-w-[260px] mx-auto">
                                    I can help you file complaints, track status, navigate the portal, and answer your questions.
                                </p>
                            </div>
                        )}

                        {messages.map((msg, i) => (
                            <div
                                key={i}
                                className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                            >
                                <div
                                    className={`max-w-[80%] px-4 py-3 rounded-2xl text-sm leading-relaxed ${msg.role === "user"
                                        ? "bg-primary-600 text-white rounded-br-md"
                                        : "bg-gray-100 text-gray-800 rounded-bl-md"
                                        }`}
                                >
                                    {msg.role === "assistant" ? (
                                        <MessageContent
                                            content={msg.content}
                                            onNavigate={handleNavigate}
                                        />
                                    ) : (
                                        msg.content
                                    )}
                                </div>
                            </div>
                        ))}

                        {loading && (
                            <div className="flex justify-start">
                                <div className="bg-gray-100 px-4 py-3 rounded-2xl rounded-bl-md">
                                    <div className="flex gap-1.5">
                                        <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" />
                                        <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:0.15s]" />
                                        <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:0.3s]" />
                                    </div>
                                </div>
                            </div>
                        )}

                        <div ref={messagesEndRef} />
                    </div>

                    {/* Quick Replies */}
                    {quickReplies.length > 0 && (
                        <div className="px-4 pb-2 flex flex-wrap gap-2">
                            {quickReplies.map((qr) => (
                                <button
                                    key={qr}
                                    onClick={() => sendMessage(qr)}
                                    className="text-xs px-3 py-1.5 rounded-full border border-primary-200 text-primary-700 hover:bg-primary-50 transition-colors"
                                >
                                    {qr}
                                </button>
                            ))}
                        </div>
                    )}

                    {/* Input */}
                    <form onSubmit={handleSubmit} className="p-4 border-t border-gray-100">
                        <div className="flex gap-2">
                            <label htmlFor="chatbot-input" className="sr-only">
                                Type a message
                            </label>
                            <input
                                id="chatbot-input"
                                type="text"
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                placeholder="Ask me anything about grievances..."
                                className="input-field !py-2.5 !rounded-full !text-sm"
                                disabled={loading}
                            />
                            <button
                                type="submit"
                                disabled={!input.trim() || loading}
                                className="w-10 h-10 rounded-full gradient-primary text-white flex items-center justify-center hover:shadow-lg transition-all disabled:opacity-50 shrink-0"
                                aria-label="Send message"
                            >
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                                </svg>
                            </button>
                        </div>
                    </form>
                </div>
            )}
        </>
    );
}
