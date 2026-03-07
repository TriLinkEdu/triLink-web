"use client";
import { useState, useMemo } from "react";

type AttendanceStatus = "present" | "absent" | "excused";

interface Student {
    name: string;
    id: string;
}

export default function TeacherAttendance() {
    const [selectedClass, setSelectedClass] = useState("Grade 11-A");
    const classes = ["Grade 11-A", "Grade 11-B", "Grade 12-A", "Grade 12-B"];

    const students: Student[] = [
        { name: "Abebe Kebede", id: "STU-042" },
        { name: "Kalkidan Assefa", id: "STU-015" },
        { name: "Yohannes Belay", id: "STU-028" },
        { name: "Meron Girma", id: "STU-033" },
        { name: "Samuel Dereje", id: "STU-019" },
        { name: "Hana Tadesse", id: "STU-051" },
        { name: "Dawit Mulugeta", id: "STU-007" },
        { name: "Fatima Hassan", id: "STU-044" },
        { name: "Lidya Solomon", id: "STU-062" },
        { name: "Temesgen Alemu", id: "STU-011" },
    ];

    // All present by default
    const [attendance, setAttendance] = useState<Record<string, AttendanceStatus>>(
        Object.fromEntries(students.map(s => [s.id, "present" as AttendanceStatus]))
    );
    const [excuseNotes, setExcuseNotes] = useState<Record<string, string>>({});
    const [saved, setSaved] = useState(false);

    const togglePresent = (id: string) => {
        setAttendance(prev => {
            const current = prev[id];
            if (current === "present") {
                return { ...prev, [id]: "absent" };
            } else {
                // Going back to present — clear excuse
                const newNotes = { ...excuseNotes };
                delete newNotes[id];
                setExcuseNotes(newNotes);
                return { ...prev, [id]: "present" };
            }
        });
        setSaved(false);
    };

    const setExcused = (id: string) => {
        setAttendance(prev => ({ ...prev, [id]: "excused" }));
        setSaved(false);
    };

    const setAbsent = (id: string) => {
        setAttendance(prev => ({ ...prev, [id]: "absent" }));
        const newNotes = { ...excuseNotes };
        delete newNotes[id];
        setExcuseNotes(newNotes);
        setSaved(false);
    };

    const updateExcuseNote = (id: string, note: string) => {
        setExcuseNotes(prev => ({ ...prev, [id]: note }));
    };

    const markAllPresent = () => {
        setAttendance(Object.fromEntries(students.map(s => [s.id, "present" as AttendanceStatus])));
        setExcuseNotes({});
        setSaved(false);
    };

    const stats = useMemo(() => {
        const values = Object.values(attendance);
        return {
            present: values.filter(v => v === "present").length,
            absent: values.filter(v => v === "absent").length,
            excused: values.filter(v => v === "excused").length,
            total: students.length,
        };
    }, [attendance, students.length]);

    const handleSave = () => {
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
    };

    const today = new Date().toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" });

    return (
        <div className="page-wrapper">
            <div className="page-header">
                <div>
                    <h1 className="page-title" style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--primary-500)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M22 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg>
                        Attendance
                    </h1>
                    <p className="page-subtitle">{today}</p>
                </div>
                <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
                    <button className="btn btn-secondary" onClick={markAllPresent} style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" /></svg>
                        Mark All Present
                    </button>
                    <button className="btn btn-primary" onClick={handleSave} style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" /><polyline points="17 21 17 13 7 13 7 21" /><polyline points="7 3 7 8 15 8" /></svg>
                        Save Attendance
                    </button>
                </div>
            </div>

            {/* Success Toast */}
            {saved && (
                <div style={{
                    position: "fixed", top: 20, right: 20, zIndex: 9999,
                    background: "#fff", borderRadius: 14, padding: "1rem 1.5rem",
                    boxShadow: "0 8px 30px rgba(0,0,0,0.12)", border: "1.5px solid var(--success)",
                    display: "flex", alignItems: "center", gap: "0.75rem",
                    animation: "fadeIn 0.3s ease",
                }}>
                    <div style={{ width: 32, height: 32, borderRadius: 8, background: "var(--success-light)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--success)" }}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
                    </div>
                    <span style={{ fontWeight: 600, fontSize: "0.9rem" }}>Attendance saved successfully!</span>
                </div>
            )}

            {/* Class Tabs */}
            <div style={{ display: "flex", gap: "0.5rem", marginBottom: "1.5rem", flexWrap: "wrap" }}>
                {classes.map(c => (
                    <button key={c} className={`btn ${selectedClass === c ? "btn-primary" : "btn-secondary"}`} onClick={() => setSelectedClass(c)}>{c}</button>
                ))}
            </div>

            {/* Stats Bar */}
            <div className="stats-grid" style={{ marginBottom: "1.5rem" }}>
                <div className="stat-card">
                    <div className="stat-icon" style={{ background: "var(--gray-100)", color: "var(--gray-700)" }}>
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M22 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg>
                    </div>
                    <div className="stat-info"><div className="stat-label">Total</div><div className="stat-value">{stats.total}</div></div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon" style={{ background: "var(--success-light)", color: "var(--success)" }}>
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" /></svg>
                    </div>
                    <div className="stat-info"><div className="stat-label">Present</div><div className="stat-value" style={{ color: "var(--success)" }}>{stats.present}</div></div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon" style={{ background: "var(--danger-light)", color: "var(--danger)" }}>
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
                    </div>
                    <div className="stat-info"><div className="stat-label">Absent</div><div className="stat-value" style={{ color: "var(--danger)" }}>{stats.absent}</div></div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon" style={{ background: "var(--warning-light)", color: "var(--warning)" }}>
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z" /><path d="M14 2v4a2 2 0 0 0 2 2h4" /><line x1="9" x2="15" y1="13" y2="13" /></svg>
                    </div>
                    <div className="stat-info"><div className="stat-label">Excused</div><div className="stat-value" style={{ color: "var(--warning)" }}>{stats.excused}</div></div>
                </div>
            </div>

            {/* Attendance Table */}
            <div className="card">
                <div className="card-header">
                    <h3 className="card-title" style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--gray-500)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="18" x="3" y="4" rx="2" ry="2" /><line x1="16" x2="16" y1="2" y2="6" /><line x1="8" x2="8" y1="2" y2="6" /><line x1="3" x2="21" y1="10" y2="10" /></svg>
                        {selectedClass} — {new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
                    </h3>
                    <div style={{ fontSize: "0.8rem", color: "var(--gray-500)" }}>
                        Uncheck absent students, then mark as excused if applicable
                    </div>
                </div>
                <div className="table-wrapper">
                    <table>
                        <thead>
                            <tr>
                                <th style={{ width: 48 }}>#</th>
                                <th>Student</th>
                                <th style={{ width: 90 }}>ID</th>
                                <th style={{ width: 70, textAlign: "center" }}>Present</th>
                                <th style={{ width: 100 }}>Status</th>
                                <th>Excuse Note</th>
                            </tr>
                        </thead>
                        <tbody>
                            {students.map((s, i) => {
                                const status = attendance[s.id];
                                const isPresent = status === "present";
                                const isExcused = status === "excused";
                                const isAbsent = status === "absent";

                                return (
                                    <tr key={s.id} style={{ background: isPresent ? "transparent" : isExcused ? "rgba(139,92,246,0.03)" : "rgba(239,68,68,0.03)" }}>
                                        <td style={{ fontWeight: 500, color: "var(--gray-400)" }}>{i + 1}</td>
                                        <td>
                                            <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
                                                <div style={{
                                                    width: 32, height: 32, borderRadius: 8,
                                                    background: isPresent ? "var(--success-light)" : isExcused ? "var(--purple-light)" : "var(--danger-light)",
                                                    display: "flex", alignItems: "center", justifyContent: "center",
                                                    fontSize: "0.7rem", fontWeight: 700,
                                                    color: isPresent ? "#065f46" : isExcused ? "#5b21b6" : "#991b1b",
                                                }}>
                                                    {s.name.split(" ").map(n => n[0]).join("")}
                                                </div>
                                                <span style={{ fontWeight: 600, fontSize: "0.875rem" }}>{s.name}</span>
                                            </div>
                                        </td>
                                        <td style={{ color: "var(--gray-500)", fontSize: "0.8rem" }}>{s.id}</td>
                                        <td style={{ textAlign: "center" }}>
                                            <button
                                                onClick={() => togglePresent(s.id)}
                                                style={{
                                                    width: 28, height: 28, borderRadius: 8,
                                                    border: `2px solid ${isPresent ? "var(--success)" : "var(--gray-300)"}`,
                                                    background: isPresent ? "var(--success)" : "#fff",
                                                    cursor: "pointer", display: "flex",
                                                    alignItems: "center", justifyContent: "center",
                                                    color: "#fff", transition: "all 150ms ease",
                                                    margin: "0 auto",
                                                }}
                                                title={isPresent ? "Mark as absent" : "Mark as present"}
                                            >
                                                {isPresent && (
                                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
                                                )}
                                            </button>
                                        </td>
                                        <td>
                                            {!isPresent && (
                                                <div style={{ display: "flex", gap: "0.25rem" }}>
                                                    <button
                                                        onClick={() => setAbsent(s.id)}
                                                        style={{
                                                            padding: "0.25rem 0.5rem", borderRadius: 6, fontSize: "0.7rem", fontWeight: 600,
                                                            border: `1.5px solid ${isAbsent ? "var(--danger)" : "var(--gray-200)"}`,
                                                            background: isAbsent ? "var(--danger-light)" : "#fff",
                                                            color: isAbsent ? "#991b1b" : "var(--gray-500)",
                                                            cursor: "pointer",
                                                        }}
                                                    >
                                                        Absent
                                                    </button>
                                                    <button
                                                        onClick={() => setExcused(s.id)}
                                                        style={{
                                                            padding: "0.25rem 0.5rem", borderRadius: 6, fontSize: "0.7rem", fontWeight: 600,
                                                            border: `1.5px solid ${isExcused ? "var(--purple)" : "var(--gray-200)"}`,
                                                            background: isExcused ? "var(--purple-light)" : "#fff",
                                                            color: isExcused ? "#5b21b6" : "var(--gray-500)",
                                                            cursor: "pointer",
                                                        }}
                                                    >
                                                        Excused
                                                    </button>
                                                </div>
                                            )}
                                            {isPresent && (
                                                <span className="badge badge-success" style={{ fontSize: "0.7rem" }}>Present</span>
                                            )}
                                        </td>
                                        <td>
                                            {isExcused && (
                                                <input
                                                    type="text"
                                                    placeholder="Enter excuse reason..."
                                                    value={excuseNotes[s.id] || ""}
                                                    onChange={(e) => updateExcuseNote(s.id, e.target.value)}
                                                    style={{
                                                        width: "100%", padding: "0.4rem 0.65rem",
                                                        borderRadius: 8, border: "1.5px solid var(--purple)",
                                                        background: "var(--purple-light)",
                                                        fontSize: "0.8rem", outline: "none",
                                                        color: "#5b21b6",
                                                    }}
                                                    onFocus={(e) => e.target.style.boxShadow = "0 0 0 3px rgba(139,92,246,0.1)"}
                                                    onBlur={(e) => e.target.style.boxShadow = "none"}
                                                />
                                            )}
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
