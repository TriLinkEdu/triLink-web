"use client";
import { useState, useMemo } from "react";

type AttendanceStatus = "present" | "absent" | "excused";

interface AttendanceRecord {
    id: string;
    studentName: string;
    studentId: string;
    class: string;
    date: string;
    teacherName: string;
    status: AttendanceStatus;
    excuseNote?: string;
    corrected?: boolean;
    correctedStatus?: AttendanceStatus;
    correctionReason?: string;
    correctedBy?: string;
}

const MOCK_RECORDS: AttendanceRecord[] = [
    { id: "ATT-001", studentName: "Abebe Kebede", studentId: "STU-042", class: "Grade 11-A", date: "2026-03-07", teacherName: "Mr. Solomon", status: "absent" },
    { id: "ATT-002", studentName: "Kalkidan Assefa", studentId: "STU-015", class: "Grade 11-A", date: "2026-03-07", teacherName: "Mr. Solomon", status: "present" },
    { id: "ATT-003", studentName: "Yohannes Belay", studentId: "STU-028", class: "Grade 11-A", date: "2026-03-07", teacherName: "Mr. Solomon", status: "excused", excuseNote: "Medical appointment" },
    { id: "ATT-004", studentName: "Meron Girma", studentId: "STU-033", class: "Grade 11-A", date: "2026-03-07", teacherName: "Mr. Solomon", status: "absent" },
    { id: "ATT-005", studentName: "Samuel Dereje", studentId: "STU-019", class: "Grade 11-B", date: "2026-03-07", teacherName: "Ms. Hiwot", status: "present" },
    { id: "ATT-006", studentName: "Hana Tadesse", studentId: "STU-051", class: "Grade 11-B", date: "2026-03-07", teacherName: "Ms. Hiwot", status: "absent" },
    { id: "ATT-007", studentName: "Dawit Mulugeta", studentId: "STU-007", class: "Grade 12-A", date: "2026-03-06", teacherName: "Mr. Solomon", status: "absent" },
    { id: "ATT-008", studentName: "Fatima Hassan", studentId: "STU-044", class: "Grade 12-A", date: "2026-03-06", teacherName: "Mr. Solomon", status: "present" },
    { id: "ATT-009", studentName: "Lidya Solomon", studentId: "STU-062", class: "Grade 12-B", date: "2026-03-06", teacherName: "Ms. Hiwot", status: "absent" },
    { id: "ATT-010", studentName: "Temesgen Alemu", studentId: "STU-011", class: "Grade 12-B", date: "2026-03-06", teacherName: "Ms. Hiwot", status: "present" },
];

const STATUS_LABELS: Record<AttendanceStatus, string> = { present: "Present", absent: "Absent", excused: "Excused" };
const STATUS_BADGE: Record<AttendanceStatus, string> = { present: "badge-success", absent: "badge-danger", excused: "badge-warning" };

export default function AdminAttendance() {
    const [records, setRecords] = useState<AttendanceRecord[]>(MOCK_RECORDS.map(r => ({ ...r })));
    const [filterClass, setFilterClass] = useState("All");
    const [filterDate, setFilterDate] = useState("All");
    const [filterStatus, setFilterStatus] = useState("All");
    const [searchQuery, setSearchQuery] = useState("");

    // Correction modal
    const [selected, setSelected] = useState<AttendanceRecord | null>(null);
    const [newStatus, setNewStatus] = useState<AttendanceStatus>("present");
    const [correctionReason, setCorrectionReason] = useState("");
    const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null);

    const showToast = (msg: string, ok = true) => { setToast({ msg, ok }); setTimeout(() => setToast(null), 3500); };

    const classes = ["All", ...Array.from(new Set(MOCK_RECORDS.map(r => r.class)))];
    const dates = ["All", ...Array.from(new Set(MOCK_RECORDS.map(r => r.date))).sort().reverse()];

    const filtered = useMemo(() => records.filter(r => {
        if (filterClass !== "All" && r.class !== filterClass) return false;
        if (filterDate !== "All" && r.date !== filterDate) return false;
        if (filterStatus !== "All") {
            const effective = r.corrected ? r.correctedStatus! : r.status;
            if (effective !== filterStatus) return false;
        }
        if (searchQuery) {
            const q = searchQuery.toLowerCase();
            return r.studentName.toLowerCase().includes(q) || r.studentId.toLowerCase().includes(q) || r.teacherName.toLowerCase().includes(q);
        }
        return true;
    }), [records, filterClass, filterDate, filterStatus, searchQuery]);

    const stats = useMemo(() => {
        const eff = records.map(r => r.corrected ? r.correctedStatus! : r.status);
        return {
            total: records.length,
            present: eff.filter(s => s === "present").length,
            absent: eff.filter(s => s === "absent").length,
            excused: eff.filter(s => s === "excused").length,
            corrections: records.filter(r => r.corrected).length,
        };
    }, [records]);

    const openModal = (r: AttendanceRecord) => {
        setSelected(r);
        setNewStatus(r.corrected ? r.correctedStatus! : r.status);
        setCorrectionReason("");
    };

    const applyCorrection = () => {
        if (!selected) return;
        if (!correctionReason.trim()) { showToast("Please enter a reason for correction", false); return; }
        const effective = selected.corrected ? selected.correctedStatus! : selected.status;
        if (newStatus === effective) { showToast("No change — select a different status", false); return; }
        setRecords(prev => prev.map(r => r.id === selected.id ? {
            ...r,
            corrected: true,
            correctedStatus: newStatus,
            correctionReason: correctionReason.trim(),
            correctedBy: "Admin User",
        } : r));
        showToast(`${selected.studentName}'s attendance corrected to ${STATUS_LABELS[newStatus]} ✓`);
        setSelected(null);
        setCorrectionReason("");
    };

    const revertCorrection = (id: string) => {
        setRecords(prev => prev.map(r => r.id === id ? { ...r, corrected: false, correctedStatus: undefined, correctionReason: undefined, correctedBy: undefined } : r));
        showToast("Correction reverted");
    };

    return (
        <div className="page-wrapper">
            {/* Toast */}
            {toast && (
                <div style={{ position: "fixed", top: 20, right: 20, zIndex: 9999, background: "#fff", borderRadius: 14, padding: "1rem 1.5rem", boxShadow: "0 8px 30px rgba(0,0,0,0.12)", border: `1.5px solid ${toast.ok ? "var(--success)" : "var(--danger)"}`, display: "flex", alignItems: "center", gap: "0.75rem", animation: "fadeIn 0.3s ease" }}>
                    <div style={{ width: 32, height: 32, borderRadius: 8, background: toast.ok ? "var(--success-light)" : "var(--danger-light)", display: "flex", alignItems: "center", justifyContent: "center", color: toast.ok ? "var(--success)" : "var(--danger)" }}>
                        {toast.ok ? <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg> : <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>}
                    </div>
                    <span style={{ fontWeight: 600, fontSize: "0.9rem" }}>{toast.msg}</span>
                </div>
            )}

            {/* Correction Modal */}
            {selected && (
                <div style={{ position: "fixed", inset: 0, zIndex: 9998, background: "rgba(0,0,0,0.4)", display: "flex", alignItems: "center", justifyContent: "center", padding: "1rem" }}>
                    <div style={{ background: "#fff", borderRadius: 20, padding: "2rem", width: "100%", maxWidth: 500, boxShadow: "0 25px 60px rgba(0,0,0,0.25)" }}>
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1.5rem" }}>
                            <h2 style={{ fontSize: "1.1rem", fontWeight: 700 }}>Correct Attendance Record</h2>
                            <button onClick={() => setSelected(null)} style={{ width: 32, height: 32, borderRadius: 8, border: "1.5px solid var(--gray-200)", background: "var(--gray-50)", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: "var(--gray-500)" }}>
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
                            </button>
                        </div>

                        {/* Student info */}
                        <div style={{ padding: "1rem", background: "var(--gray-50)", borderRadius: 12, marginBottom: "1.25rem" }}>
                            <div style={{ fontWeight: 700, fontSize: "0.95rem" }}>{selected.studentName}</div>
                            <div style={{ fontSize: "0.8rem", color: "var(--gray-500)", marginTop: 4 }}>{selected.studentId} · {selected.class} · {selected.date}</div>
                            <div style={{ fontSize: "0.8rem", color: "var(--gray-500)" }}>Marked by: {selected.teacherName}</div>
                            <div style={{ marginTop: "0.75rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                                <span style={{ fontSize: "0.8rem", color: "var(--gray-600)" }}>Current:</span>
                                <span className={`badge ${STATUS_BADGE[selected.corrected ? selected.correctedStatus! : selected.status]}`}>
                                    {STATUS_LABELS[selected.corrected ? selected.correctedStatus! : selected.status]}
                                </span>
                                {selected.corrected && <span className="badge badge-primary" style={{ fontSize: "0.68rem" }}>Admin override</span>}
                            </div>
                        </div>

                        {/* New status */}
                        <div style={{ marginBottom: "1.25rem" }}>
                            <label style={{ fontSize: "0.78rem", fontWeight: 600, color: "var(--gray-600)", textTransform: "uppercase", letterSpacing: "0.05em", display: "block", marginBottom: "0.5rem" }}>Change Status To</label>
                            <div style={{ display: "flex", gap: "0.5rem" }}>
                                {(["present", "absent", "excused"] as AttendanceStatus[]).map(s => (
                                    <button key={s} onClick={() => setNewStatus(s)}
                                        style={{ padding: "0.5rem 1rem", borderRadius: 8, border: `2px solid ${newStatus === s ? (s === "present" ? "var(--success)" : s === "absent" ? "var(--danger)" : "var(--warning)") : "var(--gray-200)"}`, background: newStatus === s ? (s === "present" ? "var(--success-light)" : s === "absent" ? "var(--danger-light)" : "var(--warning-light)") : "#fff", color: newStatus === s ? (s === "present" ? "#065f46" : s === "absent" ? "#991b1b" : "#92400e") : "var(--gray-600)", fontWeight: 600, fontSize: "0.85rem", cursor: "pointer" }}>
                                        {STATUS_LABELS[s]}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Reason */}
                        <div style={{ marginBottom: "1.5rem" }}>
                            <label style={{ fontSize: "0.78rem", fontWeight: 600, color: "var(--gray-600)", textTransform: "uppercase", letterSpacing: "0.05em", display: "block", marginBottom: "0.5rem" }}>Reason for Correction <span style={{ color: "var(--danger)" }}>*</span></label>
                            <textarea value={correctionReason} onChange={e => setCorrectionReason(e.target.value)} rows={3}
                                placeholder="e.g., Student provided late note; teacher marked absent by mistake…"
                                style={{ width: "100%", padding: "0.75rem 1rem", border: "1.5px solid var(--gray-200)", borderRadius: 10, fontSize: "0.875rem", fontFamily: "inherit", resize: "vertical", background: "var(--gray-50)" }}
                                onFocus={e => { e.target.style.borderColor = "var(--primary-400)"; e.target.style.boxShadow = "0 0 0 3px var(--primary-50)"; }}
                                onBlur={e => { e.target.style.borderColor = "var(--gray-200)"; e.target.style.boxShadow = "none"; }} />
                        </div>

                        <div style={{ display: "flex", gap: "0.75rem" }}>
                            <button onClick={() => setSelected(null)} className="btn btn-secondary" style={{ flex: 1 }}>Cancel</button>
                            <button onClick={applyCorrection} className="btn btn-primary" style={{ flex: 1 }}>Apply Correction</button>
                        </div>
                    </div>
                </div>
            )}

            <div className="page-header">
                <div>
                    <h1 className="page-title" style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--primary-500)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M22 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg>
                        Attendance Management
                    </h1>
                    <p className="page-subtitle">Review and correct attendance records submitted by teachers</p>
                </div>
                <button className="btn btn-outline">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: "0.4rem" }}><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" /></svg>
                    Export CSV
                </button>
            </div>

            {/* Stats */}
            <div className="stats-grid" style={{ marginBottom: "1.5rem" }}>
                <div className="stat-card">
                    <div className="stat-icon" style={{ background: "var(--gray-100)", color: "var(--gray-700)" }}>
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="18" x="3" y="4" rx="2" /><line x1="16" x2="16" y1="2" y2="6" /><line x1="8" x2="8" y1="2" y2="6" /><line x1="3" x2="21" y1="10" y2="10" /></svg>
                    </div>
                    <div className="stat-info"><div className="stat-label">Total Records</div><div className="stat-value">{stats.total}</div></div>
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
                    <div className="stat-icon" style={{ background: "var(--purple-light)", color: "var(--purple)" }}>
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" /></svg>
                    </div>
                    <div className="stat-info"><div className="stat-label">Corrections</div><div className="stat-value" style={{ color: "var(--purple)" }}>{stats.corrections}</div></div>
                </div>
            </div>

            {/* Filters */}
            <div className="card" style={{ marginBottom: "1.5rem" }}>
                <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap", alignItems: "center" }}>
                    <div className="input-group" style={{ marginBottom: 0, flex: "1 1 200px" }}>
                        <label>Search</label>
                        <div className="input-field">
                            <input value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="Student name, ID, teacher…" />
                        </div>
                    </div>
                    <div className="input-group" style={{ marginBottom: 0, flex: "0 0 160px" }}>
                        <label>Class</label>
                        <select value={filterClass} onChange={e => setFilterClass(e.target.value)}
                            style={{ padding: "0.65rem 1rem", background: "var(--gray-50)", border: "1.5px solid var(--gray-200)", borderRadius: "var(--radius-md)", fontSize: "0.875rem", fontFamily: "inherit", width: "100%" }}>
                            {classes.map(c => <option key={c}>{c}</option>)}
                        </select>
                    </div>
                    <div className="input-group" style={{ marginBottom: 0, flex: "0 0 160px" }}>
                        <label>Date</label>
                        <select value={filterDate} onChange={e => setFilterDate(e.target.value)}
                            style={{ padding: "0.65rem 1rem", background: "var(--gray-50)", border: "1.5px solid var(--gray-200)", borderRadius: "var(--radius-md)", fontSize: "0.875rem", fontFamily: "inherit", width: "100%" }}>
                            {dates.map(d => <option key={d}>{d}</option>)}
                        </select>
                    </div>
                    <div className="input-group" style={{ marginBottom: 0, flex: "0 0 160px" }}>
                        <label>Status</label>
                        <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
                            style={{ padding: "0.65rem 1rem", background: "var(--gray-50)", border: "1.5px solid var(--gray-200)", borderRadius: "var(--radius-md)", fontSize: "0.875rem", fontFamily: "inherit", width: "100%" }}>
                            <option>All</option><option value="present">Present</option><option value="absent">Absent</option><option value="excused">Excused</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* Records table */}
            <div className="card">
                <div className="card-header">
                    <h3 className="card-title">Attendance Records</h3>
                    <span style={{ fontSize: "0.8rem", color: "var(--gray-500)" }}>{filtered.length} record(s)</span>
                </div>
                <div className="table-wrapper">
                    <table>
                        <thead>
                            <tr>
                                <th>Student</th>
                                <th>Class</th>
                                <th>Date</th>
                                <th>Teacher</th>
                                <th>Original</th>
                                <th>Effective</th>
                                <th>Note / Reason</th>
                                <th>Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filtered.map(r => {
                                const effective: AttendanceStatus = r.corrected ? r.correctedStatus! : r.status;
                                return (
                                    <tr key={r.id} style={{ background: r.corrected ? "rgba(139,92,246,0.03)" : "transparent" }}>
                                        <td>
                                            <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
                                                <div style={{ width: 32, height: 32, borderRadius: 8, background: "var(--primary-100)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.7rem", fontWeight: 700, color: "var(--primary-700)" }}>
                                                    {r.studentName.split(" ").map(n => n[0]).join("")}
                                                </div>
                                                <div>
                                                    <div style={{ fontWeight: 600, fontSize: "0.875rem" }}>{r.studentName}</div>
                                                    <div style={{ fontSize: "0.72rem", color: "var(--gray-400)" }}>{r.studentId}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td style={{ fontSize: "0.85rem" }}>{r.class}</td>
                                        <td style={{ fontSize: "0.85rem", color: "var(--gray-500)" }}>{r.date}</td>
                                        <td style={{ fontSize: "0.85rem" }}>{r.teacherName}</td>
                                        <td>
                                            <span className={`badge ${STATUS_BADGE[r.status]}`} style={{ fontSize: "0.72rem" }}>
                                                {STATUS_LABELS[r.status]}
                                            </span>
                                        </td>
                                        <td>
                                            <div style={{ display: "flex", alignItems: "center", gap: "0.35rem" }}>
                                                <span className={`badge ${STATUS_BADGE[effective]}`} style={{ fontSize: "0.72rem" }}>
                                                    {STATUS_LABELS[effective]}
                                                </span>
                                                {r.corrected && (
                                                    <span style={{ fontSize: "0.65rem", padding: "0.1rem 0.35rem", borderRadius: 4, background: "var(--purple-light)", color: "var(--purple)", fontWeight: 600 }}>edited</span>
                                                )}
                                            </div>
                                        </td>
                                        <td style={{ maxWidth: 200 }}>
                                            {r.corrected && r.correctionReason ? (
                                                <div>
                                                    <div style={{ fontSize: "0.75rem", color: "var(--gray-600)", fontStyle: "italic" }}>{r.correctionReason}</div>
                                                    <div style={{ fontSize: "0.68rem", color: "var(--gray-400)", marginTop: 2 }}>by {r.correctedBy}</div>
                                                </div>
                                            ) : r.excuseNote ? (
                                                <span style={{ fontSize: "0.75rem", color: "var(--gray-600)", fontStyle: "italic" }}>{r.excuseNote}</span>
                                            ) : (
                                                <span style={{ fontSize: "0.75rem", color: "var(--gray-300)" }}>—</span>
                                            )}
                                        </td>
                                        <td>
                                            <div style={{ display: "flex", gap: "0.35rem" }}>
                                                <button className="btn btn-primary btn-sm" onClick={() => openModal(r)}>Correct</button>
                                                {r.corrected && (
                                                    <button className="btn btn-outline btn-sm" onClick={() => revertCorrection(r.id)}>Revert</button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                            {filtered.length === 0 && (
                                <tr>
                                    <td colSpan={8} style={{ textAlign: "center", padding: "3rem", color: "var(--gray-400)" }}>
                                        No records match the selected filters
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
