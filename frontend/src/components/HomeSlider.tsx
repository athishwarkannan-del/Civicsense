"use client";

import { useState, useEffect, useCallback } from "react";
import { useLanguage } from "./LanguageProvider";

const SLIDES = [
    { id: 1, src: "/images/slider/slide1.jpg", alt: "Slider Image 1" },
    { id: 2, src: "/images/slider/slide2.jpg", alt: "Slider Image 2" },
    { id: 3, src: "/images/slider/slide3.jpg", alt: "Slider Image 3" },
    { id: 4, src: "/images/slider/slide4.jpg", alt: "Slider Image 4" },
];

export default function HomeSlider() {
    const { t } = useLanguage();
    const [current, setCurrent] = useState(0);

    const next = useCallback(() => {
        setCurrent((prev) => (prev + 1) % SLIDES.length);
    }, []);

    const prev = () => {
        setCurrent((prev) => (prev - 1 + SLIDES.length) % SLIDES.length);
    };

    useEffect(() => {
        const timer = setInterval(next, 5000);
        return () => clearInterval(timer);
    }, [next]);

    return (
        <div className="relative w-full h-[300px] sm:h-[400px] md:h-[500px] lg:h-[600px] overflow-hidden bg-gray-100 group">
            {/* Slides */}
            <div
                className="flex transition-transform duration-700 ease-in-out h-full"
                style={{ transform: `translateX(-${current * 100}%)` }}
            >
                {SLIDES.map((slide) => (
                    <div key={slide.id} className="min-w-full h-full relative">
                        <img
                            src={slide.src}
                            alt={slide.alt}
                            className="w-full h-full object-cover"
                        />
                        {/* Overlay for branding and text consistency */}
                        <div className="absolute inset-0 bg-gradient-to-r from-primary-800/80 to-transparent flex items-center px-4 sm:px-12 md:px-24">
                            <div className="max-w-2xl text-white">
                                <span className="bg-accent-gold text-primary-900 px-3 py-1 text-[10px] font-black uppercase tracking-widest mb-4 inline-block">
                                    {t("hero.news_tag")}
                                </span>
                                <h1 className="text-2xl sm:text-4xl md:text-5xl font-black uppercase tracking-tighter leading-none mb-4 drop-shadow-lg">
                                    {t("hero.slide1_title")}
                                </h1>
                                <p className="text-xs sm:text-sm font-bold opacity-90 uppercase tracking-wide max-w-lg drop-shadow shadow-primary-900">
                                    {t("hero.slide1_desc")}
                                </p>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Navigation Buttons */}
            <button
                onClick={prev}
                className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-black/20 hover:bg-accent-gold text-white hover:text-primary-900 transition-all flex items-center justify-center rounded-sm backdrop-blur-md opacity-0 group-hover:opacity-100 z-20 border border-white/20"
                aria-label="Previous Slide"
            >
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path d="M15 19l-7-7 7-7" /></svg>
            </button>
            <button
                onClick={next}
                className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-black/20 hover:bg-accent-gold text-white hover:text-primary-900 transition-all flex items-center justify-center rounded-sm backdrop-blur-md opacity-0 group-hover:opacity-100 z-20 border border-white/20"
                aria-label="Next Slide"
            >
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path d="M9 5l7 7-7 7" /></svg>
            </button>

            {/* Indicators */}
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-3 z-20">
                {SLIDES.map((_, i) => (
                    <button
                        key={i}
                        onClick={() => setCurrent(i)}
                        className={`transition-all duration-300 rounded-sm ${i === current ? "w-8 h-2 bg-accent-gold" : "w-2 h-2 bg-white/50 hover:bg-white"}`}
                        aria-label={`Go to slide ${i + 1}`}
                    />
                ))}
            </div>

            {/* Decorative bottom border */}
            <div className="absolute bottom-0 left-0 w-full h-1.5 bg-accent-saffron z-30 shadow-[0_-4px_10px_rgba(255,103,31,0.3)]" />
        </div>
    );
}
