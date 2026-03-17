"use client";
import { useState } from "react";
import { useAcademicYearStore } from "@/store/academicYearStore";

function Toggle({ value, onChange }: { value: boolean; onChange: () => void }) {
    return (
        <button
            onClick={onChange}
            style={{
                width: 48, height: 26, borderRadius: 13,
                background: value ? "var(--primary-500)" : "var(--gray-300)",
                position: "relative", border: "none", cursor: "pointer",
                transition: "background 0.2s", flexShrink: 0,
            }}
            aria-checked={value}
            role="switch"
        >
            <div style={{
                width: 20, height: 20, borderRadius: "50%", background: "#fff",
                position: "absolute", top: 3, left: value ? 25 : 3,
                transition: "left 0.2s", boxShadow: "0 1px 4px rgba(0,0,0,0.18)",
            }} />
        </button>
    );
}

function SectionHeader({ icon, title, description }: { icon: string; title: string; description?: string }) {
    return (
        <div style={{ display: "flex", alignItems: "flex-start", gap: "0.875rem", marginBottom: "1.5rem" }}>
            <div style={{
                width: 40, height: 40, borderRadius: "var(--radius-md)",
                background: "var(--primary-50)", display: "flex", alignItems: "center",
                justifyContent: "center", fontSize: "1.125rem", flexShrink: 0,
            }}>{icon}</div>
            <div>
                <div style={{ fontWeight: 700, fontSize: "1rem", color: "var(--gray-800)" }}>{title}</div>
                {description && <div style={{ fontSize: "0.8125rem", color: "var(--gray-500)", marginTop: "0.125rem" }}>{description}</div>}
            </div>
        </div>
    );
}

export default function AdminSettings() {
    const [notifications, setNotifications] = useState({
        email: { label: "Email Notifications", description: "Receive alerts and updates via email", value: true },
        push: { label: "Push Notifications", description: "Browser and mobile push alerts", value: true },
        attendance: { label: "Attendance Alerts", description: "Notify when attendance drops below threshold", value: false },
        announcements: { label: "Announcement Broadcasts", description: "Send notifications for new announcements", value: true },
    });
    const [schoolName, setSchoolName] = useState("TriLink Academy");
    const [schoolEmail, setSchoolEmail] = useState("admin@trilink.edu");
    const [timezone, setTimezone] = useState("Africa/Addis_Ababa");
    const { years, currentSystemYear, setCurrentSystemYear, addYear } = useAcademicYearStore();
    const [newYear, setNewYear] = useState("");

    const toggleNotif = (key: string) => {
        setNotifications(prev => ({
            ...prev,
            [key]: { ...prev[key as keyof typeof prev], value: !prev[key as keyof typeof prev].value },
        }));
    };

    return (
        <div className="page-wrapper">
            <div className="page-header">
                <div>
                    <h1 className="page-title">Settings</h1>
                    <p className="page-subtitle">Manage system configuration and preferences</p>
                </div>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>

                <div style={{ display: "grid", gridTemplateColumns: "3fr 2fr", gap: "1.5rem", alignItems: "start" }}>

                    {/* LEFT COLUMN */}
                    <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>

                        <div className="card">
                            <SectionHeader icon="&#127867;" title="School Information" description="Basic details about your institution" />
                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                                <div className="input-group">
                                    <label>School Name</label>
                                    <div className="input-field">
                                        <input value={schoolName} onChange={e => setSchoolName(e.target.value)} placeholder="Enter school name" />
                                    </div>
                                </div>
                                <div className="input-group">
                                    <label>Admin Email</label>
                                    <div className="input-field">
                                        <input value={schoolEmail} onChange={e => setSchoolEmail(e.target.value)} placeholder="admin@school.edu" type="email" />
                                    </div>
                                </div>
                                <div className="input-group">
                                    <label>Timezone</label>
                                    <div className="input-field" style={{ padding: "0.5rem 1rem" }}>
                                        <select value={timezone} onChange={e => setTimezone(e.target.value)}
                                            style={{ flex: 1, background: "transparent", fontSize: "0.9375rem", color: "var(--gray-800)", cursor: "pointer" }}>
                                            <option value="Africa/Addis_Ababa">Africa/Addis Ababa (UTC+3)</option>
                                            <option value="UTC">UTC</option>
                                            <option value="Europe/London">Europe/London</option>
                                            <option value="America/New_York">America/New York</option>
                                        </select>
                                    </div>
                                </div>
                                <div className="input-group">
                                    <label>Language</label>
                                    <div className="input-field" style={{ padding: "0.5rem 1rem" }}>
                                        <select style={{ flex: 1, background: "transparent", fontSize: "0.9375rem", color: "var(--gray-800)", cursor: "pointer" }}>
                                            <option>English</option>
                                            <option>Amharic</option>
                                        </select>
                                    </div>
                                </div>
                            </div>
                            <div style={{ marginTop: "1.5rem", paddingTop: "1.25rem", borderTop: "1px solid var(--gray-100)", display: "flex", justifyContent: "flex-end" }}>
                                <button className="btn btn-primary">Save School Info</button>
                            </div>
                        </div>

                        <div className="card">
                            <SectionHeader icon="&#128197;" title="Academic Year Management" description="Control which year teachers and students see across the system" />
                            <div style={{
                                background: "linear-gradient(135deg, var(--primary-50), #fff)",
                                border: "1.5px solid var(--primary-200)",
                                borderRadius: "var(--radius-md)",
                                padding: "1rem 1.25rem", marginBottom: "1.25rem",
                                display: "flex", alignItems: "center", justifyContent: "space-between",
                                gap: "1rem", flexWrap: "wrap",
                            }}>
                                <div>
                                    <div style={{ fontWeight: 600, fontSize: "0.875rem", color: "var(--primary-700)" }}>Active System Year</div>
                                    <div style={{ fontSize: "0.8rem", color: "var(--gray-500)", marginTop: "0.125rem" }}>Default academic year visible to all users</div>
                                </div>
                                <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                                    <span style={{
                                        padding: "0.375rem 0.875rem",
                                        background: "var(--primary-500)", color: "#fff",
                                        borderRadius: "var(--radius-full)",
                                        fontWeight: 700, fontSize: "0.875rem", letterSpacing: "0.02em",
                                    }}>{currentSystemYear}</span>
                                    <div className="input-field" style={{ padding: "0.4rem 0.875rem", minWidth: 140 }}>
                                        <select value={currentSystemYear} onChange={(e) => setCurrentSystemYear(e.target.value)}
                                            style={{ flex: 1, background: "transparent", fontSize: "0.875rem", color: "var(--gray-800)", cursor: "pointer" }}>
                                            {years.map((y) => <option key={y} value={y}>{y}</option>)}
                                        </select>
                                    </div>
                                </div>
                            </div>
                            <div style={{ marginBottom: "1.25rem" }}>
                                <div style={{ fontSize: "0.8125rem", fontWeight: 600, color: "var(--gray-600)", marginBottom: "0.625rem", textTransform: "uppercase", letterSpacing: "0.04em" }}>All Academic Years</div>
                                <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem" }}>
                                    {years.map((y) => (
                                        <div key={y} style={{
                                            display: "inline-flex", alignItems: "center", gap: "0.375rem",
                                            padding: "0.3rem 0.875rem",
                                            borderRadius: "var(--radius-full)",
                                            border: y === currentSystemYear ? "1.5px solid var(--primary-400)" : "1.5px solid var(--gray-200)",
                                            background: y === currentSystemYear ? "var(--primary-50)" : "var(--gray-50)",
                                            color: y === currentSystemYear ? "var(--primary-700)" : "var(--gray-600)",
                                            fontSize: "0.8125rem", fontWeight: y === currentSystemYear ? 600 : 500,
                                        }}>
                                            {y === currentSystemYear && <span style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--primary-500)", display: "inline-block" }} />}
                                            {y}
                                        </div>
                                    ))}
                                </div>
                            </div>
                            <div style={{ display: "flex", gap: "0.75rem", alignItems: "flex-end" }}>
                                <div className="input-group" style={{ flex: 1 }}>
                                    <label>Add New Academic Year</label>
                                    <div className="input-field">
                                        <input placeholder="e.g. 2025/2026" value={newYear}
                                            onChange={(e) => setNewYear(e.target.value)}
                                            onKeyDown={(e) => { if (e.key === "Enter" && newYear.trim()) { addYear(newYear.trim()); setNewYear(""); } }}
                                        />
                                    </div>
                                </div>
                                <button className="btn btn-primary" onClick={() => { if (newYear.trim()) { addYear(newYear.trim()); setNewYear(""); } }}>Add Year</button>
                            </div>
                        </div>

                    </div>

                    {/* RIGHT COLUMN */}
                    <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>

                        <div className="card">
                            <SectionHeader icon="&#128276;" title="Notifications" description="Choose which alerts you receive" />
                            <div style={{ display: "flex", flexDirection: "column" }}>
                                {Object.entries(notifications).map(([key, item], idx, arr) => (
                                    <div key={key} style={{
                                        display: "flex", alignItems: "center", justifyContent: "space-between",
                                        padding: "0.875rem 0",
                                        borderBottom: idx < arr.length - 1 ? "1px solid var(--gray-100)" : "none",
                                        gap: "0.75rem",
                                    }}>
                                        <div style={{ flex: 1, minWidth: 0 }}>
                                            <div style={{ fontWeight: 500, fontSize: "0.875rem", color: "var(--gray-800)" }}>{item.label}</div>
                                            <div style={{ fontSize: "0.775rem", color: "var(--gray-400)", marginTop: "0.125rem", lineHeight: 1.4 }}>{item.description}</div>
                                        </div>
                                        <Toggle value={item.value} onChange={() => toggleNotif(key)} />
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="card">
                            <SectionHeader icon="&#128274;" title="Security" description="Access and authentication preferences" />
                            <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0.75rem 1rem", background: "var(--gray-50)", borderRadius: "var(--radius-md)", border: "1px solid var(--gray-100)" }}>
                                    <div>
                                        <div style={{ fontWeight: 500, fontSize: "0.875rem" }}>Two-Factor Auth</div>
                                        <div style={{ fontSize: "0.775rem", color: "var(--gray-400)", marginTop: "0.1rem" }}>Extra layer of security</div>
                                    </div>
                                    <span className="badge badge-warning">Soon</span>
                                </div>
                                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0.75rem 1rem", background: "var(--gray-50)", borderRadius: "var(--radius-md)", border: "1px solid var(--gray-100)" }}>
                                    <div>
                                        <div style={{ fontWeight: 500, fontSize: "0.875rem" }}>Session Timeout</div>
                                        <div style={{ fontSize: "0.775rem", color: "var(--gray-400)", marginTop: "0.1rem" }}>Auto-logout after inactivity</div>
                                    </div>
                                    <div className="input-field" style={{ padding: "0.3rem 0.65rem", width: 120 }}>
                                        <select style={{ flex: 1, background: "transparent", fontSize: "0.8125rem", color: "var(--gray-800)", cursor: "pointer" }}>
                                            <option>30 min</option>
                                            <option>1 hour</option>
                                            <option>4 hours</option>
                                            <option>Never</option>
                                        </select>
                                    </div>
                                </div>
                            </div>
                        </div>

                    </div>

                </div>

                {/* Danger Zone - full width */}
                <div className="card" style={{ border: "1.5px solid var(--danger-light)" }}>
                    <SectionHeader icon="&#9888;" title="Danger Zone" description="Irreversible and destructive actions - proceed with caution" />
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
                        {[
                            { label: "Reset All Student Data", desc: "Clears exam results and progress for the current academic year" },
                            { label: "Archive Academic Year", desc: "Locks the current year data as read-only and moves it to archive" },
                            { label: "Purge Chat History", desc: "Permanently removes all chat messages across all users" },
                            { label: "Reset Attendance Records", desc: "Clears all recorded attendance for the current year" },
                        ].map((item) => (
                            <div key={item.label} style={{
                                display: "flex", alignItems: "center", justifyContent: "space-between",
                                padding: "0.875rem 1rem", background: "#fff9f9",
                                border: "1px solid var(--danger-light)",
                                borderRadius: "var(--radius-md)", gap: "1rem",
                            }}>
                                <div>
                                    <div style={{ fontWeight: 600, fontSize: "0.875rem", color: "var(--gray-800)" }}>{item.label}</div>
                                    <div style={{ fontSize: "0.775rem", color: "var(--gray-500)", marginTop: "0.2rem", lineHeight: 1.4 }}>{item.desc}</div>
                                </div>
                                <button className="btn btn-danger btn-sm" style={{ flexShrink: 0 }}>Execute</button>
                            </div>
                        ))}
                    </div>
                </div>

            </div>
        </div>
    );
}
