"use client";
import { useState, useMemo } from "react";
import { useAttendanceStore } from "@/store/attendanceStore";
import type { AttendanceStatus } from "@/store/attendanceStore";

export default function AdminAttendance() {
    const { sessions, records, unlockSession, correctRecord, revertRecord } = useAttendanceStore();

    const [search, setSearch] = useState("");
    const [dateFilter, setDateFilter] = useState("");
    const [classFilter, setClassFilter] = useState("");

    // Correction modal state
    const [correcting, setCorrecting] = useState<null | { recordId: string; studentName: string; className: string; current: AttendanceStatus }>(null);
    const [newStatus, setNewStatus] = useState<AttendanceStatus>("present");
    const [reason, setReason] = useState("");

    const lockedSessions = useMemo(() =>
        [...sessions]
            .filter(s => s.locked)
            .sort((a, b) => b.submittedAt.localeCompare(a.submittedAt)),
        [sessions]
    );

    const filteredRecords = useMemo(() => {
        let r = records;
        if (search) r = r.filter(x => x.studentName.toLowerCase().includes(search.toLowerCase()) || x.studentId.toLowerCase().includes(search.toLowerCase()));
        if (dateFilter) r = r.filter(x => x.date === dateFilter);
        if (classFilter) r = r.filter(x => x.className === classFilter);
        return r;
    }, [records, search, dateFilter, classFilter]);

    const uniqueClasses = useMemo(() => [...new Set(records.map(r => r.className))].sort(), [records]);

    const openCorrect = (recordId: string, studentName: string, className: string, current: AttendanceStatus) => {
        setCorrecting({ recordId, studentName, className, current });
        setNewStatus(current);
        setReason("");
    };

    const submitCorrection = () => {
        if (!correcting || !reason.trim()) return;
        correctRecord(correcting.recordId, newStatus, reason.trim());
        setCorrecting(null);
    };

    const statusBadge = (status: AttendanceStatus, corrected?: boolean) => {
        const cls = status === "present" ? "badge-success" : status === "excused" ? "badge-warning" : "badge-danger";
        return (
            <span className={`badge ${cls}`} style={{ fontSize: "0.7rem" }}>
                {corrected && <span style={{ marginRight: 3 }}>✏️</span>}
                {status.charAt(0).toUpperCase() + status.slice(1)}
            </span>
        );
    };

    return (
        <div className="page-wrapper">
            {/* Correction modal */}
            {correcting && (
                <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.35)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <div style={{ background: "#fff", borderRadius: 16, padding: "2rem", width: 420, maxWidth: "90vw", boxShadow: "0 20px 60px rgba(0,0,0,0.2)" }}>
                        <h3 style={{ fontWeight: 700, fontSize: "1rem", marginBottom: "0.25rem" }}>Correct Attendance</h3>
                        <p style={{ fontSize: "0.8rem", color: "var(--gray-500)", marginBottom: "1.25rem" }}>
                            {correcting.studentName} · {correcting.className}
                        </p>

                        <div style={{ marginBottom: "1rem" }}>
                            <label style={{ fontSize: "0.76rem", fontWeight: 600, color: "var(--gray-600)", textTransform: "uppercase", letterSpacing: "0.05em", display: "block", marginBottom: "0.4rem" }}>New Status</label>
                            <div style={{ display: "flex", gap: "0.5rem" }}>
                                {(["present", "absent", "excused"] as AttendanceStatus[]).map(s => (
                                    <button key={s} onClick={() => setNewStatus(s)}
                                        style={{ flex: 1, padding: "0.5rem", borderRadius: 8, border: `2px solid ${newStatus === s ? (s === "present" ? "var(--success)" : s === "excused" ? "var(--warning)" : "var(--danger)") : "var(--gray-200)"}`, background: newStatus === s ? (s === "present" ? "var(--success-light)" : s === "excused" ? "var(--warning-light)" : "var(--danger-light)") : "#fff", fontWeight: 600, fontSize: "0.8rem", cursor: "pointer", color: newStatus === s ? (s === "present" ? "#065f46" : s === "excused" ? "#92400e" : "#991b1b") : "var(--gray-600)" }}>
                                        {s.charAt(0).toUpperCase() + s.slice(1)}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div style={{ marginBottom: "1.25rem" }}>
                            <label style={{ fontSize: "0.76rem", fontWeight: 600, color: "var(--gray-600)", textTransform: "uppercase", letterSpacing: "0.05em", display: "block", marginBottom: "0.4rem" }}>Reason *</label>
                            <textarea
                                value={reason}
                                onChange={e => setReason(e.target.value)}
                                rows={3}
                                placeholder="Provide a reason for the correction…"
                                style={{ width: "100%", padding: "0.65rem 0.9rem", borderRadius: 10, border: "1.5px solid var(--gray-200)", fontSize: "0.875rem", resize: "vertical", outline: "none", boxSizing: "border-box" }}
                                onFocus={e => e.target.style.borderColor = "var(--primary-400)"}
                                onBlur={e => e.target.style.borderColor = "var(--gray-200)"}
                            />
                        </div>

                        <div style={{ display: "flex", gap: "0.5rem", justifyContent: "flex-end" }}>
                            <button className="btn btn-secondary" onClick={() => setCorrecting(null)}>Cancel</button>
                            <button className="btn btn-primary" onClick={submitCorrection} disabled={!reason.trim()}>Save Correction</button>
                        </div>
                    </div>
                </div>
            )}

            <div className="page-header">
                <div>
                    <h1 className="page-title">Attendance Management</h1>
                    <p className="page-subtitle">Review submitted sessions and correct records</p>
                </div>
            </div>

            {/* Submitted Sessions Panel */}
            <div className="card" style={{ marginBottom: "1.5rem" }}>
                <div className="card-header">
                    <h3 className="card-title">Submitted Sessions</h3>
                    <span className="badge badge-primary">{lockedSessions.length} sessions</span>
                </div>
                {lockedSessions.length === 0 ? (
                    <p style={{ color: "var(--gray-400)", fontSize: "0.875rem", padding: "1rem 0" }}>No submitted sessions yet.</p>
                ) : (
                    <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                        {lockedSessions.map(s => {
                            const sessionRecords = records.filter(r => r.sessionId === s.id);
                            const presentCount = sessionRecords.filter(r => (r.corrected ? r.correctedStatus : r.status) === "present").length;
                            const absentCount = sessionRecords.filter(r => (r.corrected ? r.correctedStatus : r.status) === "absent").length;
                            const excusedCount = sessionRecords.filter(r => (r.corrected ? r.correctedStatus : r.status) === "excused").length;

                            return (
                                <div key={s.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0.875rem 1rem", background: "var(--gray-50)", borderRadius: 10, gap: "1rem", flexWrap: "wrap" }}>
                                    <div style={{ flex: 1, minWidth: 200 }}>
                                        <div style={{ fontWeight: 700, fontSize: "0.9rem" }}>{s.className}</div>
                                        <div style={{ fontSize: "0.75rem", color: "var(--gray-500)", marginTop: 2 }}>
                                            {s.teacherName} · {s.date} · Submitted {new Date(s.submittedAt).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}
                                        </div>
                                    </div>
                                    <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
                                        <span className="badge badge-success" style={{ fontSize: "0.7rem" }}>{presentCount} Present</span>
                                        <span className="badge badge-danger" style={{ fontSize: "0.7rem" }}>{absentCount} Absent</span>
                                        {excusedCount > 0 && <span className="badge badge-warning" style={{ fontSize: "0.7rem" }}>{excusedCount} Excused</span>}
                                    </div>
                                    <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
                                        {s.unlockGranted ? (
                                            <span className="badge badge-success" style={{ fontSize: "0.7rem" }}>✓ Edit Unlocked</span>
                                        ) : (
                                            <button className="btn btn-secondary" style={{ fontSize: "0.78rem", padding: "0.35rem 0.85rem", display: "flex", alignItems: "center", gap: "0.35rem" }}
                                                onClick={() => unlockSession(s.id)}>
                                                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="11" x="3" y="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0 1 9.9-1" /></svg>
                                                Unlock Edit
                                            </button>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* Records Table */}
            <div className="card">
                <div className="card-header">
                    <h3 className="card-title">Attendance Records</h3>
                    <span className="badge badge-primary">{filteredRecords.length} records</span>
                </div>

                {/* Filters */}
                <div style={{ display: "flex", gap: "0.75rem", marginBottom: "1rem", flexWrap: "wrap" }}>
                    <input
                        type="text"
                        placeholder="Search student…"
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        style={{ flex: 1, minWidth: 160, padding: "0.5rem 0.85rem", borderRadius: 8, border: "1.5px solid var(--gray-200)", fontSize: "0.875rem", outline: "none" }}
                        onFocus={e => e.target.style.borderColor = "var(--primary-400)"}
                        onBlur={e => e.target.style.borderColor = "var(--gray-200)"}
                    />
                    <input
                        type="date"
                        value={dateFilter}
                        onChange={e => setDateFilter(e.target.value)}
                        style={{ padding: "0.5rem 0.85rem", borderRadius: 8, border: "1.5px solid var(--gray-200)", fontSize: "0.875rem", outline: "none" }}
                        onFocus={e => e.target.style.borderColor = "var(--primary-400)"}
                        onBlur={e => e.target.style.borderColor = "var(--gray-200)"}
                    />
                    <select
                        value={classFilter}
                        onChange={e => setClassFilter(e.target.value)}
                        style={{ padding: "0.5rem 0.85rem", borderRadius: 8, border: "1.5px solid var(--gray-200)", fontSize: "0.875rem", outline: "none", background: "#fff" }}
                    >
                        <option value="">All Classes</option>
                        {uniqueClasses.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                    {(search || dateFilter || classFilter) && (
                        <button className="btn btn-secondary" onClick={() => { setSearch(""); setDateFilter(""); setClassFilter(""); }} style={{ fontSize: "0.8rem" }}>
                            Clear
                        </button>
                    )}
                </div>

                <div className="table-wrapper">
                    <table>
                        <thead>
                            <tr>
                                <th>Student</th>
                                <th>ID</th>
                                <th>Class</th>
                                <th>Date</th>
                                <th>Teacher</th>
                                <th>Status</th>
                                <th>Note</th>
                                <th style={{ textAlign: "center" }}>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredRecords.length === 0 ? (
                                <tr><td colSpan={8} style={{ textAlign: "center", color: "var(--gray-400)", padding: "2rem" }}>No records found</td></tr>
                            ) : filteredRecords.map(r => (
                                <tr key={r.id}>
                                    <td style={{ fontWeight: 600, fontSize: "0.875rem" }}>{r.studentName}</td>
                                    <td style={{ color: "var(--gray-500)", fontSize: "0.8rem" }}>{r.studentId}</td>
                                    <td style={{ fontSize: "0.8rem" }}>{r.className}</td>
                                    <td style={{ fontSize: "0.8rem", color: "var(--gray-500)" }}>{r.date}</td>
                                    <td style={{ fontSize: "0.8rem", color: "var(--gray-500)" }}>{r.teacherName}</td>
                                    <td>
                                        {statusBadge(r.corrected && r.correctedStatus ? r.correctedStatus : r.status, r.corrected)}
                                    </td>
                                    <td style={{ fontSize: "0.8rem", color: "var(--gray-500)", fontStyle: r.excuseNote ? "italic" : "normal" }}>
                                        {r.excuseNote ?? "—"}
                                        {r.corrected && r.correctionReason && (
                                            <span style={{ display: "block", color: "var(--primary-500)", fontStyle: "normal" }} title={r.correctionReason}>
                                                ✏️ {r.correctionReason.length > 25 ? r.correctionReason.slice(0, 25) + "…" : r.correctionReason}
                                            </span>
                                        )}
                                    </td>
                                    <td style={{ textAlign: "center" }}>
                                        <div style={{ display: "flex", gap: "0.35rem", justifyContent: "center" }}>
                                            <button
                                                className="btn btn-secondary"
                                                style={{ fontSize: "0.72rem", padding: "0.25rem 0.6rem" }}
                                                onClick={() => openCorrect(r.id, r.studentName, r.className, r.corrected && r.correctedStatus ? r.correctedStatus : r.status)}
                                            >
                                                Correct
                                            </button>
                                            {r.corrected && (
                                                <button
                                                    className="btn btn-secondary"
                                                    style={{ fontSize: "0.72rem", padding: "0.25rem 0.6rem", color: "var(--danger)" }}
                                                    onClick={() => revertRecord(r.id)}
                                                >
                                                    Revert
                                                </button>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
