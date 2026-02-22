"use client";

import { useEffect, useRef, useState } from "react";

interface CameraOverlayProps {
    onCapture: (file: File) => void;
    onClose: () => void;
}

export default function CameraOverlay({ onCapture, onClose }: CameraOverlayProps) {
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [isStreaming, setIsStreaming] = useState(false);
    const [error, setError] = useState("");
    const [stream, setStream] = useState<MediaStream | null>(null);

    const startCamera = async () => {
        setError("");
        try {
            const s = await navigator.mediaDevices.getUserMedia({
                video: {
                    facingMode: { ideal: "environment" },
                    width: { ideal: 1280 },
                    height: { ideal: 720 }
                },
                audio: false
            });
            setStream(s);
            if (videoRef.current) {
                videoRef.current.srcObject = s;
            }
            setIsStreaming(true);
        } catch (err) {
            console.error("Camera access error:", err);
            setError("Camera access was blocked or is unavailable. Please check your browser settings and try again.");
        }
    };

    useEffect(() => {
        startCamera();

        return () => {
            if (stream) {
                stream.getTracks().forEach(track => track.stop());
            }
        };
    }, []);

    const capturePhoto = () => {
        if (!videoRef.current || !canvasRef.current) return;

        const video = videoRef.current;
        const canvas = canvasRef.current;
        const context = canvas.getContext("2d");

        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;

        if (context) {
            context.drawImage(video, 0, 0, canvas.width, canvas.height);
            canvas.toBlob((blob) => {
                if (blob) {
                    const file = new File([blob], `capture_${Date.now()}.jpg`, { type: "image/jpeg" });
                    onCapture(file);
                    onClose();
                }
            }, "image/jpeg", 0.8);
        }
    };

    return (
        <div className="fixed inset-0 z-[100] bg-black/90 flex flex-col items-center justify-center p-4">
            <div className="relative w-full max-w-2xl bg-black rounded-lg overflow-hidden shadow-2xl">
                {/* Header */}
                <div className="absolute top-0 left-0 w-full p-4 flex justify-between items-center z-10 bg-gradient-to-b from-black/50 to-transparent">
                    <h3 className="text-white text-xs font-black uppercase tracking-widest">Live Capture</h3>
                    <button onClick={onClose} className="p-2 text-white hover:bg-white/10 rounded-full transition-all">
                        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {/* Video Feed */}
                <div className="aspect-[4/3] bg-gray-900 flex items-center justify-center overflow-hidden">
                    {error ? (
                        <div className="p-8 text-center">
                            <p className="text-red-400 text-sm font-bold uppercase mb-6 leading-relaxed">{error}</p>
                            <div className="flex flex-col sm:flex-row gap-4 justify-center">
                                <button onClick={startCamera} className="px-8 py-3 bg-white text-black text-[10px] font-black uppercase rounded-sm shadow-xl">Grant Permission / Retry</button>
                                <button onClick={onClose} className="px-8 py-3 bg-white/10 text-white text-[10px] font-black uppercase rounded-sm border border-white/20">Cancel</button>
                            </div>
                        </div>
                    ) : !isStreaming ? (
                        <div className="flex flex-col items-center gap-4">
                            <div className="w-10 h-10 border-4 border-white border-t-transparent rounded-full animate-spin" />
                            <p className="text-white/50 text-[10px] font-bold uppercase tracking-widest">Initializing Camera...</p>
                        </div>
                    ) : (
                        <video
                            ref={videoRef}
                            autoPlay
                            playsInline
                            className="w-full h-full object-cover"
                        />
                    )}
                </div>

                {/* Controls */}
                {isStreaming && (
                    <div className="p-8 flex justify-center items-center gap-8 bg-black">
                        <button
                            onClick={capturePhoto}
                            className="w-16 h-16 rounded-full border-4 border-white flex items-center justify-center group active:scale-95 transition-all"
                        >
                            <div className="w-12 h-12 bg-white rounded-full group-hover:scale-110 transition-transform" />
                        </button>
                    </div>
                )}
            </div>

            <canvas ref={canvasRef} className="hidden" />

            <div className="mt-6 text-white/50 text-[10px] font-bold uppercase tracking-widest text-center">
                Point your camera at the evidence and tap the button to capture
            </div>
        </div>
    );
}
