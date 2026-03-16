"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAnnouncementStore } from "@/store/announcementStore";
import { useExamStore } from "@/store/examStore";

type ExamStatus = "available" | "completed" | "upcoming" | "missed";

interface Exam {
    id: number;
    course: string;
    type: "Test" | "Quiz" | "Midterm" | "Final";
    title: string;
    date: string;
    time: string;
    duration: number;
    totalQuestions: number;
    status: ExamStatus;
    score?: number;
    room: string;
}

/* ─── Inline SVG Icons ─── */
const IconPlay = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polygon points="5 3 19 12 5 21 5 3" /></svg>;
const IconChart = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 20V10" /><path d="M12 20V4" /><path d="M6 20v-6" /></svg>;
const IconLock = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="11" x="3" y="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></svg>;
const IconCalendar = () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="18" x="3" y="4" rx="2" ry="2" /><line x1="16" x2="16" y1="2" y2="6" /><line x1="8" x2="8" y1="2" y2="6" /><line x1="3" x2="21" y1="10" y2="10" /></svg>;
const IconClock = () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>;
const IconTimer = () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="10" x2="14" y1="2" y2="2" /><line x1="12" x2="15" y1="14" y2="11" /><circle cx="12" cy="14" r="8" /></svg>;
const IconList = () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="8" x2="21" y1="6" y2="6" /><line x1="8" x2="21" y1="12" y2="12" /><line x1="8" x2="21" y1="18" y2="18" /><line x1="3" x2="3.01" y1="6" y2="6" /><line x1="3" x2="3.01" y1="12" y2="12" /><line x1="3" x2="3.01" y1="18" y2="18" /></svg>;
const IconBuilding = () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 22V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v18Z" /><path d="M6 12H4a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h2" /><path d="M18 9h2a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2h-2" /><path d="M10 6h4" /><path d="M10 10h4" /><path d="M10 14h4" /><path d="M10 18h4" /></svg>;
const IconCheckCircle = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" /></svg>;
const IconActivity = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12" /></svg>;
const IconTarget = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><circle cx="12" cy="12" r="6" /><circle cx="12" cy="12" r="2" /></svg>;

export default function StudentDashboard() {
    const router = useRouter();
    const [filter, setFilter] = useState<"all" | "available" | "completed">("all");
    const { announcements } = useAnnouncementStore();
    const publishedExams = useExamStore(s => s.publishedExams);
    const completedExams = useExamStore(s => s.completedExams);
    const sentAnnouncements = announcements.filter(a => a.status === "sent");
    const studentClass = "Grade 11-A";

    const baseExams: Exam[] = [
        { id: 1, course: "Mathematics", type: "Midterm", title: "Ch.5-8 Midterm Exam", date: "2026-02-20", time: "09:00", duration: 120, totalQuestions: 40, status: "available", room: "ICT Lab 1" },
        { id: 2, course: "Physics", type: "Quiz", title: "Ch.6 Mechanics Quiz", date: "2026-02-20", time: "14:00", duration: 30, totalQuestions: 15, status: "available", room: "ICT Lab 2" },
        { id: 3, course: "Chemistry", type: "Test", title: "Organic Chemistry Test", date: "2026-02-21", time: "10:00", duration: 60, totalQuestions: 25, status: "upcoming", room: "ICT Lab 1" },
        { id: 4, course: "English", type: "Quiz", title: "Grammar & Vocabulary Quiz", date: "2026-02-19", time: "11:00", duration: 20, totalQuestions: 10, status: "completed", score: 88, room: "ICT Lab 2" },
        { id: 5, course: "Biology", type: "Test", title: "Cell Biology Test", date: "2026-02-18", time: "09:00", duration: 45, totalQuestions: 20, status: "completed", score: 94, room: "ICT Lab 1" },
        { id: 6, course: "Mathematics", type: "Quiz", title: "Integration Quick Quiz", date: "2026-02-17", time: "10:00", duration: 15, totalQuestions: 8, status: "completed", score: 75, room: "ICT Lab 2" },
        { id: 7, course: "Physics", type: "Final", title: "Semester Final Exam", date: "2026-03-10", time: "08:00", duration: 180, totalQuestions: 60, status: "upcoming", room: "ICT Lab 1" },
    ];

    const publishedForStudent: Exam[] = publishedExams
        .filter((e) => e.classGroup === studentClass)
        .map((e) => {
            const completed = completedExams.find((x) => x.examId === e.id);
            const openSource = e.opensAt || e.publishedAt;
            const openDate = new Date(openSource);
            const openTimeMs = Number.isNaN(openDate.getTime()) ? Date.now() : openDate.getTime();
            const safeOpenDate = Number.isNaN(openDate.getTime()) ? new Date() : openDate;
            const nowMs = Date.now();
            const status: ExamStatus = completed
                ? "completed"
                : openTimeMs > nowMs
                ? "upcoming"
                : "available";

            return {
                id: e.id,
                course: e.course,
                type: e.type,
                title: e.title,
                date: safeOpenDate.toISOString().slice(0, 10),
                time: safeOpenDate.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: false }),
                duration: e.duration,
                totalQuestions: e.totalQuestions,
                status,
                score: completed?.score,
                room: "Online",
            };
        });

    const exams: Exam[] = [
        ...publishedForStudent,
        ...baseExams.filter((base) => !publishedForStudent.some((p) => p.title === base.title)),
    ];

    const filtered = filter === "all" ? exams : exams.filter(e => filter === "available" ? (e.status === "available") : e.status === "completed");
    const availableCount = exams.filter(e => e.status === "available").length;
    const completedCount = exams.filter(e => e.status === "completed").length;
    const avgScore = exams.filter(e => e.score).reduce((a, e) => a + (e.score || 0), 0) / (completedCount || 1);

    const typeColor: Record<string, string> = { Quiz: "var(--primary-500)", Test: "var(--warning)", Midterm: "var(--purple)", Final: "var(--danger)" };
    const typeBg: Record<string, string> = { Quiz: "var(--primary-50)", Test: "var(--warning-light)", Midterm: "var(--purple-light)", Final: "var(--danger-light)" };

    const statIcons = [
        <IconActivity key="a" />,
        <IconCheckCircle key="c" />,
        <IconTarget key="t" />,
    ];
    const statColors = ["var(--success)", "var(--primary-500)", "var(--purple)"];
    const statBgs = ["var(--success-light)", "var(--primary-50)", "var(--purple-light)"];

    return (
        <div>
            <div style={{ marginBottom: "1.5rem" }}>
                <h1 style={{ fontSize: "1.5rem", fontWeight: 800, color: "var(--gray-900)", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--primary-500)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" /></svg>
                    Exam Portal
                </h1>
                <p style={{ fontSize: "0.875rem", color: "var(--gray-500)", marginTop: "0.25rem" }}>Select a course exam to begin</p>
            </div>

            <div className="stats-grid" style={{ marginBottom: "1.5rem" }}>
                {[
                    { label: "Available Now", value: availableCount },
                    { label: "Completed", value: completedCount },
                    { label: "Avg. Score", value: `${Math.round(avgScore)}%` },
                ].map((s, i) => (
                    <div key={i} className="stat-card">
                        <div className="stat-icon" style={{ width: 42, height: 42, borderRadius: 12, background: statBgs[i], color: statColors[i] }}>
                            {statIcons[i]}
                        </div>
                        <div className="stat-info">
                            <div className="stat-label">{s.label}</div>
                            <div className="stat-value">{s.value}</div>
                        </div>
                    </div>
                ))}
            </div>

            {sentAnnouncements.length > 0 && (
                <div style={{ background: "#fff", borderRadius: 16, padding: "1.25rem", border: "1.5px solid var(--gray-100)", marginBottom: "1.25rem" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.875rem" }}>
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--primary-500)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" /><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" /></svg>
                        <span style={{ fontWeight: 700, fontSize: "1rem", color: "var(--gray-900)" }}>Announcements</span>
                        <span style={{ marginLeft: "auto", fontSize: "0.75rem", color: "var(--gray-400)" }}>{sentAnnouncements.length} new</span>
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                        {sentAnnouncements.map(a => (
                            <div key={a.id} style={{ background: "var(--primary-50)", borderRadius: 12, padding: "0.75rem 1rem", borderLeft: "4px solid var(--primary-500)" }}>
                                <div style={{ fontWeight: 600, fontSize: "0.9rem", color: "var(--gray-900)" }}>{a.title}</div>
                                <div style={{ fontSize: "0.8rem", color: "var(--gray-600)", marginTop: "0.25rem" }}>{a.message}</div>
                                <div style={{ fontSize: "0.7rem", color: "var(--gray-400)", marginTop: "0.35rem" }}>From your teacher · {a.date}</div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            <div className="exam-filter-tabs">
                {(["all", "available", "completed"] as const).map(f => (
                    <button key={f} onClick={() => setFilter(f)} style={{
                        padding: "0.5rem 1.25rem", borderRadius: 10, border: "1.5px solid",
                        borderColor: filter === f ? "var(--primary-500)" : "var(--gray-200)",
                        background: filter === f ? "var(--primary-500)" : "#fff",
                        color: filter === f ? "#fff" : "var(--gray-600)",
                        fontWeight: 600, fontSize: "0.85rem", cursor: "pointer",
                        transition: "all 150ms ease", display: "flex", alignItems: "center", gap: "0.4rem",
                    }}>
                        {f === "all" && "All Exams"}
                        {f === "available" && <>
                            <span style={{ width: 8, height: 8, borderRadius: "50%", background: filter === f ? "#fff" : "var(--success)", display: "inline-block" }} />
                            Available
                        </>}
                        {f === "completed" && <>
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" /></svg>
                            Completed
                        </>}
                    </button>
                ))}
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                {filtered.length === 0 && (
                    <div style={{ textAlign: "center", padding: "3rem 1rem", color: "var(--gray-400)" }}>
                        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ margin: "0 auto 1rem", display: "block" }}><path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z" /><path d="M14 2v4a2 2 0 0 0 2 2h4" /><line x1="9" x2="15" y1="13" y2="13" /><line x1="9" x2="15" y1="17" y2="17" /></svg>
                        <div style={{ fontWeight: 600, fontSize: "1rem", color: "var(--gray-500)", marginBottom: "0.25rem" }}>No exams found</div>
                        <div style={{ fontSize: "0.85rem" }}>There are no exams in this category yet.</div>
                    </div>
                )}
                {filtered.map(exam => (
                    <div key={exam.id} style={{
                        background: "#fff", borderRadius: 16, padding: "1.25rem",
                        border: `1.5px solid ${exam.status === "available" ? "var(--success)" : exam.status === "missed" ? "var(--danger)" : "var(--gray-100)"}`,
                        boxShadow: exam.status === "available" ? "0 0 0 3px rgba(16,185,129,0.08)" : exam.status === "missed" ? "0 0 0 3px rgba(239,68,68,0.07)" : "none",
                    }}>
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "0.75rem", flexWrap: "wrap", gap: "0.5rem" }}>
                            <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                                <div style={{ padding: "0.35rem 0.85rem", borderRadius: 8, background: typeBg[exam.type], color: typeColor[exam.type], fontWeight: 700, fontSize: "0.75rem" }}>{exam.type}</div>
                                <span style={{ fontSize: "0.8rem", color: "var(--gray-400)" }}>•</span>
                                <span style={{ fontSize: "0.85rem", fontWeight: 600, color: "var(--primary-600)" }}>{exam.course}</span>
                            </div>
                            <div style={{
                                padding: "0.3rem 0.75rem", borderRadius: 8, display: "flex", alignItems: "center", gap: "0.35rem",
                                background: exam.status === "available" ? "var(--success-light)" : exam.status === "completed" ? "var(--primary-50)" : exam.status === "upcoming" ? "var(--warning-light)" : "var(--danger-light)",
                                color: exam.status === "available" ? "#065f46" : exam.status === "completed" ? "var(--primary-700)" : exam.status === "upcoming" ? "#92400e" : "#991b1b",
                                fontWeight: 600, fontSize: "0.75rem",
                            }}>
                                {exam.status === "available" && <><span style={{ width: 6, height: 6, borderRadius: "50%", background: "#065f46", display: "inline-block" }} /> Available Now</>}
                                {exam.status === "completed" && `Score: ${exam.score}%`}
                                {exam.status === "upcoming" && "Upcoming"}
                                {exam.status === "missed" && "Missed"}
                            </div>
                        </div>

                        <h3 style={{ fontSize: "1.05rem", fontWeight: 700, color: "var(--gray-900)", marginBottom: "0.5rem" }}>{exam.title}</h3>

                        <div className="exam-card-meta">
                            <span style={{ display: "flex", alignItems: "center", gap: "0.3rem" }}><IconCalendar /> {new Date(exam.date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</span>
                            <span style={{ display: "flex", alignItems: "center", gap: "0.3rem" }}><IconClock /> {exam.time}</span>
                            <span style={{ display: "flex", alignItems: "center", gap: "0.3rem" }}><IconTimer /> {exam.duration} min</span>
                            <span style={{ display: "flex", alignItems: "center", gap: "0.3rem" }}><IconList /> {exam.totalQuestions} Q</span>
                            <span style={{ display: "flex", alignItems: "center", gap: "0.3rem" }}><IconBuilding /> {exam.room}</span>
                        </div>

                        <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
                            {exam.status === "available" && (
                                <button onClick={() => router.push(`/student/exam/${exam.id}`)} style={{
                                    padding: "0.6rem 1.5rem", borderRadius: 10, display: "flex", alignItems: "center", gap: "0.4rem",
                                    background: "linear-gradient(135deg, var(--primary-500), var(--primary-600))",
                                    color: "#fff", fontWeight: 700, fontSize: "0.85rem", border: "none", cursor: "pointer",
                                    boxShadow: "0 2px 8px rgba(37,99,235,0.25)",
                                }}><IconPlay /> Start Exam</button>
                            )}
                            {exam.status === "completed" && (
                                <button onClick={() => router.push(`/student/result/${exam.id}`)} style={{
                                    padding: "0.6rem 1.5rem", borderRadius: 10, display: "flex", alignItems: "center", gap: "0.4rem",
                                    background: "var(--primary-50)", color: "var(--primary-600)",
                                    fontWeight: 600, fontSize: "0.85rem", border: "1.5px solid var(--primary-200)", cursor: "pointer",
                                }}><IconChart /> View Result</button>
                            )}
                            {exam.status === "upcoming" && (
                                <span style={{ padding: "0.6rem 1.5rem", borderRadius: 10, background: "var(--gray-100)", color: "var(--gray-400)", fontWeight: 600, fontSize: "0.85rem", display: "flex", alignItems: "center", gap: "0.4rem" }}>
                                    <IconLock /> Not yet available
                                </span>
                            )}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
