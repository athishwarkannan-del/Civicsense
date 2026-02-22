// Dynamically resolve the backend host so the app works both on localhost
// and from any other device on the same LAN (e.g. 192.168.0.181).
const _backendHost =
    typeof window !== "undefined" ? window.location.hostname : "localhost";
export const API_BASE = process.env.NEXT_PUBLIC_API_URL || `http://${_backendHost}:8000`;

/* ─── Types ──────────────────────────────────────────────── */

export interface User {
    id: string;
    full_name: string;
    email: string;
    role: "user" | "admin" | "super_admin";
    phone?: string;
}

export interface AuthResponse {
    access_token: string;
    token_type: string;
    user: User;
}

export interface Grievance {
    id: string;
    title: string;
    description: string;
    category: string;
    address: string;
    location: { lat: number; lng: number };
    status: "pending" | "assigned" | "in_progress" | "resolved" | "rejected";
    priority: "low" | "medium" | "high" | "urgent";
    department: string;
    department_suggested?: string;
    department_confirmed?: string;
    user_email: string;
    media_urls: string[];
    remarks?: string;
    assigned_officer?: string;
    officer_suggested?: string;
    officer_confirmed?: string;
    assignment_status?: string;
    ai_explanation?: string;
    keywords_found?: string[];
    priority_score?: number;
    importance_pct?: number;
    importance_dimensions?: Record<string, number>;
    created_at: string;
    updated_at: string;
    timeline?: TimelineEvent[];
}

export interface TimelineEvent {
    status: string;
    header: string;
    description: string;
    remarks?: string;
    timestamp: string;
    created_by?: string;
}

export type TeamMember = UserRecord;

export interface ClassificationResult {
    detected_category: string;
    department: string;
    priority: string;
    explanation: string;
    keywords_found: string[];
    domains?: {
        category: string;
        department: string;
        officer: string;
        is_primary?: boolean;
    }[];
    all_categories?: string[];
    all_departments?: string[];
}

export interface DuplicateCheckResult {
    id: string;
    similarity: number;
    title: string;
    similarity_score?: number; // compat
    status?: string; // compat
    description?: string; // compat
}

export interface UserRecord {
    _id: string;
    id?: string; // for compatibility
    email: string;
    full_name: string;
    role: "user" | "admin" | "super_admin";
    department?: string;
    created_at: string;
    grievance_count: number;
}

export interface AdminStats {
    total_grievances: number;
    pending: number;
    pending_confirmation?: number;
    in_progress: number;
    resolved: number;
    rejected: number;
    avg_resolution_time: number;
    department_wise: Record<string, number>;
    priority_distribution: Record<string, number>;
    monthly_trend: { month: string; count: number }[];
    // Extended fields from /overview
    trend?: { date: string; count: number }[];
    by_priority?: Record<string, number>;
    by_department?: { department: string; count: number }[];
    by_status?: Record<string, number>;
    pending_ai_confirmation?: number;
}

export interface ApiError {
    detail: string;
    status: number;
}

export interface ChatMessage {
    role: "user" | "assistant";
    content: string;
}

/* ─── Helpers ────────────────────────────────────────────── */

function getToken(): string | null {
    if (typeof window === "undefined") return null;
    return localStorage.getItem("token");
}

function getHeaders(hasBody: boolean = false): HeadersInit {
    const headers: HeadersInit = {};
    const token = getToken();
    if (token) {
        headers["Authorization"] = `Bearer ${token}`;
    }
    if (hasBody) {
        headers["Content-Type"] = "application/json";
    }
    return headers;
}

async function handleResponse<T>(res: Response): Promise<T> {
    if (res.status === 401) {
        if (typeof window !== "undefined") {
            localStorage.removeItem("token");
            localStorage.removeItem("user");
            window.location.href = "/login";
        }
        throw { detail: "Session expired. Please login again.", status: 401 } as ApiError;
    }

    if (!res.ok) {
        const body = await res.json().catch(() => ({ detail: "An error occurred" }));
        throw { detail: body.detail || "An error occurred", status: res.status } as ApiError;
    }

    if (res.status === 204) return {} as T;
    return res.json();
}

/* ─── API Methods ────────────────────────────────────────── */

export const api = {

    /* ── Auth ─────────────────────────────────────────────── */

    async login(email: string, password: string): Promise<AuthResponse> {
        const res = await fetch(`${API_BASE}/api/auth/login`, {
            method: "POST",
            headers: getHeaders(true),
            body: JSON.stringify({ email, password }),
        });
        return handleResponse<AuthResponse>(res);
    },

    async register(data: {
        name?: string;
        full_name?: string;
        email: string;
        password: string;
        phone?: string;
    }): Promise<AuthResponse> {
        // Accept either `name` or `full_name` from the register page
        const payload = {
            full_name: data.full_name ?? data.name ?? "",
            email: data.email,
            password: data.password,
        };
        const res = await fetch(`${API_BASE}/api/auth/register`, {
            method: "POST",
            headers: getHeaders(true),
            body: JSON.stringify(payload),
        });
        return handleResponse<AuthResponse>(res);
    },

    async getMe(): Promise<User> {
        const res = await fetch(`${API_BASE}/api/auth/me`, {
            headers: getHeaders(),
        });
        return handleResponse<User>(res);
    },

    /* ── Grievances ───────────────────────────────────────── */

    async classifyGrievance(description: string): Promise<ClassificationResult> {
        const res = await fetch(`${API_BASE}/api/grievances/classify`, {
            method: "POST",
            headers: getHeaders(true),
            body: JSON.stringify({ description }),
        });
        return handleResponse<ClassificationResult>(res);
    },

    async checkDuplicate(grievance: {
        title: string;
        description: string;
        category: string;
        location: { lat: number; lng: number };
        address: string;
    }): Promise<DuplicateCheckResult[]> {
        const res = await fetch(`${API_BASE}/api/grievances/check-duplicate`, {
            method: "POST",
            headers: getHeaders(true),
            body: JSON.stringify(grievance),
        });
        return handleResponse<DuplicateCheckResult[]>(res);
    },

    /** Primary grievance submission endpoint */
    async submitGrievance(data: {
        title: string;
        description: string;
        category: string;
        location: { lat: number; lng: number };
        address: string;
        media_urls?: string[];
    }): Promise<Grievance> {
        const res = await fetch(`${API_BASE}/api/grievances/submit`, {
            method: "POST",
            headers: getHeaders(true),
            body: JSON.stringify(data),
        });
        return handleResponse<Grievance>(res);
    },

    async trackGrievance(id: string): Promise<{ id: string; status: string; timeline: TimelineEvent[] }> {
        const res = await fetch(`${API_BASE}/api/grievances/track/${id}`, {
            headers: getHeaders(),
        });
        return handleResponse<{ id: string; status: string; timeline: TimelineEvent[] }>(res);
    },

    async getGrievance(id: string): Promise<Grievance> {
        const res = await fetch(`${API_BASE}/api/grievances/${id}`, {
            headers: getHeaders(),
        });
        return handleResponse<Grievance>(res);
    },

    async getUserGrievances(
        userEmail: string,
        params?: { status?: string; page?: number; limit?: number }
    ): Promise<{ grievances: Grievance[]; total: number }> {
        const searchParams = new URLSearchParams();
        if (params?.status) searchParams.set("status", params.status);
        if (params?.page) searchParams.set("page", String(params.page));
        if (params?.limit) searchParams.set("limit", String(params.limit));

        const query = searchParams.toString();
        const res = await fetch(
            `${API_BASE}/api/grievances/user/${encodeURIComponent(userEmail)}${query ? `?${query}` : ""}`,
            { headers: getHeaders() }
        );
        return handleResponse<{ grievances: Grievance[]; total: number }>(res);
    },

    /* ── Media ────────────────────────────────────────────── */

    async uploadMedia(file: File): Promise<{ url: string; filename: string }> {
        const token = getToken();
        const headers: HeadersInit = {};
        if (token) headers["Authorization"] = `Bearer ${token}`;

        const formData = new FormData();
        formData.append("file", file);

        const res = await fetch(`${API_BASE}/api/media/upload`, {
            method: "POST",
            headers,
            body: formData,
        });
        const data = await handleResponse<{ url: string; filename: string }>(res);
        return { ...data, url: `${API_BASE}${data.url}` };
    },

    /* ── Admin ────────────────────────────────────────────── */

    async getAdminStats(): Promise<AdminStats> {
        const res = await fetch(`${API_BASE}/api/admin/stats`, {
            headers: getHeaders(),
        });
        return handleResponse<AdminStats>(res);
    },

    async getAnalytics(): Promise<AdminStats> {
        const res = await fetch(`${API_BASE}/api/admin/analytics/overview`, {
            headers: getHeaders(),
        });
        const overview = await handleResponse<any>(res);

        // Transform overview into AdminStats format for compatibility
        const stats: AdminStats = {
            total_grievances: (Object.values(overview.by_status || {}) as any[]).reduce((a: number, b: any) => a + (Number(b) || 0), 0),
            pending: (overview.by_status?.submitted || 0) + (overview.by_status?.pending || 0),
            pending_confirmation: Number(overview.pending_ai_confirmation || 0),
            in_progress: (overview.by_status?.assigned || 0) + (overview.by_status?.in_progress || 0),
            resolved: overview.by_status?.resolved || 0,
            rejected: overview.by_status?.rejected || 0,
            avg_resolution_time: 0,
            department_wise: (overview.by_department || []).reduce((acc: any, curr: any) => {
                acc[curr.department] = curr.count;
                return acc;
            }, {}),
            priority_distribution: overview.by_priority || {},
            monthly_trend: (overview.trend || []).map((t: any) => ({ month: t.date, count: t.count })),
            // Map raw fields
            trend: overview.trend,
            by_priority: overview.by_priority,
            by_department: overview.by_department,
            by_status: overview.by_status,
            pending_ai_confirmation: overview.pending_ai_confirmation
        };
        return stats;
    },

    async getTeam(): Promise<TeamMember[]> {
        const res = await this.getUsers({ role: "admin" });
        return res.users;
    },

    async getAdminComplaints(params?: {
        status?: string;
        priority?: string;
        department?: string;
        assignment_status?: string;
        page?: number;
        limit?: number;
        sort?: string;
        search?: string;
    }): Promise<{ complaints: Grievance[]; total: number }> {
        const searchParams = new URLSearchParams();
        if (params) {
            Object.entries(params).forEach(([key, val]) => {
                if (val !== undefined && val !== "") searchParams.set(key, String(val));
            });
        }
        const query = searchParams.toString();
        const res = await fetch(
            `${API_BASE}/api/admin/complaints${query ? `?${query}` : ""}`,
            { headers: getHeaders() }
        );
        return handleResponse<{ complaints: Grievance[]; total: number }>(res);
    },

    async getAdminComplaint(id: string): Promise<Grievance> {
        const res = await fetch(`${API_BASE}/api/admin/complaints/${id}`, {
            headers: getHeaders(),
        });
        return handleResponse<Grievance>(res);
    },

    async updateComplaintStatus(
        id: string,
        data: { status: string; remarks?: string; priority?: string; department?: string; assigned_officer?: string }
    ): Promise<Grievance> {
        const res = await fetch(`${API_BASE}/api/admin/complaints/${id}`, {
            method: "PUT",
            headers: getHeaders(true),
            body: JSON.stringify(data),
        });
        return handleResponse<Grievance>(res);
    },

    async updatePriority(id: string, priority: string): Promise<Grievance> {
        const res = await fetch(`${API_BASE}/api/admin/complaints/${id}/priority`, {
            method: "PUT",
            headers: getHeaders(true),
            body: JSON.stringify({ priority }),
        });
        return handleResponse<Grievance>(res);
    },

    async assignDepartment(id: string, department: string): Promise<Grievance> {
        const res = await fetch(`${API_BASE}/api/admin/complaints/${id}/assign`, {
            method: "PUT",
            headers: getHeaders(true),
            body: JSON.stringify({ department }),
        });
        return handleResponse<Grievance>(res);
    },

    async getUsers(params?: {
        search?: string;
        role?: string;
        page?: number;
        limit?: number;
    }): Promise<{ users: UserRecord[]; total: number }> {
        const searchParams = new URLSearchParams();
        if (params?.search) searchParams.set("search", params.search);
        if (params?.role) searchParams.set("role", params.role);
        if (params?.page) searchParams.set("page", String(params.page));
        if (params?.limit) searchParams.set("limit", String(params.limit));
        const query = searchParams.toString();
        const res = await fetch(
            `${API_BASE}/api/admin/users${query ? `?${query}` : ""}`,
            { headers: getHeaders() }
        );
        return handleResponse<{ users: UserRecord[]; total: number }>(res);
    },

    async confirmAssignment(id: string, remarks?: string): Promise<Grievance> {
        const res = await fetch(`${API_BASE}/api/admin/complaints/${id}/confirm-assignment`, {
            method: "PUT",
            headers: getHeaders(true),
            body: JSON.stringify({ remarks }),
        });
        return handleResponse<Grievance>(res);
    },

    /* ── Chat ─────────────────────────────────────────────── */

    async sendChatMessage(
        messages: ChatMessage[]
    ): Promise<{ reply: string; quick_replies?: string[] }> {
        const res = await fetch(`${API_BASE}/api/chat`, {
            method: "POST",
            headers: getHeaders(true),
            body: JSON.stringify({ messages }),
        });
        return handleResponse<{ reply: string; quick_replies?: string[] }>(res);
    },
};

/* ─── Utility ────────────────────────────────────────────── */

export function getCurrentUser(): User | null {
    if (typeof window === "undefined") return null;
    const raw = localStorage.getItem("user");
    if (!raw) return null;
    try {
        return JSON.parse(raw) as User;
    } catch {
        return null;
    }
}

export function logout(): void {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    window.location.href = "/login";
}

export function isAdmin(): boolean {
    const user = getCurrentUser();
    return user?.role === "admin";
}

export function debounce<T extends (...args: Parameters<T>) => void>(
    fn: T,
    ms: number
): (...args: Parameters<T>) => void {
    let timer: ReturnType<typeof setTimeout>;
    return (...args: Parameters<T>) => {
        clearTimeout(timer);
        timer = setTimeout(() => fn(...args), ms);
    };
}
