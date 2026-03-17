"use client";
import { useState } from "react";
import { Announcement, isAnnouncementVisibleToRole, useAnnouncementStore } from "@/store/announcementStore";

export default function TeacherAnnouncements() {
    const { announcements, addAnnouncement } = useAnnouncementStore();
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [title, setTitle] = useState("");
    const [target, setTarget] = useState("All My Classes");
    const [message, setMessage] = useState("");
    const [showSchedule, setShowSchedule] = useState(false);
    const [scheduledDate, setScheduledDate] = useState("");
    const [viewFilter, setViewFilter] = useState<"all" | "sent" | "upcoming" | "today" | "overdue">("all");
    const [toast, setToast] = useState<string | null>(null);
    const [selectedAnnouncement, setSelectedAnnouncement] = useState<Announcement | null>(null);

    const targets = ["All My Classes", "Grade 11-A", "Grade 11-B", "Grade 12-A"];
    const visibleAnnouncements = announcements.filter((a) => isAnnouncementVisibleToRole(a, "teacher"));

    const getScheduleState = (value?: string) => {
        if (!value) return "scheduled" as const;
        const today = new Date();
        const scheduled = new Date(value);
        if (Number.isNaN(scheduled.getTime())) return "scheduled" as const;
        today.setHours(0, 0, 0, 0);
        scheduled.setHours(0, 0, 0, 0);
        if (scheduled.getTime() > today.getTime()) return "upcoming" as const;
        if (scheduled.getTime() < today.getTime()) return "overdue" as const;
        return "today" as const;
    };

    const sortedAnnouncements = [...visibleAnnouncements].sort((a, b) => b.id - a.id);
    const sentAnnouncements = sortedAnnouncements.filter((a) => a.status === "sent");
    const upcomingAnnouncements = sortedAnnouncements.filter((a) => a.status === "scheduled" && getScheduleState(a.scheduledDate) === "upcoming");
    const todayAnnouncements = sortedAnnouncements.filter((a) => a.status === "scheduled" && getScheduleState(a.scheduledDate) === "today");
    const overdueAnnouncements = sortedAnnouncements.filter((a) => a.status === "scheduled" && getScheduleState(a.scheduledDate) === "overdue");

    const filteredAnnouncements = sortedAnnouncements.filter((a) => {
        if (viewFilter === "all") return true;
        if (viewFilter === "sent") return a.status === "sent";
        return a.status === "scheduled" && getScheduleState(a.scheduledDate) === viewFilter;
    });

    const resolveTeacherAudience = (value: string): { audience: "students" | "teachers"; grade?: string } => {
        if (value.toLowerCase().includes("grade")) return { audience: "students", grade: value };
        if (value.toLowerCase().includes("class")) return { audience: "students" };
        return { audience: "students" };
    };

    function showToast(msg: string) {
        setToast(msg);
        setTimeout(() => setToast(null), 3000);
    }

    function handlePublish() {
        if (!title.trim() || !message.trim()) {
            showToast("Please fill in the title and message.");
            return;
        }
        addAnnouncement({
            title: title.trim(),
            target,
            message: message.trim(),
            status: "sent",
            date: new Date().toLocaleDateString("en-US", { month: "short", day: "numeric" }),
            ...resolveTeacherAudience(target),
            authorRole: "teacher",
        });
        setTitle("");
        setMessage("");
        setTarget("All My Classes");
        setShowCreateModal(false);
        setShowSchedule(false);
        showToast("Announcement published successfully!");
    }

    function handleSchedule() {
        if (!showSchedule) {
            setShowSchedule(true);
            return;
        }
        if (!title.trim() || !message.trim()) {
            showToast("Please fill in the title and message.");
            return;
        }
        if (!scheduledDate) {
            showToast("Please select a schedule date and time.");
            return;
        }
        const formatted = new Date(scheduledDate).toLocaleDateString("en-US", { month: "short", day: "numeric" });
        addAnnouncement({
            title: title.trim(),
            target,
            message: message.trim(),
            status: "scheduled",
            date: new Date().toLocaleDateString("en-US", { month: "short", day: "numeric" }),
            scheduledDate,
            ...resolveTeacherAudience(target),
            authorRole: "teacher",
        });
        setTitle("");
        setMessage("");
        setTarget("All My Classes");
        setScheduledDate("");
        setShowCreateModal(false);
        setShowSchedule(false);
        showToast(`Announcement scheduled for ${formatted}!`);
    }

    return (
        <div className="page-wrapper">
            {toast && (
                <div style={{
                    position: "fixed", top: "1.25rem", right: "1.25rem", zIndex: 9999,
                    background: "var(--gray-900)", color: "#fff", padding: "0.75rem 1.25rem",
                    borderRadius: "var(--radius-md)", fontSize: "0.875rem", fontWeight: 500,
                    boxShadow: "0 4px 16px rgba(0,0,0,0.18)", maxWidth: 320,
                }}>
                    {toast}
                </div>
            )}
            <div className="page-header">
                <div>
                    <h1 className="page-title">Announcements</h1>
                    <p className="page-subtitle">Create and manage announcements for your classes</p>
                </div>
                <button className="btn btn-primary" onClick={() => setShowCreateModal(true)}>+ New Announcement</button>
            </div>

            {showCreateModal && (
                <div
                    style={{
                        position: "fixed",
                        inset: 0,
                        zIndex: 1000,
                        background: "rgba(15, 23, 42, 0.45)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        padding: "1rem",
                    }}
                    onClick={() => {
                        setShowCreateModal(false);
                        setShowSchedule(false);
                        setScheduledDate("");
                    }}
                >
                    <div className="card" style={{ width: "100%", maxWidth: 760, margin: 0, maxHeight: "90vh", overflowY: "auto" }} onClick={(e) => e.stopPropagation()}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.25rem" }}>
                            <h3 className="card-title" style={{ marginBottom: 0 }}>{showSchedule ? "Schedule Announcement" : "Create Announcement"}</h3>
                            <button className="btn btn-outline btn-sm" onClick={() => { setShowCreateModal(false); setShowSchedule(false); setScheduledDate(""); }}>Close</button>
                        </div>

                        <div className="input-group" style={{ marginBottom: "1rem" }}>
                            <label>Title</label>
                            <div className="input-field">
                                <input placeholder="Announcement title..." value={title} onChange={(e) => setTitle(e.target.value)} />
                            </div>
                        </div>

                        <div className="input-group" style={{ marginBottom: "1rem" }}>
                            <label>Target</label>
                            <select
                                value={target}
                                onChange={(e) => setTarget(e.target.value)}
                                style={{ padding: "0.75rem 1rem", background: "var(--gray-50)", border: "1.5px solid var(--gray-200)", borderRadius: "var(--radius-md)", fontSize: "0.9rem", fontFamily: "inherit", width: "100%" }}
                            >
                                {targets.map((t) => <option key={t}>{t}</option>)}
                            </select>
                        </div>

                        <div className="input-group" style={{ marginBottom: "1rem" }}>
                            <label>Message</label>
                            <textarea
                                placeholder="Write your announcement..."
                                rows={4}
                                value={message}
                                onChange={(e) => setMessage(e.target.value)}
                                style={{ padding: "0.75rem 1rem", background: "var(--gray-50)", border: "1.5px solid var(--gray-200)", borderRadius: "var(--radius-md)", fontSize: "0.9rem", fontFamily: "inherit", resize: "vertical", width: "100%" }}
                            />
                        </div>

                        {showSchedule && (
                            <div className="input-group" style={{ marginBottom: "1rem" }}>
                                <label>Schedule Date &amp; Time</label>
                                <input
                                    type="datetime-local"
                                    value={scheduledDate}
                                    onChange={(e) => setScheduledDate(e.target.value)}
                                    style={{ padding: "0.75rem 1rem", background: "var(--gray-50)", border: "1.5px solid var(--gray-200)", borderRadius: "var(--radius-md)", fontSize: "0.9rem", fontFamily: "inherit", width: "100%" }}
                                />
                            </div>
                        )}

                        <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
                            <button className="btn btn-primary" onClick={handlePublish}>Publish Now</button>
                            <button className="btn btn-outline" onClick={handleSchedule}>{showSchedule ? "Confirm Schedule" : "Schedule"}</button>
                            {showSchedule && (
                                <button className="btn btn-outline" onClick={() => { setShowSchedule(false); setScheduledDate(""); }}>Cancel Schedule</button>
                            )}
                        </div>
                    </div>
                </div>
            )}

            <div className="card">
                <h3 className="card-title" style={{ marginBottom: "1rem" }}>Announcements At A Glance</h3>

                <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: "1rem", marginBottom: "1.25rem" }}>
                    <div style={{ border: "1px solid #bbf7d0", borderRadius: "var(--radius-md)", background: "#f0fdf4", padding: "0.9rem" }}>
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "0.65rem" }}>
                            <span style={{ fontSize: "0.82rem", fontWeight: 800, color: "#166534", letterSpacing: "0.03em", textTransform: "uppercase" }}>Sent</span>
                            <span style={{ fontSize: "0.82rem", fontWeight: 700, color: "#166534" }}>{sentAnnouncements.length}</span>
                        </div>
                        <div style={{ display: "flex", flexDirection: "column", gap: "0.45rem" }}>
                            {sentAnnouncements.slice(0, 3).map((ann) => (
                                <div key={`sent-${ann.id}`} style={{ fontSize: "0.85rem", color: "#14532d", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{ann.title}</div>
                            ))}
                            {sentAnnouncements.length === 0 && <div style={{ fontSize: "0.82rem", color: "#166534" }}>No sent announcements yet.</div>}
                        </div>
                    </div>

                    <div style={{ border: "1px solid #fed7aa", borderRadius: "var(--radius-md)", background: "#fff7ed", padding: "0.9rem" }}>
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "0.65rem" }}>
                            <span style={{ fontSize: "0.82rem", fontWeight: 800, color: "#9a3412", letterSpacing: "0.03em", textTransform: "uppercase" }}>Upcoming</span>
                            <span style={{ fontSize: "0.82rem", fontWeight: 700, color: "#9a3412" }}>{upcomingAnnouncements.length}</span>
                        </div>
                        <div style={{ display: "flex", flexDirection: "column", gap: "0.45rem" }}>
                            {upcomingAnnouncements.slice(0, 3).map((ann) => (
                                <div key={`upcoming-${ann.id}`} style={{ fontSize: "0.85rem", color: "#7c2d12", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{ann.title}</div>
                            ))}
                            {upcomingAnnouncements.length === 0 && <div style={{ fontSize: "0.82rem", color: "#9a3412" }}>No upcoming announcements.</div>}
                        </div>
                    </div>
                </div>

                <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", marginBottom: "1rem" }}>
                    {[
                        { key: "all", label: `All (${sortedAnnouncements.length})` },
                        { key: "sent", label: `Sent (${sentAnnouncements.length})` },
                        { key: "upcoming", label: `Upcoming (${upcomingAnnouncements.length})` },
                        { key: "today", label: `Today (${todayAnnouncements.length})` },
                        { key: "overdue", label: `Overdue (${overdueAnnouncements.length})` },
                    ].map((item) => (
                        <button
                            key={item.key}
                            type="button"
                            onClick={() => setViewFilter(item.key as typeof viewFilter)}
                            className={viewFilter === item.key ? "btn btn-primary btn-sm" : "btn btn-outline btn-sm"}
                        >
                            {item.label}
                        </button>
                    ))}
                </div>

                {filteredAnnouncements.length === 0 && (
                    <p style={{ fontSize: "0.875rem", color: "var(--gray-400)", textAlign: "center", padding: "1rem 0" }}>No announcements yet.</p>
                )}
                {filteredAnnouncements.map((a) => (
                    <button
                        key={a.id}
                        onClick={() => setSelectedAnnouncement(a)}
                        style={{
                            display: "flex",
                            alignItems: "flex-start",
                            justifyContent: "space-between",
                            width: "100%",
                            padding: "0.85rem 0.95rem",
                            background: "var(--gray-50)",
                            borderRadius: "var(--radius-md)",
                            marginBottom: "0.5rem",
                            gap: "0.75rem",
                            border: "1px solid var(--gray-100)",
                            cursor: "pointer",
                            textAlign: "left",
                            transition: "all var(--transition-fast)",
                        }}
                    >
                        <div style={{ flex: 1 }}>
                            <div style={{ fontWeight: 600, fontSize: "0.875rem" }}>{a.title}</div>
                            <div style={{ fontSize: "0.75rem", color: "var(--gray-500)", margin: "0.2rem 0" }}>To: {a.target} · {a.status === "scheduled" ? `Scheduled: ${a.scheduledDate}` : a.date}</div>
                            <div style={{ fontSize: "0.8rem", color: "var(--gray-600)", marginTop: "0.25rem", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>{a.message}</div>
                        </div>
                        <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "0.45rem", flexShrink: 0 }}>
                            <span className={`badge ${a.status === "sent" ? "badge-success" : "badge-warning"}`}>{a.status}</span>
                            <span style={{ fontSize: "0.72rem", color: "var(--primary-600)", fontWeight: 600 }}>View details</span>
                        </div>
                    </button>
                ))}
            </div>

            {selectedAnnouncement && (
                <div className="modal-overlay" onClick={() => setSelectedAnnouncement(null)}>
                    <div className="modal" style={{ maxWidth: 720, width: "92%", overflow: "hidden", padding: 0 }} onClick={(e) => e.stopPropagation()}>
                        <div
                            style={{
                                padding: "1.4rem 1.5rem 1.2rem",
                                background: selectedAnnouncement.status === "sent"
                                    ? "linear-gradient(135deg, #eff6ff 0%, #f8fafc 55%, #ecfeff 100%)"
                                    : "linear-gradient(135deg, #fffbeb 0%, #fff7ed 55%, #fff 100%)",
                                borderBottom: "1px solid var(--gray-100)",
                                position: "relative",
                            }}
                        >
                            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "1rem" }}>
                                <div style={{ display: "flex", gap: "0.95rem", alignItems: "flex-start" }}>
                                    <div
                                        style={{
                                            width: 46,
                                            height: 46,
                                            borderRadius: 14,
                                            display: "flex",
                                            alignItems: "center",
                                            justifyContent: "center",
                                            background: selectedAnnouncement.status === "sent" ? "#dbeafe" : "#fef3c7",
                                            color: selectedAnnouncement.status === "sent" ? "#2563eb" : "#b45309",
                                            boxShadow: "0 10px 25px rgba(15, 23, 42, 0.08)",
                                            flexShrink: 0,
                                        }}
                                    >
                                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="m22 2-7 20-4-9-9-4Z" /><path d="M22 2 11 13" /></svg>
                                    </div>
                                    <div>
                                        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", flexWrap: "wrap", marginBottom: "0.45rem" }}>
                                            <span className={`badge ${selectedAnnouncement.status === "sent" ? "badge-success" : "badge-warning"}`}>{selectedAnnouncement.status}</span>
                                            <span style={{ fontSize: "0.72rem", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--gray-400)" }}>Announcement Details</span>
                                        </div>
                                        <h3 className="modal-title" style={{ fontSize: "1.3rem", lineHeight: 1.25 }}>{selectedAnnouncement.title}</h3>
                                        <div style={{ fontSize: "0.82rem", color: "var(--gray-500)", marginTop: "0.45rem", maxWidth: 520 }}>
                                            Review the full announcement before sharing or following up with students.
                                        </div>
                                    </div>
                                </div>
                                <button className="modal-close" onClick={() => setSelectedAnnouncement(null)} aria-label="Close announcement details">
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
                                </button>
                            </div>
                        </div>
                        <div className="modal-body" style={{ paddingTop: "1.2rem" }}>
                            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", gap: "0.75rem", marginBottom: "1.1rem" }}>
                                <div style={{ border: "1px solid var(--gray-100)", borderRadius: 14, padding: "0.9rem 1rem", background: "#fff" }}>
                                    <div style={{ fontSize: "0.7rem", fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase", color: "var(--gray-400)", marginBottom: "0.35rem" }}>Audience</div>
                                    <div style={{ fontSize: "0.92rem", fontWeight: 600, color: "var(--gray-800)" }}>{selectedAnnouncement.target}</div>
                                </div>
                                <div style={{ border: "1px solid var(--gray-100)", borderRadius: 14, padding: "0.9rem 1rem", background: "#fff" }}>
                                    <div style={{ fontSize: "0.7rem", fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase", color: "var(--gray-400)", marginBottom: "0.35rem" }}>Status</div>
                                    <div style={{ fontSize: "0.92rem", fontWeight: 600, color: "var(--gray-800)", textTransform: "capitalize" }}>{selectedAnnouncement.status}</div>
                                </div>
                                <div style={{ border: "1px solid var(--gray-100)", borderRadius: 14, padding: "0.9rem 1rem", background: "#fff" }}>
                                    <div style={{ fontSize: "0.7rem", fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase", color: "var(--gray-400)", marginBottom: "0.35rem" }}>Date</div>
                                    <div style={{ fontSize: "0.92rem", fontWeight: 600, color: "var(--gray-800)" }}>
                                        {selectedAnnouncement.status === "scheduled" ? selectedAnnouncement.scheduledDate : selectedAnnouncement.date}
                                    </div>
                                </div>
                            </div>

                            <div style={{ border: "1px solid var(--gray-100)", borderRadius: 18, overflow: "hidden", background: "linear-gradient(180deg, #ffffff 0%, #fafcff 100%)" }}>
                                <div style={{ padding: "0.85rem 1rem", borderBottom: "1px solid var(--gray-100)", background: "rgba(37, 99, 235, 0.03)" }}>
                                    <div style={{ fontSize: "0.76rem", fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase", color: "var(--primary-600)" }}>Message</div>
                                </div>
                                <div style={{ padding: "1rem 1.05rem 1.1rem", fontSize: "0.95rem", color: "var(--gray-700)", lineHeight: 1.8, whiteSpace: "pre-wrap" }}>
                                    {selectedAnnouncement.message}
                                </div>
                            </div>
                        </div>
                        <div className="modal-footer">
                            <button className="btn btn-secondary" onClick={() => setSelectedAnnouncement(null)}>Close</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
