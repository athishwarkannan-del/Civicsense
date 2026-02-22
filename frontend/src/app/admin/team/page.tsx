"use client";

import { useEffect, useState, useCallback } from "react";
import { api, type UserRecord } from "@/lib/api";

const ROLE_DEFINITIONS = [
    {
        title: "Super Admin",
        desc: "Complete administrative control over all portal functions and user management.",
        perms: ["Full System Access", "Analytics & AI Insights", "Role Assignment", "System Configuration", "Audit Logs"],
        icon: "👤",
        color: "purple"
    },
    {
        title: "Complaint Manager",
        desc: "Manages day-to-day complaint processing and status updates.",
        perms: ["View All Complaints", "Update Status", "Communicate with Users", "Generate Reports"],
        icon: "👥",
        color: "blue"
    },
    {
        title: "Field Assignment Officer",
        desc: "Assigns complaints to field workers based on location and department.",
        perms: ["Assign to Local Workers", "Location-based Routing", "Department Coordination"],
        icon: "👷",
        color: "emerald"
    },
    {
        title: "Priority Officer",
        desc: "Handles high-priority and emergency cases requiring immediate attention.",
        perms: ["Access Priority Session", "Handle HIGH/CRITICAL Cases", "Emergency Response", "AI Urgency Insights"],
        icon: "🚨",
        color: "rose"
    },
    {
        title: "Support & Help Officer",
        desc: "Handles user-reported issues and provides support for portal-related problems.",
        perms: ["Monitor User Issues", "Error Resolution", "Admin Help Management", "Citizen Support"],
        icon: "🎧",
        color: "orange"
    }
];

export default function AdminTeamPage() {
    const [users, setUsers] = useState<UserRecord[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchUsers = useCallback(async () => {
        setLoading(true);
        try {
            // In a real app, we'd fetch actual team members. 
            // For the mockup, we fetch users and style them.
            const res = await api.getUsers({ limit: 10 });
            setUsers(res.users);
        } catch (err) {
            console.error("Failed to fetch users", err);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchUsers();
    }, [fetchUsers]);

    return (
        <div className="space-y-12 pb-20 animate-in fade-in duration-500">
            {/* Page Header */}
            <div className="text-center">
                <h2 className="text-4xl font-black text-[#0D3967] tracking-tight uppercase">TEAM & ROLES MANAGEMENT</h2>
                <p className="text-sm font-medium text-gray-500 mt-1 uppercase tracking-widest">
                    Manage admin team members and their access permissions
                </p>
            </div>

            {/* Role Definitions */}
            <section>
                <div className="text-center mb-8">
                    <h3 className="text-lg font-black text-[#0D3967] tracking-widest uppercase">EMPLOYEE ROLE DEFINITIONS</h3>
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">Available roles and their permissions in the portal</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {ROLE_DEFINITIONS.map((role) => (
                        <div key={role.title} className={`bg-white border-2 border-${role.color}-100 p-6 shadow-sm hover:shadow-md transition-all`}>
                            <div className="flex items-center gap-4 mb-4">
                                <div className={`w-10 h-10 bg-${role.color}-500 text-white flex items-center justify-center text-xl rounded-full shadow-sm`}>
                                    {role.icon}
                                </div>
                                <h4 className={`text-lg font-black text-${role.color}-900 uppercase tracking-tight`}>{role.title}</h4>
                            </div>
                            <p className="text-xs font-medium text-gray-600 mb-4 leading-relaxed uppercase tracking-tight">
                                {role.desc}
                            </p>
                            <div className="space-y-2">
                                <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">PERMISSIONS:</p>
                                <div className="flex flex-wrap gap-2">
                                    {role.perms.map(p => (
                                        <span key={p} className="text-[9px] font-bold text-gray-500 bg-gray-50 px-2 py-0.5 border border-gray-100 uppercase tracking-tighter italic">
                                            {p}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </section>

            {/* Team Members */}
            <section>
                <div className="flex justify-between items-end mb-6">
                    <div>
                        <h3 className="text-lg font-black text-[#0D3967] tracking-widest uppercase">TEAM MEMBERS</h3>
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">{users.length} registered officers</p>
                    </div>
                    <button className="bg-[#0D3967] text-white px-4 py-2 text-[10px] font-black uppercase tracking-[0.2em] rounded-sm hover:bg-black transition-all shadow-md flex items-center gap-2">
                        <span className="text-lg">+</span> ADD MEMBER
                    </button>
                </div>

                <div className="bg-white shadow-xl border border-gray-100 overflow-hidden">
                    <table className="w-full text-left border-collapse">
                        <thead className="bg-[#f8fafc] border-b-2 border-gray-100">
                            <tr>
                                <th className="px-6 py-4 text-[10px] font-black text-[#0D3967] uppercase tracking-widest">ID</th>
                                <th className="px-6 py-4 text-[10px] font-black text-[#0D3967] uppercase tracking-widest">NAME</th>
                                <th className="px-6 py-4 text-[10px] font-black text-[#0D3967] uppercase tracking-widest">EMAIL</th>
                                <th className="px-6 py-4 text-[10px] font-black text-[#0D3967] uppercase tracking-widest">ROLE</th>
                                <th className="px-6 py-4 text-[10px] font-black text-[#0D3967] uppercase tracking-widest">DEPARTMENT</th>
                                <th className="px-6 py-4 text-[10px] font-black text-[#0D3967] uppercase tracking-widest text-center">STATUS</th>
                                <th className="px-6 py-4 text-[10px] font-black text-[#0D3967] uppercase tracking-widest text-center">LAST ACTIVE</th>
                                <th className="px-6 py-4 text-[10px] font-black text-[#0D3967] uppercase tracking-widest text-right">ACTION</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {loading ? (
                                [1, 2, 3, 4, 5].map(i => (
                                    <tr key={i} className="animate-pulse">
                                        <td colSpan={8} className="px-6 py-8"><div className="h-4 bg-gray-50 rounded-sm"></div></td>
                                    </tr>
                                ))
                            ) : (
                                users.map((user, idx) => {
                                    const mockRoles = ["SUPER ADMIN", "COMPLAINT MANAGER", "FIELD ASSIGNMENT OFFICER", "PRIORITY OFFICER", "SUPPORT & HELP OFFICER"];
                                    const mockDepts = ["IT Administration", "Public Works", "Municipal Services", "Emergency Services", "Citizen Support", "Health"];
                                    const role = user.role === 'admin' ? mockRoles[idx % mockRoles.length] : "COMPLAINT MANAGER";
                                    const dept = mockDepts[idx % mockDepts.length];
                                    const isActive = idx !== 4; // Mock one inactive user

                                    return (
                                        <tr key={user._id} className="hover:bg-gray-50/50 transition-colors group">
                                            <td className="px-6 py-4">
                                                <span className="text-[10px] font-black text-gray-400 uppercase tracking-tight">EMP{String(idx + 1).padStart(3, '0')}</span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <p className="text-[11px] font-black text-gray-900 uppercase">{user.full_name}</p>
                                            </td>
                                            <td className="px-6 py-4">
                                                <p className="text-[10px] font-bold text-gray-500 lowercase tracking-tight">{user.email}</p>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={`text-[9px] font-black px-2 py-0.5 rounded-sm border uppercase ${role === 'SUPER ADMIN' ? 'bg-purple-50 text-purple-700 border-purple-100' :
                                                        role === 'COMPLAINT MANAGER' ? 'bg-blue-50 text-blue-700 border-blue-100' :
                                                            role === 'FIELD ASSIGNMENT OFFICER' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' :
                                                                role === 'PRIORITY OFFICER' ? 'bg-rose-50 text-rose-700 border-rose-100' :
                                                                    'bg-orange-50 text-orange-700 border-orange-100'
                                                    }`}>
                                                    {role}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className="text-[10px] font-bold text-gray-500 uppercase tracking-tighter">{dept}</span>
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                <span className={`text-[9px] font-black uppercase tracking-widest ${isActive ? 'text-emerald-600' : 'text-rose-600'}`}>
                                                    {isActive ? "ACTIVE" : "INACTIVE"}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase text-center tabular-nums">
                                                {isActive ? `${(idx + 1) * 2} mins ago` : '2 days ago'}
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <button className={`text-[9px] font-black uppercase tracking-widest px-3 py-1 rounded-sm border transition-all ${isActive ? 'border-gray-200 text-gray-400 hover:bg-rose-50 hover:text-rose-600 hover:border-rose-200' : 'border-emerald-200 text-emerald-600 bg-emerald-50'
                                                    }`}>
                                                    {isActive ? "DEACTIVATE" : "ACTIVATE"}
                                                </button>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </section>
        </div>
    );
}
