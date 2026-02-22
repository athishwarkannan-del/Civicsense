"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import en from "@/lib/i18n/en.json";
import hi from "@/lib/i18n/hi.json";
import ta from "@/lib/i18n/ta.json";

type Locale = "en" | "hi" | "ta";
type Translations = typeof en;

interface LanguageContextType {
    locale: Locale;
    setLocale: (locale: Locale) => void;
    t: (key: string) => string;
}

const translations: Record<Locale, any> = { en, hi, ta };

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
    const [locale, setLocale] = useState<Locale>("en");

    // Persist locale preference
    useEffect(() => {
        const savedLocale = localStorage.getItem("portal_locale") as Locale;
        if (savedLocale && (savedLocale === "en" || savedLocale === "hi" || savedLocale === "ta")) {
            setLocale(savedLocale);
        }
    }, []);

    const handleSetLocale = (newLocale: Locale) => {
        setLocale(newLocale);
        localStorage.setItem("portal_locale", newLocale);
    };

    const t = (key: string): string => {
        const keys = key.split(".");
        let result = translations[locale];

        for (const k of keys) {
            if (result && result[k]) {
                result = result[k];
            } else {
                return key; // Return key if translation is missing
            }
        }

        return typeof result === "string" ? result : key;
    };

    return (
        <LanguageContext.Provider value={{ locale, setLocale: handleSetLocale, t }}>
            {children}
        </LanguageContext.Provider>
    );
}

export function useLanguage() {
    const context = useContext(LanguageContext);
    if (context === undefined) {
        throw new Error("useLanguage must be used within a LanguageProvider");
    }
    return context;
}
