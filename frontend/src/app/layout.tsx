import type { Metadata } from "next";
import "./globals.css";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import Chatbot from "@/components/Chatbot";
import { LanguageProvider } from "@/components/LanguageProvider";

export const metadata: Metadata = {
    title: "GrievanceAI - AI-Powered Public Grievance Redressal",
    description:
        "Connecting Citizens with Government - Your Voice, Our Priority. File, track, and resolve public grievances with AI-powered classification and routing.",
    keywords: [
        "grievance",
        "public complaint",
        "government",
        "citizen services",
        "AI",
    ],
};

export default function RootLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <html lang="en" suppressHydrationWarning>
            <head>
                <link
                    href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap"
                    rel="stylesheet"
                />
                <link
                    rel="stylesheet"
                    href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"
                    crossOrigin=""
                />
            </head>
            <body className="min-h-screen flex flex-col">
                <LanguageProvider>
                    <Header />
                    <main className="flex-1">{children}</main>
                    <Footer />
                    <Chatbot />
                </LanguageProvider>
            </body>
        </html>
    );
}
