"use client";
import { useState, useEffect, useMemo, useCallback } from "react";
import Select from "@/components/Select";
import {
    getActiveAcademicYear,
    listMyClassOfferings,
    listEnrollments,
    listUsers,
    listExams,
    listExamAttempts,
    classAttendanceReport,
    type ClassOffering,
    type PublicUser,
    type Exam,
} from "@/lib/admin-api";

type StudentRow = {
    id: string;
    name: string;
    email: string;
    offeringLabel: string;
    subjects: { name: string; score: number | null; attendance: number }[];
    avg: number;
    attendance: number;
};

function offeringLabel(o: ClassOffering) {
    return o.displayName || o.name?.trim() || `Class ${o.id.slice(0, 8)}`;
}

export default function TeacherStudents() {
    const [offerings, setOfferings] = useState<ClassOffering[]>([]);
    const [students, setStudents] = useState<StudentRow[]>([]);
    const [selectedOffering, setSelectedOffering] = useState("");
    const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [err, setErr] = useState<string | null>(null);

    const loadData = useCallback(async () => {
        setLoading(true);
        setErr(null);
        try {
            const year = await getActiveAcademicYear();
            if (!year) { setErr("No active academic year"); setLoading(false); return; }

            const mine = await listMyClassOfferings(year.id);
            setOfferings(mine);
            if (mine.length > 0 && !mine.find(o => o.id === selectedOffering)) {
                setSelectedOffering(mine[0].id);
            }
        } catch (e) {
            setErr(e instanceof Error ? e.message : "Failed to load data");
        } finally {
            setLoading(false);
        }
    }, [selectedOffering]);

    useEffect(() => { loadData(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

    // Load students for selected offering
    useEffect(() => {
        if (!selectedOffering) return;
        let cancelled = false;

        (async () => {
            setLoading(true);
            try {
                const year = await getActiveAcademicYear();
                if (!year || cancelled) return;

                const offering = offerings.find(o => o.id === selectedOffering);
                if (!offering) return;

                // Get enrolled students
                const enrollments = await listEnrollments({ classOfferingId: selectedOffering, academicYearId: year.id });
                const allUsers = await listUsers("student");
                const userMap = new Map<string, PublicUser>(allUsers.map(u => [u.id, u]));

                // Get exams for this class
                const exams = await listExams(year.id);
                const classExams = exams.filter(ex => ex.classOfferingId === selectedOffering && ex.published);

                // Get attempts for these exams
                const attemptsByExam: Record<string, Record<string, { score: number | null }>> = {};
                for (const ex of classExams) {
                    try {
                        const res = await listExamAttempts(ex.id);
                        const map: Record<string, { score: number | null }> = {};
                        if (res?.attempts) {
                            for (const a of res.attempts) {
                                map[a.studentId] = { score: a.score };
                            }
                        }
                        attemptsByExam[ex.id] = map;
                    } catch { /* exam may not have attempts */ }
                }

                // Get attendance report for this class
                let attendanceMap: Record<string, { present: number; total: number }> = {};
                try {
                    const report = await classAttendanceReport(selectedOffering);
                    if (report?.sessions) {
                        for (const session of report.sessions) {
                            for (const mark of session.marks) {
                                if (!attendanceMap[mark.studentId]) {
                                    attendanceMap[mark.studentId] = { present: 0, total: 0 };
                                }
                                attendanceMap[mark.studentId].total += 1;
                                if (mark.status === "present" || mark.status === "excused") {
                                    attendanceMap[mark.studentId].present += 1;
                                }
                            }
                        }
                    }
                } catch { /* no attendance data */ }

                // Build student rows
                const rows: StudentRow[] = enrollments.map(e => {
                    const u = userMap.get(e.studentId);
                    const name = u ? `${u.firstName} ${u.lastName}` : e.studentId.slice(0, 8);

                    // Per-exam scores (treated as per-subject)
                    const subjects = classExams.map(ex => {
                        const att = attemptsByExam[ex.id]?.[e.studentId];
                        return {
                            name: ex.title,
                            score: att?.score ?? null,
                            attendance: 0, // filled below per student
                        };
                    });

                    const scoredSubjects = subjects.filter(s => s.score !== null);
                    const avg = scoredSubjects.length > 0
                        ? Math.round(scoredSubjects.reduce((sum, s) => sum + (s.score ?? 0), 0) / scoredSubjects.length)
                        : 0;

                    const attData = attendanceMap[e.studentId];
                    const attendanceRate = attData && attData.total > 0
                        ? Math.round((attData.present / attData.total) * 100)
                        : 100; // default 100% if no sessions

                    return {
                        id: e.studentId,
                        name,
                        email: u?.email ?? "",
                        offeringLabel: offeringLabel(offering),
                        subjects,
                        avg,
                        attendance: attendanceRate,
                    };
                });

                if (!cancelled) {
                    setStudents(rows);
                    setSelectedStudentId(null);
                }
            } catch (e) {
                if (!cancelled) setErr(e instanceof Error ? e.message : "Failed to load students");
            } finally {
                if (!cancelled) setLoading(false);
            }
        })();

        return () => { cancelled = true; };
    }, [selectedOffering, offerings]);

    // Sort by avg descending to compute rank
    const rankedStudents = useMemo(() => {
        const sorted = [...students].sort((a, b) => b.avg - a.avg);
        return sorted.map((s, i) => ({ ...s, rank: i + 1 }));
    }, [students]);

    const selected = useMemo(() => rankedStudents.find(s => s.id === selectedStudentId), [rankedStudents, selectedStudentId]);

    if (loading && offerings.length === 0) {
        return (
            <div className="page-wrapper">
                <div className="page-header"><div><h1 className="page-title">Students</h1><p className="page-subtitle">Loading…</p></div></div>
                <div className="card" style={{ textAlign: "center", padding: "3rem", color: "var(--gray-400)" }}>Loading class data…</div>
            </div>
        );
    }

    if (err) {
        return (
            <div className="page-wrapper">
                <div className="page-header"><div><h1 className="page-title">Students</h1></div></div>
                <div className="card" style={{ color: "var(--danger)", padding: "2rem" }}>{err}</div>
            </div>
        );
    }

    return (
        <div className="page-wrapper">
            <div className="page-header">
                <div>
                    <h1 className="page-title">Students</h1>
                    <p className="page-subtitle">Student analytics per class</p>
                </div>
                {/* Class selector */}
                {offerings.length > 1 && (
                    <Select
                        value={selectedOffering}
                        onChange={e => setSelectedOffering(e.target.value)}
                        style={{
                            padding: "0.5rem 0.75rem",
                            borderRadius: 8,
                            border: "1.5px solid var(--gray-200)",
                            fontSize: "0.85rem",
                            fontWeight: 500,
                            background: "#fff",
                            color: "var(--gray-700)",
                            cursor: "pointer",
                        }}
                    >
                        {offerings.map(o => (
                            <option key={o.id} value={o.id}>{offeringLabel(o)}</option>
                        ))}
                    </Select>
                )}
            </div>

            {rankedStudents.length === 0 && !loading ? (
                <div className="card" style={{ textAlign: "center", padding: "3rem 1rem", color: "var(--gray-400)" }}>
                    <div style={{ fontWeight: 600, fontSize: "1rem", color: "var(--gray-500)", marginBottom: "0.25rem" }}>No students enrolled</div>
                    <div style={{ fontSize: "0.85rem" }}>Students will appear once enrolled by the admin.</div>
                </div>
            ) : (
                <div style={{ display: "grid", gridTemplateColumns: selected ? "1fr 1.5fr" : "1fr", gap: "1.5rem" }}>
                    <div className="card">
                        <div className="table-wrapper">
                            <table>
                                <thead><tr><th>Student</th><th>Avg</th><th>Attendance</th><th>Rank</th></tr></thead>
                                <tbody>
                                    {rankedStudents.map(s => (
                                        <tr key={s.id} onClick={() => setSelectedStudentId(s.id)} style={{ cursor: "pointer", background: selectedStudentId === s.id ? "var(--primary-50)" : undefined }}>
                                            <td style={{ fontWeight: 600 }}>
                                                {s.name}<br />
                                                <span style={{ fontSize: "0.7rem", color: "var(--gray-400)" }}>{s.email}</span>
                                            </td>
                                            <td>
                                                <span className={`badge ${s.avg >= 90 ? "badge-success" : s.avg >= 80 ? "badge-primary" : s.avg >= 60 ? "badge-warning" : "badge-danger"}`}>
                                                    {s.avg > 0 ? `${s.avg}%` : "-"}
                                                </span>
                                            </td>
                                            <td>{s.attendance}%</td>
                                            <td>#{s.rank}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {selected && (
                        <div>
                            <div className="card" style={{ marginBottom: "1rem" }}>
                                <div style={{ display: "flex", alignItems: "center", gap: "1rem", marginBottom: "1rem" }}>
                                    <div className="avatar avatar-initials avatar-lg" style={{ fontSize: "1rem" }}>{selected.name.split(" ").map(n => n[0]).join("")}</div>
                                    <div>
                                        <h3 style={{ fontSize: "1.125rem", fontWeight: 700 }}>{selected.name}</h3>
                                        <p style={{ fontSize: "0.8rem", color: "var(--gray-500)" }}>{selected.offeringLabel} · Rank #{selected.rank}</p>
                                    </div>
                                </div>

                                <div className="stats-grid" style={{ gridTemplateColumns: "repeat(3,1fr)", marginBottom: "1rem" }}>
                                    <div className="stat-card">
                                        <div className="stat-icon blue"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 20V10" /><path d="M12 20V4" /><path d="M6 20v-6" /></svg></div>
                                        <div className="stat-info"><div className="stat-label">Avg Score</div><div className="stat-value">{selected.avg > 0 ? `${selected.avg}%` : "-"}</div></div>
                                    </div>
                                    <div className="stat-card">
                                        <div className="stat-icon green"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" /></svg></div>
                                        <div className="stat-info"><div className="stat-label">Attendance</div><div className="stat-value">{selected.attendance}%</div></div>
                                    </div>
                                    <div className="stat-card">
                                        <div className="stat-icon orange"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="8" r="6" /><path d="M15.477 12.89 17 22l-5-3-5 3 1.523-9.11" /></svg></div>
                                        <div className="stat-info"><div className="stat-label">Class Rank</div><div className="stat-value">#{selected.rank}</div></div>
                                    </div>
                                </div>

                                {selected.subjects.length > 0 && (
                                    <>
                                        <h4 style={{ fontSize: "0.9rem", fontWeight: 600, marginBottom: "0.5rem" }}>📊 Exam Performance</h4>
                                        <div className="table-wrapper">
                                            <table>
                                                <thead><tr><th>Exam</th><th>Score</th><th>Status</th></tr></thead>
                                                <tbody>
                                                    {selected.subjects.map((sub, i) => (
                                                        <tr key={i}>
                                                            <td style={{ fontWeight: 500 }}>{sub.name}</td>
                                                            <td>
                                                                {sub.score !== null ? (
                                                                    <span className={`badge ${sub.score >= 90 ? "badge-success" : sub.score >= 80 ? "badge-primary" : sub.score >= 60 ? "badge-warning" : "badge-danger"}`}>{sub.score}%</span>
                                                                ) : (
                                                                    <span className="badge" style={{ background: "var(--gray-100)", color: "var(--gray-500)" }}>Not taken</span>
                                                                )}
                                                            </td>
                                                            <td style={{ color: sub.score === null ? "var(--gray-400)" : sub.score >= 85 ? "var(--success)" : sub.score >= 75 ? "var(--warning)" : "var(--danger)" }}>
                                                                {sub.score === null ? "-" : sub.score >= 85 ? "✅ Good" : sub.score >= 75 ? "⚠ Needs attention" : "❌ At risk"}
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    </>
                                )}
                            </div>

                            <div className="card" style={{ padding: "1rem" }}>
                                <h4 style={{ fontWeight: 600, color: "var(--primary-600)", marginBottom: "0.5rem" }}>🤖 AI Recommendation</h4>
                                <p style={{ fontSize: "0.85rem", color: "var(--gray-600)" }}>
                                    {selected.avg >= 85
                                        ? `${selected.name} is performing well overall. Continue providing challenging material to maintain engagement.`
                                        : selected.avg >= 60
                                        ? `${selected.name} needs additional support in exams with scores below 80%. Consider scheduling extra practice sessions.`
                                        : selected.avg > 0
                                        ? `${selected.name} is at risk with an average below 60%. Immediate intervention is recommended, including one-on-one tutoring and parent communication.`
                                        : `${selected.name} hasn't taken any exams yet. Make sure they are participating in upcoming assessments.`}
                                </p>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
