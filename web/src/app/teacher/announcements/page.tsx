"use client";
import { useRef, useState } from "react";
import { useAnnouncementStore } from "@/store/announcementStore";

export default function TeacherAnnouncements() {
    const { announcements, addAnnouncement } = useAnnouncementStore();
    const [title, setTitle] = useState("");
    const [target, setTarget] = useState("All My Classes");
    const [message, setMessage] = useState("");
    const [showSchedule, setShowSchedule] = useState(false);
    const [scheduledDate, setScheduledDate] = useState("");
    const [toast, setToast] = useState<string | null>(null);
    const formRef = useRef<HTMLDivElement>(null);

    const targets = ["All My Classes", "Grade 11-A", "Grade 11-B", "Grade 12-A"];

    function showToast(msg: string) {
        setToast(msg);
        setTimeout(() => setToast(null), 3000);
    }

    function handleNewAnnouncement() {
        formRef.current?.scrollIntoView({ behavior: "smooth" });
        (formRef.current?.querySelector("input") as HTMLInputElement | null)?.focus();
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
        });
        setTitle("");
        setMessage("");
        setTarget("All My Classes");
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
            scheduledDate: formatted,
        });
        setTitle("");
        setMessage("");
        setTarget("All My Classes");
        setScheduledDate("");
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
                <button className="btn btn-primary" onClick={handleNewAnnouncement}>+ New Announcement</button>
            </div>
            <div className="card" style={{ marginBottom: "1rem" }} ref={formRef}>
                <h3 className="card-title" style={{ marginBottom: "1rem" }}>Create Announcement</h3>
                <div className="input-group" style={{ marginBottom: "1rem" }}>
                    <label>Title</label>
                    <div className="input-field">
                        <input
                            placeholder="Announcement title..."
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                        />
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
                    <button className="btn btn-outline" onClick={handleSchedule}>
                        {showSchedule ? "Confirm Schedule" : "Schedule"}
                    </button>
                    {showSchedule && (
                        <button className="btn btn-outline" onClick={() => { setShowSchedule(false); setScheduledDate(""); }}>
                            Cancel
                        </button>
                    )}
                </div>
            </div>
            <div className="card">
                <h3 className="card-title" style={{ marginBottom: "1rem" }}>Previous Announcements</h3>
                {announcements.length === 0 && (
                    <p style={{ fontSize: "0.875rem", color: "var(--gray-400)", textAlign: "center", padding: "1rem 0" }}>No announcements yet.</p>
                )}
                {announcements.map((a) => (
                    <div key={a.id} style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", padding: "0.75rem", background: "var(--gray-50)", borderRadius: "var(--radius-md)", marginBottom: "0.5rem", gap: "0.5rem" }}>
                        <div style={{ flex: 1 }}>
                            <div style={{ fontWeight: 600, fontSize: "0.875rem" }}>{a.title}</div>
                            <div style={{ fontSize: "0.75rem", color: "var(--gray-500)", margin: "0.2rem 0" }}>To: {a.target} · {a.status === "scheduled" ? `Scheduled: ${a.scheduledDate}` : a.date}</div>
                            <div style={{ fontSize: "0.8rem", color: "var(--gray-600)", marginTop: "0.25rem" }}>{a.message}</div>
                        </div>
                        <span className={`badge ${a.status === "sent" ? "badge-success" : "badge-warning"}`} style={{ flexShrink: 0 }}>{a.status}</span>
                    </div>
                ))}
            </div>
        </div>
    );
}
