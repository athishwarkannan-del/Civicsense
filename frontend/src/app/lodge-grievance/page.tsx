"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { api, debounce, type ClassificationResult, getCurrentUser } from "@/lib/api";
import { INDIA_STATES_DISTRICTS } from "@/lib/locationData";

const LocationMap = dynamic(() => import("@/components/LocationMap"), { ssr: false, loading: () => <div className="h-[300px] bg-gray-100 flex items-center justify-center font-bold text-gray-400">LOADING MAP...</div> });
const CameraOverlay = dynamic(() => import("@/components/CameraOverlay"), { ssr: false });

const CATEGORIES = [
    "Roads & Transport", "Water Supply", "Electricity", "Sanitation",
    "Healthcare", "Education", "Public Safety", "Revenue", "Housing",
    "Environment", "Social Welfare", "Other",
];

const INSTRUCTIONS = [
    "Grievance can be lodged only by registered citizens.",
    "Issues relating to sub-judice matters, personal/family disputes, or RTI matters will NOT be treated as grievances.",
    "Please provide exact location details and valid contact info for faster resolution.",
    "You can upload images (up to 10MB each) as supporting evidence.",
    "Our AI system will automatically route your grievance to the concerned nodal officer."
];

interface FormData {
    description: string;
    category: string;
    state: string;
    district: string;
    pincode: string;
    address: string;
    location: string;
    latitude: number;
    longitude: number;
    name: string;
    email: string;
    phone: string;
}

const INITIAL_FORM: FormData = {
    description: "", category: "", state: "", district: "", pincode: "", address: "", location: "",
    latitude: 28.6139, longitude: 77.209,
    name: "", email: "", phone: "",
};

export default function LodgeGrievancePage() {
    const router = useRouter();
    const [step, setStep] = useState(1);
    const [currUser, setCurrUser] = useState<any>(null);
    const [form, setForm] = useState<FormData>(INITIAL_FORM);
    const [classification, setClassification] = useState<ClassificationResult | null>(null);
    const [classifying, setClassifying] = useState(false);
    const [imageFiles, setImageFiles] = useState<File[]>([]);
    const [imagePreviews, setImagePreviews] = useState<string[]>([]);
    const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
    const [recording, setRecording] = useState(false);
    const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState("");
    const [showDuplicateModal, setShowDuplicateModal] = useState(false);
    const [duplicates, setDuplicates] = useState<{ id: string; description: string; similarity_score: number; status: string }[]>([]);
    const [showSuccess, setShowSuccess] = useState(false);
    const [complaintId, setComplaintId] = useState("");
    const [showCamera, setShowCamera] = useState(false);
    const [gpsLoading, setGpsLoading] = useState(false);
    const [gpsError, setGpsError] = useState("");
    const [locationMode, setLocationMode] = useState<"auto" | "manual">("auto");

    // Restore draft & Fetch latest user data
    useEffect(() => {
        // 1. Restore draft (never restore personal contact fields)
        const saved = localStorage.getItem("grievance_draft");
        if (saved) {
            try {
                const parsed = JSON.parse(saved) as Partial<FormData>;
                // Explicitly exclude contact fields so they always start blank
                const { name: _n, email: _e, phone: _p, ...rest } = parsed;
                setForm((prev) => ({ ...prev, ...rest }));
            } catch { /* ignore */ }
        }

        // 2. Fetch latest user from backend to ensure phone is loaded
        const fetchUser = async () => {
            try {
                const user = await api.getMe();
                setCurrUser(user);
                localStorage.setItem("user", JSON.stringify(user));
                // Sync profile data into form state for validation
                setForm(prev => ({
                    ...prev,
                    name: user.full_name || prev.name,
                    email: user.email || prev.email,
                    phone: user.phone || prev.phone
                }));
            } catch (err) {
                console.error("Failed to fetch current user", err);
                // Fallback to local storage if API fails
                setCurrUser(getCurrentUser());
            }
        };
        fetchUser();
    }, []);



    // Auto-save draft
    useEffect(() => {
        localStorage.setItem("grievance_draft", JSON.stringify(form));
    }, [form]);

    const update = (field: keyof FormData, value: string | number) => {
        setForm((prev) => ({ ...prev, [field]: value }));
    };

    // Debounced AI classification
    const classifyDescription = useMemo(
        () =>
            debounce(async (desc: string) => {
                if (desc.length < 20) return;
                setClassifying(true);
                try {
                    const res = await api.classifyGrievance(desc);
                    setClassification(res);
                    if (res.detected_category && !form.category) {
                        update("category", res.detected_category);
                    }
                } catch { /* silent */ }
                finally { setClassifying(false); }
            }, 500),
        // eslint-disable-next-line react-hooks/exhaustive-deps
        []
    );

    const handleDescriptionChange = useCallback(
        (val: string) => {
            update("description", val);
            classifyDescription(val);
        },
        [classifyDescription]
    );

    // Geocoding logic
    const geocodeAddress = useMemo(
        () =>
            debounce(async (f: FormData) => {
                const query = [f.address, f.district, f.state, f.pincode, "India"]
                    .filter(Boolean)
                    .join(", ");

                if (query.length < 10) return;

                try {
                    const res = await fetch(
                        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=1`
                    );
                    const data = await res.json();
                    if (data && data[0]) {
                        const lat = parseFloat(data[0].lat);
                        const lon = parseFloat(data[0].lon);
                        setForm(prev => ({
                            ...prev,
                            latitude: lat,
                            longitude: lon,
                            location: query // Update visual location string
                        }));
                    }
                } catch (err) {
                    console.error("Geocoding error:", err);
                }
            }, 1000),
        []
    );

    useEffect(() => {
        if (form.state || form.district || form.pincode || form.address) {
            geocodeAddress(form);
        }
    }, [form.state, form.district, form.pincode, form.address, geocodeAddress]);

    // Image handling
    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files || []);
        const valid = files.filter((f) => f.type.startsWith("image/") && f.size <= 10 * 1024 * 1024);
        setImageFiles((prev) => [...prev, ...valid]);

        valid.forEach((f) => {
            const reader = new FileReader();
            reader.onload = (ev) => {
                setImagePreviews((prev) => [...prev, ev.target?.result as string]);
            };
            reader.readAsDataURL(f);
        });
    };

    const removeImage = (idx: number) => {
        setImageFiles((prev) => prev.filter((_, i) => i !== idx));
        setImagePreviews((prev) => prev.filter((_, i) => i !== idx));
    };

    const handleCameraCapture = (file: File) => {
        setImageFiles((prev) => [...prev, file]);
        const reader = new FileReader();
        reader.onload = (ev) => {
            setImagePreviews((prev) => [...prev, ev.target?.result as string]);
        };
        reader.readAsDataURL(file);
    };

    // Audio recording
    const startRecording = async () => {
        setError("");
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            const mr = new MediaRecorder(stream);
            const chunks: BlobPart[] = [];
            mr.ondataavailable = (e) => chunks.push(e.data);
            mr.onstop = () => {
                const blob = new Blob(chunks, { type: "audio/webm" });
                setAudioBlob(blob);
                stream.getTracks().forEach((t) => t.stop());
            };
            mr.start();
            setMediaRecorder(mr);
            setRecording(true);
        } catch (err: any) {
            console.error("Audio access error:", err);
            if (err.name === "NotAllowedError" || err.name === "PermissionDeniedError") {
                setError("Microphone access denied by user. Please enable it in browser settings to record audio.");
            } else {
                setError("Microphone access failed. It might be in use by another application or unavailable on this device.");
            }
        }
    };

    const stopRecording = () => {
        mediaRecorder?.stop();
        setRecording(false);
    };

    // Live GPS Location
    const requestLiveLocation = () => {
        if (!navigator.geolocation) {
            setGpsError("Geolocation is not supported by your browser.");
            return;
        }
        setGpsLoading(true);
        setGpsError("");
        navigator.geolocation.getCurrentPosition(
            async (pos) => {
                const lat = pos.coords.latitude;
                const lng = pos.coords.longitude;
                // Update coordinates immediately
                setForm(prev => ({ ...prev, latitude: lat, longitude: lng }));
                // Reverse geocode with Nominatim
                try {
                    const res = await fetch(
                        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&addressdetails=1`
                    );
                    const data = await res.json();
                    const addr = data.address || {};
                    const road = addr.road || addr.pedestrian || addr.residential || "";
                    const suburb = addr.suburb || addr.neighbourhood || "";
                    const pincode = addr.postcode || "";
                    const city = addr.city || addr.town || addr.village || "";
                    const stateRaw: string = addr.state || "";
                    const district = addr.county || addr.state_district || city || "";

                    // Try to match state against our known list
                    const knownStates = Object.keys(INDIA_STATES_DISTRICTS);
                    const matchedState = knownStates.find(s =>
                        s.toLowerCase() === stateRaw.toLowerCase()
                    ) || "";

                    // Try to match district
                    const knownDistricts = matchedState ? INDIA_STATES_DISTRICTS[matchedState] || [] : [];
                    const matchedDistrict = knownDistricts.find(d =>
                        d.toLowerCase() === district.toLowerCase() ||
                        d.toLowerCase().includes(district.toLowerCase()) ||
                        district.toLowerCase().includes(d.toLowerCase())
                    ) || "";

                    const fullAddress = [road, suburb, city].filter(Boolean).join(", ");

                    setForm(prev => ({
                        ...prev,
                        latitude: lat,
                        longitude: lng,
                        state: matchedState || prev.state,
                        district: matchedDistrict || prev.district,
                        pincode: pincode || prev.pincode,
                        address: fullAddress || prev.address,
                        location: data.display_name || prev.location,
                    }));
                } catch {
                    // Coords are set even if reverse geocode fails
                }
                setGpsLoading(false);
            },
            (err) => {
                setGpsLoading(false);
                if (err.code === 1) {
                    setGpsError("Location permission denied. Please allow location access in your browser settings.");
                } else if (err.code === 2) {
                    setGpsError("Location unavailable. Ensure GPS is enabled on your device.");
                } else {
                    setGpsError("Location request timed out. Please try again.");
                }
            },
            { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
        );
    };

    // Submit
    const handleSubmit = async () => {
        setError("");
        setSubmitting(true);

        try {
            // Check duplicates first
            const dupCheck = await api.checkDuplicate({
                title: form.description.slice(0, 50),
                description: form.description,
                category: form.category,
                location: { lat: form.latitude, lng: form.longitude },
                address: form.address
            });
            if (dupCheck.length > 0) {
                setDuplicates(dupCheck.map(d => ({
                    id: d.id,
                    description: d.description || "Similar grievance",
                    similarity_score: d.similarity,
                    status: d.status || "pending"
                })));
                setShowDuplicateModal(true);
                setSubmitting(false);
                return;
            }
            await doSubmit();
        } catch (err: unknown) {
            const apiErr = err as { detail?: string };
            setError(apiErr.detail || "Submission failed. Please try again.");
            setSubmitting(false);
        }
    };

    const doSubmit = async () => {
        try {
            // 1. Upload media first
            const media_urls: string[] = [];
            for (const file of imageFiles) {
                const uploaded = await api.uploadMedia(file);
                media_urls.push(uploaded.url);
            }
            if (audioBlob) {
                const audioFile = new File([audioBlob], "recording.webm", { type: "audio/webm" });
                const uploaded = await api.uploadMedia(audioFile);
                media_urls.push(uploaded.url);
            }

            // 2. Submit as JSON
            const res = await api.submitGrievance({
                title: form.description.slice(0, 50),
                description: form.description,
                category: form.category,
                location: { lat: form.latitude, lng: form.longitude },
                address: form.address,
                media_urls
            });

            setComplaintId(res.id);
            setShowSuccess(true);
            setShowDuplicateModal(false);
            localStorage.removeItem("grievance_draft");
        } catch (err: unknown) {
            const apiErr = err as { detail?: string };
            setError(apiErr.detail || "Submission failed.");
        } finally {
            setSubmitting(false);
        }
    };

    const validateStep = (s: number): boolean => {
        switch (s) {
            case 1: return (
                form.description.length >= 20 &&
                form.category !== "" &&
                form.state !== "" &&
                form.district !== "" &&
                form.pincode.length === 6 &&
                form.address !== ""
            );
            case 2: return true;
            case 3: return form.name.trim() !== "" && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email);
            default: return true;
        }
    };

    const STEPS = ["DESCRIPTION", "EVIDENCE", "DETAILS", "REVIEW"];

    return (
        <div className="min-h-screen bg-portal-bg py-12">
            <div className="max-w-7xl mx-auto px-4">
                {/* Header Section */}
                <div className="bg-white border-t-4 border-accent-saffron shadow-sm p-6 mb-8 flex flex-col md:flex-row justify-between items-center gap-4">
                    <div>
                        <h1 className="text-2xl font-black text-primary-600 tracking-tighter uppercase">LODGE PUBLIC GRIEVANCE</h1>
                        <p className="text-[11px] font-bold text-gray-500 uppercase tracking-widest mt-1">Submit your grievance for official redressal</p>
                    </div>
                    <div className="flex gap-2">
                        <button onClick={() => router.push('/')} className="px-4 py-2 bg-gray-100 text-[10px] font-black uppercase text-gray-600 hover:bg-gray-200 transition-all">HOME</button>
                        <button onClick={() => router.push('/help')} className="px-4 py-2 bg-primary-50 text-[10px] font-black uppercase text-primary-600 hover:bg-primary-100 transition-all">USER MANUAL</button>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                    {/* Left Sidebar: Instructions */}
                    <div className="lg:col-span-1">
                        <div className="bg-white border border-gray-200 shadow-sm sticky top-24 overflow-hidden">
                            <div className="bg-primary-600 text-white p-4">
                                <h3 className="text-xs font-black uppercase tracking-widest">IMPORTANT INSTRUCTIONS</h3>
                            </div>
                            <div className="p-5 space-y-4">
                                {INSTRUCTIONS.map((text, i) => (
                                    <div key={i} className="flex gap-3">
                                        <div className="w-1.5 h-1.5 rounded-full bg-accent-saffron mt-1.5 shrink-0" />
                                        <p className="text-[11px] font-bold text-gray-600 leading-relaxed uppercase">{text}</p>
                                    </div>
                                ))}
                            </div>
                            <div className="bg-gray-50 p-4 border-t border-gray-100">
                                <p className="text-[9px] font-black text-gray-400 uppercase italic">All fields marked with (*) are mandatory.</p>
                            </div>
                        </div>
                    </div>

                    {/* Main Content: Form */}
                    <div className="lg:col-span-3">
                        <div className="bg-white border border-gray-200 shadow-lg overflow-hidden">
                            {/* Step Indicators (Horizontal) */}
                            <div className="bg-gray-50 border-b border-gray-200 flex overflow-x-auto no-scrollbar">
                                {STEPS.map((label, i) => (
                                    <div key={label} className={`flex-1 min-w-[120px] px-4 py-4 flex items-center justify-center gap-3 border-r border-gray-200 last:border-0 relative ${step === i + 1 ? "bg-white" : ""}`}>
                                        <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-black ${i + 1 <= step ? "bg-primary-600 text-white" : "bg-gray-200 text-gray-500"}`}>
                                            {i + 1 < step ? "✓" : i + 1}
                                        </div>
                                        <span className={`text-[10px] font-black tracking-widest uppercase ${i + 1 === step ? "text-primary-600" : "text-gray-400"}`}>{label}</span>
                                        {step === i + 1 && <div className="absolute bottom-0 left-0 w-full h-[3px] bg-accent-saffron" />}
                                    </div>
                                ))}
                            </div>

                            <div className="p-8">
                                {error && (
                                    <div className="mb-8 p-4 bg-red-50 border-l-4 border-red-600 text-red-700 text-[11px] font-black uppercase tracking-wide">
                                        ERROR: {typeof error === 'object' ? JSON.stringify(error) : error}
                                    </div>
                                )}

                                {/* Form Body */}
                                <div className="animate-fade-in min-h-[400px]">
                                    {step === 1 && (
                                        <div className="space-y-8">
                                            <div className="bg-primary-50/50 border border-primary-100 p-6 rounded-sm">
                                                <h4 className="text-[10px] font-black text-primary-600 uppercase tracking-widest mb-4">AI ANALYSIS PREVIEW</h4>
                                                {classification ? (
                                                    <div className="space-y-4">
                                                        {classification.domains && classification.domains.length > 1 ? (
                                                            <div className="space-y-3">
                                                                <p className="text-[9px] font-bold text-emerald-600 uppercase tracking-widest flex items-center gap-2">
                                                                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                                                                    Multi-Domain Detected
                                                                </p>
                                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                                                    {classification.domains.map((domain, idx) => (
                                                                        <div key={idx} className={`p-3 rounded-sm border ${domain.is_primary ? 'bg-primary-600 border-primary-700 shadow-md transform scale-[1.02]' : 'bg-white border-primary-100'}`}>
                                                                            <div className="flex justify-between items-start mb-1">
                                                                                <p className={`text-[8px] font-bold uppercase leading-none ${domain.is_primary ? 'text-primary-100' : 'text-gray-400'}`}>{domain.category}</p>
                                                                                {domain.is_primary && (
                                                                                    <span className="text-[8px] font-black bg-accent-gold text-primary-900 px-1.5 py-0.5 rounded-full tracking-tighter uppercase leading-none transform -translate-y-1">PRIMARY</span>
                                                                                )}
                                                                            </div>
                                                                            <p className={`text-[11px] font-black uppercase mt-1 ${domain.is_primary ? 'text-white' : 'text-primary-800'}`}>{domain.department}</p>
                                                                        </div>
                                                                    ))}
                                                                </div>
                                                            </div>
                                                        ) : (
                                                            <div className="grid grid-cols-2 gap-4">
                                                                <div>
                                                                    <p className="text-[9px] font-bold text-gray-400 uppercase">Detection</p>
                                                                    <p className="text-sm font-black text-primary-800 uppercase leading-none mt-1">{classification.detected_category}</p>
                                                                </div>
                                                                <div>
                                                                    <p className="text-[9px] font-bold text-gray-400 uppercase">Department</p>
                                                                    <p className="text-sm font-black text-primary-800 uppercase leading-none mt-1">{classification.department}</p>
                                                                </div>
                                                            </div>
                                                        )}
                                                        <p className="text-[10px] text-primary-600 font-bold uppercase tracking-wide leading-tight px-3 py-1.5 bg-primary-100/50 rounded-sm inline-block">
                                                            {classification.explanation}
                                                        </p>
                                                    </div>
                                                ) : (
                                                    <p className="text-[11px] text-gray-400 font-bold uppercase italic">{classifying ? "Analysing text..." : "Start typing to see AI analysis"}</p>
                                                )}
                                            </div>

                                            <div>
                                                <label className="text-[11px] font-black text-gray-600 uppercase tracking-wider block mb-3">Grievance Description*</label>
                                                <textarea
                                                    value={form.description}
                                                    onChange={(e) => handleDescriptionChange(e.target.value)}
                                                    rows={8}
                                                    className="w-full p-4 border-2 border-gray-200 rounded-sm focus:border-primary-600 focus:outline-none text-sm font-medium leading-relaxed bg-gray-50/30"
                                                    placeholder="Enter your grievance description (minimum 20 characters)..."
                                                />
                                                <div className="mt-2 flex justify-between items-center">
                                                    <span className={`text-[10px] font-black uppercase ${form.description.length < 20 ? "text-amber-600" : "text-emerald-600"}`}>
                                                        {form.description.length} / 20 CHARACTERS
                                                    </span>
                                                </div>
                                            </div>

                                            {/* ── Location Mode Toggle ─────────────────── */}
                                            <div>
                                                <label className="text-[11px] font-black text-gray-600 uppercase tracking-wider block mb-3">Location*</label>

                                                {/* Mode Selector */}
                                                <div className="grid grid-cols-2 gap-3 mb-5">
                                                    <button
                                                        type="button"
                                                        onClick={() => { setLocationMode("auto"); setGpsError(""); }}
                                                        className={`flex items-center gap-3 p-4 border-2 rounded-sm transition-all ${locationMode === "auto"
                                                            ? "border-blue-600 bg-blue-50 text-blue-700"
                                                            : "border-gray-200 bg-white text-gray-500 hover:border-gray-300"
                                                            }`}
                                                    >
                                                        <span className="text-2xl">🛰️</span>
                                                        <div className="text-left">
                                                            <p className="text-[11px] font-black uppercase tracking-wide">Auto GPS</p>
                                                            <p className="text-[9px] font-bold mt-0.5 opacity-70">USE LIVE LOCATION</p>
                                                        </div>
                                                        {locationMode === "auto" && <span className="ml-auto text-blue-600 font-black">✓</span>}
                                                    </button>

                                                    <button
                                                        type="button"
                                                        onClick={() => setLocationMode("manual")}
                                                        className={`flex items-center gap-3 p-4 border-2 rounded-sm transition-all ${locationMode === "manual"
                                                            ? "border-primary-600 bg-primary-50 text-primary-700"
                                                            : "border-gray-200 bg-white text-gray-500 hover:border-gray-300"
                                                            }`}
                                                    >
                                                        <span className="text-2xl">✍️</span>
                                                        <div className="text-left">
                                                            <p className="text-[11px] font-black uppercase tracking-wide">Manual</p>
                                                            <p className="text-[9px] font-bold mt-0.5 opacity-70">ENTER ADDRESS</p>
                                                        </div>
                                                        {locationMode === "manual" && <span className="ml-auto text-primary-600 font-black">✓</span>}
                                                    </button>
                                                </div>

                                                {/* ── AUTO GPS MODE ──── */}
                                                {locationMode === "auto" && (
                                                    <div className="space-y-4">
                                                        <div className="flex items-center gap-4 p-4 bg-blue-50 border border-blue-200 rounded-sm">
                                                            <button
                                                                type="button"
                                                                onClick={requestLiveLocation}
                                                                disabled={gpsLoading}
                                                                className="flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white text-[10px] font-black uppercase tracking-widest rounded-sm transition-all shrink-0"
                                                            >
                                                                {gpsLoading ? (
                                                                    <><span className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" /> DETECTING...</>
                                                                ) : (
                                                                    <>📍 DETECT MY LOCATION</>
                                                                )}
                                                            </button>
                                                            <div>
                                                                <p className="text-[11px] font-black text-blue-800">
                                                                    {gpsLoading ? "Requesting GPS permission..." : form.address ? "✓ Location detected" : "Click to detect your precise location"}
                                                                </p>
                                                                {form.address && !gpsLoading && (
                                                                    <p className="text-[10px] text-blue-600 font-bold mt-1 line-clamp-1">{form.address}{form.district ? `, ${form.district}` : ""}{form.state ? `, ${form.state}` : ""}</p>
                                                                )}
                                                            </div>
                                                        </div>
                                                        {gpsError && (
                                                            <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-[10px] font-bold rounded-sm">⚠️ {gpsError}</div>
                                                        )}
                                                        {/* Show auto-filled fields read-only */}
                                                        {(form.state || form.address) && (
                                                            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                                                {[{ label: "State", value: form.state }, { label: "District", value: form.district }, { label: "Pincode", value: form.pincode }, { label: "Address", value: form.address }].map(f => (
                                                                    <div key={f.label} className="p-3 bg-white border border-gray-200 rounded-sm">
                                                                        <p className="text-[9px] font-black text-gray-400 uppercase">{f.label}</p>
                                                                        <p className="text-[11px] font-bold text-gray-800 mt-1 line-clamp-2">{f.value || "—"}</p>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        )}
                                                    </div>
                                                )}

                                                {/* ── MANUAL MODE ──── */}
                                                {locationMode === "manual" && (
                                                    <div className="space-y-6">
                                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                            <div>
                                                                <label className="text-[11px] font-black text-gray-500 uppercase tracking-wider block mb-2">State*</label>
                                                                <select
                                                                    value={form.state}
                                                                    onChange={(e) => setForm(prev => ({ ...prev, state: e.target.value, district: "" }))}
                                                                    className="w-full p-3 border-2 border-gray-200 rounded-sm focus:border-primary-600 text-sm font-bold bg-white"
                                                                >
                                                                    <option value="">-- SELECT STATE --</option>
                                                                    {Object.keys(INDIA_STATES_DISTRICTS).sort().map(s => (
                                                                        <option key={s} value={s}>{s.toUpperCase()}</option>
                                                                    ))}
                                                                </select>
                                                            </div>
                                                            <div>
                                                                <label className="text-[11px] font-black text-gray-500 uppercase tracking-wider block mb-2">District*</label>
                                                                <select
                                                                    value={form.district}
                                                                    onChange={(e) => update("district", e.target.value)}
                                                                    className="w-full p-3 border-2 border-gray-200 rounded-sm focus:border-primary-600 text-sm font-bold bg-white"
                                                                    disabled={!form.state}
                                                                >
                                                                    <option value="">-- SELECT DISTRICT --</option>
                                                                    {form.state && INDIA_STATES_DISTRICTS[form.state]?.sort().map(d => (
                                                                        <option key={d} value={d}>{d.toUpperCase()}</option>
                                                                    ))}
                                                                </select>
                                                            </div>
                                                        </div>
                                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                            <div>
                                                                <label className="text-[11px] font-black text-gray-500 uppercase tracking-wider block mb-2">Pincode*</label>
                                                                <input value={form.pincode} onChange={(e) => update("pincode", e.target.value)} type="text" className="w-full p-3 border-2 border-gray-200 rounded-sm focus:border-primary-600 text-sm font-bold bg-white" placeholder="######" maxLength={6} />
                                                            </div>
                                                            <div>
                                                                <label className="text-[11px] font-black text-gray-500 uppercase tracking-wider block mb-2">House / Street Address*</label>
                                                                <input value={form.address} onChange={(e) => update("address", e.target.value)} type="text" className="w-full p-3 border-2 border-gray-200 rounded-sm focus:border-primary-600 text-sm font-bold bg-white" placeholder="e.g. PLOT NO 5, SECTOR 10" />
                                                            </div>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>

                                            {/* ── Map (always visible) ──── */}
                                            <div>
                                                <label className="text-[11px] font-black text-gray-600 uppercase tracking-wider block mb-4">Pin Location on Map</label>
                                                <div className="border-4 border-gray-100 rounded-sm overflow-hidden">
                                                    <LocationMap
                                                        latitude={form.latitude}
                                                        longitude={form.longitude}
                                                        onLocationChange={(lat, lng) => {
                                                            update("latitude", lat);
                                                            update("longitude", lng);
                                                        }}
                                                    />
                                                </div>
                                                <p className="text-[9px] font-black text-gray-400 mt-2 uppercase">
                                                    LAT: {form.latitude.toFixed(6)} | LNG: {form.longitude.toFixed(6)}
                                                    {gpsLoading && <span className="ml-3 text-blue-500 animate-pulse">● ACQUIRING GPS...</span>}
                                                </p>
                                            </div>
                                        </div>
                                    )}

                                    {step === 2 && (
                                        <div className="space-y-12">
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                <div className="border-2 border-dashed border-gray-300 p-8 text-center bg-gray-50/50 hover:bg-gray-50 transition-all rounded-sm group">
                                                    <input type="file" multiple accept="image/*" onChange={handleImageUpload} className="hidden" id="imgs" />
                                                    <label htmlFor="imgs" className="cursor-pointer block">
                                                        <div className="text-4xl mb-3 group-hover:scale-110 transition-transform">📁</div>
                                                        <p className="text-[10px] font-black text-gray-700 uppercase tracking-widest">Upload Images</p>
                                                        <p className="inline-block mt-4 px-6 py-2 bg-primary-600 text-white text-[9px] font-black uppercase rounded-sm">SELECT FILES</p>
                                                    </label>
                                                </div>

                                                <div className="border-2 border-dashed border-gray-300 p-8 text-center bg-gray-50/50 hover:bg-gray-50 transition-all rounded-sm group">
                                                    <button onClick={() => setShowCamera(true)} className="w-full h-full cursor-pointer block">
                                                        <div className="text-4xl mb-3 group-hover:scale-110 transition-transform">📸</div>
                                                        <p className="text-[10px] font-black text-gray-700 uppercase tracking-widest">Take Photo</p>
                                                        <p className="inline-block mt-4 px-6 py-2 bg-accent-gold text-primary-900 text-[9px] font-black uppercase rounded-sm">OPEN CAMERA</p>
                                                    </button>
                                                </div>
                                            </div>

                                            {imagePreviews.length > 0 && (
                                                <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-4">
                                                    {imagePreviews.map((src, i) => (
                                                        <div key={i} className="relative aspect-square border-2 border-gray-200 p-1 rounded-sm">
                                                            <img src={src} className="w-full h-full object-cover" />
                                                            <button onClick={() => removeImage(i)} className="absolute -top-2 -right-2 w-6 h-6 bg-red-600 text-white flex items-center justify-center font-black rounded-sm shadow-lg">✕</button>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}

                                            <div className="pt-8 border-t border-gray-100 flex flex-col md:flex-row items-center justify-between gap-6">
                                                <div className="text-center md:text-left">
                                                    <h4 className="text-[11px] font-black text-gray-600 uppercase tracking-wider mb-1">Audio Evidence</h4>
                                                    <p className="text-[10px] font-bold text-gray-400 uppercase">Record voice description (Optional)</p>
                                                </div>
                                                <div className="flex items-center gap-4">
                                                    {!recording ? (
                                                        <button onClick={startRecording} className="px-6 py-3 bg-white border-2 border-red-600 text-red-600 text-[10px] font-black uppercase tracking-widest hover:bg-red-600 hover:text-white transition-all flex items-center gap-2">
                                                            <div className="w-2 h-2 rounded-full bg-red-600 animate-pulse" /> START RECORDING
                                                        </button>
                                                    ) : (
                                                        <button onClick={stopRecording} className="px-6 py-3 bg-red-600 text-white text-[10px] font-black uppercase tracking-widest animate-pulse flex items-center gap-2">
                                                            <div className="w-2 h-2 bg-white" /> STOP RECORDING
                                                        </button>
                                                    )}
                                                    {audioBlob && (
                                                        <div className="px-4 py-2 bg-emerald-50 border border-emerald-200 text-emerald-700 text-[10px] font-bold uppercase flex items-center gap-2">
                                                            ✓ READY • {(audioBlob.size / 1024).toFixed(0)} KB
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {step === 3 && (
                                        <div className="space-y-8 max-w-2xl mx-auto">
                                            <div className="bg-amber-50 border-l-4 border-accent-saffron p-5">
                                                <p className="text-[11px] font-black text-amber-800 uppercase leading-relaxed">Official communication will be sent to the registered email and phone number on your account.</p>
                                            </div>

                                            {/* Read-only profile display */}
                                            <div className="border border-gray-200 rounded-sm overflow-hidden">
                                                <div className="bg-gray-50 border-b border-gray-200 px-5 py-3 flex items-center gap-2">
                                                    <span className="text-base">👤</span>
                                                    <p className="text-[10px] font-black text-gray-600 uppercase tracking-widest">Submitter Profile</p>
                                                </div>
                                                <div className="divide-y divide-gray-100">
                                                    <div className="flex items-center gap-5 px-5 py-4">
                                                        <p className="text-[10px] font-black text-gray-400 uppercase w-28 shrink-0">Full Name</p>
                                                        <p className="text-sm font-bold text-gray-900 uppercase">{currUser?.full_name || currUser?.name || "—"}</p>
                                                    </div>
                                                    <div className="flex items-center gap-5 px-5 py-4">
                                                        <p className="text-[10px] font-black text-gray-400 uppercase w-28 shrink-0">Email</p>
                                                        <p className="text-sm font-bold text-primary-700">{currUser?.email || "—"}</p>
                                                    </div>
                                                    <div className="flex items-center gap-5 px-5 py-4">
                                                        <p className="text-[10px] font-black text-gray-400 uppercase w-28 shrink-0">Phone</p>
                                                        {currUser?.phone ? (
                                                            <p className="text-sm font-bold text-gray-900">{currUser.phone}</p>
                                                        ) : (
                                                            <input
                                                                value={form.phone}
                                                                onChange={(e) => update("phone", e.target.value)}
                                                                type="tel"
                                                                className="flex-1 p-2 border border-gray-200 rounded-sm text-sm font-bold focus:border-primary-600 focus:outline-none"
                                                                placeholder="+91 XXXXXXXXXX"
                                                            />
                                                        )}
                                                    </div>
                                                </div>
                                                <div className="bg-blue-50 border-t border-blue-100 px-5 py-3">
                                                    <p className="text-[9px] font-black text-blue-600 uppercase tracking-wide">ℹ️ These details are pulled from your registered account and cannot be changed here.</p>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {step === 4 && (
                                        <div className="space-y-10">
                                            <div className="border-b-2 border-gray-100 pb-6 flex items-center justify-between">
                                                <h3 className="text-lg font-black text-gray-900 tracking-tighter uppercase">Review Official Submission</h3>
                                                <div className="px-3 py-1 bg-primary-600 text-white text-[10px] font-black rounded-sm uppercase">Verification Mode</div>
                                            </div>

                                            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                                                <div className="md:col-span-2 space-y-8">
                                                    <div className="space-y-2">
                                                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">DESCRIPTION</p>
                                                        <p className="text-sm font-medium text-gray-800 leading-relaxed p-5 bg-gray-50 border border-gray-100 rounded-sm">{form.description}</p>
                                                    </div>
                                                    <div className="grid grid-cols-2 gap-6">
                                                        <div className="space-y-2">
                                                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">CATEGORY</p>
                                                            <p className="text-xs font-black text-primary-600 uppercase p-3 bg-primary-50 border border-primary-100 rounded-sm">{form.category}</p>
                                                        </div>
                                                        <div className="space-y-2">
                                                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">LOCATION DETAILS</p>
                                                            <div className="text-xs font-bold text-gray-700 p-3 bg-gray-50 border border-gray-100 rounded-sm space-y-1">
                                                                <p className="uppercase"><span className="text-gray-400 font-black">ADDRESS:</span> {form.address}</p>
                                                                <p className="uppercase"><span className="text-gray-400 font-black">DISTRICT:</span> {form.district}</p>
                                                                <p className="uppercase"><span className="text-gray-400 font-black">STATE:</span> {form.state} - {form.pincode}</p>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="space-y-6 bg-gray-50/50 p-6 border border-gray-100 rounded-sm">
                                                    <h4 className="text-[10px] font-black text-primary-600 border-b border-primary-100 pb-2 uppercase tracking-widest">AI SUMMARY</h4>
                                                    {classification && (
                                                        <div className="space-y-4">
                                                            <div>
                                                                <p className="text-[8px] font-bold text-gray-400 uppercase">PROPOSED DEPT.</p>
                                                                <p className="text-xs font-black text-gray-800 uppercase">{classification.department}</p>
                                                            </div>
                                                            <div>
                                                                <p className="text-[8px] font-bold text-gray-400 uppercase">PRIORITY LEVEL</p>
                                                                <span className={`inline-block px-2 py-0.5 text-[8px] font-black uppercase rounded-sm mt-1 ${classification.priority === 'urgent' ? 'bg-red-600 text-white' : 'bg-amber-500 text-white'}`}>{classification.priority}</span>
                                                            </div>
                                                            <div>
                                                                <p className="text-[8px] font-bold text-gray-400 uppercase">ROUTING STATUS</p>
                                                                <p className="text-xs font-black text-emerald-600">VERIFIED BY AI</p>
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>

                                            <div className="p-6 bg-primary-600/5 border border-primary-600/10 rounded-sm">
                                                <div className="flex items-center gap-3 mb-4">
                                                    <div className="w-1.5 h-6 bg-primary-600" />
                                                    <h4 className="text-[10px] font-black text-primary-600 uppercase tracking-widest">SUBMITTER INFORMATION</h4>
                                                </div>
                                                <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                                                    <div>
                                                        <p className="text-[8px] font-bold text-gray-400 uppercase">NAME</p>
                                                        <p className="text-xs font-black text-gray-800 uppercase">{form.name}</p>
                                                    </div>
                                                    <div>
                                                        <p className="text-[8px] font-bold text-gray-400 uppercase">EMAIL</p>
                                                        <p className="text-xs font-black text-gray-800">{form.email}</p>
                                                    </div>
                                                    <div>
                                                        <p className="text-[8px] font-bold text-gray-400 uppercase">PHONE</p>
                                                        <p className="text-xs font-black text-gray-800">{form.phone || 'N/A'}</p>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* Action Buttons */}
                                <div className="mt-12 pt-8 border-t-2 border-gray-100 flex justify-between items-center">
                                    <button
                                        onClick={() => step > 1 ? setStep(step - 1) : router.push('/')}
                                        className="px-8 py-3 bg-white border-2 border-gray-200 text-gray-600 text-[10px] font-black uppercase tracking-widest hover:border-primary-600 hover:text-primary-600 transition-all rounded-sm"
                                    >
                                        {step === 1 ? 'CANCEL' : 'BACK'}
                                    </button>

                                    {step < 4 ? (
                                        <button
                                            onClick={() => setStep(step + 1)}
                                            disabled={!validateStep(step)}
                                            className="px-10 py-3 bg-primary-600 text-white text-[10px] font-black uppercase tracking-widest hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all rounded-sm shadow-xl"
                                        >
                                            CONTINUE TO STEP {step + 1}
                                        </button>
                                    ) : (
                                        <button
                                            onClick={handleSubmit}
                                            disabled={submitting}
                                            className="px-12 py-3 bg-accent-saffron text-primary-900 text-[10px] font-black uppercase tracking-widest hover:bg-white border-2 border-accent-saffron transition-all rounded-sm shadow-xl"
                                        >
                                            {submitting ? 'PROCESSING...' : 'OFFICIAL SUBMISSION'}
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Duplicate Modal */}
            {showDuplicateModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-primary-900/60 backdrop-blur-sm p-4">
                    <div className="bg-white rounded-sm max-w-lg w-full shadow-2xl overflow-hidden animate-slide-up">
                        <div className="bg-amber-500 text-white p-4 font-black text-xs uppercase tracking-widest flex items-center justify-between">
                            POTENTIAL DUPLICATE DETECTED
                            <button onClick={() => setShowDuplicateModal(false)}>✕</button>
                        </div>
                        <div className="p-6">
                            <p className="text-[11px] font-bold text-gray-600 uppercase leading-relaxed mb-6">
                                Our AI system has detected similar grievances already registered. Please review them before proceeding to avoid redundant filings.
                            </p>
                            <div className="space-y-4 mb-8 overflow-y-auto max-h-60">
                                {duplicates.map(d => (
                                    <div key={d.id} className="p-4 bg-gray-50 border border-gray-200 rounded-sm">
                                        <div className="flex justify-between items-center mb-2">
                                            <span className="text-[10px] font-black text-primary-600 uppercase">GRIEVANCE #{d.id}</span>
                                            <span className="text-[9px] font-black text-amber-600 uppercase">{Math.round(d.similarity_score * 100)}% MATCH</span>
                                        </div>
                                        <p className="text-[11px] text-gray-600 line-clamp-2 italic">&quot;{d.description}&quot;</p>
                                    </div>
                                ))}
                            </div>
                            <div className="flex gap-4">
                                <button onClick={() => setShowDuplicateModal(false)} className="flex-1 py-3 border-2 border-gray-200 text-[10px] font-black uppercase tracking-widest rounded-sm">GO BACK</button>
                                <button onClick={doSubmit} className="flex-1 py-3 bg-amber-500 text-white text-[10px] font-black uppercase tracking-widest rounded-sm shadow-lg">SUBMIT ANYWAY</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Success Modal */}
            {showSuccess && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-primary-900/80 backdrop-blur-md p-4">
                    <div className="bg-white rounded-sm max-w-md w-full shadow-2xl p-10 text-center border-t-8 border-accent-green">
                        <div className="w-20 h-20 bg-accent-green/10 text-accent-green rounded-full flex items-center justify-center mx-auto mb-6 text-4xl">✓</div>
                        <h3 className="text-2xl font-black text-gray-900 tracking-tighter uppercase mb-2">SUCCESSFULLY LODGED</h3>
                        <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-8">Your public grievance has been registered</p>

                        <div className="bg-gray-50 p-6 border border-gray-100 rounded-sm mb-10">
                            <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">REFERENCE REGISTRATION NUMBER</p>
                            <p className="text-2xl font-black text-primary-600 tracking-tighter uppercase">{complaintId}</p>
                        </div>

                        <div className="flex flex-col gap-3">
                            <button onClick={() => router.push('/track-status')} className="w-full py-4 bg-primary-600 text-white text-[10px] font-black uppercase tracking-widest rounded-sm shadow-xl">VIEW STATUS / TRACKING</button>
                            <button onClick={() => router.push('/')} className="w-full py-4 border-2 border-gray-200 text-gray-500 text-[10px] font-black uppercase tracking-widest rounded-sm">BACK TO PORTAL HOME</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Camera Overlay */}
            {showCamera && (
                <CameraOverlay
                    onCapture={handleCameraCapture}
                    onClose={() => setShowCamera(false)}
                />
            )}
        </div>
    );
}
