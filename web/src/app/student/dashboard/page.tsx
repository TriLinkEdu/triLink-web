"use client";
import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
    announcementsForMe,
    studentDashboard,
    listStudentExams,
    getActiveAcademicYear,
    type Announcement,
    type Exam as BackendExam,
} from "@/lib/admin-api";
import { 
    Calendar, 
    Clock, 
    PlayCircle, 
    CheckCircle2, 
    ChevronRight,
    Sparkles,
    BookOpen,
    RefreshCcw,
    Megaphone,
    AlertCircle,
    Layout,
    Timer
} from "lucide-react";

type ExamStatus = "available" | "completed" | "upcoming" | "missed";

interface Exam {
    id: string;
    course: string;
    type: string;
    title: string;
    date: string;
    time: string;
    duration: number;
    totalQuestions: number;
    status: ExamStatus;
    score?: number | null;
    room: string;
}

export default function StudentDashboard() {
    const router = useRouter();
    const [filter, setFilter] = useState<"all" | "available" | "completed">("all");
    const [apiAnnouncements, setApiAnnouncements] = useState<Announcement[]>([]);
    const [apiDash, setApiDash] = useState<{ activeEnrollments: number; unreadNotifications: number } | null>(null);
    const [apiExams, setApiExams] = useState<BackendExam[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [year, setYear] = useState<{ id: string; label: string } | null>(null);

    const [isClient, setIsClient] = useState(false);
    useEffect(() => {
        setIsClient(true);
        let c = false;
        (async () => {
            setIsLoading(true);
            try {
                const activeYear = await getActiveAcademicYear();
                setYear(activeYear);
                
                // Fetch announcements and dashboard regardless of academic year
                const [ann, dash] = await Promise.all([
                    announcementsForMe(),
                    studentDashboard(),
                ]);
                
                let examsRes: BackendExam[] = [];
                if (activeYear) {
                    examsRes = await listStudentExams(activeYear.id);
                }
                
                if (!c) {
                    setApiAnnouncements(ann);
                    setApiDash(dash);
                    setApiExams(examsRes);
                }
            } catch (err) {
                console.error("Dashboard primary load failed:", err);
            } finally {
                if (!c) setIsLoading(false);
            }
        })();
        return () => { c = true; };
    }, []);

    const processedExams: Exam[] = useMemo(() => {
        if (!isClient) return [];
        return apiExams.map((e: BackendExam) => {
            const attempt = e.attempts?.[0]; 
            const now = new Date();
            const opensAt = new Date(e.opensAt);
            const closesAt = new Date(e.closesAt);
            
            let status: ExamStatus = "upcoming";
            if (attempt?.submittedAt) {
                status = "completed";
            } else if (now >= opensAt && now <= closesAt) {
                status = "available";
            } else if (now > closesAt && !attempt?.submittedAt) {
                status = "missed";
            }

            return {
                id: e.id,
                course: (e as any).subject?.name || (e as any).classOffering?.name || "General",
                type: (e as any).type || "Examination",
                title: e.title,
                date: opensAt.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }),
                time: opensAt.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' }),
                duration: e.durationMinutes,
                totalQuestions: (e as any).questionCount || 0,
                status,
                score: attempt?.score,
                room: "Digital Hall"
            };
        });
    }, [apiExams, isClient]);

    const filtered = processedExams.filter(e => {
        if (filter === "all") return true;
        return e.status === filter;
    });

    if (isLoading) {
        return (
            <div className="page-wrapper" style={{ padding: "2rem" }}>
                <div className="admin-skeleton shimmer" style={{ height: 40, width: 250, marginBottom: "2rem", borderRadius: 12 }} />
                <div style={{ display: "grid", gridTemplateColumns: "1fr 340px", gap: "2rem" }}>
                    <div>
                        <div className="admin-skeleton shimmer" style={{ height: 50, width: "100%", marginBottom: "1rem", borderRadius: 12 }} />
                        <div className="admin-skeleton shimmer" style={{ height: 200, width: "100%", borderRadius: 16 }} />
                    </div>
                    <div className="admin-skeleton shimmer" style={{ height: 400, width: "100%", borderRadius: 16 }} />
                </div>
            </div>
        );
    }

    return (
        <div className="page-wrapper" style={{ maxWidth: 1280, margin: "0 auto", padding: "2rem" }}>
            {/* Hero Section */}
            <div className="student-hero" style={{ marginBottom: "2.5rem" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.75rem" }}>
                    <Sparkles size={18} className="text-primary-500" />
                    <span style={{ fontWeight: 700, fontSize: "0.85rem", color: "var(--primary-600)", textTransform: "uppercase", letterSpacing: "0.1em" }}>Academic Dashboard</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
                    <div>
                        <h1 style={{ fontSize: "2.5rem", fontWeight: 800, color: "var(--gray-900)", marginBottom: "0.5rem" }}>Welcome back!</h1>
                        <p style={{ color: "var(--gray-500)", fontSize: "1.1rem" }}>
                            {year ? `Viewing schedule for academic year ${year.label}` : "Configure an active year in school setup to view exams."}
                        </p>
                    </div>
                    <button 
                        onClick={() => window.location.reload()}
                        className="btn btn-secondary" 
                        style={{ height: "fit-content", padding: "0.6rem 1.25rem", borderRadius: 12, fontWeight: 700, gap: "0.6rem" }}
                    >
                        <RefreshCcw size={16} />
                        Sync Dashboard
                    </button>
                </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 360px", gap: "2.5rem", alignItems: "start" }}>
                {/* Main Content: Exams */}
                <div className="exams-column">
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1.5rem" }}>
                        <div style={{ display: "flex", gap: "0.75rem" }}>
                            {(["all", "available", "completed"] as const).map(f => (
                                <button 
                                    key={f} 
                                    onClick={() => setFilter(f)} 
                                    style={{
                                        padding: "0.6rem 1.25rem", 
                                        borderRadius: 12, 
                                        border: "1.5px solid",
                                        borderColor: filter === f ? "var(--primary-500)" : "transparent",
                                        background: filter === f ? "var(--primary-500)" : "#fff",
                                        color: filter === f ? "#fff" : "var(--gray-600)",
                                        fontWeight: 700, 
                                        fontSize: "0.85rem", 
                                        cursor: "pointer",
                                        boxShadow: filter === f ? "0 4px 12px var(--primary-100)" : "none",
                                        transition: "all 0.2s"
                                    }}
                                >
                                    {f.charAt(0).toUpperCase() + f.slice(1)} Exams
                                </button>
                            ))}
                        </div>
                    </div>

                    <div style={{ display: "grid", gap: "1.25rem" }}>
                        {filtered.length === 0 ? (
                            <div className="card" style={{ textAlign: "center", padding: "4rem 2rem", borderRadius: 24, border: "2px dashed var(--gray-200)" }}>
                                <div style={{ width: 64, height: 64, background: "var(--gray-50)", borderRadius: 20, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 1.5rem", color: "var(--gray-400)" }}>
                                    <BookOpen size={32} />
                                </div>
                                <h3 style={{ fontWeight: 700, marginBottom: "0.5rem" }}>No exams tracked</h3>
                                <p style={{ color: "var(--gray-500)", fontSize: "0.9rem" }}>Check back later or change your filter.</p>
                            </div>
                        ) : (
                            filtered.map(exam => (
                                <div key={exam.id} className="card exam-card-hover" style={{ 
                                    padding: "1.75rem", 
                                    borderRadius: 24, 
                                    border: "1.5px solid var(--gray-100)",
                                    background: "#fff",
                                    transition: "transform 0.2s, box-shadow 0.2s",
                                    cursor: "pointer"
                                }} onClick={() => exam.status === "available" && router.push(`/student/exam/${exam.id}`)}>
                                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "1.25rem" }}>
                                        <div>
                                            <div style={{ display: "flex", alignItems: "center", gap: "0.6rem", marginBottom: "0.5rem" }}>
                                                <span style={{ fontSize: "0.65rem", fontWeight: 800, color: "var(--primary-600)", background: "var(--primary-50)", padding: "0.25rem 0.6rem", borderRadius: 6, textTransform: "uppercase" }}>{exam.course}</span>
                                                <span style={{ fontSize: "0.75rem", color: "var(--gray-400)" }}>•</span>
                                                <span style={{ fontSize: "0.75rem", fontWeight: 600, color: "var(--gray-400)" }}>{exam.type}</span>
                                            </div>
                                            <h3 style={{ fontSize: "1.35rem", fontWeight: 800, color: "var(--gray-900)" }}>{exam.title}</h3>
                                        </div>
                                        
                                        <div style={{ 
                                            padding: "0.4rem 0.8rem", 
                                            borderRadius: 10, 
                                            fontSize: "0.75rem", 
                                            fontWeight: 800,
                                            display: "flex",
                                            alignItems: "center",
                                            gap: "0.4rem",
                                            background: exam.status === "available" ? "#ecfdf5" : exam.status === "completed" ? "var(--primary-50)" : "var(--gray-50)",
                                            color: exam.status === "available" ? "#065f46" : exam.status === "completed" ? "var(--primary-700)" : "var(--gray-500)",
                                        }}>
                                            {exam.status === "available" && <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#10b981", animation: "pulse 2s infinite" }} />}
                                            {exam.status.toUpperCase()}
                                        </div>
                                    </div>

                                    <div style={{ display: "flex", gap: "2rem", marginBottom: "1.75rem" }}>
                                        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", color: "var(--gray-500)" }}>
                                            <Calendar size={16} />
                                            <span style={{ fontSize: "0.85rem", fontWeight: 500 }}>{exam.date}</span>
                                        </div>
                                        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", color: "var(--gray-500)" }}>
                                            <Timer size={16} />
                                            <span style={{ fontSize: "0.85rem", fontWeight: 500 }}>{exam.duration} mins</span>
                                        </div>
                                        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", color: "var(--gray-500)" }}>
                                            <Layout size={16} />
                                            <span style={{ fontSize: "0.85rem", fontWeight: 500 }}>{exam.totalQuestions} Questions</span>
                                        </div>
                                    </div>

                                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", paddingTop: "1.25rem", borderTop: "1px solid var(--gray-50)" }}>
                                        {exam.status === "completed" ? (
                                            <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                                                <CheckCircle2 size={20} className="text-primary-600" />
                                                <div>
                                                    <div style={{ fontSize: "0.7rem", color: "var(--gray-400)", fontWeight: 600 }}>Achieved Score</div>
                                                    <div style={{ fontSize: "1.25rem", fontWeight: 800, color: "var(--primary-700)" }}>{exam.score != null ? `${exam.score}%` : "Evaluating..."}</div>
                                                </div>
                                            </div>
                                        ) : exam.status === "available" ? (
                                            <button 
                                                className="btn btn-primary"
                                                onClick={(e) => { e.stopPropagation(); router.push(`/student/exam/${exam.id}`); }}
                                                style={{ padding: "0.75rem 2rem", borderRadius: 14, fontWeight: 700, gap: "0.6rem" }}
                                            >
                                                <PlayCircle size={18} />
                                                Start Session
                                            </button>
                                        ) : (
                                            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", color: "var(--gray-400)" }}>
                                                <Clock size={18} />
                                                <span style={{ fontSize: "0.85rem", fontWeight: 600 }}>Available at {exam.time}</span>
                                            </div>
                                        )}
                                        <ChevronRight size={20} className="text-gray-300" />
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {/* Sidebar: Announcements */}
                <div className="announcements-column">
                    <div style={{ 
                        background: "#fff", 
                        borderRadius: 32, 
                        border: "1.5px solid var(--gray-100)", 
                        overflow: "hidden" 
                    }}>
                        <div style={{ padding: "1.75rem", borderBottom: "1.5px solid var(--gray-50)", background: "#fafafa" }}>
                            <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                                <div style={{ width: 40, height: 40, background: "var(--primary-100)", borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center", color: "var(--primary-600)" }}>
                                    <Megaphone size={20} />
                                </div>
                                <div>
                                    <h3 style={{ fontSize: "1.1rem", fontWeight: 800 }}>School Feed</h3>
                                    <p style={{ fontSize: "0.75rem", color: "var(--gray-400)", fontWeight: 600 }}>Institutional Broadcasts</p>
                                </div>
                            </div>
                        </div>

                        <div style={{ padding: "1.25rem", display: "grid", gap: "1rem" }}>
                            {apiAnnouncements.length === 0 ? (
                                <div style={{ textAlign: "center", padding: "2rem 0" }}>
                                    <p style={{ color: "var(--gray-400)", fontSize: "0.85rem" }}>Stay tuned for updates!</p>
                                </div>
                            ) : (
                                apiAnnouncements.slice(0, 8).map(a => (
                                    <div key={a.id} style={{ 
                                        padding: "1.25rem", 
                                        borderRadius: 20, 
                                        background: "var(--gray-50)", 
                                        border: "1px solid var(--gray-100)",
                                        position: "relative"
                                    }}>
                                        <div style={{ fontSize: "0.65rem", fontWeight: 700, color: "var(--gray-400)", marginBottom: "0.5rem", textTransform: "uppercase" }}>
                                            {new Date(a.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                                        </div>
                                        <h4 style={{ fontSize: "0.95rem", fontWeight: 700, color: "var(--gray-900)", marginBottom: "0.4rem" }}>{a.title}</h4>
                                        <p style={{ fontSize: "0.82rem", color: "var(--gray-600)", lineHeight: 1.6 }}>{a.body}</p>
                                    </div>
                                ))
                            )}
                        </div>

                        {apiAnnouncements.length > 0 && (
                            <div style={{ padding: "1.25rem", textAlign: "center", borderTop: "1.5px solid var(--gray-50)" }}>
                                <button style={{ background: "none", border: "none", color: "var(--primary-600)", fontWeight: 700, fontSize: "0.85rem", cursor: "pointer" }}>
                                    View Older Archives
                                </button>
                            </div>
                        )}
                    </div>

                    <div style={{ 
                        marginTop: "2rem",
                        padding: "1.75rem", 
                        borderRadius: 32, 
                        background: "linear-gradient(135deg, var(--primary-600), var(--primary-800))", 
                        color: "#fff",
                        position: "relative",
                        overflow: "hidden"
                    }}>
                        <div style={{ position: "relative", zIndex: 1 }}>
                            <h3 style={{ fontSize: "1.1rem", fontWeight: 800, marginBottom: "0.5rem" }}>Need Assistance?</h3>
                            <p style={{ fontSize: "0.85rem", opacity: 0.9, lineHeight: 1.6, marginBottom: "1.25rem" }}>If you experience technical issues during an active exam window, reach out to support immediately.</p>
                            <button className="btn btn-secondary" style={{ width: "100%", borderRadius: 12, fontWeight: 700 }}>Contact Helpdesk</button>
                        </div>
                        <AlertCircle size={80} style={{ position: "absolute", bottom: -20, right: -20, opacity: 0.1 }} />
                    </div>
                </div>
            </div>

            <style jsx>{`
                .exam-card-hover:hover {
                    transform: translateY(-4px);
                    box-shadow: 0 12px 24px rgba(0,0,0,0.04);
                    border-color: var(--primary-200) !important;
                }
                @keyframes pulse {
                    0% { opacity: 1; transform: scale(1); }
                    50% { opacity: 0.6; transform: scale(1.1); }
                    100% { opacity: 1; transform: scale(1); }
                }
            `}</style>
        </div>
    );
}

