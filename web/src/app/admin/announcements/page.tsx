"use client";
import { useState } from "react";
import { useAnnouncementStore } from "@/store/announcementStore";

const GRADES = ["Grade 9-A", "Grade 9-B", "Grade 10-A", "Grade 10-B", "Grade 11-A", "Grade 11-B", "Grade 12-A", "Grade 12-B"];

export default function AdminAnnouncements() {
    const { announcements, addAnnouncement } = useAnnouncementStore();
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [title, setTitle] = useState("");
    const [targetAudience, setTargetAudience] = useState("Everyone");
    const [selectedGrade, setSelectedGrade] = useState(GRADES[0]);
    const [message, setMessage] = useState("");
    const [scheduledDate, setScheduledDate] = useState("");
    const [showScheduleForm, setShowScheduleForm] = useState(false);
    const [toast, setToast] = useState("");
    const [viewFilter, setViewFilter] = useState<"all" | "sent" | "upcoming" | "today" | "overdue">("all");

    const showToast = (message: string) => {
        setToast(message);
        setTimeout(() => setToast(""), 3000);
    };

    const getAudience = (): "everyone" | "students" | "teachers" | "parents" => {
        if (targetAudience === "All Students" || targetAudience === "Specific Grade") return "students";
        if (targetAudience === "All Teachers") return "teachers";
        if (targetAudience === "All Parents") return "parents";
        return "everyone";
    };

    const formatDate = (value?: string) => {
        if (!value) return "-";
        const d = new Date(value);
        if (Number.isNaN(d.getTime())) return value;
        return d.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
    };

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

    const scheduleBucket = (ann: (typeof announcements)[number]) => {
        if (ann.status !== "scheduled") return null;
        return getScheduleState(ann.scheduledDate);
    };

    const sortedAnnouncements = [...announcements].sort((a, b) => b.id - a.id);
    const sentAnnouncements = sortedAnnouncements.filter((a) => a.status === "sent");
    const upcomingAnnouncements = sortedAnnouncements.filter((a) => scheduleBucket(a) === "upcoming");
    const todayAnnouncements = sortedAnnouncements.filter((a) => scheduleBucket(a) === "today");
    const overdueAnnouncements = sortedAnnouncements.filter((a) => scheduleBucket(a) === "overdue");

    const visibleAnnouncements = sortedAnnouncements.filter((ann) => {
        if (viewFilter === "all") return true;
        if (viewFilter === "sent") return ann.status === "sent";
        return scheduleBucket(ann) === viewFilter;
    });

    const handleSendNow = () => {
        if (!title.trim() || !message.trim()) {
            showToast("Please fill in all fields");
            return;
        }

        const today = new Date();
        const dateStr = today.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });

        addAnnouncement({
            title: title.trim(),
            target: targetAudience === "Specific Grade" ? selectedGrade : targetAudience,
            message: message.trim(),
            status: "sent",
            date: dateStr,
            audience: getAudience(),
            grade: targetAudience === "Specific Grade" ? selectedGrade : undefined,
            authorRole: "admin",
        });

        setTitle("");
        setMessage("");
        setTargetAudience("Everyone");
        setSelectedGrade(GRADES[0]);
        setShowCreateModal(false);
        setShowScheduleForm(false);
        showToast("Announcement sent successfully!");
    };

    const handleSchedule = () => {
        if (!title.trim() || !message.trim() || !scheduledDate) {
            showToast("Please fill in all fields including schedule date");
            return;
        }

        addAnnouncement({
            title: title.trim(),
            target: targetAudience === "Specific Grade" ? selectedGrade : targetAudience,
            message: message.trim(),
            status: "scheduled",
            date: new Date().toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" }),
            scheduledDate,
            audience: getAudience(),
            grade: targetAudience === "Specific Grade" ? selectedGrade : undefined,
            authorRole: "admin",
        });

        setTitle("");
        setMessage("");
        setTargetAudience("Everyone");
        setSelectedGrade(GRADES[0]);
        setScheduledDate("");
        setShowCreateModal(false);
        setShowScheduleForm(false);
        showToast("Announcement scheduled successfully!");
    };

    return (
        <div className="page-wrapper">
            {/* Toast Notification */}
            {toast && (
                <div
                    style={{
                        position: "fixed",
                        top: "1rem",
                        right: "1rem",
                        background: "var(--green-600)",
                        color: "white",
                        padding: "0.75rem 1rem",
                        borderRadius: "var(--radius-md)",
                        zIndex: 1000,
                        boxShadow: "0 4px 6px rgba(0,0,0,0.1)",
                    }}
                >
                    {toast}
                </div>
            )}

            <div className="page-header">
                <div>
                    <h1 className="page-title">Announcements</h1>
                    <p className="page-subtitle">Send and manage school announcements</p>
                </div>
                <button className="btn btn-primary" onClick={() => setShowCreateModal(true)}>
                    + Create Announcement
                </button>
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
                        setShowScheduleForm(false);
                        setScheduledDate("");
                    }}
                >
                    <div
                        className="card"
                        style={{ width: "100%", maxWidth: 760, margin: 0, maxHeight: "90vh", overflowY: "auto" }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.25rem" }}>
                            <h3 className="card-title" style={{ marginBottom: 0 }}>
                                {showScheduleForm ? "Schedule Announcement" : "Create Announcement"}
                            </h3>
                            <button
                                className="btn btn-outline btn-sm"
                                onClick={() => {
                                    setShowCreateModal(false);
                                    setShowScheduleForm(false);
                                    setScheduledDate("");
                                }}
                            >
                                Close
                            </button>
                        </div>

                        <div className="input-group" style={{ marginBottom: "1rem" }}>
                            <label>Title</label>
                            <div className="input-field">
                                <input
                                    placeholder="Announcement title"
                                    value={title}
                                    onChange={(e) => setTitle(e.target.value)}
                                />
                            </div>
                        </div>

                        <div className="input-group" style={{ marginBottom: "1rem" }}>
                            <label>Target Audience</label>
                            <select
                                value={targetAudience}
                                onChange={(e) => setTargetAudience(e.target.value)}
                                style={{
                                    padding: "0.75rem",
                                    background: "var(--gray-50)",
                                    border: "1.5px solid var(--gray-200)",
                                    borderRadius: "var(--radius-md)",
                                    fontFamily: "inherit",
                                    width: "100%",
                                    cursor: "pointer",
                                }}
                            >
                                <option>Everyone</option>
                                <option>All Students</option>
                                <option>All Teachers</option>
                                <option>All Parents</option>
                                <option>Specific Grade</option>
                            </select>
                        </div>

                        {targetAudience === "Specific Grade" && (
                            <div className="input-group" style={{ marginBottom: "1rem" }}>
                                <label>Select Grade</label>
                                <select
                                    value={selectedGrade}
                                    onChange={(e) => setSelectedGrade(e.target.value)}
                                    style={{
                                        padding: "0.75rem",
                                        background: "var(--gray-50)",
                                        border: "1.5px solid var(--gray-200)",
                                        borderRadius: "var(--radius-md)",
                                        fontFamily: "inherit",
                                        width: "100%",
                                        cursor: "pointer",
                                    }}
                                >
                                    {GRADES.map((grade) => (
                                        <option key={grade} value={grade}>
                                            {grade}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        )}

                        <div className="input-group" style={{ marginBottom: "1rem" }}>
                            <label>Message</label>
                            <textarea
                                rows={4}
                                placeholder="Write announcement..."
                                value={message}
                                onChange={(e) => setMessage(e.target.value)}
                                style={{
                                    padding: "0.75rem",
                                    background: "var(--gray-50)",
                                    border: "1.5px solid var(--gray-200)",
                                    borderRadius: "var(--radius-md)",
                                    fontFamily: "inherit",
                                    resize: "vertical",
                                    width: "100%",
                                }}
                            />
                        </div>

                        {showScheduleForm && (
                            <div className="input-group" style={{ marginBottom: "1rem" }}>
                                <label>Schedule Date</label>
                                <input
                                    type="date"
                                    value={scheduledDate}
                                    onChange={(e) => setScheduledDate(e.target.value)}
                                    style={{
                                        padding: "0.75rem",
                                        background: "var(--gray-50)",
                                        border: "1.5px solid var(--gray-200)",
                                        borderRadius: "var(--radius-md)",
                                        fontFamily: "inherit",
                                        width: "100%",
                                    }}
                                />
                            </div>
                        )}

                        <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
                            {!showScheduleForm && (
                                <>
                                    <button className="btn btn-primary" onClick={handleSendNow}>
                                        Send Now
                                    </button>
                                    <button className="btn btn-outline" onClick={() => setShowScheduleForm(true)}>
                                        Schedule
                                    </button>
                                </>
                            )}
                            {showScheduleForm && (
                                <>
                                    <button className="btn btn-primary" onClick={handleSchedule}>
                                        Schedule Announcement
                                    </button>
                                    <button
                                        className="btn btn-outline"
                                        onClick={() => {
                                            setShowScheduleForm(false);
                                            setScheduledDate("");
                                        }}
                                    >
                                        Cancel Schedule
                                    </button>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Announcements List */}
            <div className="card">
                <h3 className="card-title" style={{ marginBottom: "1rem" }}>
                    Announcements At A Glance
                </h3>

                <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: "1rem", marginBottom: "1.25rem" }}>
                    <div style={{ border: "1px solid #bbf7d0", borderRadius: "var(--radius-md)", background: "#f0fdf4", padding: "0.9rem" }}>
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "0.65rem" }}>
                            <span style={{ fontSize: "0.82rem", fontWeight: 800, color: "#166534", letterSpacing: "0.03em", textTransform: "uppercase" }}>Sent</span>
                            <span style={{ fontSize: "0.82rem", fontWeight: 700, color: "#166534" }}>{sentAnnouncements.length}</span>
                        </div>
                        <div style={{ display: "flex", flexDirection: "column", gap: "0.45rem" }}>
                            {sentAnnouncements.slice(0, 3).map((ann) => (
                                <div key={`sent-${ann.id}`} style={{ fontSize: "0.85rem", color: "#14532d", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                                    {ann.title}
                                </div>
                            ))}
                            {sentAnnouncements.length === 0 && (
                                <div style={{ fontSize: "0.82rem", color: "#166534" }}>No sent announcements yet.</div>
                            )}
                        </div>
                    </div>

                    <div style={{ border: "1px solid #fed7aa", borderRadius: "var(--radius-md)", background: "#fff7ed", padding: "0.9rem" }}>
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "0.65rem" }}>
                            <span style={{ fontSize: "0.82rem", fontWeight: 800, color: "#9a3412", letterSpacing: "0.03em", textTransform: "uppercase" }}>Upcoming</span>
                            <span style={{ fontSize: "0.82rem", fontWeight: 700, color: "#9a3412" }}>{upcomingAnnouncements.length}</span>
                        </div>
                        <div style={{ display: "flex", flexDirection: "column", gap: "0.45rem" }}>
                            {upcomingAnnouncements.slice(0, 3).map((ann) => (
                                <div key={`upcoming-${ann.id}`} style={{ fontSize: "0.85rem", color: "#7c2d12", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                                    {ann.title}
                                </div>
                            ))}
                            {upcomingAnnouncements.length === 0 && (
                                <div style={{ fontSize: "0.82rem", color: "#9a3412" }}>No upcoming announcements.</div>
                            )}
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

                {visibleAnnouncements.length > 0 ? (
                    <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                        {visibleAnnouncements.map((ann) => (
                            (() => {
                                const scheduleState = ann.status === "scheduled" ? getScheduleState(ann.scheduledDate) : null;
                                const statusText = ann.status === "sent"
                                    ? "SENT"
                                    : scheduleState === "upcoming"
                                    ? "UPCOMING"
                                    : scheduleState === "today"
                                    ? "SCHEDULED TODAY"
                                    : scheduleState === "overdue"
                                    ? "OVERDUE"
                                    : "SCHEDULED";
                                const statusStyle = ann.status === "sent"
                                                                        ? { background: "#dcfce7", color: "#166534" }
                                    : scheduleState === "upcoming"
                                    ? { background: "#fff7ed", color: "#c2410c" }
                                    : scheduleState === "today"
                                    ? { background: "#ecfeff", color: "#0e7490" }
                                    : scheduleState === "overdue"
                                    ? { background: "#fef2f2", color: "#b91c1c" }
                                                                        : { background: "#dbeafe", color: "#1d4ed8" };
                                                                const cardStyle = ann.status === "sent"
                                                                        ? {
                                                                                background: "#f0fdf4",
                                                                                border: "1px solid #bbf7d0",
                                                                                borderLeft: "4px solid #22c55e",
                                                                            }
                                                                        : {
                                                                                background: "#fffbeb",
                                                                                border: "1px solid #fde68a",
                                                                                borderLeft: "4px solid #f59e0b",
                                                                            };

                                return (
                            <div
                                key={ann.id}
                                style={{
                                    padding: "1rem",
                                    borderRadius: "var(--radius-md)",
                                    ...cardStyle,
                                }}
                            >
                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start", marginBottom: "0.5rem" }}>
                                    <div>
                                        <h4 style={{ fontSize: "1rem", fontWeight: 700, color: "var(--gray-900)", marginBottom: "0.25rem" }}>
                                            {ann.title}
                                        </h4>
                                        <p style={{ fontSize: "0.875rem", color: "#4b5563" }}>
                                            Target: <strong>{ann.target}</strong>
                                        </p>
                                    </div>
                                    <div
                                        style={{
                                            padding: "0.35rem 0.75rem",
                                            borderRadius: "var(--radius-sm)",
                                            fontSize: "0.75rem",
                                            fontWeight: 700,
                                            ...statusStyle,
                                        }}
                                    >
                                        {statusText}
                                    </div>
                                </div>
                                <p style={{ fontSize: "0.9rem", color: "#1f2937", marginBottom: "0.5rem", lineHeight: 1.5 }}>
                                    {ann.message}
                                </p>
                                <p style={{ fontSize: "0.75rem", color: "#6b7280" }}>
                                    {ann.status === "sent" ? `Sent on ${ann.date}` : `Scheduled for ${formatDate(ann.scheduledDate)}`}
                                </p>
                            </div>
                                );
                            })()
                        ))}
                    </div>
                ) : (
                    <div style={{ textAlign: "center", padding: "2rem", color: "var(--gray-400)" }}>
                        No announcements in this view.
                    </div>
                )}
            </div>
        </div>
    );
}
